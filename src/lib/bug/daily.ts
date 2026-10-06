import { lessonKey, type Lesson } from '../content/schema';
import { alignWords } from '../lesson/diff';

export { MAX_TRIES, shareText } from './share';

export type DailyBug = {
  /** Ngày theo giờ Việt Nam, YYYY-MM-DD. */
  date: string;
  lesson: Pick<Lesson, 'slug' | 'title' | 'free'> & { key: string };
  wrong: string;
  right: string;
  right_vi: string;
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

export const BUGS_PER_DAY = 3;

/**
 * Thứ tự xoay vòng: lỗi thứ nhất của mọi bài, rồi lỗi thứ hai, rồi thứ ba.
 * Nhờ vậy các câu đứng cạnh nhau thuộc các bài khác nhau, và 3 câu trong một ngày không cùng một bài.
 */
function rotation(lessons: readonly Lesson[]): Candidate[] {
  const most = Math.max(0, ...lessons.map((l) => l.mistakes.length));
  const out: Candidate[] = [];
  for (let m = 0; m < most; m++) {
    for (const lesson of lessons) {
      const mistake = lesson.mistakes[m];
      if (mistake) out.push({ lesson, mistake });
    }
  }
  return out;
}

function toBug({ lesson, mistake }: Candidate, date: string): DailyBug {
  return {
    date,
    lesson: { key: lessonKey(lesson), slug: lesson.slug, title: lesson.title, free: lesson.free },
    wrong: mistake.wrong,
    right: mistake.right,
    right_vi: mistake.right_vi,
    why_vi: mistake.why_vi,
    words: mistake.wrong.split(/\s+/).filter(Boolean),
    targets: bugTargets(mistake.wrong, mistake.right),
  };
}

/** Lấy `count` câu liên tiếp trong vòng xoay, bắt đầu từ vị trí `start` (quay vòng). */
function slice(lessons: readonly Lesson[], date: string, start: number, count: number): DailyBug[] {
  const all = rotation(lessons);
  const n = all.length;
  return Array.from({ length: Math.min(count, n) }, (_, k) => toBug(all[(((start + k) % n) + n) % n]!, date));
}

/** 3 câu của ngày: giống nhau với mọi người trong ngày, xoay vòng qua mọi câu sai. */
export function bugsForDate(lessons: readonly Lesson[], date: string): DailyBug[] {
  return slice(lessons, date, dayNumber(date) * BUGS_PER_DAY, BUGS_PER_DAY);
}

/** Câu để chơi thêm sau khi xong PR hôm nay: các câu của những ngày sắp tới, không trùng câu hôm nay. */
export function practiceBugs(lessons: readonly Lesson[], date: string, count = 30): DailyBug[] {
  const n = rotation(lessons).length;
  return slice(lessons, date, (dayNumber(date) + 1) * BUGS_PER_DAY, Math.min(count, Math.max(0, n - BUGS_PER_DAY)));
}
