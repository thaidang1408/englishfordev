/** Dùng được ở trình duyệt: không import gì để script của trang /bug-hom-nay nhỏ. */
export const MAX_TRIES = 3;

/** Văn bản để chia sẻ: chỉ kết quả, không lộ đáp án cho người chưa chơi. */
export function shareText(date: string, foundAt: number | null, url: string): string {
  const [y, m, d] = date.split('-');
  const result = foundAt ? `Tìm ra ở lần thử ${foundAt} trên ${MAX_TRIES}.` : `Chưa tìm ra sau ${MAX_TRIES} lần thử.`;
  return `Bug của ngày ${d}/${m}/${y}, English Personal Coach\n${result}\nThử tìm lỗi trong câu hôm nay: ${url}`;
}
