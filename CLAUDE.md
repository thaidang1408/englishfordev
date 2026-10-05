# English Personal Coach (EPC)

Web app giúp dev/IT người Việt dùng tiếng Anh trong công việc hằng ngày: standup, họp, viết PR.
Một người làm, chi phí hạ tầng 0đ. Đặc tả đầy đủ ở `docs/SPEC.md`. Đọc file đó trước khi làm bất cứ việc gì.

## Cách làm việc

- Làm theo milestone M0 → M7 trong `docs/SPEC.md`, đúng thứ tự. Mỗi lần chỉ một milestone.
- Cuối mỗi milestone: chạy `npm run check`, `npm run test`, `npm run build`, rồi báo ngắn gọn đã làm gì,
  cách tự kiểm bằng tay, và việc nào cần chủ dự án làm (tạo tài khoản, dán key). Dừng ở đó, chờ "OK".
- Không thêm tính năng ngoài SPEC. Thấy thiếu thì ghi vào `docs/BACKLOG.md`, không tự build.
- Thư viện hay API nào không chắc cú pháp hiện tại thì đọc tài liệu chính thức trước khi viết code.
  Đặc biệt: Astro + adapter Cloudflare, Supabase SSR auth, Telegram Bot API, payOS.
- Việc gì cần tài khoản bên ngoài (Supabase, Cloudflare, Google/GitHub OAuth, BotFather, payOS, API key AI)
  thì viết hướng dẫn từng bước vào `docs/SETUP.md` và dừng lại cho chủ dự án làm. Không bịa key.

## Skill của dự án

Nằm trong `.claude/skills/`. Dùng đúng skill cho đúng việc:

| Skill | Khi nào |
| --- | --- |
| `/milestone M<n>` | Chủ dự án gọi để làm trọn một milestone rồi dừng |
| `epc-check` | Trước khi báo xong việc hoặc commit |
| `lesson` | Soạn hoặc sửa bài học, test xếp trình độ |
| `db-change` | Mọi thay đổi bảng, cột, policy trong Supabase |
| `ui-vi` | Mọi chữ tiếng Việt trên giao diện, thông báo, tin nhắn gửi người dùng |
| `design-system` | Mọi trang, layout, component, CSS |
| `design-review` | Sau khi dựng hoặc sửa một màn hình: chụp ảnh, chấm, sửa |
| `code-standards` | Mọi code TypeScript, Astro, React; thêm thư viện; commit |
| `api-endpoint` | Mọi endpoint và webhook |
| `security` | Đăng nhập, phân quyền, thanh toán, admin, AI, nội dung người dùng nhập |
| `testing` | Thêm logic, endpoint, policy; sửa lỗi |
| `web-quality` | Trang công khai: hiệu năng, khả năng truy cập, SEO kỹ thuật |

## Stack (đã chốt, không đổi)

- Astro + TypeScript, React cho phần tương tác, Tailwind CSS.
- Chạy trên Cloudflare (adapter `@astrojs/cloudflare`). Không dùng Vercel: gói Hobby cấm dùng thương mại.
- Supabase: Postgres, Auth (Google và GitHub OAuth), Row Level Security.
- AI sửa câu: gọi từ server qua một interface duy nhất `src/lib/ai/correct.ts`.
- Không có server riêng, không microservice, không hàng đợi, không Docker.

## Lệnh

```bash
npm run dev      # chạy local
npm run check    # astro check + tsc
npm run test     # vitest
npm run test:e2e # playwright, sau khi build
npm run build    # build production
npm run deploy   # wrangler deploy
```

## Quy ước

- Toàn bộ chữ trên giao diện là tiếng Việt, xưng "bạn". Câu ví dụ tiếng Anh giữ nguyên tiếng Anh.
- Giọng văn: câu ngắn, cụ thể, không khoa trương. Không hứa kết quả ("nói trôi chảy sau 14 ngày").
  Không số liệu người dùng, không lời khen giả. Nút bấm nói đúng việc nó làm.
- Giao diện theo skill `design-system` và `reference/styleguide.html`: sáng và tối, khung diff kiểu code review
  là hình ảnh chủ đạo, phím tắt, lịch luyện tập. `reference/landing.html` là mẫu bố cục trang chủ. Không XP, huy hiệu, bảng xếp hạng.
- Nội dung bài học nằm trong `content/lessons/*.json`, đúng schema ở SPEC mục 6. Không nhúng nội dung vào component.
- Bí mật chỉ nằm trong biến môi trường. `SUPABASE_SERVICE_ROLE_KEY` và key AI không bao giờ tới trình duyệt.
- Mọi quyền Premium và hạn mức được kiểm ở server. Không tin dữ liệu từ client.
- Mobile trước. Trang công khai phải đọc được khi tắt JavaScript.

## Không làm trong bản 1

Quảng cáo, app mobile, trừ tiền tự động định kỳ (gia hạn tự động; tự xác nhận chuyển khoản qua payOS thì có), luyện nói và chấm phát âm, bảng xếp hạng,
đa ngôn ngữ, blog, trang SEO sinh hàng loạt.
