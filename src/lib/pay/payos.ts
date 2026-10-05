import { z } from 'zod';

/**
 * Gọi payOS (https://payos.vn/docs/api/). Chỉ chạy ở server: key nằm trong secret của Cloudflare.
 * Chữ ký dùng HMAC-SHA256 qua Web Crypto, chạy được trên Workers và Node.
 */
export type PayosConfig = { clientId: string; apiKey: string; checksumKey: string };

const BASE = 'https://api-merchant.payos.vn';

const encoder = new TextEncoder();

async function hmacHex(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** So sánh hai chuỗi hex với thời gian không phụ thuộc vị trí khác nhau (skill api-endpoint). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Chuỗi dữ liệu để ký theo tài liệu payOS: khóa xếp theo bảng chữ cái, dạng key=value nối bằng &,
 * null hoặc undefined thành chuỗi rỗng, mảng thành JSON với khóa của từng phần tử đã xếp.
 */
export function signingString(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .filter((key) => data[key] !== undefined)
    .map((key) => {
      let value = data[key];
      if (Array.isArray(value)) {
        value = JSON.stringify(
          value.map((v) => (isObj(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v)),
        );
      } else if (isObj(value)) {
        value = JSON.stringify(value);
      }
      if (value === null || value === undefined || value === 'undefined' || value === 'null') value = '';
      return `${key}=${String(value)}`;
    })
    .join('&');
}

export function sign(data: Record<string, unknown>, checksumKey: string): Promise<string> {
  return hmacHex(checksumKey, signingString(data));
}

/** Kiểm chữ ký webhook: ký lại toàn bộ object `data` nhận được (không bỏ trường nào) rồi so sánh. */
export async function verifySignature(data: Record<string, unknown>, signature: string, checksumKey: string): Promise<boolean> {
  return safeEqual(await sign(data, checksumKey), signature.toLowerCase());
}

export class PayosError extends Error {
  constructor(detail: string) {
    super(`payos: ${detail}`);
    this.name = 'PayosError';
  }
}

const createResponseSchema = z.object({
  code: z.string(),
  desc: z.string(),
  data: z
    .object({
      checkoutUrl: z.url(),
      qrCode: z.string().min(10).max(1000),
      paymentLinkId: z.string(),
    })
    .nullable(),
});

const infoResponseSchema = z.object({
  code: z.string(),
  desc: z.string(),
  data: z
    .object({
      status: z.string(),
      amount: z.number(),
      amountPaid: z.number(),
    })
    .nullable(),
});

type Fetch = typeof fetch;

export type CreateLinkInput = {
  orderCode: number;
  amount: number;
  /** Nội dung chuyển khoản, ví dụ "EPCABCDE". */
  description: string;
  returnUrl: string;
  cancelUrl: string;
  /** Unix timestamp (giây). */
  expiredAt: number;
};

export function payosClient(cfg: PayosConfig, fetcher: Fetch = fetch) {
  const headers = { 'Content-Type': 'application/json', 'x-client-id': cfg.clientId, 'x-api-key': cfg.apiKey };
  return {
    /** Tạo link thanh toán: trả về chuỗi QR (VietQR) và trang thanh toán của payOS. */
    async createLink(input: CreateLinkInput): Promise<{ checkoutUrl: string; qrCode: string }> {
      const { amount, cancelUrl, description, orderCode, returnUrl } = input;
      const signature = await sign({ amount, cancelUrl, description, orderCode, returnUrl }, cfg.checksumKey);
      const res = await fetcher(`${BASE}/v2/payment-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...input, signature }),
      });
      const parsed = createResponseSchema.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || parsed.data.code !== '00' || !parsed.data.data) {
        throw new PayosError(`create ${res.status} ${parsed.success ? parsed.data.code : 'bad response'}`);
      }
      return { checkoutUrl: parsed.data.data.checkoutUrl, qrCode: parsed.data.data.qrCode };
    },

    /** Trạng thái thanh toán theo số đơn, dùng khi webhook chưa tới. */
    async getLink(orderCode: number): Promise<{ status: string; amountPaid: number }> {
      const res = await fetcher(`${BASE}/v2/payment-requests/${orderCode}`, { headers });
      const parsed = infoResponseSchema.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || parsed.data.code !== '00' || !parsed.data.data) {
        throw new PayosError(`get ${res.status} ${parsed.success ? parsed.data.code : 'bad response'}`);
      }
      return { status: parsed.data.data.status, amountPaid: parsed.data.data.amountPaid };
    },

    /** Đăng ký địa chỉ webhook với payOS (npm run setup:pay gọi một lần). */
    async confirmWebhook(webhookUrl: string): Promise<void> {
      const res = await fetcher(`${BASE}/confirm-webhook`, { method: 'POST', headers, body: JSON.stringify({ webhookUrl }) });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok || !isObj(body) || body.code !== '00') throw new PayosError(`confirm-webhook ${res.status}`);
    },
  };
}

export type PayosClient = ReturnType<typeof payosClient>;
