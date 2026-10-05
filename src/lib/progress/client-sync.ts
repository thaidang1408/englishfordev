/**
 * Chạy ở trình duyệt, không import zod để bundle nhỏ. Server kiểm dữ liệu bằng schema.
 * Gửi tiến độ trong localStorage lên tài khoản; gửi lại nhiều lần cũng không sinh dữ liệu trùng.
 */
export const PROGRESS_KEY = 'epc:progress:v1';
const SYNCED_KEY = 'epc:progress:synced';

export type SyncOutcome = 'synced' | 'nothing' | 'guest' | 'failed';

export async function syncLocalProgress(): Promise<SyncOutcome> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw || localStorage.getItem(SYNCED_KEY) === raw) return 'nothing';
  } catch {
    return 'nothing';
  }

  let res: Response;
  try {
    res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: `{"progress":${raw}}`,
    });
  } catch {
    return 'failed';
  }
  if (res.status === 401) return 'guest';
  // 400 và 403: dữ liệu không dùng được, đánh dấu để không gửi lại mãi.
  if (res.ok || res.status === 400 || res.status === 403) {
    try {
      localStorage.setItem(SYNCED_KEY, raw);
    } catch {
      // Không ghi được thì lần sau gửi lại, server bỏ qua dòng trùng.
    }
  }
  return res.ok ? 'synced' : 'failed';
}
