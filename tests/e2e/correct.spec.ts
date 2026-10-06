import { expect, test, type Page, type Route } from '@playwright/test';
import lesson from '../../content/lessons/standup-01.json' with { type: 'json' };

// Giao diện ô "Sửa câu của tôi" ở phần 5 của bài học. Máy chủ được giả lập bằng page.route,
// vì test không đăng nhập thật và không gọi AI thật.
const URL = `/hoc/${lesson.slug}`;
const SENTENCE = 'Yesterday I have fixed bug in login page.';

const ok = {
  ok: true,
  data: {
    id: 'c1',
    original: SENTENCE,
    result: {
      is_already_correct: false,
      corrected: 'Yesterday I fixed a bug on the login page.',
      corrected_vi: 'Hôm qua mình đã sửa một bug ở trang đăng nhập.',
      changes: [
        { from: 'have fixed', to: 'fixed', why_vi: 'Có "yesterday" thì dùng quá khứ đơn.', category: 'tense' },
        { from: 'bug', to: 'a bug', why_vi: 'Danh từ đếm được số ít cần mạo từ.', category: 'article' },
      ],
      tip_vi: 'Thấy mốc thời gian đã qua thì nghĩ ngay tới quá khứ đơn.',
      missing_vi: ['Có việc hôm nay sẽ làm'],
    },
    remaining: 9,
    period: 'day',
    review_items: 2,
  },
};

async function openBox(page: Page, reply: (route: Route) => Promise<void>) {
  const bodies: unknown[] = [];
  await page.route('**/api/correct', async (route) => {
    bodies.push(route.request().postDataJSON());
    await reply(route);
  });
  await page.goto(URL);
  const box = page.getByLabel('Câu tiếng Anh của bạn');
  await box.scrollIntoViewIfNeeded();
  await expect(box).toBeEnabled();
  return { box, bodies };
}

const json = (status: number, body: unknown) => (route: Route) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const section = (page: Page) => page.locator('section[aria-labelledby="cau-cua-ban"]');

test('gửi câu thì cho tự sửa trước: tô chỗ sai, nêu số chỗ và nhóm lỗi, chưa lộ bản sửa', async ({ page }) => {
  const { box } = await openBox(page, json(200, ok));
  await box.fill(SENTENCE);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  await expect(section(page)).toContainText('Câu của bạn có 2 chỗ cần sửa');
  await expect(section(page)).toContainText('thì của động từ, mạo từ');
  await expect(section(page).locator('.own-original mark')).toHaveText(['Chỗ cần sửa: have fixed', 'Chỗ cần sửa: bug']);
  await expect(section(page).locator('.diff-line.add')).toHaveCount(0);
  await expect(section(page)).not.toContainText('on the login page');
});

test('tự sửa khớp bản sửa thì báo đúng rồi hiện diff và nghĩa tiếng Việt', async ({ page }) => {
  const { box } = await openBox(page, json(200, ok));
  await box.fill(SENTENCE);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  const fix = page.getByLabel('Thử tự sửa trước khi xem đáp án');
  await fix.fill('yesterday I fixed a bug on the login page');
  await page.getByRole('button', { name: /Kiểm tra/ }).click();
  await expect(section(page)).toContainText('Bạn đã sửa đúng.');
  await expect(section(page)).toContainText('Nghĩa: Hôm qua mình đã sửa một bug ở trang đăng nhập.');
});

test('tự sửa chưa khớp hai lần thì hiện bản của bạn so với bản sửa', async ({ page }) => {
  const { box } = await openBox(page, json(200, ok));
  await box.fill(SENTENCE);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  const fix = page.getByLabel('Thử tự sửa trước khi xem đáp án');
  await fix.fill('Yesterday I fixed bug in login page.');
  await page.getByRole('button', { name: /Kiểm tra/ }).click();
  await expect(section(page).locator('.note.info')).toContainText('Bạn đã sửa đúng 1 trên 2 chỗ');
  await page.getByRole('button', { name: /Kiểm tra/ }).click();
  await expect(section(page)).toContainText('Bản bạn tự sửa');
  await expect(section(page).locator('.changes li')).toHaveCount(2);
});

test('gửi câu thì hiện khung diff, ghi chú từng chỗ sửa và số lượt còn lại', async ({ page }) => {
  const { box, bodies } = await openBox(page, json(200, ok));
  await box.fill(`  ${SENTENCE}  `);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  await page.getByRole('button', { name: 'Xem đáp án' }).click();

  const review = page.locator('section[aria-labelledby="cau-cua-ban"] figure.review');
  await expect(review.locator('.diff-line.del')).toContainText(SENTENCE);
  await expect(review.locator('.diff-line.add')).toContainText('Yesterday I fixed a bug on the login page.');
  await expect(review.locator('.changes li')).toHaveCount(2);
  await expect(review).toContainText('Có "yesterday" thì dùng quá khứ đơn.');
  await expect(review).toContainText('thì của động từ');
  await expect(review).toContainText('Nghĩa: Hôm qua mình đã sửa một bug ở trang đăng nhập.');
  await expect(section(page).locator('.missing')).toContainText('Có việc hôm nay sẽ làm');
  await expect(page.locator('section[aria-labelledby="cau-cua-ban"]')).toContainText('2 chỗ sửa đã vào sổ lỗi');
  await expect(page.locator('section[aria-labelledby="cau-cua-ban"]')).toContainText('Hôm nay bạn còn 9 lượt sửa.');
  expect(bodies).toEqual([{ sentence: SENTENCE, lessonKey: 'standup-01' }]);

  await page.getByRole('button', { name: 'Sửa câu khác' }).click();
  await expect(page.getByLabel('Câu tiếng Anh của bạn')).toHaveValue('');
});

test('Ctrl + Enter trong ô nhập gửi câu', async ({ page }) => {
  const { box, bodies } = await openBox(page, json(200, ok));
  await box.fill(SENTENCE);
  await box.press('Control+Enter');
  await expect(page.getByLabel('Thử tự sửa trước khi xem đáp án')).toBeVisible();
  expect(bodies).toHaveLength(1);
});

test('chưa đăng nhập thì mời đăng nhập và quay lại đúng bài', async ({ page }) => {
  const { box } = await openBox(page, json(401, { ok: false, error: { code: 'unauthenticated', message: 'x' } }));
  await box.fill(SENTENCE);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  const link = page.locator('#noi-dung').getByRole('link', { name: 'Đăng nhập', exact: true });
  await expect(link).toHaveAttribute('href', `/dang-nhap?next=${encodeURIComponent(`${URL}#cau-cua-ban`)}`);
});

test('hết lượt thì hiện đúng thông báo của máy chủ, câu vẫn còn trong ô', async ({ page }) => {
  const message = 'Tài khoản miễn phí sửa được 1 câu mỗi 7 ngày. Bạn đã dùng lượt của 7 ngày này.';
  const { box } = await openBox(page, json(429, { ok: false, error: { code: 'quota_exceeded', message } }));
  await box.fill(SENTENCE);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  await expect(page.locator('section[aria-labelledby="cau-cua-ban"] .note.err')).toHaveText(message);
  await expect(box).toHaveValue(SENTENCE);
});

test('phản hồi sai dạng không làm hỏng trang', async ({ page }) => {
  const { box } = await openBox(page, json(200, { ok: true, data: { result: '<img src=x onerror=alert(1)>' } }));
  await box.fill(SENTENCE);
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  await expect(page.locator('section[aria-labelledby="cau-cua-ban"] .note.err')).toContainText('không đọc được');
  await expect(page.locator('section[aria-labelledby="cau-cua-ban"] img')).toHaveCount(0);
});

test('câu quá ngắn thì báo ngay, không gửi', async ({ page }) => {
  const { box, bodies } = await openBox(page, json(200, ok));
  await box.fill(' a ');
  await page.getByRole('button', { name: 'Sửa câu của tôi' }).click();
  await expect(page.locator('section[aria-labelledby="cau-cua-ban"] .note.err')).toContainText('ít nhất 3 ký tự');
  expect(bodies).toHaveLength(0);
});
