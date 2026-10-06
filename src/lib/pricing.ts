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

/** Giá chia theo ngày, làm tròn tới 100đ. Phép chia thật, không phải giá khuyến mãi. */
export function perDay(plan: keyof typeof PLANS): number {
  return Math.round(PLANS[plan].amount / PLANS[plan].days / 100) * 100;
}

/** Bảng Miễn phí và Premium, SPEC mục 2. `total` là số bài hiện có. */
export function compareRows(total: number): { feature: string; free: string; premium: string }[] {
  return [
    { feature: 'Bài học', free: '3 bài đầu của track Standup', premium: `Tất cả ${total} bài, 3 track, có bài theo ngành Dev, QA, BA, PM` },
    { feature: 'Tin hoàn chỉnh mẫu và AI chỉ ra ý còn thiếu', free: 'Ở 3 bài miễn phí', premium: 'Ở mọi bài: PR, bug report, email khách, câu trả lời STAR' },
    { feature: 'AI sửa câu của bạn, trên web và qua bot Telegram', free: '1 lần mỗi 7 ngày', premium: '30 lần mỗi ngày' },
    { feature: 'Ôn câu trắc nghiệm đã sai', free: 'Có', premium: 'Có' },
    { feature: 'Sổ lỗi cá nhân và ôn lỗi của chính bạn', free: 'Giữ nguyên dữ liệu, xem được 3 lỗi gần nhất', premium: 'Đầy đủ, ôn lại sau 1, 3, 7, 14 ngày' },
    { feature: 'Phân tích lỗi', free: 'Chỉ thấy tổng số lỗi và số lỗi đang lặp lại', premium: 'Ba nhóm lỗi hay mắc, xu hướng theo tuần, bản đồ lỗi 8 tuần' },
    { feature: 'Luyện phỏng vấn', free: 'Không', premium: '10 bài có câu trả lời mẫu theo STAR, và "Phỏng vấn thử"' },
    { feature: 'Báo cáo tuần qua Telegram', free: 'Không', premium: 'Có' },
    { feature: 'Nhắc mỗi sáng qua Telegram', free: 'Có', premium: 'Có' },
    { feature: 'Test xếp trình độ', free: 'Có', premium: 'Có' },
  ];
}

/**
 * Ba lý do trả tiền (SPEC mục 2), nói bằng việc người dùng làm được, không bằng tên tính năng.
 * Không hứa kết quả, không số liệu người dùng.
 */
export const PREMIUM_REASONS: { icon: 'mic' | 'diff' | 'pen'; title: string; points: string[] }[] = [
  {
    icon: 'mic',
    title: 'Vào phỏng vấn đã có sẵn câu trả lời của mình',
    points: [
      '10 bài cho 10 câu nhà tuyển dụng hay hỏi, mỗi bài có câu trả lời mẫu theo STAR',
      'Phỏng vấn thử 5 câu: AI sửa câu trả lời và gợi ý một cách nói tốt hơn, giữ đúng ý của bạn',
    ],
  },
  {
    icon: 'diff',
    title: 'Biết đúng lỗi mình hay mắc, và thấy nó giảm dần',
    points: [
      'Sổ lỗi đầy đủ: mỗi chỗ AI sửa được xếp nhóm và quay lại để ôn sau 1, 3, 7, 14 ngày',
      'Bản đồ lỗi 8 tuần cho thấy nhóm lỗi nào đang giảm, nhóm nào còn lặp',
    ],
  },
  {
    icon: 'pen',
    title: 'Viết tin công việc thật mỗi ngày, có người soát',
    points: [
      '30 lần sửa mỗi ngày, ngay trên web hoặc nhắn cho bot Telegram',
      'Mỗi bài có tin hoàn chỉnh mẫu; AI chỉ ra ý còn thiếu trong PR, bug report, email gửi khách',
    ],
  },
];
