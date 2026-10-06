# Trước khi bán EPC: cần làm gì

Ngày 07/10/2026. Gộp từ 4 bài đánh giá (pháp lý, kỹ thuật, tìm người dùng, sản phẩm) và 4 vai người dùng thử. Bài đầy đủ kèm nguồn: `research_notes/Launch readiness/` và `research_notes/UX test/`. Chỗ nào ghi "nhận định" trong các bài gốc là suy luận, chưa kiểm chứng.

**Kết luận:** sản phẩm học đã dùng được, lõi bảo mật và thanh toán chắc. Còn thiếu 3 nhóm việc trước khi thu tiền: giấy tờ người bán, chống sập và chống mất dữ liệu, và giữ chân người đã trả tiền. Phần lớn làm được với 0đ trong khoảng 2 tuần.

## Đã sửa ngay (commit M11)

Từ 4 vai người dùng thử:

- Kết quả trắc nghiệm bị server từ chối (lỗi 400 với câu q6 đến q10), nên tiến độ và câu ôn không được lưu. Đã sửa.
- 78 lời giải thích trắc nghiệm nhắc "câu thứ hai", trong khi đáp án đã bị xáo. Đã viết lại theo nội dung đáp án, và thêm test chặn.
- Tự sửa câu đòi giống hệt bản AI. Nay chấm theo từng chỗ ("đúng 1 trên 2 chỗ").
- Phần 5 của bài Phỏng vấn bị giới hạn 700 ký tự. Nay dùng chế độ phỏng vấn: 1200 ký tự, có "Một cách trả lời tốt hơn".
- Câu đang gõ bị mất khi đi đăng nhập. Nay được giữ lại.
- Sau trắc nghiệm, nút chính dẫn sang bài sau nên người học bỏ qua phần viết. Nay nút chính dẫn sang phần 5.
- Nút "Học miễn phí" đưa khách tới màn đăng nhập. Nay mở thẳng bài 1.
- Trang đổi track ghi "Bạn đúng 0 trên 12 câu" dù chưa làm bài kiểm tra. Đã bỏ dòng này.
- Trang chủ ghi số lần sửa câu khi dùng thử khác với trang bảng giá. Nay cả hai ghi đúng 10 lần/ngày.
- Font đáp án khó đọc, đáp án tiếng Việt bị gắn sai ngôn ngữ cho screen reader. Đã sửa.
- Nút Telegram che nút bấm khi đang gõ. Nay nút tự ẩn lúc gõ.

## 1. Bắt buộc trước khi bán

### Bạn làm

| Việc | Vì sao |
|---|---|
| Đăng ký hộ kinh doanh online (VNeID, Cổng dịch vụ công) | Là điều kiện cho việc thông báo website và để được miễn hồ sơ đánh giá tác động dữ liệu cá nhân. Doanh thu từ 500 triệu đồng/năm trở xuống thì thuế 0đ, nhưng mỗi năm vẫn phải thông báo doanh thu trên eTax, hạn 31/01. |
| Mua tên miền riêng (khoảng 10 USD/năm) trước khi có người dùng | Đổi tên miền sau khi ra mắt thì phải làm lại cùng lúc đăng nhập OAuth, webhook payOS, webhook Telegram và sitemap. |
| Thông báo website với Bộ Công Thương/UBND tỉnh (miễn phí) | Không thông báo có thể bị phạt 10 đến 20 triệu đồng. |
| Tài khoản MB riêng cho EPC, khai với cơ quan thuế | payOS có thể dừng dịch vụ không báo trước. Tiền bán hàng không nên đi qua tài khoản cá nhân dùng hằng ngày. |
| Kiểm màn đồng ý đăng nhập Google đang ở trạng thái "In production" | Nếu còn "Testing" thì chỉ tối đa 100 người đăng nhập được. |
| Tạo một hộp thư liên hệ (Gmail hoặc Cloudflare Email Routing, 0đ) | Hiện hoàn tiền và xóa dữ liệu chỉ làm được qua Telegram. |
| Beta kín 2 tuần với 15 đến 30 người thật, link `?src=beta`, hỏi họ ở ngày 3 và ngày 7 | Ngưỡng "5 câu được sửa trong 7 ngày" chưa từng được đo với người thật. Các vai người dùng thử ở trên đều là giả lập. |
| Viết đoạn "Ai làm EPC" (tên, ảnh, 2 đến 3 câu, link GitHub/LinkedIn) | Người mua chuyển khoản cho một tên cá nhân lạ thì rất dễ dừng lại ở bước này. Luật cũng bắt công khai thông tin người bán. |

### Code (mình làm được, cần bạn đồng ý)

| Việc | Vì sao | Cỡ |
|---|---|---|
| Báo lỗi về Telegram của admin: cron hỏng, khách chuyển thiếu tiền, webhook lỗi 500, chạm mức chặn AI | Log chỉ giữ 3 ngày và không có cảnh báo. Cron hỏng âm thầm thì sau 7 ngày Supabase tạm dừng và cả app sập. | Nhỏ |
| Sao lưu database hằng ngày (GitHub Actions dump, mã hóa, lưu lên R2) | Gói Free của Supabase không có bản sao lưu. | Nhỏ |
| Khóa bảng `events`: bỏ quyền insert của anon, giới hạn `props` 1 KB, giới hạn tần suất | Hiện ai cũng ghi thẳng được vào bảng. Database vượt 500 MB thì cả app chuyển sang chỉ đọc, kể cả phần xác nhận đơn. | Nhỏ |
| Giữ lượt trước khi gọi AI, và mỗi người chỉ một request sửa câu chạy cùng lúc | Gửi song song 50 câu thì AI chạy 50 lần nhưng chỉ bị trừ 1 lượt. Khoảng 10 tài khoản giả là đốt hết quota AI trong ngày, kể cả của người đã trả tiền. | Vừa |
| Dành sẵn 20% quota AI cho người trả tiền | Một đợt người dùng thử tràn vào sau một bài đăng là người trả tiền bị chặn. | Nhỏ |
| Sửa hoàn tiền: chỉ trừ số ngày của đơn được hoàn | Hiện hoàn một đơn là mất luôn cả Premium từ các đơn khác. | Nhỏ, có migration |
| Sửa `/admin`: lấy email bằng một truy vấn | Hơn khoảng 45 người mua là trang hỏng, đúng lúc cần xác nhận đơn hoặc hoàn tiền bằng tay. | Nhỏ |
| Thông tin người bán ở chân trang, email liên hệ, viết lại `/bao-mat` theo Luật Bảo vệ dữ liệu cá nhân 2025, câu đồng ý cạnh nút đăng nhập, điều kiện tuổi | Luật bắt buộc. Câu chữ cần bạn duyệt. | Vừa |
| Nhắc trước khi hết Premium hoặc hết dùng thử (Telegram và thẻ trên `/hom-nay`), câu chữ riêng cho người đã hết Premium | Gói không tự gia hạn, nên mua lại là nguồn doanh thu duy nhất từ tháng 2. | Vừa |
| Lịch sử đơn và biên nhận trong `/tai-khoan` | Đóng tab thanh toán là mất mã đơn, mà hoàn tiền thì cần mã đơn. | Nhỏ |
| Nút "AI sửa chưa đúng": bỏ mục ôn đó và ghi lại để bạn xem | Chỗ AI sửa sai vẫn vào sổ lỗi và quay lại 4 lần. Một ảnh chụp "app dạy sai" có thể làm hỏng kênh truyền miệng. | Vừa |
| Ghi tên người nhận tiền ở bước QR, và 3 câu hỏi thường gặp ở `/bang-gia` | Giảm số người bỏ ngang ở bước chuyển khoản. | Nhỏ |
| Gắn `?src=` vào link chia sẻ và một câu SQL đếm khách theo nguồn | Để biết nhóm Facebook nào ra đơn. | Nhỏ |

## 2. Nên làm trong tháng đầu

- **Kỹ thuật:**
  - Tách môi trường thử khỏi bản thật. Hiện `npm run dev` ghi vào database thật.
  - Viết sổ tay rollback.
  - Thêm header bảo mật.
  - Giữ lại đơn đã trả khi xóa tài khoản. Hiện đơn bị xóa theo, trái với trang `/bao-mat`.
  - Giới hạn số tin `/hotro` mỗi giờ.
  - Đo Lighthouse.
  - Chuyển lên Workers Paid (5 USD/tháng) khi CPU gần chạm giới hạn.
- **Sản phẩm:**
  - Học hết một track thì có việc tiếp theo.
  - Tin nhắc có số câu cần ôn.
  - Người miễn phí không bị nhắc học bài đã khóa.
  - Chỉ đường cho người vừa mua: đặt ngày phỏng vấn, liên kết bot, phỏng vấn thử.
  - Hỏi một câu góp ý ở ngày 6 của dùng thử.
  - Đo tỷ lệ mua lại.
  - Nút "Tải dữ liệu của tôi".
- **Theo 4 vai người dùng thử:**
  - Nghe câu mẫu bằng giọng đọc có sẵn của trình duyệt (0đ).
  - Chế độ "sắp phỏng vấn": bài hôm nay lấy từ track Phỏng vấn.
  - Thêm câu hỏi và câu trả lời mẫu cho BA/PM/QA. Hiện phỏng vấn thử hỏi BA về Kubernetes.
  - Lưu "bộ câu trả lời của tôi" sau buổi phỏng vấn thử.
  - Thư viện bài trong app, lọc được theo ngành.
- **Tìm người dùng:**
  - Mỗi link đăng bài có `src` riêng.
  - Đặt Phỏng vấn làm thông điệp chính trong một phần quảng bá.
  - Đăng ký Search Console.
  - Ảnh OG riêng cho từng mẫu câu.
  - Kênh Telegram "Bug hôm nay".
  - Mỗi tuần gọi 5 người, nhất là người không trả tiền.
  - Kênh nên đăng: Facebook cá nhân, các nhóm dev/QA/BA lớn (xin admin trước), LinkedIn, Viblo (chỉ bài kỹ thuật thật, một link ở cuối).

## 3. Để sau

- Gói năm: khi tỷ lệ quay lại ngày 30 đạt từ 15% và có từ 60 bài.
- Thử giá.
- Gói nhóm cho công ty: cần hộ kinh doanh để xuất hóa đơn.
- Giới thiệu bạn bè.
- Email nhắc cho người không dùng Telegram.
- Tự xóa tài khoản.
- Gộp tài khoản Google và GitHub.
- CI trên GitHub Actions.
- TikTok.

## Rủi ro lớn nhất nếu bỏ qua

1. **Bán ẩn danh, chưa đăng ký kinh doanh, tiền vào tài khoản cá nhân.** Chỉ cần một khiếu nại là có thể bị phạt và bị khóa kênh nhận tiền.
2. **App hỏng mà không ai biết, và không có bản sao lưu.** Khách đã chuyển tiền mà Premium không mở, tới khi khách hỏi thì log đã bị xóa.
3. **Doanh thu chỉ đến một lần.** Không có nhắc hết hạn và biên nhận, nên người mua tháng 1 không quay lại mua tiếp.
