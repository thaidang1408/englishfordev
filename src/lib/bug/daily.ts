import { lessonKey, type Lesson } from '../content/schema';
import { alignWords } from '../lesson/diff';

export { MAX_TRIES, shareText } from './share';

export type DailyBug = {
  /** Ngày theo giờ Việt Nam, YYYY-MM-DD. */
  date: string;
  lesson: Pick<Lesson, 'slug' | 'title' | 'free'> & { key: string };
  wrong: string;
  right: string;
  why_vi: string;
  /** Các từ của câu sai, tách theo khoảng trắng. */
  words: string[];
  /** Vị trí các từ được tính là "chỗ sai". */
  targets: number[];
};

type Candidate = { lesson: Lesson; mistake: Lesson['mistakes'][number] };

/** Mọi câu sai trong mistakes[] của các bài, theo thứ tự track và bài (đã sắp ở lib/content/load). */
export function allMistakes(lessons: readonly Lesson[]): Candidate[] {
  return lessons.flatMap((lesson) => lesson.mistakes.map((mistake) => ({ lesson, mistake })));
}

/**
 * Chỗ người chơi phải bấm: các từ của câu sai không có trong câu đúng.
 * Lỗi thiếu từ (ví dụ thiếu "the") không có từ nào để bấm, nên tính từ đứng ngay sau chỗ thiếu.
 */
export function bugTargets(wrong: string, right: string): number[] {
  const { a, b, keepA, keepB, pairs } = alignWords(wrong, right);
  const targets = new Set<number>();
  keepA.forEach((kept, i) => {
    if (!kept) targets.add(i);
  });
  keepB.forEach((kept, j) => {
    if (kept) return;
    const before = pairs.filter(([, pj]) => pj < j).at(-1);
    const after = pairs.find(([, pj]) => pj > j);
    const from = before ? before[0] + 1 : 0;
    const to = after ? after[0] : a.length;
    // Có từ của câu sai bị thay ở đoạn này thì đã có chỗ để bấm; chỉ xử lý chỗ thiếu từ thuần túy.
    if (keepA.slice(from, to).some((k) => !k)) return;
    targets.add(after ? after[0] : a.length - 1);
  });
  if (targets.size === 0 && b.length > 0) targets.add(a.length - 1);
  return [...targets].sort((x, y) => x - y);
}

/** Số ngày kể từ 01/01/1970 của một khóa ngày YYYY-MM-DD. */
function dayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/** Câu của ngày: xoay vòng qua mọi câu sai, mỗi ngày một câu, giống nhau với mọi người trong ngày. */
export function bugForDate(lessons: readonly Lesson[], date: string): DailyBug | null {
  const all = allMistakes(lessons);
  if (all.length === 0) return null;
  const pick = all[((dayNumber(date) % all.length) + all.length) % all.length];
  if (!pick) return null;
  const { lesson, mistake } = pick;
  return {
    date,
    lesson: { key: lessonKey(lesson), slug: lesson.slug, title: lesson.title, free: lesson.free },
    wrong: mistake.wrong,
    right: mistake.right,
    why_vi: mistake.why_vi,
    words: mistake.wrong.split(/\s+/).filter(Boolean),
    targets: bugTargets(mistake.wrong, mistake.right),
  };
}

