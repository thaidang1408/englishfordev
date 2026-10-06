import type { Track } from './schema';

export const TRACK_NAMES: Record<Track, string> = {
  standup: 'Standup và họp',
  writing: 'Viết cho team',
  interview: 'Phỏng vấn',
};

/** Danh sách bài đã chốt ở SPEC mục 6, dùng cho trang chủ trước khi đủ file nội dung. */
export const TRACK_OUTLINE: Record<Track, string[]> = {
  standup: [
    'Hôm qua đã làm gì',
    'Hôm nay làm gì',
    'Đang kẹt ở đâu',
    'Việc xong, việc còn dở',
    'Ước lượng bao lâu thì xong',
    'Hỏi lại khi chưa hiểu',
    'Xin người khác giúp',
    'Báo trễ và đề xuất mốc mới',
    'Không đồng ý một cách lịch sự',
    'Tóm tắt một buổi họp',
    'Chen vào và xác nhận lại trong cuộc họp',
    'Giải thích kỹ thuật cho người không làm kỹ thuật',
    'Nói chuyện xã giao đầu buổi họp',
  ],
  writing: [
    'Tiêu đề và mô tả pull request',
    'Commit message',
    'Comment khi review code',
    'Trả lời comment review',
    'Báo một bug',
    'Hỏi trên Slack ngắn mà đủ ý',
    'Báo tiến độ cho khách',
    'Email xin nghỉ, xin dời lịch',
    'Viết ghi chú bàn giao',
    'Từ chối hoặc xin thêm thời gian',
    'Cập nhật khi có sự cố',
    'Báo tin xấu hoặc rủi ro cho khách',
    'Acceptance criteria và kết quả test',
    'Đọc hiểu tin nhắn của đồng nghiệp nước ngoài',
  ],
  interview: [
    'Giới thiệu bản thân',
    'Kể về dự án gần nhất',
    'Vai trò và đóng góp của bạn',
    'Một bug khó bạn đã xử lý',
    'Điểm mạnh và điểm cần cải thiện',
    'Vì sao muốn đổi việc',
    'Bất đồng trong team và cách xử lý',
    'Trả lời khi không biết câu trả lời',
    'Hỏi lại nhà tuyển dụng',
    'Nói về lương và ngày bắt đầu',
  ],
};
