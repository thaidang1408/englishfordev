import { expect, test, type Page } from '@playwright/test';
import { bugsForDate } from '../../src/lib/bug/daily';
import { lessons } from './content';
import { vnDateKey } from '../../src/lib/time';

// Cùng cách chọn với máy chủ; test và máy chủ chạy cùng lúc nên cùng ngày.
const bugs = bugsForDate(lessons, vnDateKey(new Date()));
if (bugs.length !== 3) throw new Error('PR hôm nay phải có 3 câu');
const misses = (k: number) => bugs[k]!.words.map((_, i) => i).filter((i) => !bugs[k]!.targets.includes(i));

const file = (page: Page, k: number) => page.locator('.pr-file').nth(k);
const tok = (page: Page, k: number, i: number) => file(page, k).locator(`button.tok[data-i="${i}"]`);

/** Đợi island hydrate: dòng đầu mở cho bấm. */
async function open(page: Page): Promise<void> {
  await page.goto('/bug-hom-nay');
  await expect(file(page, 0)).toHaveClass(/is-active/);
}

test('review đủ 3 dòng thì có kết luận, điểm, ô kết quả và nhớ sau khi tải lại', async ({ page }) => {
  await open(page);
  await expect(page.locator('h1')).toHaveText('Tìm lỗi mỗi ngày');
  await expect(page.locator('#pr-answers')).toBeHidden();
  await expect(file(page, 1)).toHaveClass(/is-waiting/);

  // Dòng 1: sai một lần rồi tìm ra (2 điểm), nếu câu có chữ không phải chỗ sai.
  const miss = misses(0)[0];
  if (miss !== undefined) {
    await tok(page, 0, miss).click();
    await expect(file(page, 0).locator('.bug-status')).toHaveText('Chưa phải chỗ này. Còn 2 lần thử.');
    await expect(tok(page, 0, miss)).toBeDisabled();
  }
  await tok(page, 0, bugs[0]!.targets[0]!).click();
  await expect(file(page, 0)).toHaveClass(/is-found/);
  await expect(file(page, 0)).toContainText(bugs[0]!.why_vi);
  await expect(file(page, 0).locator('.diff-line.add')).toContainText(bugs[0]!.right);
  await expect(file(page, 1)).toHaveClass(/is-active/);

  // Dòng 2 và 3: tìm ra ngay.
  await tok(page, 1, bugs[1]!.targets[0]!).click();
  await tok(page, 2, bugs[2]!.targets[0]!).click();
  const first = miss === undefined ? 3 : 2;
  await expect(page.locator('.pr-score')).toHaveText(`${first + 6}/9 điểm`);
  await expect(page.locator('.pr-result')).toBeVisible();
  await expect(page.locator('.pr-verdict')).toHaveText(first === 3 ? 'Approve' : 'Approve, kèm góp ý');
  await expect(page.locator('.pr-grid')).toHaveText(first === 3 ? '■ ■ ■' : '□■ ■ ■');

  // Tải lại trong ngày: giữ kết quả, không chơi lại được.
  await page.reload();
  await expect(page.locator('.pr-result')).toBeVisible();
  await expect(tok(page, 0, bugs[0]!.targets[0]!)).toBeDisabled();
});

test('sai đủ 3 lần ở một dòng thì tô chỗ sai, được 0 điểm và sang dòng sau', async ({ page }) => {
  test.skip(misses(0).length < 3, 'câu đầu có ít hơn 3 chữ không phải chỗ sai');
  await open(page);
  for (const i of misses(0).slice(0, 3)) await tok(page, 0, i).click();
  await expect(file(page, 0)).toHaveClass(/is-missed/);
  await expect(file(page, 0).locator('.pr-pts')).toHaveText('+0');
  for (const i of bugs[0]!.targets) await expect(tok(page, 0, i)).toHaveClass(/hit/);
  await expect(file(page, 1)).toHaveClass(/is-active/);
});

test('xong PR thì chơi thêm 3 câu khác, không ảnh hưởng kết quả hôm nay', async ({ page }) => {
  await open(page);
  for (let k = 0; k < 3; k++) await tok(page, k, bugs[k]!.targets[0]!).click();
  await page.getByRole('button', { name: 'Chơi thêm 3 câu' }).click();
  await expect(page.locator('.pr')).toHaveAttribute('data-mode', 'practice');
  await expect(page.locator('.pr-result')).toBeHidden();
  const shown = await page.locator('.pr-file .bug-line').allTextContents();
  for (const b of bugs) expect(shown.map((t) => t.replace(/\s+/g, ' ').trim())).not.toContain(b.wrong);
  await page.reload();
  await expect(page.locator('.pr')).toHaveAttribute('data-mode', 'daily');
  await expect(page.locator('.pr-verdict')).toHaveText('Approve');
});

test('chép kết quả không lộ đáp án', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'quyền clipboard chỉ cấp được trên Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  for (let k = 0; k < 3; k++) await tok(page, k, bugs[k]!.targets[0]!).click();
  await page.getByRole('button', { name: 'Chép kết quả' }).click();
  await expect(page.getByRole('button', { name: 'Đã chép' })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('■ ■ ■');
  expect(text).toContain('Approve · 9/9 điểm');
  expect(text).toContain('/bug-hom-nay?src=bug-share');
  for (const b of bugs) expect(text).not.toContain(b.right);
});

test('không có JavaScript vẫn xem được đáp án 3 câu', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/bug-hom-nay');
  await page.getByText('Không chơi được? Xem đáp án PR hôm nay').click();
  for (const b of bugs) await expect(page.locator('#pr-answers')).toContainText(b.why_vi);
  await context.close();
});
