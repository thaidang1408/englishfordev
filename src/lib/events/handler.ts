import { errors, fail, sameOrigin } from '../http/response';
import { eventBodySchema, type ClientEvent, type EventProps } from './schema';

export type EventRepo = {
  insert(row: { user_id: string | null; anon_id: string; name: ClientEvent; props: EventProps }): Promise<void>;
};

/** Trả false khi vượt giới hạn. Không có binding (local, test) thì không truyền. */
export type RateLimit = (key: string) => Promise<boolean>;

type Input = { request: Request; user: { id: string } | null; repo: EventRepo; siteUrl?: string; limit?: RateLimit };

const MAX_BODY = 1024;

/** POST /api/events: ghi một sự kiện phễu từ trình duyệt, cho cả khách chưa đăng nhập (SPEC mục 3, 10). */
export async function handleEvent({ request, user, repo, siteUrl, limit }: Input): Promise<Response> {
  // 1. Phương thức
  if (request.method !== 'POST') return errors.method();
  // 2. Nguồn gốc
  if (!sameOrigin(request, siteUrl)) return errors.origin();
  // 3. Danh tính: không bắt buộc. Có session thì gắn user_id từ server, không lấy từ body.
  // 4. Dữ liệu vào
  const raw = await request.text();
  if (raw.length > MAX_BODY) return errors.badRequest();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return errors.badRequest();
  }
  const body = eventBodySchema.safeParse(json);
  if (!body.success) return errors.badRequest();
  // Giới hạn theo IP để không ai làm đầy database. Chỉ tính sự kiện hợp lệ: dữ liệu rác đã bị trả 400 ở trên.
  if (limit && !(await limit(request.headers.get('CF-Connecting-IP') ?? 'unknown'))) {
    return fail(429, 'rate_limited', 'Bạn gửi quá nhanh. Thử lại sau ít phút.');
  }
  // 5. Quyền: client không ghi thẳng bảng events, route ghi bằng service role sau khi đã kiểm ở trên.
  // 6. Việc chính
  await repo.insert({ user_id: user?.id ?? null, ...body.data });
  // 7. Phản hồi
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
