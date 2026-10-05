import { encode } from 'uqr';
import { z } from 'zod';
import type { OrderPlan, OrderRow, OrderStatus } from '../db/types';
import { PLANS } from '../pricing';

/** Mã đơn "EPC" + 5 ký tự, bỏ các ký tự dễ nhầm (0, O, 1, I). Là nội dung chuyển khoản. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newOrderCode(random: (n: number) => number = randomInt): string {
  let code = 'EPC';
  for (let i = 0; i < 5; i++) code += ALPHABET[random(ALPHABET.length)];
  return code;
}

function randomInt(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) % n;
}

export const planSchema = z.enum(['30d', '90d']);

/** Số tiền luôn do server tính từ gói, không nhận từ client (skill api-endpoint). */
export function amountFor(plan: OrderPlan): number {
  return PLANS[plan].amount;
}

/** Link thanh toán payOS sống 24 giờ. Đơn chờ của cùng gói trong khoảng này được dùng lại. */
export const LINK_TTL_HOURS = 24;

/**
 * Đường vẽ mã QR dạng SVG (một path), tính ở server. Giao diện chỉ gắn chuỗi này vào thuộc tính `d`,
 * không chèn HTML.
 */
export function qrPath(text: string): { size: number; d: string } {
  const { data, size } = encode(text, { ecc: 'M', border: 2 });
  let d = '';
  data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) d += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return { size, d };
}

/** Dữ liệu đơn gửi về trình duyệt của chính chủ đơn. */
export type OrderView = {
  id: string;
  code: string;
  plan: OrderPlan;
  amount: number;
  status: OrderStatus;
  checkout_url: string | null;
  qr: { size: number; d: string } | null;
  created_at: string;
};

export function toView(o: Pick<OrderRow, 'id' | 'code' | 'plan' | 'amount' | 'status' | 'checkout_url' | 'qr_code' | 'created_at'>): OrderView {
  return {
    id: o.id,
    code: o.code,
    plan: o.plan,
    amount: o.amount,
    status: o.status,
    checkout_url: o.checkout_url,
    qr: o.status === 'pending' && o.qr_code ? qrPath(o.qr_code) : null,
    created_at: o.created_at,
  };
}
