---
name: web-quality
description: Chuẩn hiệu năng, khả năng truy cập và SEO kỹ thuật cho các trang của EPC. Dùng khi tạo hoặc sửa trang công khai, layout, ảnh, font, thẻ meta, sitemap, hoặc khi trang chậm.
---

# Chất lượng trang web

## Hiệu năng

Ngưỡng cho trang công khai, đo trên điện thoại tầm trung với mạng 4G chậm:

| Chỉ số | Ngưỡng |
| --- | --- |
| LCP | Không quá 2,5 giây |
| INP | Không quá 200 ms |
| CLS | Không quá 0,1 |
| JavaScript gửi về ở `/` và `/mau-cau/*` | Không quá 50 KB sau nén |
| JavaScript ở `/hoc/*` | Không quá 120 KB sau nén |

Cách đạt:

- Trang công khai render sẵn HTML lúc build. Nội dung bài không chờ JavaScript.
- Font: `preconnect`, `font-display: swap`, chỉ tải trọng số đang dùng (400, 500, 600, 800 cho Be Vietnam Pro; 400, 600 cho JetBrains Mono). Chỉ tải subset `latin` và `vietnamese`.
- Ảnh có `width`, `height`, `loading="lazy"` trừ ảnh trong màn hình đầu. Ưu tiên SVG và CSS cho hình minh họa.
- Không script bên thứ ba ở trang công khai. Sự kiện phễu gửi bằng `navigator.sendBeacon` tới `/api/events`.
- Không để layout nhảy: khung diff, lịch luyện tập, mã QR đều có kích thước giữ chỗ.

## Khả năng truy cập

- HTML đúng nghĩa: một `h1` mỗi trang, thứ bậc heading không nhảy cóc, `button` cho hành động, `a` cho điều hướng, `label` gắn với mọi ô nhập.
- Tương phản chữ đạt tối thiểu 4,5:1, chữ lớn và thành phần giao diện 3:1, ở cả giao diện sáng và tối.
- Mọi thứ dùng được bằng bàn phím, thứ tự tab hợp lý, focus luôn nhìn thấy.
- Đúng và sai trong trắc nghiệm không chỉ báo bằng màu: có chữ hoặc dấu kèm theo.
- Kết quả sửa câu và thông báo lỗi nằm trong vùng `aria-live="polite"`.
- Dòng diff có nhãn cho trình đọc màn hình: "câu gốc", "câu đã sửa".
- `lang="vi"` trên `html`, `lang="en"` trên các câu tiếng Anh.
- Tôn trọng `prefers-reduced-motion`.

## SEO kỹ thuật

- Mỗi trang công khai có `title` riêng dưới 60 ký tự, `meta description` riêng dưới 155 ký tự, `link rel="canonical"`, thẻ Open Graph và ảnh OG.
- `/mau-cau/[slug]` và `/hoc/[slug]` của bài miễn phí được index. Trang cần đăng nhập, `/admin`, `/api/*` có `noindex` và bị chặn trong `robots.txt`.
- `sitemap.xml` sinh lúc build, chỉ gồm trang được index.
- URL không dấu, chữ thường, gạch ngang. Không đổi slug sau khi ra mắt; đổi thì có chuyển hướng 301.
- Trang mẫu câu có dữ liệu có cấu trúc JSON-LD loại `LearningResource`, ngôn ngữ `vi`.
- Liên kết nội bộ: mỗi trang mẫu câu trỏ tới bài học tương ứng và hai mẫu câu liền kề.
- Trang 404 có nội dung riêng và trả đúng mã 404.

## Cách kiểm

Chạy Lighthouse ở chế độ mobile cho `/`, một trang `/mau-cau/*` và một trang `/hoc/*` trên bản build production. Mục tiêu: Performance, Accessibility, Best Practices, SEO đều từ 90. Ghi điểm thật vào báo cáo; không chạy được thì nói là chưa đo.
