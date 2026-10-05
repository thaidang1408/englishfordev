import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROGRESS_KEY, fetchAccountResult, migrateGuestProgress } from '../../src/lib/progress/client-sync';

const GUEST = JSON.stringify({ 'standup-01': { answers: { s01q1: false }, completed_at: '2026-10-05T02:00:00.000Z' } });

function fakeStorage(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

let store: ReturnType<typeof fakeStorage>;
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  store = fakeStorage({});
  vi.stubGlobal('window', { localStorage: store });
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

const respond = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

describe('chuyển tiến độ khách lên tài khoản', () => {
  it('chuyển một lần rồi xóa khỏi trình duyệt', async () => {
    store.setItem(PROGRESS_KEY, GUEST);
    fetchMock.mockResolvedValueOnce(respond(200));
    expect(await migrateGuestProgress()).toBe('migrated');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.data.has(PROGRESS_KEY)).toBe(false);

    // Lần sau, hoặc tài khoản khác đăng nhập trên cùng trình duyệt: không còn gì để gửi.
    expect(await migrateGuestProgress()).toBe('nothing');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('chưa đăng nhập thì giữ nguyên tiến độ', async () => {
    store.setItem(PROGRESS_KEY, GUEST);
    fetchMock.mockResolvedValueOnce(respond(401));
    expect(await migrateGuestProgress()).toBe('guest');
    expect(store.data.get(PROGRESS_KEY)).toBe(GUEST);
  });

  it('lỗi máy chủ hay mạng thì giữ lại để gửi lần sau', async () => {
    store.setItem(PROGRESS_KEY, GUEST);
    fetchMock.mockResolvedValueOnce(respond(500));
    expect(await migrateGuestProgress()).toBe('failed');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await migrateGuestProgress()).toBe('failed');
    expect(store.data.get(PROGRESS_KEY)).toBe(GUEST);
  });

  it('dữ liệu đã gửi ở bản cũ chỉ bị dọn, không gửi lại', async () => {
    store.setItem(PROGRESS_KEY, GUEST);
    store.setItem('epc:progress:synced', GUEST);
    expect(await migrateGuestProgress()).toBe('nothing');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.data.size).toBe(0);
  });
});

describe('kết quả bài của tài khoản', () => {
  it('401 nghĩa là khách', async () => {
    fetchMock.mockResolvedValueOnce(respond(401));
    expect(await fetchAccountResult('standup-01')).toEqual({ kind: 'guest' });
  });

  it('đọc điểm đã lưu hoặc null', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { ok: true, data: { completed: { score: 3, completed_at: 'x' } } }));
    expect(await fetchAccountResult('standup-01')).toEqual({ kind: 'account', completed: { score: 3 } });
    fetchMock.mockResolvedValueOnce(respond(200, { ok: true, data: { completed: null } }));
    expect(await fetchAccountResult('standup-01')).toEqual({ kind: 'account', completed: null });
  });

  it('phản hồi lạ hay lỗi mạng thì báo lỗi', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { ok: true, data: { completed: { score: 'x' } } }));
    expect(await fetchAccountResult('standup-01')).toEqual({ kind: 'error' });
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await fetchAccountResult('standup-01')).toEqual({ kind: 'error' });
  });
});
