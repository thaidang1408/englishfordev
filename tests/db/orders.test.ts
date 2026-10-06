import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PLANS } from '../../src/lib/pricing';
import { as, createTestDb, createUser } from './harness';

const A = '00000000-0000-4000-8000-0000000000a2';
const B = '00000000-0000-4000-8000-0000000000b2';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, A, 'An');
  await createUser(db, B, 'Bình');
}, 60_000);

afterAll(async () => {
  await db.close();
});

async function newOrder(user: string, code: string, plan: '30d' | '90d' = '30d') {
  const r = await db.query<{ id: string; order_number: string }>(
    `insert into public.orders (user_id, code, plan, amount) values ($1, $2, $3, $4) returning id, order_number`,
    [user, code, plan, PLANS[plan].amount],
  );
  return r.rows[0]!;
}

const confirm = (id: string, amount: number | null = null) =>
  as(db, 'service_role', null, async () =>
    (await db.query<{ r: { status: string } }>(`select public.confirm_order($1, 'FT123', 'payos', $2) as r`, [id, amount])).rows[0]!.r,
  );

const refund = (code: string) =>
  as(db, 'service_role', null, async () =>
    (await db.query<{ r: { status: string } }>(`select public.refund_order(id) as r from public.orders where code = $1`, [code])).rows[0]!.r,
  );

const premiumDays = async (user: string) =>
  (
    await db.query<{ d: number | null }>(
      `select round(extract(epoch from premium_until - now()) / 86400)::int as d from public.entitlements where user_id = $1`,
      [user],
    )
  ).rows[0]?.d ?? null;

describe('đơn hàng', () => {
  it('số đơn cho payOS tự tăng và không trùng', async () => {
    const a = await newOrder(A, 'EPCAAAAA');
    const b = await newOrder(A, 'EPCAAAAB');
    expect(Number(b.order_number)).toBeGreaterThan(Number(a.order_number));
    expect(Number(a.order_number)).toBeGreaterThanOrEqual(100001);
  });

  it('xác nhận đơn 30 ngày: đơn thành paid, Premium tới 30 ngày sau', async () => {
    const o = await newOrder(A, 'EPCCONF1');
    expect(await confirm(o.id, PLANS['30d'].amount)).toMatchObject({ status: 'paid' });
    expect(await premiumDays(A)).toBe(30);
    const row = await db.query<{ status: string; bank_ref: string; paid_by: string }>(
      'select status, bank_ref, paid_by from public.orders where id = $1',
      [o.id],
    );
    expect(row.rows[0]).toEqual({ status: 'paid', bank_ref: 'FT123', paid_by: 'payos' });
  });

  it('xác nhận lần hai (webhook gửi lại) không cộng thêm ngày', async () => {
    const o = await newOrder(B, 'EPCTWICE');
    await confirm(o.id);
    expect(await confirm(o.id)).toEqual({ status: 'already_paid' });
    expect(await premiumDays(B)).toBe(30);
  });

  it('còn Premium thì cộng nối tiếp: 30 + 90 ngày', async () => {
    const o = await newOrder(B, 'EPCMORE1', '90d');
    await confirm(o.id);
    expect(await premiumDays(B)).toBe(120);
  });

  it('chuyển thiếu tiền thì không xác nhận', async () => {
    const o = await newOrder(A, 'EPCSHORT');
    expect(await confirm(o.id, PLANS['30d'].amount - 1000)).toEqual({ status: 'amount_mismatch' });
    const row = await db.query<{ status: string }>('select status from public.orders where id = $1', [o.id]);
    expect(row.rows[0]?.status).toBe('pending');
  });

  it('hoàn đơn 90 ngày khi đã mua 30 + 90: còn đúng 30 ngày, dữ liệu còn nguyên', async () => {
    expect(await refund('EPCMORE1')).toEqual({ status: 'refunded' });
    expect(await premiumDays(B)).toBe(30);
    expect((await db.query('select 1 from public.orders where user_id = $1', [B])).rows.length).toBe(2);
    expect(await refund('EPCMORE1')).toEqual({ status: 'not_paid' });
    expect(await premiumDays(B)).toBe(30);
  });

  it('hoàn đơn duy nhất: Premium về hiện tại, không âm', async () => {
    expect(await refund('EPCTWICE')).toEqual({ status: 'refunded' });
    expect(await premiumDays(B)).toBe(0);
    const r = await db.query<{ ok: boolean }>('select abs(extract(epoch from premium_until - now())) < 60 as ok from public.entitlements where user_id = $1', [B]);
    expect(r.rows[0]?.ok).toBe(true);
  });

  it('admin_list_orders: đơn kèm email và tên, chỉ service role gọi được', async () => {
    const rows = await as(db, 'service_role', null, async () =>
      (await db.query<{ code: string; email: string; name: string }>('select code, email, name from public.admin_list_orders(2)')).rows,
    );
    expect(rows).toHaveLength(2);
    const all = (await db.query<{ code: string }>('select code from public.orders order by created_at desc limit 2')).rows.map((r) => r.code);
    expect(rows.map((r) => r.code)).toEqual(all);
    const b = await db.query<{ email: string; name: string }>('select email, name from public.admin_list_orders(100) where code = $1', ['EPCMORE1']);
    expect(b.rows[0]).toEqual({ email: `${B.slice(0, 8)}@example.com`, name: 'Bình' });
    await expect(as(db, 'authenticated', A, () => db.query('select * from public.admin_list_orders(10)'))).rejects.toThrow(/permission denied/);
    await expect(as(db, 'anon', null, () => db.query('select * from public.admin_list_orders(10)'))).rejects.toThrow(/permission denied/);
  });

  it('người dùng không gọi được hàm xác nhận, không tự sửa được đơn hay quyền Premium', async () => {
    const o = await newOrder(A, 'EPCHACK1');
    await expect(as(db, 'authenticated', A, () => db.query(`select public.confirm_order($1, null, 'me', null)`, [o.id]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(as(db, 'authenticated', A, () => db.query(`update public.orders set status = 'paid' where id = $1`, [o.id]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as(db, 'authenticated', A, () => db.query(`update public.entitlements set premium_until = now() + interval '1 year'`)),
    ).rejects.toThrow(/permission denied/);
  });

  it('người dùng chỉ thấy đơn của mình, kể cả mã QR', async () => {
    const mine = await as(db, 'authenticated', A, async () => (await db.query<{ user_id: string }>('select user_id, qr_code from public.orders')).rows);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((r) => r.user_id === A)).toBe(true);
  });
});
