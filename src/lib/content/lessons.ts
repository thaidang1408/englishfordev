import { parseLessonFiles } from './load';
import type { Lesson } from './schema';

const files = import.meta.glob<unknown>('/content/lessons/*.json', { eager: true, import: 'default' });

export const lessons: readonly Lesson[] = parseLessonFiles(files);

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

/** Bài liền trước và liền sau trong cùng track. */
export function neighbours(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const track = lessons.filter((l) => l.track === lesson.track);
  const i = track.findIndex((l) => l.id === lesson.id);
  return { prev: track[i - 1], next: track[i + 1] };
}
