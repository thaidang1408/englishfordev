import { expect, test, type Page } from '@playwright/test';
import lesson from '../../content/lessons/standup-01.json' with { type: 'json' };

const URL = `/hoc/${lesson.slug}`;
const quiz = (page: Page) => page.locator('.quiz');

/** Trắc nghiệm là island client:visible: chỉ chạy khi người học cuộn tới. */
async function openQuiz(page: Page): Promise<void> {
  await page.goto(URL);
  await quiz(page).scrollIntoViewIfNeeded();
  await expect(quiz(page).locator('.opt')).toHaveCount(3);
}

const QUIZ_SIZE = 5;

/** Câu đang hiện (nhận ra qua bộ đáp án, vì câu được lấy ngẫu nhiên) và vị trí đang hiển thị của đáp án đúng. */
async function current(page: Page): Promise<{ id: string; right: number }> {
  const texts = await quiz(page).locator('.opt span[lang="en"]').allTextContents();
  const item = lesson.quiz.find((q) => q.options.every((o) => texts.includes(o)));
  expect(item, 'câu đang hiện phải là một câu của bài').toBeTruthy();
  return { id: item!.id, right: texts.indexOf(item!.options[0]!) };
}

test('học hết bài 1 không cần đăng nhập, tiến độ còn sau khi tải lại', async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson.title);
  await expect(page.getByText(lesson.pattern.formula)).toBeVisible();
  await openQuiz(page);

  const seen = new Set<string>();
  for (let q = 0; q < QUIZ_SIZE; q++) {
    await expect(quiz(page).locator('.quiz-top')).toContainText(`Câu ${q + 1} trên ${QUIZ_SIZE}`);
    // câu 2 cố ý chọn sai để kiểm phần giải thích
    const { id, right } = await current(page);
    seen.add(id);
    const pick = q === 1 ? (right + 1) % 3 : right;
    await quiz(page).locator('.opt').nth(pick).click();
    await expect(quiz(page).locator('.why')).toContainText(q === 1 ? 'Chưa đúng.' : 'Đúng.');
    // Nghĩa tiếng Việt của đáp án đúng hiện cùng lời giải thích.
    const item = lesson.quiz.find((x) => x.id === id)!;
    await expect(quiz(page).locator('.why')).toContainText(item.answer_vi);
    await quiz(page).getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ }).click();
  }
  expect(seen.size).toBe(QUIZ_SIZE);

  await expect(quiz(page)).toContainText('Bạn đúng 4 trên 5 câu.');
  await expect(page.getByRole('link', { name: 'Học bài tiếp theo' })).toHaveAttribute('href', '/hoc/hom-nay-lam-gi');

  await page.reload();
  await quiz(page).scrollIntoViewIfNeeded();
  await expect(quiz(page)).toContainText('Bạn đúng 4 trên 5 câu.');
});

test('dùng phím 1 2 3 và Enter để làm trắc nghiệm', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'phím tắt dành cho máy tính');
  await openQuiz(page);

  for (let q = 0; q < QUIZ_SIZE; q++) {
    await expect(quiz(page).locator('.quiz-top')).toContainText(`Câu ${q + 1} trên ${QUIZ_SIZE}`);
    const { right } = await current(page);
    await page.keyboard.press(String(right + 1));
    await expect(quiz(page).locator('.why')).toContainText('Đúng.');
    await page.keyboard.press('Enter');
  }
  await expect(quiz(page)).toContainText('Bạn đúng 5 trên 5 câu.');
});

test('đáp án đúng không phải lúc nào cũng nằm ở vị trí đầu', async ({ page }) => {
  const positions = new Set<number>();
  for (let i = 0; i < 8 && positions.size < 2; i++) {
    await openQuiz(page);
    positions.add((await current(page)).right);
  }
  expect(positions.size).toBeGreaterThan(1);
});

test('mỗi lượt lấy 5 trong 10 câu, mở lại trang thường gặp câu khác', async ({ page }) => {
  const firsts = new Set<string>();
  for (let i = 0; i < 6 && firsts.size < 2; i++) {
    await openQuiz(page);
    firsts.add((await current(page)).id);
  }
  expect(lesson.quiz).toHaveLength(10);
  expect(firsts.size).toBeGreaterThan(1);
});

test('ví dụ: trình học hiện 3 trong 5 câu, trang mẫu câu hiện đủ 5', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.examples li:visible')).toHaveCount(3);
  await page.goto(`/mau-cau/${lesson.slug}`);
  await expect(page.locator('.examples li:visible')).toHaveCount(5);
});

test('bài có tin hoàn chỉnh (nghĩa mở khi bấm) và danh sách "Bài viết nên có"', async ({ page }) => {
  await page.goto(URL);
  const model = page.locator('section[aria-labelledby="tin-hoan-chinh"]');
  await expect(model).toContainText(lesson.model.title_vi);
  await expect(model.locator('.model-msg').first()).toContainText(lesson.model.en.split(String.fromCharCode(10))[0]!);
  await expect(model.locator('.model-msg.vi')).toBeHidden();
  await model.getByText('Xem nghĩa tiếng Việt').click();
  await expect(model.locator('.model-msg.vi')).toBeVisible();
  for (const item of lesson.checklist_vi) await expect(page.locator('.checklist')).toContainText(item);
});
