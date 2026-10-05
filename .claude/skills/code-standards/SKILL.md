---
name: code-standards
description: Chuẩn viết code của EPC, gồm cấu trúc thư mục, TypeScript, xử lý lỗi, dependency và commit. Dùng mỗi khi tạo file mới, viết hoặc sửa code TypeScript, Astro, React, hoặc thêm thư viện.
---

# Chuẩn code

## Cấu trúc

```
src/
├── pages/            # route Astro và endpoint trong pages/api/
├── components/       # .astro cho phần tĩnh, .tsx cho phần tương tác
├── layouts/
├── lib/
│   ├── ai/           # correct.ts là cửa duy nhất gọi AI
│   ├── db/           # client Supabase, kiểu bảng, truy vấn
│   ├── auth/         # lấy người dùng từ session, kiểm quyền
│   ├── content/      # schema zod và hàm đọc bài học
│   ├── review/       # luật Leitner, hàm thuần
│   └── http/         # hàm trả JSON, kiểu lỗi
├── styles/           # tokens.css và CSS chung
content/              # dữ liệu bài học, không có code
supabase/migrations/
cron/                 # worker cron riêng
tests/
```

Một file một việc. File quá 250 dòng thì tách. Logic nghiệp vụ nằm trong `lib/`, không nằm trong component hay endpoint.

## TypeScript

- `strict: true`. Không `any`, không `as` để ép kiểu cho qua, không `// @ts-ignore`. Cần thoát kiểu thì dùng `unknown` rồi thu hẹp.
- Mọi dữ liệu đi qua ranh giới (body request, phản hồi AI, file nội dung, biến môi trường, `localStorage`) phải qua schema zod trước khi dùng. Kiểu suy ra từ schema bằng `z.infer`, không viết kiểu song song.
- Biến môi trường đọc một lần ở `src/lib/env.ts`, kiểm bằng zod, lỗi rõ tên biến thiếu.
- Hàm thuần cho luật nghiệp vụ (hạn mức, Leitner, tính ngày Premium) để test được không cần mạng.
- Ngày giờ lưu UTC, chỉ đổi sang `Asia/Ho_Chi_Minh` khi hiển thị hoặc khi tính "hôm nay".

## Astro và React

- Mặc định là component `.astro` render ở server. Chỉ dùng React cho phần cần trạng thái: trình học bài, ô sửa câu, phiên ôn, form.
- Island dùng `client:visible` hoặc `client:idle`. `client:load` chỉ cho thứ nằm trong màn hình đầu và cần tương tác ngay.
- Không thư viện quản lý state. `useState`, `useReducer` là đủ.
- Không gọi Supabase bằng service role từ component. Dữ liệu cần quyền thì đi qua endpoint.

## Xử lý lỗi

- Không nuốt lỗi. `catch` phải xử lý được, hoặc ghi log rồi ném tiếp.
- Lỗi cho người dùng là câu tiếng Việt theo skill `ui-vi`. Chi tiết kỹ thuật chỉ vào log server.
- Log không chứa câu của người dùng, email, token.

## Dependency

- Trước khi thêm thư viện: việc này làm được bằng nền tảng web hoặc 30 dòng code không. Được thì không thêm.
- Không thêm thư viện UI lớn, ORM, thư viện ngày giờ nặng. Chỉ thêm thứ còn được bảo trì và chạy được trên Cloudflare Workers.
- Ghi lý do thêm dependency trong thông điệp commit.

## Commit

- Dạng `M<n>: <việc đã làm>` hoặc `fix: <lỗi đã sửa>`. Một commit một ý.
- Không commit `.env`, file build, `node_modules`. Chạy skill `epc-check` trước khi commit.
