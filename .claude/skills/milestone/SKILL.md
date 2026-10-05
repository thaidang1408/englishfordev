---
name: milestone
description: Thực hiện đúng một milestone (M0 đến M7) trong docs/SPEC.md từ đầu đến cuối rồi dừng lại báo cáo. Chỉ chạy khi chủ dự án gọi /milestone.
argument-hint: "[M0..M7]"
disable-model-invocation: true
---

# Làm milestone $ARGUMENTS

## Quy trình

0. Chạy `git status --short` và `git log --oneline -5` để biết repo đang ở đâu.
1. Đọc `CLAUDE.md` và dòng **$ARGUMENTS** trong bảng mục 12 của `docs/SPEC.md`, cùng mọi mục SPEC mà milestone đó chạm tới.
2. Kiểm tra milestone trước đã xong chưa (có commit `M<n>: ...`). Chưa xong thì dừng và nói rõ, không làm nhảy cóc.
3. Viết kế hoạch tối đa 10 dòng: file sẽ tạo hoặc sửa, thứ tự làm, việc nào cần chủ dự án làm tay. Rồi làm luôn, không chờ duyệt kế hoạch.
4. Thư viện hoặc API nào không chắc cú pháp hiện tại thì đọc tài liệu chính thức trước khi viết.
5. Làm từng bước nhỏ. Sau mỗi bước chạy được thì chạy thử ngay.
6. Việc cần tài khoản bên ngoài: viết hướng dẫn từng bước vào `docs/SETUP.md`, dùng tên biến trong `.env.example`, không bịa key.
7. Xong thì chạy skill `epc-check`. Chưa qua thì sửa cho tới khi qua.
8. Commit một lần: `M<n>: <mô tả ngắn>`.

## Báo cáo cuối, đúng bốn phần, ngắn

- **Đã làm:** 3 đến 6 gạch đầu dòng.
- **Tự kiểm bằng tay:** các bước cụ thể để chủ dự án xác nhận điều kiện "Xong khi" của milestone.
- **Việc của bạn:** tài khoản cần tạo, key cần dán, nội dung cần duyệt. Không có thì ghi "Không".
- **Chưa làm hoặc chưa chắc:** nói thật. Không có thì ghi "Không".

Sau báo cáo thì dừng. Không tự bắt đầu milestone kế tiếp.

## Không làm

- Không thêm tính năng ngoài SPEC. Ý tưởng mới ghi vào `docs/BACKLOG.md`.
- Không đổi stack, không thêm dependency nặng khi chưa cần.
- Không sửa `docs/SPEC.md`. Thấy SPEC sai hoặc mâu thuẫn thì nêu trong báo cáo.
