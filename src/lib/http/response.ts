/** Dạng phản hồi JSON chung (skill api-endpoint). */
export type ApiError = { code: string; message: string };

const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

export function ok<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), { status, headers: HEADERS });
}

export function fail(status: number, code: string, message: string): Response {
  const body: { ok: false; error: ApiError } = { ok: false, error: { code, message } };
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export const errors = {
  method: () => fail(405, 'method_not_allowed', 'Phương thức không được hỗ trợ.'),
  origin: () => fail(403, 'bad_origin', 'Yêu cầu không đến từ trang của EPC.'),
  unauthenticated: () => fail(401, 'unauthenticated', 'Bạn cần đăng nhập để làm việc này.'),
  badRequest: (message = 'Dữ liệu gửi lên không hợp lệ.') => fail(400, 'bad_request', message),
  forbidden: (message: string) => fail(403, 'forbidden', message),
  internal: () => fail(500, 'internal', 'Có lỗi ở máy chủ. Thử lại sau ít phút.'),
};

/**
 * POST từ trình duyệt phải có Origin trùng site. Chấp nhận PUBLIC_SITE_URL và origin của chính request
 * (Host do trình duyệt của nạn nhân gửi, trang khác không giả được), để chạy được cả local lẫn production.
 */
export function sameOrigin(request: Request, siteUrl?: string): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  const allowed = new Set([new URL(request.url).origin]);
  if (siteUrl) allowed.add(new URL(siteUrl).origin);
  return allowed.has(origin);
}
