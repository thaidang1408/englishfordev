/** Luật chơi và văn bản chia sẻ. Dùng được ở trình duyệt: không import gì để island của /bug-hom-nay nhỏ. */
export const MAX_TRIES = 3;

/** Kết quả một dòng: các vị trí đã bấm theo thứ tự, và có tìm ra không. */
export type LineResult = { tries: number; found: boolean };

/** Điểm một dòng: tìm ra ở lần 1 được 3, lần 2 được 2, lần 3 được 1, không tìm ra được 0. */
export function linePoints(r: LineResult): number {
  return r.found ? MAX_TRIES + 1 - r.tries : 0;
}

export function totalPoints(lines: readonly LineResult[]): number {
  return lines.reduce((sum, r) => sum + linePoints(r), 0);
}

export type Verdict = { key: 'approve' | 'comments' | 'changes' | 'again'; label: string; note: string };

/** Kết luận review theo điểm, đặt tên như khi duyệt pull request thật. */
export function verdict(points: number, max: number): Verdict {
  if (points >= max) return { key: 'approve', label: 'Approve', note: 'Không lọt lỗi nào, toàn bộ tìm ra ngay lần đầu.' };
  if (points * 3 >= max * 2) return { key: 'comments', label: 'Approve, kèm góp ý', note: 'Bạn bắt được hết hoặc gần hết, chỉ chậm vài nhịp.' };
  if (points * 3 >= max) return { key: 'changes', label: 'Request changes', note: 'Còn lỗi lọt qua. Đọc giải thích từng dòng rồi thử PR ngày mai.' };
  return { key: 'again', label: 'Cần review lại', note: 'Các lỗi hôm nay khó. Mở bài học của từng dòng để nắm mẫu câu.' };
}

/** Ô kết quả kiểu Wordle, không dùng emoji: mỗi lần bấm sai là □, lần tìm ra là ■. */
export function resultGrid(lines: readonly LineResult[]): string {
  return lines.map((r) => (r.found ? '□'.repeat(r.tries - 1) + '■' : '□'.repeat(MAX_TRIES))).join(' ');
}

export function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Số PR của ngày theo ngày và tháng, ví dụ 2026-10-07 thành #0710. */
export function prNumber(date: string): string {
  const [, m, d] = date.split('-');
  return `#${d}${m}`;
}

/** Số ngày liên tiếp đã chơi tính lùi từ hôm nay (hôm nay chưa chơi thì tính từ hôm qua). */
export function streakFrom(played: readonly string[], today: string): number {
  const set = new Set(played);
  const day = (d: string, back: number) => new Date(Date.parse(`${d}T00:00:00Z`) - back * 86_400_000).toISOString().slice(0, 10);
  const start = set.has(today) ? 0 : 1;
  let n = 0;
  while (set.has(day(today, start + n))) n++;
  return n;
}

/** Văn bản để chia sẻ: chỉ kết quả, không lộ câu sai hay câu đúng. */
export function shareText(date: string, lines: readonly LineResult[], seconds: number | null, streak: number, url: string): string {
  const points = totalPoints(lines);
  const max = lines.length * MAX_TRIES;
  const time = seconds === null ? '' : ` · ${formatSeconds(seconds)}`;
  return [
    `Review PR ${prNumber(date)}, English Personal Coach`,
    resultGrid(lines),
    `${verdict(points, max).label} · ${points}/${max} điểm${time}`,
    ...(streak > 1 ? [`Chuỗi ${streak} ngày`] : []),
    `Bạn review thử PR hôm nay: ${url}`,
  ].join('\n');
}
