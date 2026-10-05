import { z } from 'zod';
import type { OrderPlan, OrderRow } from '../db/types';
import { errors, fail, ok, sameOrigin } from '../http/response';
import { amountFor, LINK_TTL_HOURS, newOrderCode, planSchema, toView } from './order';
import { verifySignature, type PayosClient } from './payos';

export type ConfirmResult =
  | { status: 'paid'; premium_until: string }
  | { status: 'already_paid' | 'not_pending' | 'amount_mismatch' | 'not_found' };

export type OrderRepo = {
  /** Đơn của người dùng, đọc bằng session (RLS). */
  getOwnOrder(userId: string, orderId: string): Promise<OrderRow | null>;
  /** Đơn chờ gần nhất của người dùng cho gói này, còn trong hạn link. */
  findPendingOrder(userId: string, plan: OrderPlan, since: Date): Promise<OrderRow | null>;
  /** Các hàm dưới chạy bằng service role. Trả về null khi mã đơn bị trùng (cần sinh mã khác). */
  insertOrder(row: { user_id: string; code: string; plan: OrderPlan; amount: number }): Promise<OrderRow | null>;
  attachLink(orderId: string, link: { checkout_url: string; qr_code: string }): Promise<void>;
  markExpired(orderId: string): Promise<void>;
  findByNumber(orderNumber: number): Promise<OrderRow | null>;
  confirm(orderId: string, bankRef: string | null, paidBy: string, paidAmount: number | null): Promise<ConfirmResult>;
  refund(orderId: string): Promise<{ status: 'refunded' | 'not_paid' | 'not_found' }>;
};

const unavailable = () => fail(503, 'payment_unavailable', 'Thanh toán đang tạm tắt. Bạn thử lại sau, hoặc nhắn cho EPC.');

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

type Base = { request: Request; user: { id: string; email: string | null } | null; repo: OrderRepo; now: Date; siteUrl?: string };

/** POST /api/orders: tạo đơn và link thanh toán payOS. */
export async function handleCreateOrder(input: Base & { payos: PayosClient | null; origin: string }): Promise<Response> {
  const { request, user, repo, payos, now, siteUrl, origin } = input;
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  // 2. Nguồn gốc
  if (!sameOrigin(request, siteUrl)) return errors.origin();
  // 3. Danh tính
  if (!user) return errors.unauthenticated();
  // 4. Dữ liệu vào: chỉ nhận gói. Số tiền và số ngày do server tính.
  const body = z.object({ plan: planSchema }).safeParse(await readJson(request));
  if (!body.success) return errors.badRequest('Gói không hợp lệ.');
  const { plan } = body.data;
  // 5. Điều kiện chạy được
  if (!payos) {
    console.error('[api/orders] thiếu PAYOS_*');
    return unavailable();
  }

  // 6. Việc chính. Bấm lại cùng gói trong 24 giờ thì dùng lại đơn cũ, không tạo link mới.
  const since = new Date(now.getTime() - LINK_TTL_HOURS * 3600_000);
  const existing = await repo.findPendingOrder(user.id, plan, since);
  if (existing?.qr_code) return ok({ order: toView(existing) });

  let order: OrderRow | null = null;
  for (let i = 0; i < 3 && !order; i++) {
    order = await repo.insertOrder({ user_id: user.id, code: newOrderCode(), plan, amount: amountFor(plan) });
  }
  if (!order) return errors.internal();

  const back = `${siteUrl ?? origin}/nang-cap?don=${order.id}`;
  try {
    const link = await payos.createLink({
      orderCode: order.order_number,
      amount: order.amount,
      description: order.code,
      returnUrl: back,
      cancelUrl: back,
      expiredAt: Math.floor(now.getTime() / 1000) + LINK_TTL_HOURS * 3600,
    });
    await repo.attachLink(order.id, { checkout_url: link.checkoutUrl, qr_code: link.qrCode });
    // 7. Phản hồi
    return ok({ order: toView({ ...order, checkout_url: link.checkoutUrl, qr_code: link.qrCode }) }, 201);
  } catch (e) {
    console.error('[api/orders] payOS lỗi:', e instanceof Error ? e.message : 'không rõ');
    await repo.markExpired(order.id);
    return fail(502, 'payment_provider', 'Chưa tạo được mã thanh toán. Bạn thử lại sau ít phút.');
  }
}

/** GET /api/orders/:id: trạng thái đơn của chính người dùng. Đơn còn chờ thì hỏi lại payOS. */
export async function handleGetOrder(input: Base & { payos: PayosClient | null; orderId: string | undefined }): Promise<Response> {
  const { request, user, repo, payos, orderId } = input;
  if (request.method !== 'GET') return errors.method();
  // GET chỉ đọc, không cần kiểm Origin; xác nhận đơn chỉ xảy ra khi chính payOS báo đã trả.
  if (!user) return errors.unauthenticated();
  if (!z.uuid().safeParse(orderId).success || !orderId) return errors.badRequest();

  const order = await repo.getOwnOrder(user.id, orderId);
  if (!order) return fail(404, 'not_found', 'Không tìm thấy đơn này.');

  let status = order.status;
  if (status === 'pending' && payos) {
    try {
      const info = await payos.getLink(order.order_number);
      if (info.status === 'PAID' && info.amountPaid >= order.amount) {
        const r = await repo.confirm(order.id, null, 'payos', info.amountPaid);
        if (r.status === 'paid' || r.status === 'already_paid') status = 'paid';
      }
    } catch (e) {
      // payOS không trả lời thì giữ trạng thái hiện tại; webhook vẫn xác nhận sau.
      console.error('[api/orders] hỏi payOS lỗi:', e instanceof Error ? e.message : 'không rõ');
    }
  }
  return ok({ order: toView({ ...order, status }) });
}

const webhookSchema = z.object({
  code: z.string(),
  desc: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
  signature: z.string().regex(/^[0-9a-fA-F]{64}$/),
});

const paidDataSchema = z.object({
  orderCode: z.number().int(),
  amount: z.number().int(),
  code: z.string(),
  reference: z.string().max(100).optional(),
});

/** POST /api/payos/webhook: payOS báo có giao dịch vào tài khoản. */
export async function handlePayosWebhook(input: { request: Request; repo: OrderRepo; checksumKey: string | null }): Promise<Response> {
  const { request, repo, checksumKey } = input;
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  if (!checksumKey) {
    console.error('[payos/webhook] thiếu PAYOS_CHECKSUM_KEY');
    return unavailable();
  }
  // 2. Nguồn gốc: chữ ký HMAC của payOS trên toàn bộ object data. Sai thì 401 và không làm gì.
  const text = await request.text();
  if (text.length > 20_000) return errors.badRequest();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return errors.badRequest();
  }
  const body = webhookSchema.safeParse(json);
  if (!body.success) return errors.badRequest();
  if (!(await verifySignature(body.data.data, body.data.signature, checksumKey))) {
    return fail(401, 'bad_signature', 'Chữ ký không hợp lệ.');
  }
  // 3. Danh tính: không có người dùng; đơn được tìm theo số đơn trong dữ liệu đã ký.
  // 4. Dữ liệu vào
  const data = paidDataSchema.safeParse(body.data.data);
  // Giao dịch không thành công, dữ liệu lạ, hoặc webhook thử của payOS: báo đã nhận để payOS không gửi lại.
  if (!data.success || body.data.code !== '00' || data.data.code !== '00') return ok({ handled: false });

  const order = await repo.findByNumber(data.data.orderCode);
  if (!order) return ok({ handled: false });

  // 5 và 6. Khớp số tiền rồi xác nhận. Gửi lại nhiều lần cũng chỉ cộng ngày một lần.
  const result = await repo.confirm(order.id, data.data.reference ?? null, 'payos', data.data.amount);
  if (result.status === 'amount_mismatch') console.error('[payos/webhook] chuyển thiếu tiền, đơn', order.code);
  // 7. Phản hồi
  return ok({ handled: result.status === 'paid' || result.status === 'already_paid' });
}

/** POST /api/admin/orders/:id/confirm và /refund. Kiểm email admin ở mỗi request. */
export async function handleAdminOrder(
  input: Base & { action: string | undefined; orderId: string | undefined; adminEmails: readonly string[] },
): Promise<Response> {
  const { request, user, repo, siteUrl, action, orderId, adminEmails } = input;
  if (request.method !== 'POST') return errors.method();
  if (!sameOrigin(request, siteUrl)) return errors.origin();
  if (!user) return errors.unauthenticated();
  const email = user.email?.toLowerCase();
  if (!email || !adminEmails.includes(email)) return errors.forbidden('Chỉ admin làm được việc này.');
  if (!z.uuid().safeParse(orderId).success || !orderId) return errors.badRequest();

  if (action === 'confirm') {
    const r = await repo.confirm(orderId, null, `admin:${email}`, null);
    if (r.status === 'not_found') return fail(404, 'not_found', 'Không tìm thấy đơn này.');
    if (r.status === 'not_pending') return fail(409, 'conflict', 'Đơn này đã hoàn tiền, không xác nhận lại được.');
    return ok(r);
  }
  if (action === 'refund') {
    const r = await repo.refund(orderId);
    if (r.status === 'not_found') return fail(404, 'not_found', 'Không tìm thấy đơn này.');
    if (r.status === 'not_paid') return fail(409, 'conflict', 'Chỉ hoàn tiền được đơn đã trả.');
    return ok(r);
  }
  return fail(404, 'not_found', 'Không có thao tác này.');
}
