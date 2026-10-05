-- M6: nhắc qua Telegram và báo cáo tuần (SPEC mục 5b, 9).
-- reminded_on: ngày (giờ Việt Nam) đã gửi tin nhắc; reported_on: Chủ nhật đã gửi báo cáo tuần.
-- Server ghi hai cột này trước khi gửi, có điều kiện, nên mỗi người tối đa một tin mỗi ngày
-- và một báo cáo mỗi tuần, kể cả khi cron chạy lại. Thêm ngày 05/10/2026, chủ dự án đồng ý.
-- Người dùng không có quyền update hai cột này (grant cột ở migration đầu không đổi).

alter table public.profiles
  add column reminded_on date,
  add column reported_on date;

-- Một chat Telegram chỉ gắn với một tài khoản.
create unique index profiles_telegram_chat_id_key on public.profiles (telegram_chat_id) where telegram_chat_id is not null;
-- Cron tìm người cần nhắc theo giờ standup trong số người đã liên kết.
create index profiles_standup_linked_idx on public.profiles (standup_time) where telegram_chat_id is not null;
