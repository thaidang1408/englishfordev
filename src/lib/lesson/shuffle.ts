/** Hoán vị ngẫu nhiên của 0..n-1 (Fisher–Yates). `random` được tiêm vào để test được. */
export function shuffledIndexes(n: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = order[i];
    const b = order[j];
    if (a === undefined || b === undefined) continue;
    order[i] = b;
    order[j] = a;
  }
  return order;
}

/** Số câu trắc nghiệm mỗi lượt học (SPEC mục 4 và 14). */
export const QUIZ_SIZE = 5;

/**
 * Chọn câu cho một lượt: giữ các câu đã trả lời trong lượt đang dở (theo thứ tự trong bài),
 * rồi lấy ngẫu nhiên từ các câu còn lại cho đủ `size`.
 */
export function pickQuestions<T extends { id: string }>(
  pool: readonly T[],
  answered: readonly string[] = [],
  size = QUIZ_SIZE,
  random: () => number = Math.random,
): T[] {
  const keep = pool.filter((q) => answered.includes(q.id)).slice(0, size);
  const rest = pool.filter((q) => !answered.includes(q.id));
  const order = shuffledIndexes(rest.length, random);
  const picked = [...keep, ...order.slice(0, size - keep.length).flatMap((i) => (rest[i] ? [rest[i]] : []))];
  return picked;
}
