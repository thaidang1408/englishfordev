/** Giá và quyền lợi đã chốt ở SPEC mục 2. Trang công khai và M5 (tạo đơn) cùng đọc từ đây. */
export const PLANS = {
  '30d': { days: 30, amount: 79_000 },
  '90d': { days: 90, amount: 179_000 },
} as const;

export const TRIAL_DAYS = 7;
export const REFUND_DAYS = 3;

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/** Bảng Miễn phí và Premium, SPEC mục 2. */
export const COMPARE: { feature: string; free: string; premium: string }[] = [
  { feature: 'Bài học', free: '3 bài đầu của track Standup', premium: 'Tất cả bài học, 3 track' },
  { feature: 'Test xếp trình độ', free: 'Có', premium: 'Có' },
  { feature: 'AI sửa câu của bạn', free: '1 lần mỗi 7 ngày', premium: '30 lần mỗi ngày' },
  { feature: 'Ôn câu trắc nghiệm đã sai', free: 'Có', premium: 'Có' },
  {
    feature: 'Sổ lỗi cá nhân và ôn lỗi của chính bạn',
    free: 'Giữ nguyên dữ liệu, xem được 3 lỗi gần nhất',
    premium: 'Đầy đủ',
  },
  {
    feature: 'Phân tích lỗi',
    free: 'Chỉ thấy tổng số lỗi và số lỗi đang lặp lại',
    premium: 'Ba nhóm lỗi hay mắc nhất, xu hướng theo tuần',
  },
  { feature: 'Luyện phỏng vấn', free: 'Không', premium: '10 bài và "Phỏng vấn thử"' },
  { feature: 'Báo cáo tuần qua Telegram', free: 'Không', premium: 'Có' },
  { feature: 'Nhắc mỗi sáng qua Telegram', free: 'Có', premium: 'Có' },
];
