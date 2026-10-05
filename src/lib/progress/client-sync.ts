/**
 * Chạy ở trình duyệt. Không import zod để script trên mọi trang trong app nhỏ; phản hồi được kiểm bằng hàm thu hẹp kiểu.
 * Server kiểm mọi dữ liệu gửi lên bằng schema.
 */
export const PROGRESS_KEY = 'epc:progress:v1';
/** Bản cũ đánh dấu dữ liệu đã gửi bằng khóa này; chỉ còn dùng để dọn. */
const LEGACY_SYNCED_KEY = 'epc:progress:synced';

export type LessonAnswers = { answers: Record<string, boolean>; completed_at?: string };

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clearGuestProgress(s: Storage): void {
  try {
    s.removeItem(PROGRESS_KEY);
    s.removeItem(LEGACY_SYNCED_KEY);
  } catch {
    // Không xóa được thì lần sau gửi lại; server không tạo dòng trùng.
  }
}

async function post(body: string): Promise<number> {
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
    });
    return res.status;
  } catch {
    return 0;
  }
}

export type MigrateOutcome = 'migrated' | 'nothing' | 'guest' | 'failed';

/**
 * Tiến độ học lúc là khách chỉ chuyển một lần, vào tài khoản đầu tiên đăng nhập trên trình duyệt này,
 * rồi xóa khỏi trình duyệt để không lẫn sang tài khoản khác.
 */
export async function migrateGuestProgress(): Promise<MigrateOutcome> {
  const s = storage();
  const raw = s?.getItem(PROGRESS_KEY);
  if (!s || !raw) return 'nothing';
  // Đã gửi ở bản trước: chỉ dọn, không gửi lại để không đưa mục ôn về mức 1.
  if (s.getItem(LEGACY_SYNCED_KEY) === raw) {
    clearGuestProgress(s);
    return 'nothing';
  }
  const status = await post(`{"progress":${raw}}`);
  if (status === 401) return 'guest';
  // 400 và 403: dữ liệu không dùng được, xóa để không gửi lại mãi.
  if (status === 200 || status === 400 || status === 403) clearGuestProgress(s);
  return status === 200 ? 'migrated' : 'failed';
}

export type AccountResult =
  | { kind: 'guest' }
  | { kind: 'account'; completed: { score: number } | null }
  | { kind: 'error' };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Kết quả bài này của tài khoản đang đăng nhập. Chưa đăng nhập trả về `guest`. */
export async function fetchAccountResult(lessonKey: string): Promise<AccountResult> {
  let res: Response;
  try {
    res = await fetch(`/api/progress?lesson=${encodeURIComponent(lessonKey)}`, { credentials: 'same-origin' });
  } catch {
    return { kind: 'error' };
  }
  if (res.status === 401) return { kind: 'guest' };
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok || !isRecord(json) || !isRecord(json.data)) return { kind: 'error' };
  const done = json.data.completed;
  if (done === null) return { kind: 'account', completed: null };
  if (isRecord(done) && typeof done.score === 'number') return { kind: 'account', completed: { score: done.score } };
  return { kind: 'error' };
}

/** Lưu một lần học xong vào tài khoản. */
export async function saveAccountResult(lessonKey: string, result: LessonAnswers): Promise<boolean> {
  return (await post(JSON.stringify({ progress: { [lessonKey]: result } }))) === 200;
}
