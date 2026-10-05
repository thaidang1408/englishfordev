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

/** Vị trí (0, 1, 2) đang hiển thị của đáp án đúng cho câu hiện tại. */
async function shownIndexOfAnswer(page: Page, q: number): Promise<number> {
  const right = lesson.quiz[q]!.options[0]!;
  const texts = await quiz(page).locator('.opt span[lang="en"]').allTextContents();
  const i = texts.indexOf(right);
  expect(i, `không thấy đáp án đúng của câu ${q + 1}`).toBeGreaterThanOrEqual(0);
  return i;
}

test('học hết bài 1 không cần đăng nhập, tiến độ còn sau khi tải lại', async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson.title);
  await expect(page.getByText(lesson.pattern.formula)).toBeVisible();
  await openQuiz(page);

  for (let q = 0; q < lesson.quiz.length; q++) {
    await expect(quiz(page).locator('.prompt')).toHaveText(lesson.quiz[q]!.prompt_vi);
    // câu 2 cố ý chọn sai để kiểm phần giải thích
    const right = await shownIndexOfAnswer(page, q);
    const pick = q === 1 ? (right + 1) % 3 : right;
    await quiz(page).locator('.opt').nth(pick).click();
    await expect(quiz(page).locator('.why')).toContainText(q === 1 ? 'Chưa đúng.' : 'Đúng.');
    await quiz(page).getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ }).click();
  }

  await expect(quiz(page)).toContainText('Bạn đúng 4 trên 5 câu.');
  await expect(page.getByRole('link', { name: 'Học bài tiếp theo' })).toHaveAttribute('href', '/hoc/hom-nay-lam-gi');

  await page.reload();
  await quiz(page).scrollIntoViewIfNeeded();
  await expect(quiz(page)).toContainText('Bạn đúng 4 trên 5 câu.');
});

test('dùng phím 1 2 3 và Enter để làm trắc nghiệm', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'phím tắt dành cho máy tính');
  await openQuiz(page);

  for (let q = 0; q < lesson.quiz.length; q++) {
    await expect(quiz(page).locator('.prompt')).toHaveText(lesson.quiz[q]!.prompt_vi);
    const right = await shownIndexOfAnswer(page, q);
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
    positions.add(await shownIndexOfAnswer(page, 0));
  }
  expect(positions.size).toBeGreaterThan(1);
});
