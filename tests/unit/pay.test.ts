import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { OrderPlan, OrderRow } from '../../src/lib/db/types';
import { handleAdminOrder, handleCreateOrder, handleGetOrder, handlePayosWebhook, type ConfirmResult, type OrderRepo } from '../../src/lib/pay/handlers';
import { newOrderCode, qrPath } from '../../src/lib/pay/order';
import { payosClient, sign, signingString, verifySignature, type PayosClient } from '../../src/lib/pay/payos';
import { PLANS } from '../../src/lib/pricing';

const KEY = 'checksum-key-for-tests-0123456789';
const SITE = 'https://epc.example';
const NOW = new Date('2026-10-05T03:00:00Z');
const USER = { id: 'user-a', email: 'an@example.com' };
const ORDER_ID = '7b0c6a43-4c1e-4a43-9a3a-2f0f1b9f1a01';

/** Đoạn code mẫu trong tài liệu payOS (Kiểm tra dữ liệu với signature), để đối chiếu. */
function referenceSignature(data: Record<string, unknown>, key: string): string {
  const sorted = Object.keys(data)
    .sort()
    .reduce<Record<string, unknown>>((o, k) => ((o[k] = data[k]), o), {});
  const query = Object.keys(sorted)
    .filter((k) => sorted[k] !== undefined)
    .map((k) => {
      let value = sorted[k];
      if (Array.isArray(value)) {
        value = JSON.stringify(
          value.map((v: Record<string, unknown>) => Object.keys(v).sort().reduce<Record<string, unknown>>((o, kk) => ((o[kk] = v[kk]), o), {})),
        );
      }
      if ([null, undefined, 'undefined', 'null'].includes(value as string)) value = '';
      return `${k}=${String(value)}`;
    })
    .join('&');
  return createHmac('sha256', key).update(query).digest('hex');
}

const WEBHOOK_DATA = {
  orderCode: 100005,
  amount: 79000,
  description: 'EPCABCDE',
  accountNumber: '12345678',
  reference: 'TF230204212323',
  transactionDateTime: '2026-10-05 10:25:00',
  currency: 'VND',
  paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
  code: '00',
  desc: 'Thành công',
  counterAccountBankId: '',
  counterAccountBankName: '',
  counterAccountName: null,
  counterAccountNumber: '',
  virtualAccountName: '',
  virtualAccountNumber: '',
};

describe('chữ ký payOS', () => {
  it('giống hệt code mẫu của payOS, kể cả null và mảng', async () => {
    const data = { ...WEBHOOK_DATA, items: [{ quantity: 1, name: 'Premium', price: 79000 }] };
    expect(await sign(data, KEY)).toBe(referenceSignature(data, KEY));
  });

  it('chuỗi ký tạo link chỉ gồm 5 trường theo thứ tự chữ cái', () => {
    expect(signingString({ orderCode: 1, returnUrl: 'r', amount: 2, description: 'd', cancelUrl: 'c' })).toBe(
      'amount=2&cancelUrl=c&description=d&orderCode=1&returnUrl=r',
    );
  });

  it('sai một trường hoặc sai key thì chữ ký không khớp', async () => {
    const sig = await sign(WEBHOOK_DATA, KEY);
    expect(await verifySignature(WEBHOOK_DATA, sig, KEY)).toBe(true);
    expect(await verifySignature({ ...WEBHOOK_DATA, amount: 1000000 }, sig, KEY)).toBe(false);
    expect(await verifySignature(WEBHOOK_DATA, sig, 'other-key-0123456789abcdef')).toBe(false);
  });
});

describe('mã đơn và mã QR', () => {
  it('mã đơn là EPC + 5 ký tự không dễ nhầm', () => {
    for (let i = 0; i < 50; i++) expect(newOrderCode()).toMatch(/^EPC[A-HJ-NP-Z2-9]{5}$/);
  });

  it('mã QR vẽ thành một path SVG, chỉ gồm lệnh vẽ', () => {
    const { size, d } = qrPath('00020101021238570010A000000727012700069704220113VQRQ0001234560208QRIBFTTA');
    expect(size).toBeGreaterThan(20);
    expect(d).toMatch(/^(M\d+ \d+h1v1h-1z)+$/);
  });
});

// ---------- handler ----------

function order(over: Partial<OrderRow> = {}): OrderRow {
  return {
    id: ORDER_ID,
    user_id: USER.id,
    code: 'EPCABCDE',
    plan: '30d',
    amount: PLANS['30d'].amount,
    status: 'pending',
    created_at: '2026-10-05T02:00:00Z',
    paid_at: null,
    order_number: 100005,
    checkout_url: null,
    qr_code: null,
    bank_ref: null,
    paid_by: null,
    ...over,
  };
}

function fakeRepo(initial: OrderRow[] = []) {
  const orders = [...initial];
  const calls = { confirm: [] as unknown[], refund: [] as string[], inserted: 0 };
  const repo: OrderRepo = {
    getOwnOrder: async (userId, id) => orders.find((o) => o.id === id && o.user_id === userId) ?? null,
    findPendingOrder: async (userId, plan: OrderPlan) => orders.find((o) => o.user_id === userId && o.plan === plan && o.status === 'pending') ?? null,
    insertOrder: async (row) => {
      calls.inserted++;
      const o = order({ ...row, id: `00000000-0000-4000-8000-00000000000${calls.inserted}`, order_number: 100100 + calls.inserted });
      orders.push(o);
      return o;
    },
    attachLink: async (id, link) => {
      const o = orders.find((x) => x.id === id);
      if (o) Object.assign(o, link);
    },
    markExpired: async (id) => {
      const o = orders.find((x) => x.id === id);
      if (o) o.status = 'expired';
    },
    findByNumber: async (n) => orders.find((o) => o.order_number === n) ?? null,
    confirm: async (id, bankRef, paidBy, amount): Promise<ConfirmResult> => {
      calls.confirm.push({ id, bankRef, paidBy, amount });
      const o = orders.find((x) => x.id === id);
      if (!o) return { status: 'not_found' };
      if (o.status === 'paid') return { status: 'already_paid' };
      if (o.status !== 'pending' && o.status !== 'expired') return { status: 'not_pending' };
      if (amount !== null && amount < o.amount) return { status: 'amount_mismatch' };
      o.status = 'paid';
      return { status: 'paid', premium_until: '2026-11-04T03:00:00Z' };
    },
    refund: async (id) => {
      calls.refund.push(id);
      const o = orders.find((x) => x.id === id);
      if (!o) return { status: 'not_found' };
      if (o.status !== 'paid') return { status: 'not_paid' };
      o.status = 'refunded';
      return { status: 'refunded' };
    },
  };
  return { repo, orders, calls };
}

function fakePayos(over: Partial<PayosClient> = {}) {
  const created: unknown[] = [];
  const client: PayosClient = {
    createLink: async (input) => {
      created.push(input);
      return { checkoutUrl: 'https://pay.payos.vn/web/abc', qrCode: '00020101021238570010A000000727' };
    },
    getLink: async () => ({ status: 'PENDING', amountPaid: 0 }),
    confirmWebhook: async () => undefined,
    ...over,
  };
  return { client, created };
}

const req = (method: string, body?: unknown, origin: string | null = SITE) =>
  new Request(`${SITE}/api/orders`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

const json = async (res: Response) => (await res.json()) as { ok: boolean; data?: Record<string, unknown>; error?: { code: string } };

describe('POST /api/orders', () => {
  const run = (request: Request, opts: { user?: typeof USER | null; payos?: PayosClient | null; repo?: OrderRepo } = {}) =>
    handleCreateOrder({
      request,
      user: opts.user === undefined ? USER : opts.user,
      repo: opts.repo ?? fakeRepo().repo,
      payos: opts.payos === undefined ? fakePayos().client : opts.payos,
      now: NOW,
      siteUrl: SITE,
      origin: SITE,
    });

  it('chặn sai phương thức, trang khác, chưa đăng nhập, gói lạ', async () => {
    expect((await run(req('GET'))).status).toBe(405);
    expect((await run(req('POST', { plan: '30d' }, 'https://evil.example'))).status).toBe(403);
    expect((await run(req('POST', { plan: '30d' }), { user: null })).status).toBe(401);
    expect((await run(req('POST', { plan: '7d' }))).status).toBe(400);
  });

  it('không nhận số tiền từ client: tạo đơn đúng giá gói, gửi payOS mã đơn làm nội dung', async () => {
    const { repo, orders } = fakeRepo();
    const payos = fakePayos();
    const res = await run(req('POST', { plan: '90d', amount: 1000 }), { repo, payos: payos.client });
    expect(res.status).toBe(201);
    const body = await json(res);
    const o = orders[0]!;
    expect(o.amount).toBe(PLANS['90d'].amount);
    expect(payos.created[0]).toMatchObject({
      orderCode: o.order_number,
      amount: PLANS['90d'].amount,
      description: o.code,
      returnUrl: `${SITE}/nang-cap?don=${o.id}`,
    });
    expect(body.data?.order).toMatchObject({ code: o.code, status: 'pending', checkout_url: 'https://pay.payos.vn/web/abc' });
    expect(body.data?.order).not.toHaveProperty('qr_code');
  });

  it('bấm lại cùng gói thì dùng lại đơn đang chờ, không tạo link mới', async () => {
    const { repo, calls } = fakeRepo([order({ qr_code: '000201', checkout_url: 'https://pay.payos.vn/web/x' })]);
    const payos = fakePayos();
    const res = await run(req('POST', { plan: '30d' }), { repo, payos: payos.client });
    expect(res.status).toBe(200);
    expect(calls.inserted).toBe(0);
    expect(payos.created).toHaveLength(0);
  });

  it('payOS lỗi: trả 502 và đánh dấu đơn hết hạn', async () => {
    const { repo, orders } = fakeRepo();
    const payos = fakePayos({
      createLink: async () => {
        throw new Error('down');
      },
    });
    const res = await run(req('POST', { plan: '30d' }), { repo, payos: payos.client });
    expect(res.status).toBe(502);
    expect(orders[0]?.status).toBe('expired');
  });

  it('chưa cấu hình payOS: 503', async () => {
    expect((await run(req('POST', { plan: '30d' }), { payos: null })).status).toBe(503);
  });
});

describe('GET /api/orders/:id', () => {
  const run = (orderId: string, opts: { repo: OrderRepo; payos?: PayosClient; user?: typeof USER | null }) =>
    handleGetOrder({
      request: req('GET'),
      user: opts.user === undefined ? USER : opts.user,
      repo: opts.repo,
      payos: opts.payos ?? fakePayos().client,
      now: NOW,
      siteUrl: SITE,
      orderId,
    });

  it('không thấy đơn của người khác', async () => {
    const { repo } = fakeRepo([order({ user_id: 'user-b' })]);
    expect((await run(ORDER_ID, { repo })).status).toBe(404);
    expect((await run(ORDER_ID, { repo, user: null })).status).toBe(401);
    expect((await run('x', { repo })).status).toBe(400);
  });

  it('payOS báo đã trả đủ: xác nhận đơn ngay, không chờ webhook', async () => {
    const { repo, calls } = fakeRepo([order()]);
    const payos = fakePayos({ getLink: async () => ({ status: 'PAID', amountPaid: PLANS['30d'].amount }) });
    const body = await json(await run(ORDER_ID, { repo, payos: payos.client }));
    expect(body.data?.order).toMatchObject({ status: 'paid' });
    expect(calls.confirm).toEqual([{ id: ORDER_ID, bankRef: null, paidBy: 'payos', amount: PLANS['30d'].amount }]);
  });

  it('chưa trả thì vẫn chờ', async () => {
    const { repo, calls } = fakeRepo([order()]);
    const body = await json(await run(ORDER_ID, { repo }));
    expect(body.data?.order).toMatchObject({ status: 'pending' });
    expect(calls.confirm).toHaveLength(0);
  });
});

describe('POST /api/payos/webhook', () => {
  const hook = async (
    data: Record<string, unknown>,
    opts: { signature?: string; code?: string; repo?: OrderRepo; key?: string | null; alert?: (t: string) => Promise<void> } = {},
  ) => {
    const signature = opts.signature ?? (await sign(data, KEY));
    const request = new Request(`${SITE}/api/payos/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: opts.code ?? '00', desc: 'success', success: true, data, signature }),
    });
    return handlePayosWebhook({ request, repo: opts.repo ?? fakeRepo().repo, checksumKey: opts.key === undefined ? KEY : opts.key, alert: opts.alert });
  };

  it('đúng chữ ký, đúng số tiền: xác nhận đơn kèm mã giao dịch ngân hàng', async () => {
    const { repo, orders, calls } = fakeRepo([order()]);
    const res = await hook(WEBHOOK_DATA, { repo });
    expect(res.status).toBe(200);
    expect(orders[0]?.status).toBe('paid');
    expect(calls.confirm).toEqual([{ id: ORDER_ID, bankRef: 'TF230204212323', paidBy: 'payos', amount: 79000 }]);
  });

  it('sai chữ ký: 401 và không làm gì', async () => {
    const { repo, calls } = fakeRepo([order()]);
    const res = await hook({ ...WEBHOOK_DATA }, { repo, signature: 'a'.repeat(64) });
    expect(res.status).toBe(401);
    expect(calls.confirm).toHaveLength(0);
  });

  it('dữ liệu bị sửa sau khi ký (tăng số tiền): 401', async () => {
    const { repo, calls } = fakeRepo([order()]);
    const signature = await sign({ ...WEBHOOK_DATA, amount: 1000 }, KEY);
    expect((await hook(WEBHOOK_DATA, { repo, signature })).status).toBe(401);
    expect(calls.confirm).toHaveLength(0);
  });

  it('chuyển thiếu tiền: không mở Premium, đơn vẫn chờ, báo admin', async () => {
    const { repo, orders } = fakeRepo([order()]);
    const alerts: string[] = [];
    const res = await hook({ ...WEBHOOK_DATA, amount: 50000 }, { repo, alert: async (t) => void alerts.push(t) });
    expect(res.status).toBe(200);
    expect(orders[0]?.status).toBe('pending');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('50000');
  });

  it('payOS gửi lại cùng giao dịch: chỉ xác nhận một lần', async () => {
    const { repo } = fakeRepo([order()]);
    await hook(WEBHOOK_DATA, { repo });
    const again = await json(await hook(WEBHOOK_DATA, { repo }));
    expect(again.data).toEqual({ handled: true });
  });

  it('webhook thử của payOS (đơn không tồn tại) hoặc giao dịch lỗi: trả 200, không làm gì', async () => {
    const { repo, calls } = fakeRepo([order()]);
    expect((await hook({ ...WEBHOOK_DATA, orderCode: 123 }, { repo })).status).toBe(200);
    expect((await hook({ ...WEBHOOK_DATA, code: '01' }, { repo })).status).toBe(200);
    expect(calls.confirm).toHaveLength(0);
  });

  it('chưa cấu hình checksum key: 503, không xác nhận', async () => {
    expect((await hook(WEBHOOK_DATA, { key: null })).status).toBe(503);
  });
});

describe('POST /api/admin/orders/:id/:action', () => {
  const run = (action: string, opts: { user?: { id: string; email: string | null } | null; repo: OrderRepo; origin?: string }) =>
    handleAdminOrder({
      request: req('POST', {}, opts.origin ?? SITE),
      user: opts.user === undefined ? { id: 'admin', email: 'Owner@Example.com' } : opts.user,
      repo: opts.repo,
      now: NOW,
      siteUrl: SITE,
      action,
      orderId: ORDER_ID,
      adminEmails: ['owner@example.com'],
    });

  it('chỉ email trong ADMIN_EMAILS làm được, kiểm ở server', async () => {
    const { repo, calls } = fakeRepo([order()]);
    expect((await run('confirm', { repo, user: USER })).status).toBe(403);
    expect((await run('confirm', { repo, user: null })).status).toBe(401);
    expect((await run('confirm', { repo, origin: 'https://evil.example' })).status).toBe(403);
    expect(calls.confirm).toHaveLength(0);
  });

  it('xác nhận tay rồi hoàn tiền', async () => {
    const { repo, orders, calls } = fakeRepo([order()]);
    expect((await run('confirm', { repo })).status).toBe(200);
    expect(calls.confirm[0]).toEqual({ id: ORDER_ID, bankRef: null, paidBy: 'admin:owner@example.com', amount: null });
    expect((await run('refund', { repo })).status).toBe(200);
    expect(orders[0]?.status).toBe('refunded');
    expect((await run('confirm', { repo })).status).toBe(409);
    expect((await run('refund', { repo })).status).toBe(409);
    expect((await run('delete', { repo })).status).toBe(404);
  });
});

describe('payosClient', () => {
  it('gửi đúng header, chữ ký 5 trường, và đọc mã QR trả về', async () => {
    const sent: { url: string; init: RequestInit }[] = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      sent.push({ url, init });
      return new Response(
        JSON.stringify({ code: '00', desc: 'success', data: { checkoutUrl: 'https://pay.payos.vn/web/a', qrCode: '0002010102123857', paymentLinkId: 'a' } }),
      );
    }) as typeof fetch;
    const client = payosClient({ clientId: 'client-id-1', apiKey: 'api-key-12', checksumKey: KEY }, fetcher);
    const input = { orderCode: 100005, amount: 79000, description: 'EPCABCDE', returnUrl: 'https://r', cancelUrl: 'https://c', expiredAt: 1 };
    const link = await client.createLink(input);
    expect(link.qrCode).toBe('0002010102123857');
    expect(sent[0]?.url).toBe('https://api-merchant.payos.vn/v2/payment-requests');
    const headers = sent[0]?.init.headers as Record<string, string>;
    expect(headers['x-client-id']).toBe('client-id-1');
    const body = JSON.parse(String(sent[0]?.init.body)) as { signature: string };
    expect(body.signature).toBe(
      referenceSignature({ amount: 79000, cancelUrl: 'https://c', description: 'EPCABCDE', orderCode: 100005, returnUrl: 'https://r' }, KEY),
    );
  });

  it('payOS trả mã lỗi thì ném lỗi', async () => {
    const fetcher = (async () => new Response(JSON.stringify({ code: '231', desc: 'Đơn thanh toán đã tồn tại', data: null }))) as unknown as typeof fetch;
    const client = payosClient({ clientId: 'client-id-1', apiKey: 'api-key-12', checksumKey: KEY }, fetcher);
    await expect(client.createLink({ orderCode: 1, amount: 1, description: 'x', returnUrl: 'r', cancelUrl: 'c', expiredAt: 1 })).rejects.toThrow(
      /payos/,
    );
  });
});
