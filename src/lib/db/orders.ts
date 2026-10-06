import { z } from 'zod';
import type { OrderRepo } from '../pay/handlers';
import type { Db } from './supabase';
import type { OrderRow } from './types';

function check<T>(label: string, res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) {
    console.error(`[db] ${label}: ${res.error.message}`);
    throw new Error(`db: ${label}`);
  }
  return res.data;
}

const confirmSchema = z.union([
  z.object({ status: z.literal('paid'), premium_until: z.string() }),
  z.object({ status: z.enum(['already_paid', 'not_pending', 'amount_mismatch', 'not_found']) }),
]);
const refundSchema = z.object({ status: z.enum(['refunded', 'not_paid', 'not_found']) });

const COLUMNS = 'id, user_id, code, plan, amount, status, created_at, paid_at, order_number, checkout_url, qr_code, bank_ref, paid_by';

/** `db`: client theo session (RLS). `service`: service role, cho việc người dùng không được tự làm. */
export function orderRepo(db: Db, service: Db): OrderRepo {
  return {
    getOwnOrder: (userId, orderId) => getOwnOrder(db, userId, orderId),
    async findPendingOrder(userId, plan, since) {
      return check(
        'findPendingOrder',
        await db
          .from('orders')
          .select(COLUMNS)
          .eq('user_id', userId)
          .eq('plan', plan)
          .eq('status', 'pending')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
    },
    async insertOrder(row) {
      const res = await service.from('orders').insert(row).select(COLUMNS).single();
      // 23505: mã đơn trùng, để handler sinh mã khác.
      if (res.error?.code === '23505') return null;
      return check('insertOrder', res);
    },
    async attachLink(orderId, link) {
      check('attachLink', await service.from('orders').update(link).eq('id', orderId));
    },
    async markExpired(orderId) {
      check('markExpired', await service.from('orders').update({ status: 'expired' }).eq('id', orderId).eq('status', 'pending'));
    },
    async findByNumber(orderNumber) {
      return check('findByNumber', await service.from('orders').select(COLUMNS).eq('order_number', orderNumber).maybeSingle());
    },
    async confirm(orderId, bankRef, paidBy, paidAmount) {
      const data = check(
        'confirm_order',
        await service.rpc('confirm_order', { p_order_id: orderId, p_bank_ref: bankRef, p_paid_by: paidBy, p_paid_amount: paidAmount }),
      );
      return confirmSchema.parse(data);
    },
    async refund(orderId) {
      return refundSchema.parse(check('refund_order', await service.rpc('refund_order', { p_order_id: orderId })));
    },
  };
}

/** Một đơn của chính người dùng (RLS). */
export async function getOwnOrder(db: Db, userId: string, orderId: string): Promise<OrderRow | null> {
  return check('getOwnOrder', await db.from('orders').select(COLUMNS).eq('id', orderId).eq('user_id', userId).maybeSingle());
}

/** Đơn gần nhất của người dùng (RLS), để trang /nang-cap hiện lại mã QR khi tải lại trang. */
export async function getLatestOrder(db: Db, userId: string): Promise<OrderRow | null> {
  return check(
    'getLatestOrder',
    await db.from('orders').select(COLUMNS).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  );
}

export type AdminOrder = OrderRow & { email: string | null; name: string | null };

/** Danh sách đơn cho /admin, kèm email và tên người mua, một lần gọi. Chỉ gọi sau khi đã kiểm ADMIN_EMAILS. */
export async function listOrdersForAdmin(service: Db, limit = 100): Promise<AdminOrder[]> {
  return check('admin_list_orders', await service.rpc('admin_list_orders', { p_limit: limit })) ?? [];
}
