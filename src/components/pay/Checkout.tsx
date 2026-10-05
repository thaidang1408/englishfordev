import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import type { OrderView } from '../../lib/pay/order';
import { PLANS, formatVnd } from '../../lib/pricing';

type Plan = keyof typeof PLANS;
type Props = { initialPlan: Plan; initialOrder: OrderView | null };

const orderSchema = z.object({
  id: z.string(),
  code: z.string(),
  plan: z.enum(['30d', '90d']),
  amount: z.number(),
  status: z.enum(['pending', 'paid', 'refunded', 'expired']),
  checkout_url: z.string().nullable(),
  qr: z.object({ size: z.number(), d: z.string().regex(/^(M\d+ \d+h1v1h-1z)*$/) }).nullable(),
  created_at: z.string(),
});
const responseSchema = z.union([
  z.object({ ok: z.literal(true), data: z.object({ order: orderSchema }) }),
  z.object({ ok: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }),
]);

const POLL_MS = 5000;
const POLL_FOR_MS = 30 * 60_000;

async function call(url: string, init?: RequestInit): Promise<{ order: OrderView } | { error: string }> {
  try {
    const res = await fetch(url, { credentials: 'same-origin', ...init });
    const parsed = responseSchema.safeParse(await res.json().catch(() => null));
    if (res.status === 401) return { error: 'Phiên đăng nhập đã hết. Tải lại trang để đăng nhập.' };
    if (!parsed.success) return { error: 'Máy chủ trả về kết quả không đọc được. Bạn thử lại sau ít phút.' };
    return parsed.data.ok ? { order: parsed.data.data.order } : { error: parsed.data.error.message };
  } catch {
    return { error: 'Lỗi kết nối. Bạn kiểm tra mạng rồi thử lại.' };
  }
}

/** /nang-cap: chọn gói, tạo đơn, hiện mã QR của payOS, tự báo khi đã nhận tiền (SPEC mục 2). */
export default function Checkout({ initialPlan, initialOrder }: Props) {
  const [plan, setPlan] = useState<Plan>(initialOrder?.plan ?? initialPlan);
  const [order, setOrder] = useState<OrderView | null>(initialOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const started = useRef(Date.now());
  useEffect(() => setReady(true), []);

  const create = useCallback(async () => {
    setBusy(true);
    setError(null);
    const out = await call('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    setBusy(false);
    if ('order' in out) {
      setOrder(out.order);
      started.current = Date.now();
    } else setError(out.error);
  }, [plan]);

  // Đơn đang chờ: hỏi trạng thái mỗi 5 giây khi tab đang mở, tối đa 30 phút.
  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - started.current > POLL_FOR_MS) return window.clearInterval(timer);
      const out = await call(`/api/orders/${order.id}`);
      if ('order' in out && out.order.status !== 'pending') setOrder(out.order);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [order]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (order?.status === 'paid') {
    return (
      <div className="today-card answer-in" aria-live="polite">
        <p className="note ok" style={{ marginTop: 0 }}>
          Đã nhận {formatVnd(order.amount)} cho đơn {order.code}. Premium {PLANS[order.plan].days} ngày đã được mở.
        </p>
        <a className="btn btn-primary" href="/hom-nay" style={{ marginTop: 'var(--s-4)' }}>
          Về trang Hôm nay
        </a>
      </div>
    );
  }

  if (order?.status === 'pending' && order.qr) {
    return (
      <div className="checkout answer-in">
        <div className="qr-box">
          <svg viewBox={`0 0 ${order.qr.size} ${order.qr.size}`} role="img" aria-label={`Mã QR chuyển khoản ${formatVnd(order.amount)}, nội dung ${order.code}`} shapeRendering="crispEdges">
            <rect width={order.qr.size} height={order.qr.size} fill="#fff" />
            <path d={order.qr.d} fill="#000" />
          </svg>
        </div>
        <div className="checkout-info">
          <dl>
            <div>
              <dt>Gói</dt>
              <dd>Premium {PLANS[order.plan].days} ngày</dd>
            </div>
            <div>
              <dt>Số tiền</dt>
              <dd className="mono">{formatVnd(order.amount)}</dd>
            </div>
            <div>
              <dt>Nội dung chuyển khoản</dt>
              <dd>
                <span className="mono code-pay">{order.code}</span>{' '}
                <button type="button" className="btn-link" onClick={() => void copyCode(order.code)}>
                  {copied ? 'Đã chép' : 'Chép'}
                </button>
              </dd>
            </div>
          </dl>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Mở ứng dụng ngân hàng, quét mã QR. Số tiền và nội dung đã điền sẵn, bạn giữ nguyên rồi chuyển. Premium tự mở trong khoảng một phút
            sau khi nhận tiền.
          </p>
          <p className="wait" aria-live="polite">
            <span className="dot" aria-hidden="true" /> Đang chờ nhận tiền
          </p>
          {order.checkout_url && (
            <p style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
              Không quét được? <a href={order.checkout_url}>Mở trang thanh toán payOS</a>
            </p>
          )}
          <button type="button" className="btn btn-quiet" style={{ marginTop: 'var(--s-4)' }} onClick={() => setOrder(null)}>
            Chọn gói khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="plan-pick" role="radiogroup" aria-label="Chọn gói">
        {(Object.keys(PLANS) as Plan[]).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={plan === p}
            className={`plan plan-option${plan === p ? ' picked' : ''}`}
            onClick={() => setPlan(p)}
            disabled={!ready || busy}
          >
            <span className="plan-name">{PLANS[p].days} ngày</span>
            <span className="price">{formatVnd(PLANS[p].amount)}</span>
            <span className="muted plan-note">{p === '90d' ? `${formatVnd(Math.round(PLANS[p].amount / 3))} mỗi 30 ngày` : 'Mua theo kỳ, không tự gia hạn'}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary" style={{ marginTop: 'var(--s-5)' }} onClick={() => void create()} disabled={!ready || busy}>
        {busy ? 'Đang tạo mã' : `Tạo mã thanh toán ${formatVnd(PLANS[plan].amount)}`}
      </button>
      <div aria-live="polite">{error && <p className="note err">{error}</p>}</div>
    </div>
  );
}
