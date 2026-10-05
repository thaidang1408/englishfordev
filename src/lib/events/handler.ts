import { errors, sameOrigin } from '../http/response';
import { eventBodySchema, type ClientEvent, type EventProps } from './schema';

export type EventRepo = {
  insert(row: { user_id: string | null; anon_id: string; name: ClientEvent; props: EventProps }): Promise<void>;
};

type Input = { request: Request; user: { id: string } | null; repo: EventRepo; siteUrl?: string };

const MAX_BODY = 1024;

/** POST /api/events: ghi một sự kiện phễu từ trình duyệt, cho cả khách chưa đăng nhập (SPEC mục 3, 10). */
export async function handleEvent({ request, user, repo, siteUrl }: Input): Promise<Response> {
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
  // 5. Quyền: RLS chỉ cho ghi user_id của chính người gọi, không cho đọc.
  // 6. Việc chính
  await repo.insert({ user_id: user?.id ?? null, ...body.data });
  // 7. Phản hồi
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
