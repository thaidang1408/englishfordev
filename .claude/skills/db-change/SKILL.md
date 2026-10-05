---
name: db-change
description: Quy trình bắt buộc khi thêm hoặc sửa bảng, cột, policy, trigger, hàm trong Supabase Postgres của EPC. Dùng mỗi khi thay đổi schema hoặc quyền truy cập dữ liệu.
---

# Thay đổi cơ sở dữ liệu

1. Đối chiếu với mục 8 của `docs/SPEC.md`. Bảng hoặc cột không có trong SPEC thì không tạo; ghi đề xuất vào `docs/BACKLOG.md`.
2. Mỗi thay đổi là một file migration mới trong `supabase/migrations/`, tên `<timestamp>_<mo_ta>.sql`. Không sửa migration đã commit.
3. Trong cùng migration với bảng mới:
   - `alter table ... enable row level security;`
   - Policy `select` chỉ cho `auth.uid() = user_id`.
   - Policy `insert` và `update` chỉ cho những bảng người dùng được tự ghi: `lesson_progress`, `review_items`, và các cột hồ sơ trong `profiles`.
   - `entitlements`, `orders`, `corrections`: không có policy ghi cho người dùng. Chỉ server ghi bằng service role.
   - `events`: cho phép insert, không cho select từ client.
4. Thêm index cho cột dùng để lọc thường xuyên: `user_id`, `due_at`, `created_at`.
5. Viết hoặc cập nhật test RLS: người dùng A không đọc và không ghi được dòng của người dùng B; người dùng thường không tự sửa được `premium_until` và `trial_until`.
6. Cập nhật kiểu TypeScript của bảng trong `src/lib/db/`.
7. Ghi lệnh áp dụng migration vào `docs/SETUP.md` nếu chủ dự án phải chạy tay.

Không bao giờ: tắt RLS để "cho chạy được", dùng service role ở code phía trình duyệt, lưu câu của người dùng vào bảng `events` hoặc log.
