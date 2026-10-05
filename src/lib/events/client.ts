import type { ClientEvent, EventProps } from './schema';

const ANON_KEY = 'epc:anon';
const SRC_KEY = 'epc:src';

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Mã ngẫu nhiên của trình duyệt này, để nối các bước của cùng một người. Không gắn với email hay tên. */
function anonId(): string {
  const s = store();
  let id = s?.getItem(ANON_KEY) ?? null;
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = crypto.randomUUID();
    s?.setItem(ANON_KEY, id);
  }
  return id;
}

/** Tham số ?src= của lần vào đầu tiên (SPEC mục 10). Lần sau có src khác cũng không ghi đè. */
function firstSrc(): string | undefined {
  const s = store();
  const saved = s?.getItem(SRC_KEY);
  if (saved) return saved;
  const src = new URLSearchParams(location.search).get('src');
  if (!src || !/^[A-Za-z0-9_.-]{1,40}$/.test(src)) return undefined;
  s?.setItem(SRC_KEY, src);
  return src;
}

/** Gửi một sự kiện phễu. Lỗi thì bỏ qua: đo đếm không được làm hỏng việc học. */
export function track(name: ClientEvent, props: Omit<EventProps, 'src'> = {}): void {
  try {
    const src = firstSrc();
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({ name, anon_id: anonId(), props: src ? { ...props, src } : props }),
    }).catch(() => {});
  } catch {
    // Trình duyệt cũ hoặc chặn bộ nhớ: không ghi.
  }
}

/**
 * Chạy một lần mỗi trang (Base.astro): page_view, và lesson_start hoặc paywall_view theo đánh dấu trên trang.
 * `data-lesson-start` trên trang bài học, `.paywall` ở bốn điểm mời nâng cấp.
 */
export function trackPage(): void {
  track('page_view');
  const lesson = document.querySelector<HTMLElement>('[data-lesson-start]')?.dataset.lessonStart;
  if (lesson) track('lesson_start', { lesson_key: lesson });
  const paywall = document.querySelector<HTMLElement>('.paywall');
  if (paywall) {
    const key = paywall.closest<HTMLElement>('[data-lesson-key]')?.dataset.lessonKey;
    track('paywall_view', key ? { lesson_key: key } : {});
  }
}
