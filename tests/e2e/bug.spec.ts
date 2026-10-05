import { expect, test, type Page } from '@playwright/test';
import { bugForDate } from '../../src/lib/bug/daily';
import { lessons } from './content';
import { vnDateKey } from '../../src/lib/time';

// Cùng cách chọn với máy chủ; test và máy chủ chạy cùng lúc nên cùng ngày.
const bug = bugForDate(lessons, vnDateKey(new Date()));
if (!bug) throw new Error('Không có câu nào để chơi');
const misses = bug.words.map((_, i) => i).filter((i) => !bug.targets.includes(i));

const tok = (page: Page, i: number) => page.locator(`button.tok[data-i="${i}"]`);

test('tìm ra chỗ sai thì hiện khung diff, giải thích và nút chép kết quả', async ({ page }) => {
  await page.goto('/bug-hom-nay');
  await expect(page.locator('h1')).toHaveText('Tìm lỗi mỗi ngày');
  await expect(page.locator('#bug-answer')).toBeHidden();
  await expect(page.locator('#bug-share')).toBeHidden();

  const firstMiss = misses[0];
  if (firstMiss !== undefined) {
    await tok(page, firstMiss).click();
    await expect(page.locator('#bug-status')).toHaveText('Chưa phải chỗ này. Còn 2 lần thử.');
    await expect(tok(page, firstMiss)).toBeDisabled();
  }

  await tok(page, bug.targets[0]!).click();
  await expect(page.locator('#bug-status')).toContainText('Đúng, chỗ sai ở đây.');
  await expect(page.locator('#bug-answer')).toBeVisible();
  await expect(page.locator('#bug-answer')).toContainText(bug.why_vi);
  await expect(page.locator('#bug-answer .diff-line.add')).toContainText(bug.right);
  await expect(page.locator('#bug-share')).toBeVisible();
  for (const i of bug.targets) await expect(tok(page, i)).toHaveClass(/hit/);

  // Tải lại trong ngày: giữ kết quả, không chơi lại được.
  await page.reload();
  await expect(page.locator('#bug-status')).toContainText('Đúng, chỗ sai ở đây.');
  await expect(tok(page, bug.targets[0]!)).toBeDisabled();
});

test('sai đủ 3 lần thì tô chỗ sai và hiện đáp án', async ({ page }) => {
  test.skip(misses.length < 3, 'câu hôm nay có ít hơn 3 chữ không phải chỗ sai');
  await page.goto('/bug-hom-nay');
  for (const i of misses.slice(0, 3)) await tok(page, i).click();
  await expect(page.locator('#bug-status')).toContainText('Hết 3 lần thử.');
  await expect(page.locator('#bug-answer')).toBeVisible();
  for (const b of await page.locator('button.tok').all()) await expect(b).toBeDisabled();
});

test('chép kết quả không lộ đáp án', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'quyền clipboard chỉ cấp được trên Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/bug-hom-nay');
  await tok(page, bug.targets[0]!).click();
  await page.getByRole('button', { name: 'Chép kết quả' }).click();
  await expect(page.getByRole('button', { name: 'Đã chép' })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Tìm ra ở lần thử 1 trên 3.');
  expect(text).toContain('/bug-hom-nay');
  expect(text).not.toContain(bug.right);
});

test('cuối trang có nút sang bài học của mẫu câu', async ({ page }) => {
  await page.goto('/bug-hom-nay');
  const href = bug.lesson.free ? `/hoc/${bug.lesson.slug}` : `/mau-cau/${bug.lesson.slug}`;
  await expect(page.getByRole('link', { name: 'Học bài này' })).toHaveAttribute('href', href);
});

test.describe('khi tắt JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('vẫn đọc được câu và mở được đáp án', async ({ page }) => {
    await page.goto('/bug-hom-nay');
    await expect(page.locator('.bug-line')).toContainText(bug.words[0]!);
    await page.getByText('Xem đáp án').click();
    await expect(page.locator('#bug-answer')).toContainText(bug.why_vi);
  });
});
