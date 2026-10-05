import { CATEGORY_NAMES } from '../ai/schema';
import type { Lesson } from '../content/schema';
import { topCategories, weeklyTrend, type ErrorEntry } from '../stats/errors';
import { addDaysTo } from '../time';

/** Nội dung tin Telegram, văn bản thường. Không dấu chấm than, không emoji (skill ui-vi). */

export function reminderText(lesson: Pick<Lesson, 'title' | 'pattern'>, standupTime: string, site: string): string {
  return [
    `Sắp tới giờ standup (${standupTime.slice(0, 5)}). Bài hôm nay: ${lesson.title}.`,
    lesson.pattern.formula,
    `Học 10 phút trước khi họp: ${site}/hom-nay`,
  ].join('\n');
}

const quote = (s: string) => (s ? `"${s}"` : '(không có)');

/**
 * Báo cáo tuần (SPEC mục 5b): số câu đã sửa trong 7 ngày, nhóm lỗi hay mắc nhất kèm một ví dụ,
 * nhóm lỗi đã giảm so với tuần trước, link ôn. Tuần không có câu nào thì không gửi (null).
 */
export function weeklyReportText(entries: readonly ErrorEntry[], now: Date, site: string): string | null {
  const weekAgo = addDaysTo(now, -7).getTime();
  const thisWeek = entries.filter((e) => Date.parse(e.created_at) > weekAgo && Date.parse(e.created_at) <= now.getTime());
  if (thisWeek.length === 0) return null;
  const lines = [`Tuần này bạn đã sửa ${thisWeek.length} câu.`];
  const top = topCategories(thisWeek, now, 1)[0];
  if (top) {
    lines.push(
      `Nhóm lỗi hay mắc nhất: ${CATEGORY_NAMES[top.category]} (${top.count} lần). Ví dụ của bạn: ${quote(top.example.from)} sửa thành ${quote(top.example.to)}.`,
    );
  } else {
    lines.push('Các câu bạn gửi tuần này đều đã đúng.');
  }
  const down = weeklyTrend(entries, now).filter((w) => w.trend === 'down');
  if (down.length > 0) lines.push(`Nhóm lỗi đã giảm so với tuần trước: ${down.map((w) => CATEGORY_NAMES[w.category]).join(', ')}.`);
  lines.push(`Ôn lại những lỗi này: ${site}/on-tap`);
  return lines.join('\n');
}
