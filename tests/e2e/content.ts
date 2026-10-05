import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLessonFiles } from '../../src/lib/content/load';

/** Playwright không chạy qua Vite nên không dùng được import.meta.glob; đọc file rồi kiểm cùng schema. */
const dir = join(process.cwd(), 'content', 'lessons');
export const lessons = parseLessonFiles(
  Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => [`/content/lessons/${f}`, JSON.parse(readFileSync(join(dir, f), 'utf8')) as unknown]),
  ),
);
