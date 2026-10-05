export type Segment = { text: string; changed: boolean };

/**
 * So sánh hai câu theo từ (LCS). Trả về các đoạn của câu gốc và câu sửa;
 * đoạn `changed` là chỗ được tô trong khung review.
 */
export function diffWords(before: string, after: string): { before: Segment[]; after: Segment[] } {
  const a = before.split(/\s+/).filter(Boolean);
  const b = after.split(/\s+/).filter(Boolean);

  // lcs[i][j] = độ dài chuỗi con chung dài nhất của a[i..] và b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  const at = (i: number, j: number): number => lcs[i]?.[j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = lcs[i];
      if (row) row[j] = a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }

  const keepA = new Array<boolean>(a.length).fill(false);
  const keepB = new Array<boolean>(b.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      keepA[i++] = true;
      keepB[j++] = true;
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      i++;
    } else {
      j++;
    }
  }

  return { before: toSegments(a, keepA), after: toSegments(b, keepB) };
}

function toSegments(words: string[], keep: boolean[]): Segment[] {
  const segments: Segment[] = [];
  words.forEach((word, k) => {
    const changed = !keep[k];
    const last = segments[segments.length - 1];
    if (last && last.changed === changed) {
      last.text += ` ${word}`;
    } else {
      if (last) last.text += ' ';
      segments.push({ text: word, changed });
    }
  });
  return segments;
}
