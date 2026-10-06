/**
 * Tự sửa trước (SPEC mục 14): so bản người dùng tự sửa với bản AI sửa, và tô các đoạn sai
 * trong câu gốc. Hàm thuần, chạy ở trình duyệt, không gọi AI.
 */

/** Bỏ khác biệt chữ hoa thường, khoảng trắng, kiểu dấu nháy và dấu câu cuối câu. */
export function normalizeSentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s.!?]+$/, '');
}

export function sameSentence(a: string, b: string): boolean {
  return normalizeSentence(a) === normalizeSentence(b);
}

export type Piece = { text: string; mark: boolean };

/**
 * Tách câu gốc thành các đoạn, đánh dấu lần xuất hiện đầu tiên của mỗi đoạn sai.
 * Đoạn rỗng, không tìm thấy, hoặc chồng lên đoạn đã tô thì bỏ qua.
 */
export function markFragments(original: string, fragments: readonly string[]): Piece[] {
  const ranges: [number, number][] = [];
  for (const f of fragments) {
    if (!f) continue;
    let at = original.indexOf(f);
    while (at >= 0 && ranges.some(([s, e]) => at < e && at + f.length > s)) at = original.indexOf(f, at + 1);
    if (at >= 0) ranges.push([at, at + f.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const pieces: Piece[] = [];
  let pos = 0;
  for (const [s, e] of ranges) {
    if (s > pos) pieces.push({ text: original.slice(pos, s), mark: false });
    pieces.push({ text: original.slice(s, e), mark: true });
    pos = e;
  }
  if (pos < original.length) pieces.push({ text: original.slice(pos), mark: false });
  return pieces;
}
