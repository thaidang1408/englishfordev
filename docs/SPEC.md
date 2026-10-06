# EPC — Đặc tả bản 1

Cập nhật: 06/10/2026 (thêm M8 mục 14, M9 mục 15, M10 mục 16). Người quyết định: chủ dự án. Mọi con số dưới đây là quyết định đã chốt cho bản 1.

## 1. Sản phẩm

**Một câu:** mỗi sáng 10 phút, dev học một mẫu câu dùng trong công việc và được sửa câu tiếng Anh của chính mình, giải thích bằng tiếng Việt.

**Người dùng:** dev, QA, BA, PM người Việt. Đọc tài liệu tiếng Anh được, ngại nói và viết.

**Vòng lặp chính:**

```
Trang chủ → học thử bài 1 (không đăng nhập) → đăng nhập → 7 ngày dùng thử đủ Premium
   → test xếp trình độ → "Hôm nay": bài của ngày + câu cần ôn → viết câu của mình → AI sửa
   → lỗi vào sổ lỗi, được xếp nhóm → quay lại ôn sau 1, 3, 7, 14 ngày → nhắc qua Telegram
   → hết dùng thử: sổ lỗi và phân tích lỗi của chính họ là lý do nâng cấp
```

## 2. Miễn phí và Premium

**Ba lý do trả tiền, xếp theo độ mạnh.** Mọi quyết định về Premium phải phục vụ ba thứ này:

1. **Phỏng vấn.** Có ngày hẹn và có mức lương phía sau. Track Phỏng vấn và "Phỏng vấn thử" chỉ có ở Premium.
2. **Lỗi của chính bạn.** Hệ thống nói được "tuần này bạn sai mạo từ 7 lần" và cho ôn đúng những lỗi đó. Càng dùng càng có giá trị, và không mang đi nơi khác được.
3. **Sửa câu mỗi ngày không cần viết prompt**, giải thích bằng tiếng Việt theo ngữ cảnh dev.

**Dùng thử:** 7 ngày đầu sau khi đăng ký, tài khoản có đủ quyền Premium, tối đa 10 lần sửa mỗi ngày. Không cần thẻ, không cần làm gì. Mục đích là để người dùng tích lũy sổ lỗi trước khi gặp tường phí.

| | Miễn phí, sau dùng thử | Premium |
| --- | --- | --- |
| Bài học | 3 bài đầu của track Standup | Tất cả bài, 3 track |
| Test xếp trình độ | Có | Có |
| AI sửa câu của bạn | 1 lần mỗi 7 ngày | 30 lần mỗi ngày |
| Ôn câu trắc nghiệm đã sai | Có | Có |
| Sổ lỗi cá nhân và ôn lỗi của chính bạn | Giữ nguyên dữ liệu, xem được 3 lỗi gần nhất | Đầy đủ |
| Phân tích lỗi | Chỉ thấy tổng số lỗi và số lỗi đang lặp lại | Ba nhóm lỗi hay mắc nhất, xu hướng theo tuần |
| Luyện phỏng vấn | Không | 10 bài và "Phỏng vấn thử" |
| Báo cáo tuần qua Telegram | Không | Có |
| Nhắc mỗi sáng qua Telegram | Có | Có |

Hết dùng thử không xóa gì. Dữ liệu của người dùng vẫn còn, chỉ bị khóa phần xem và ôn.

**Giá:** 79.000đ cho 30 ngày, 179.000đ cho 90 ngày. Mua theo kỳ, không tự gia hạn.
**Hoàn tiền:** trong 3 ngày đầu, không hỏi lý do.
**Thanh toán:** chuyển khoản qua mã VietQR do payOS tạo cho từng đơn (miễn phí, tài khoản cá nhân MB Bank). Khi payOS báo đã nhận đúng số tiền của đơn, tài khoản tự mở Premium. Chủ dự án vẫn xác nhận tay được trong trang admin, dùng khi người dùng chuyển sai nội dung hoặc webhook lỗi. Đổi ngày 05/10/2026 theo quyết định của chủ dự án.

Điểm mời nâng cấp (chỉ bốn chỗ này, không popup): mở bài bị khóa; hết lượt sửa; mở sổ lỗi hoặc phân tích lỗi; và một thẻ ở `/hom-nay` từ ngày thứ 5 của dùng thử cho tới khi nâng cấp.

**Cho thấy giá trị (06/10/2026):** bảng so sánh ở `/bang-gia` theo các tính năng hiện có (tin hoàn chỉnh, bản đồ lỗi, bot sửa câu, số bài thật). `/bang-gia` và `/nang-cap` có phần "Premium giúp bạn làm được gì" nói ba lý do trả tiền bằng việc làm được, kèm giá chia theo ngày (phép chia thật). Mở bài bị khóa thì thấy bài có gì, một ví dụ, dòng đầu của tin hoàn chỉnh và danh sách "Bài viết nên có"; phần còn lại không có trong HTML. Thẻ mời cho người đang dùng thử nói rõ hết dùng thử còn gì.

Lời mời luôn dùng số liệu của chính người đó, ví dụ: "Sổ lỗi của bạn có 14 lỗi, 5 lỗi đang lặp lại. Nâng cấp để ôn tiếp." Không có số liệu thì không bịa.

## 3. Trang và đường dẫn

Công khai, render sẵn HTML:

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Trang chủ. Lấy bố cục, màu, font và khung diff từ `reference/landing.html`. Nút chính là "Học thử bài 1, miễn phí". Bỏ phần giữ suất, form và chuyển khoản của file mẫu; giá theo mục 2 |
| `/hoc/[slug]` | Trình học bài. 3 bài miễn phí mở cho mọi người, bài khác cần Premium |
| `/mau-cau/[slug]` | Trang mẫu câu sinh từ mỗi bài: công thức, ví dụ, lỗi hay gặp, nút sang bài học. Dùng cho SEO |
| `/bang-gia` | Bảng ở mục 2 và hai gói giá |
| `/bug-hom-nay` | Review PR mỗi ngày (3 câu), mục 4c. Không cần đăng nhập |
| `/dieu-khoan`, `/bao-mat` | Điều khoản, hoàn tiền, dữ liệu thu thập |

Cần đăng nhập:

| Đường dẫn | Nội dung |
| --- | --- |
| `/dang-nhap` | Đăng nhập bằng Google hoặc GitHub |
| `/xep-trinh-do` | Test 12 câu, chạy một lần sau lần đăng nhập đầu |
| `/hom-nay` | Bài của ngày, số câu cần ôn, ô "Sửa câu của tôi", tiến độ track |
| `/on-tap` | Phiên ôn các mục đến hạn |
| `/so-loi` | Sổ lỗi cá nhân và phân tích lỗi. Mục 5b |
| `/phong-van-thu` | Phỏng vấn thử, chỉ Premium và dùng thử. Mục 7b |
| `/nang-cap` | Chọn gói → tạo đơn → hiện mã QR và nội dung chuyển khoản → tự báo khi đã nhận tiền |
| `/tai-khoan` | Giờ standup, ngày phỏng vấn (không bắt buộc), liên kết Telegram, hạn dùng thử và Premium, đăng xuất |
| `/admin` | Chỉ email trong `ADMIN_EMAILS`. Danh sách đơn, nút "Đã nhận tiền", "Hoàn tiền", bảng phễu |

API (server):

| Endpoint | Việc |
| --- | --- |
| `POST /api/correct` | AI sửa câu. Mục 7 |
| `POST /api/orders` | Tạo đơn `pending` với mã `EPC` + 5 ký tự và link thanh toán payOS |
| `GET /api/orders/:id` | Trạng thái đơn của chính người dùng. Đơn còn chờ thì hỏi lại payOS, đã trả thì xác nhận như webhook |
| `POST /api/payos/webhook` | payOS báo giao dịch. Kiểm chữ ký bằng `PAYOS_CHECKSUM_KEY`, khớp mã đơn và số tiền, rồi xác nhận đơn |
| `POST /api/admin/orders/:id/confirm` | Đánh dấu `paid`, cộng ngày vào `premium_until` |
| `POST /api/admin/orders/:id/refund` | Đánh dấu `refunded`, đặt `premium_until` về hiện tại |
| `POST /api/events` | Ghi sự kiện phễu, cho cả khách chưa đăng nhập |
| `POST /api/telegram/webhook` | Nhận `/start <token>` để liên kết chat |
| `POST /api/cron/tick` | Gọi bởi worker cron, có header bí mật. Gửi nhắc và giữ Supabase không bị tạm dừng |

## 4. Trình học bài

Một bài khoảng 10 phút, năm phần theo thứ tự:

1. **Mẫu câu:** công thức và ghi chú một dòng.
2. **Ví dụ:** ba câu lấy ngẫu nhiên từ năm câu của bài, có nghĩa tiếng Việt. Tắt JavaScript thì hiện đủ năm câu. Tiếp theo là **tin nhắn hoàn chỉnh** (`model`): một tin, tài liệu hoặc câu trả lời đầy đủ như ngoài đời, 3 đến 8 câu, nghĩa tiếng Việt mở khi bấm.
3. **Lỗi hay gặp:** hiển thị dạng diff, dòng sai màu đỏ, dòng đúng màu xanh, nghĩa tiếng Việt của câu đúng và lý do bên dưới.
4. **Luyện tập:** 5 câu trắc nghiệm lấy ngẫu nhiên từ 10 câu của bài, mỗi lần một câu. Đảo thứ tự đáp án khi hiển thị. Chọn xong hiện đúng/sai, nghĩa tiếng Việt của câu đúng (`answer_vi`) và `why_vi`. Câu sai tạo mục ôn.
5. **Câu của bạn:** viết đúng loại tin thật theo `write_prompt_vi`, có danh sách "Bài viết nên có" (`checklist_vi`) → `POST /api/correct` → tự sửa trước (mục 14) → kết quả dạng diff, nghĩa tiếng Việt, ghi chú, và phần còn thiếu so với danh sách (`missing_vi`).

Khách chưa đăng nhập học được phần 1 đến 4 của bài miễn phí, tiến độ lưu `localStorage`. Phần 5 yêu cầu đăng nhập; sau khi đăng nhập thì chuyển tiến độ từ `localStorage` lên tài khoản.

**Bài của ngày:** bài chưa xong có `id` nhỏ nhất trong track người dùng đang học. Thứ Bảy và Chủ nhật không có bài mới, trang `/hom-nay` chỉ hiện phần ôn.

## 4b. Giao diện

Theo skill `design-system` và `reference/styleguide.html`. Ba thứ thuộc phạm vi bản 1:

- Giao diện sáng và tối, theo hệ thống, có nút đổi, không nháy màu khi tải.
- Phím tắt trong trắc nghiệm (`1` `2` `3`, `Enter`) và ô sửa câu (`Ctrl` hoặc `Cmd` + `Enter`).
- Lịch luyện tập 16 tuần ở `/hom-nay`, tính từ `lesson_progress`, `corrections` và các phiên ôn. Kèm ba con số: bài đã xong, câu đã được sửa, lỗi còn lặp lại.

## 4c. Bug của ngày

Thêm ngày 05/10/2026 theo quyết định của chủ dự án, làm trong M3 (không chờ điều kiện bên dưới).

Đổi ngày 07/10/2026 theo yêu cầu của chủ dự án: thành mini game "Review PR mỗi ngày", 3 câu mỗi ngày.

- Trang công khai `/bug-hom-nay`, không cần đăng nhập. Mỗi ngày một "pull request" `#DDMM` có 3 dòng, mỗi dòng một câu sai lấy từ `mistakes[]`. Vòng xoay xen kẽ các bài (lỗi thứ nhất của mọi bài, rồi lỗi thứ hai...), nên 3 câu trong ngày thuộc 3 bài khác nhau và mọi người thấy cùng 3 câu.
- Review lần lượt từng dòng: bấm vào chữ sai, mỗi dòng 3 lần thử. Dòng chưa tới lượt bị làm mờ. Xong một dòng thì hiện ngay khung diff, nghĩa tiếng Việt, `why_vi` và link bài học của câu đó.
- Điểm: tìm ra ở lần 1, 2, 3 được 3, 2, 1 điểm; không tìm ra được 0. Tối đa 9. Kết luận như review thật: 9 là Approve; từ 6 là Approve, kèm góp ý; từ 3 là Request changes; dưới 3 là Cần review lại.
- Có đồng hồ từ lần bấm đầu, chuỗi ngày, chuỗi dài nhất, đếm ngược tới PR mới. Tất cả chỉ lưu trên trình duyệt (localStorage), không gửi lên máy chủ, không có số liệu của người khác.
- Chép kết quả dạng văn bản: ô □ (bấm sai) và ■ (tìm ra) cho từng dòng, kết luận, điểm, thời gian, chuỗi, link `?src=bug-share`. Không lộ câu sai hay câu đúng.
- Xong PR hôm nay thì "Chơi thêm 3 câu" từ các câu của những ngày sau, không tính điểm, không ảnh hưởng kết quả ngày.
- Không có JavaScript: hiện khối "Xem đáp án PR hôm nay".
- Không làm: bảng xếp hạng, so sánh với người khác, phần thưởng đổi ra Premium.

## 5. Ôn tập

Hộp Leitner bốn mức: 1, 3, 7, 14 ngày. Trả lời đúng thì lên một mức, sai thì về mức 1. Qua mức 14 ngày thì coi như thuộc.

Hai loại mục ôn:

- `quiz`: câu trắc nghiệm đã trả lời sai. Hỏi lại đúng câu đó.
- `own_error`: một chỗ sửa trong câu của chính người dùng. Hiện câu gốc, hỏi "sửa thế nào", cho xem đáp án, người dùng tự chấm "nhớ" hoặc "chưa nhớ". Chỉ Premium.

Một phiên ôn tối đa 10 mục, ưu tiên mục quá hạn lâu nhất.

## 5b. Phân tích lỗi

Mỗi chỗ sửa do AI trả về có một `category` (mục 7). Từ bảng `corrections`, tính cho mỗi người dùng trong 28 ngày gần nhất:

- Số lần mắc theo từng nhóm lỗi, lấy ba nhóm cao nhất, kèm một ví dụ thật của chính họ cho mỗi nhóm.
- So tuần này với tuần trước cho từng nhóm: tăng, giảm, giữ nguyên.
- Số lỗi "đang lặp lại": mục ôn `own_error` chưa qua mức 7 ngày.

**Bản đồ lỗi (Premium và dùng thử, thêm 06/10/2026):** ở `/so-loi`, bảng 8 tuần gần nhất theo từng nhóm lỗi. Mỗi ô là số lỗi của nhóm đó trong tuần, màu đậm nhạt theo số. Chỉ dùng dữ liệu thật trong `corrections`; tuần không có câu nào thì ô để trống, không nội suy.

Tên nhóm hiển thị bằng tiếng Việt: mạo từ, thì của động từ, giới từ, trật tự từ, chọn từ, dạng động từ, số ít số nhiều, khác.

**Báo cáo tuần (Premium):** Chủ nhật 20:00 giờ Việt Nam, gửi qua Telegram một tin: số câu đã sửa trong tuần, nhóm lỗi hay mắc nhất kèm một ví dụ, nhóm lỗi đã giảm, và link ôn. Tuần không có câu nào thì không gửi.

**Đếm ngược phỏng vấn:** nếu người dùng nhập ngày phỏng vấn ở `/tai-khoan`, trang `/hom-nay` hiện "Còn N ngày tới buổi phỏng vấn" và gợi ý track Phỏng vấn.

## 6. Nội dung

Bài học là file JSON trong `content/lessons/`, tên `<track>-<id 2 chữ số>.json`. Ba file mẫu `standup-01` đến `standup-03` đã có và là chuẩn để viết các bài còn lại.

```ts
type Lesson = {
  id: number;                 // thứ tự trong track
  track: "standup" | "writing" | "interview";
  slug: string;               // không dấu, dùng cho URL, duy nhất trên mọi track
  title: string;
  free: boolean;              // chỉ standup 1 đến 3 là true
  goal_vi: string;
  pattern: { formula: string; note_vi: string };
  examples: { en: string; vi: string }[];          // đúng 5, trình học hiện 3 câu ngẫu nhiên
  mistakes: { wrong: string; right: string; right_vi: string; why_vi: string }[];  // đúng 3
  word_bank: string[];
  model: { title_vi: string; en: string; vi: string };  // tin nhắn hoàn chỉnh, 3 đến 8 câu, xuống dòng bằng \n
  checklist_vi: string[];     // 3 đến 5 ý bài viết của người học nên có
  quiz: { id: string; prompt_vi: string; options: string[]; answer: number; answer_vi: string; why_vi: string }[]; // đúng 10, 3 đáp án; mỗi lượt học lấy 5
  write_prompt_vi: string;
  question_en?: string;        // chỉ track interview: câu hỏi nhà tuyển dụng sẽ hỏi
  roles?: ("dev" | "qa" | "ba" | "pm")[]; // bài chuyên ngành; không có là bài chung cho mọi ngành (mục 16)
};
```

Kiểm schema bằng zod lúc build. Build phải hỏng nếu một file sai schema.

**Track Standup và họp (13 bài):** 1 Hôm qua đã làm gì. 2 Hôm nay làm gì. 3 Đang kẹt ở đâu. 4 Việc xong, việc còn dở. 5 Ước lượng bao lâu thì xong. 6 Hỏi lại khi chưa hiểu. 7 Xin người khác giúp. 8 Báo trễ và đề xuất mốc mới. 9 Không đồng ý một cách lịch sự. 10 Tóm tắt một buổi họp. 11 Chen vào và xác nhận lại trong cuộc họp. 12 Giải thích kỹ thuật cho người không làm kỹ thuật. 13 Nói chuyện xã giao đầu buổi họp.

**Track Viết cho team (14 bài):** 1 Tiêu đề và mô tả pull request. 2 Commit message. 3 Comment khi review code. 4 Trả lời comment review. 5 Báo một bug. 6 Hỏi trên Slack ngắn mà đủ ý. 7 Báo tiến độ cho khách. 8 Email xin nghỉ, xin dời lịch. 9 Viết ghi chú bàn giao. 10 Từ chối hoặc xin thêm thời gian. 11 Cập nhật khi có sự cố. 12 Báo tin xấu hoặc rủi ro cho khách. 13 Acceptance criteria và kết quả test. 14 Đọc hiểu tin nhắn của đồng nghiệp nước ngoài.

**Track Phỏng vấn (10 bài, Premium):** 1 Giới thiệu bản thân. 2 Kể về dự án gần nhất. 3 Vai trò và đóng góp của bạn. 4 Một bug khó bạn đã xử lý. 5 Điểm mạnh và điểm cần cải thiện. 6 Vì sao muốn đổi việc. 7 Bất đồng trong team và cách xử lý. 8 Trả lời khi không biết câu trả lời. 9 Hỏi lại nhà tuyển dụng. 10 Nói về lương và ngày bắt đầu.

Bài phỏng vấn có thêm `question_en`. Mẫu câu của bài là khung trả lời, ví dụ là ba câu trả lời ngắn của ba người khác nhau, không phải một bài văn mẫu để học thuộc.

Quy tắc viết bài:

- Mỗi câu tiếng Anh phải là câu một dev thật sẽ nói. Không ví dụ kiểu sách giáo khoa.
- Đáp án sai trong trắc nghiệm phải là lỗi người Việt hay mắc, không phải câu vô nghĩa.
- Trong file, đáp án đúng luôn ở vị trí 0. Giao diện tự đảo.
- 27 bài còn lại do Claude Code soạn nháp. Mỗi bài soạn xong ghi vào `docs/CONTENT_REVIEW.md` để chủ dự án duyệt trước khi ra mắt.

**Test xếp trình độ:** `content/placement.json`, 12 câu trắc nghiệm: 4 câu đọc hiểu comment và tin nhắn công việc, 4 câu chọn câu đúng, 4 câu chọn cách nói lịch sự và rõ hơn. Kết quả: 0 đến 5 đúng là "Cơ bản", 6 đến 9 là "Trung bình", 10 đến 12 là "Khá". Nhóm câu có ít câu đúng nhất là điểm yếu. Kết quả chỉ dùng để chọn track gợi ý (điểm yếu ở nhóm viết thì gợi ý track Viết) và hiển thị cho người dùng. Không gọi đây là trình độ CEFR.

## 7. AI sửa câu

`POST /api/correct`, cần đăng nhập. Body: `{ sentence: string, lessonKey?: string, mode?: "work" | "interview", question?: string }`. `mode` mặc định là `work`.

Kiểm theo thứ tự, sai thì trả lỗi tương ứng:

1. `sentence` từ 3 đến 700 ký tự sau khi trim (`interview`: tới 1200; phần 5 của bài track Phỏng vấn gửi ở mode `interview` với `question_en` của bài, nên có thêm "Một cách trả lời tốt hơn"). Nâng ngày 06/10/2026 để viết được tin hoàn chỉnh (mục 15).
2. Hạn mức, đếm từ bảng `corrections`: Premium dưới 30 lần hôm nay; đang dùng thử dưới 10 lần hôm nay; còn lại dưới 1 lần trong 7 ngày gần nhất. `mode: "interview"` chỉ cho Premium và dùng thử.
3. Tổng số lần gọi AI toàn hệ thống hôm nay dưới `AI_DAILY_CALL_CAP` (mặc định 1000, mỗi lần sửa tính 2 kể cả khi AI lỗi). Dùng thử và miễn phí dừng ở 80% mức này, 20% còn lại dành cho Premium. Vượt thì trả "Hôm nay hệ thống đã hết lượt, thử lại ngày mai" và báo admin (mục 17).
   Các bước 1 đến 3 chạy trong một giao dịch giữ chỗ (`reserve_ai_call`) trước khi gọi AI: mỗi người chỉ một request đang chạy (request thứ hai nhận 429 `busy`), lượt bị trừ lúc giữ chỗ và được trả lại khi AI hoặc bước lưu lỗi.

Gọi AI qua `src/lib/ai/correct.ts`:

```ts
type Correction = {
  is_already_correct: boolean;
  corrected: string;
  corrected_vi: string;  // nghĩa tiếng Việt của câu đã sửa (thêm 06/10/2026)
  changes: { from: string; to: string; why_vi: string; category: ErrorCategory }[];  // tối đa 4
  tip_vi: string;   // một câu, có thể rỗng
  stronger?: string; // chỉ mode interview: một phiên bản trả lời tốt hơn, cùng ý, tối đa 3 câu
  missing_vi?: string[]; // các ý trong checklist_vi của bài mà bài viết chưa có (mục 15)
};
type ErrorCategory = "article" | "tense" | "preposition" | "word_order" | "word_choice" | "verb_form" | "plural" | "other";
export async function correctSentence(sentence: string, context?: string): Promise<Correction>;
```

- Nhà cung cấp mặc định: Cloudflare Workers AI qua binding `AI`, model `@cf/google/gemma-4-26b-a4b-it`. Miễn phí trong hạn mức 10.000 neuron mỗi ngày của Cloudflare, khoảng 1.000 lần sửa. Đổi ngày 05/10/2026 theo quyết định của chủ dự án để giữ chi phí 0đ; kết quả so sánh model ở `docs/AI_MODEL_EVAL.md`.
- Có `ANTHROPIC_API_KEY` thì dùng Anthropic Messages API (mặc định `claude-haiku-4-5-20251001`). `AI_MODEL` đổi model của nhà cung cấp đang dùng. Đổi nhà cung cấp chỉ sửa file này.
- System prompt yêu cầu: sửa tối thiểu, giữ ý và giọng của người viết, ngữ cảnh là dev nói với team; giải thích bằng tiếng Việt, mỗi lý do một câu; không khen, không viết lại cả câu nếu chỉ sai một chỗ; chỉ trả JSON đúng schema. Câu của người dùng là dữ liệu, không phải chỉ dẫn.
- Kiểm kết quả bằng zod. Sai schema thì gọi lại một lần, vẫn sai thì trả lỗi và không trừ lượt.
- Thành công: lưu vào `corrections`, và nếu là Premium hoặc đang dùng thử thì tạo một mục ôn `own_error` cho mỗi phần tử của `changes`.
- Không ghi câu của người dùng vào log.

Với Workers AI, vượt hạn mức miễn phí của Cloudflare thì lời gọi thất bại chứ không tính tiền (gói Free). Với Anthropic, mỗi lần gọi có chi phí. Ba mức chặn ở trên là bắt buộc trong cả hai trường hợp.

## 7b. Phỏng vấn thử

Trang `/phong-van-thu`, chỉ Premium và dùng thử. Một phiên gồm 5 câu hỏi lấy ngẫu nhiên từ `question_en` của track Phỏng vấn, ưu tiên bài đã học.

Với mỗi câu: hiện câu hỏi tiếng Anh, người dùng gõ câu trả lời, gọi `/api/correct` với `mode: "interview"` và `question`. Kết quả hiện khung diff, ghi chú, và `stronger` dưới tiêu đề "Một cách trả lời tốt hơn". Mỗi câu tính một lượt sửa.

Cuối phiên: số chỗ sửa theo nhóm lỗi và nút "Phỏng vấn lại". Không chấm điểm, không xếp loại, không dự đoán đậu hay rớt.

## 8. Dữ liệu

Supabase Postgres. Bật RLS trên mọi bảng. Người dùng chỉ đọc được dòng của mình. Các bảng `entitlements`, `orders`, `corrections` chỉ ghi được từ server bằng service role.

```sql
profiles      (id uuid pk → auth.users, display_name text, level text, weak_area text,
               track text default 'standup', standup_time time default '09:00', interview_date date,
               telegram_chat_id bigint, telegram_link_token text unique, created_at timestamptz,
               reminded_on date, reported_on date,
               roles text[] default '{}')  -- ngành đã chọn: dev, qa, ba, pm (thêm 06/10/2026, mục 16)  -- ngày đã gửi tin nhắc, Chủ nhật đã gửi báo cáo tuần (thêm 05/10/2026)
entitlements  (user_id uuid pk → auth.users, premium_until timestamptz,
               trial_until timestamptz)         -- đặt bằng now() + 7 ngày khi tạo tài khoản
lesson_progress (user_id uuid, lesson_key text, score int, completed_at timestamptz,
               primary key (user_id, lesson_key))            -- lesson_key = 'standup-01'
review_items  (id uuid pk, user_id uuid, kind text check (kind in ('quiz','own_error')),
               lesson_key text, ref text, payload jsonb, box int default 1,
               due_at timestamptz, created_at timestamptz)
corrections   (id uuid pk, user_id uuid, lesson_key text, mode text, original text, result jsonb,
               model text, created_at timestamptz)
orders        (id uuid pk, user_id uuid, code text unique, plan text check (plan in ('30d','90d')),
               amount int, status text check (status in ('pending','paid','refunded','expired')),
               created_at timestamptz, paid_at timestamptz,
               order_number bigint unique,   -- orderCode gửi payOS (payOS chỉ nhận số)
               checkout_url text, qr_code text, -- link và chuỗi QR payOS trả về, để hiện lại khi tải lại trang
               bank_ref text, paid_by text)  -- mã giao dịch ngân hàng; 'payos' hoặc email admin đã xác nhận
events        (id bigserial pk, user_id uuid null, anon_id text, name text, props jsonb,
               created_at timestamptz)
```

Trigger tạo `profiles` và `entitlements` khi có người dùng mới. Migration nằm trong `supabase/migrations/`.

Premium khi `premium_until > now()`. Dùng thử khi không Premium và `trial_until > now()`. Mỗi tài khoản chỉ có một lần dùng thử. Xác nhận đơn: `premium_until = greatest(premium_until, now()) + 30 hoặc 90 ngày`.

## 9. Nhắc qua Telegram

- Trang `/tai-khoan` có nút "Liên kết Telegram" mở `https://t.me/<bot>?start=<telegram_link_token>`. Webhook nhận `/start <token>` và lưu `telegram_chat_id`.
- Worker cron riêng trong `cron/` chạy mỗi 15 phút, gọi `POST /api/cron/tick` kèm `CRON_SECRET`.
- Mỗi lần tick, từ thứ Hai đến thứ Sáu theo giờ `Asia/Ho_Chi_Minh`: tìm người dùng có `standup_time` nằm trong 30 đến 45 phút tới, chưa học bài hôm nay, chưa được nhắc hôm nay. Gửi một tin: tên bài và link `/hom-nay`.
- Mỗi người tối đa một tin nhắc mỗi ngày. Lệnh `/stop` hủy liên kết.
- **Sửa câu qua bot (thêm 06/10/2026):** chat đã liên kết gửi một đoạn tiếng Anh thì bot sửa như `POST /api/correct` với `mode: "work"`: cùng giới hạn độ dài, cùng hạn mức, cùng mức chặn toàn hệ thống, lưu `corrections` và mục ôn `own_error`. Bot trả lời bằng văn bản thường: câu đã sửa, nghĩa tiếng Việt, từng chỗ sửa kèm lý do, số lượt còn lại. Chat chưa liên kết gửi tin thường thì vẫn chuyển tới admin như trước; chat đã liên kết muốn liên hệ thì dùng `/hotro <nội dung>`.
- Chủ nhật 20:00: gửi báo cáo tuần cho người dùng Premium theo mục 5b.
- Mỗi tick chạy một truy vấn nhẹ vào Supabase, đủ để project không bị tạm dừng vì 7 ngày không hoạt động.

## 10. Sự kiện phễu

Ghi vào bảng `events` các tên sau, không thêm tên khác:

`page_view`, `lesson_start`, `lesson_complete`, `signup`, `placement_complete`, `correction_request`, `paywall_view`, `order_create`, `order_paid`, `review_complete`, `telegram_linked`, `mock_interview_complete`, `trial_end`.

`props` chứa `lesson_key`, `src` (tham số `?src=` của lần vào đầu), `plan` khi liên quan. Không ghi nội dung câu của người dùng.

Trang `/admin` hiện bảng phễu 7 và 30 ngày: khách → bắt đầu bài 1 → xong bài 1 → đăng ký → xong test → sửa câu lần đầu → tạo đơn → trả tiền. Thêm tỷ lệ quay lại ngày 1, ngày 7, ngày 30 theo ngày đăng ký.

## 11. Biến môi trường

```
PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY (không bắt buộc), AI_MODEL, AI_DAILY_CALL_CAP
TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME, TELEGRAM_WEBHOOK_SECRET
CRON_SECRET, ADMIN_EMAILS
PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY
PUBLIC_SITE_URL
```

File `.env.example` liệt kê đủ, không có giá trị thật. `.env` nằm trong `.gitignore`.

## 12. Milestone

Mỗi milestone kết thúc bằng: check, test, build đều qua; mô tả cách tự kiểm bằng tay; dừng chờ "OK".

| # | Làm gì | Xong khi |
| --- | --- | --- |
| M0 | Khởi tạo Astro + React + Tailwind + adapter Cloudflare. Trang "hello". `docs/SETUP.md` hướng dẫn deploy | Chủ dự án mở được link trên Cloudflare |
| M1 | Schema nội dung + zod. Trang chủ port từ `reference/landing.html`. Trình học bài phần 1 đến 4 cho 3 bài mẫu, lưu `localStorage`. Trang `/mau-cau/[slug]`, `/bang-gia` | Học hết bài 1 trên điện thoại không cần đăng nhập, dùng được phím tắt trên máy tính. Tắt JS vẫn đọc được mẫu câu và ví dụ. Giao diện sáng và tối qua `design-review`. Lighthouse mobile từ 90 ở cả bốn mục cho `/` |
| M2 | Supabase: migration, RLS, đăng nhập Google và GitHub. Chuyển tiến độ lên tài khoản. Test xếp trình độ. Trang `/hom-nay` có lịch luyện tập, `/tai-khoan` | Hai tài khoản thử không đọc được dữ liệu của nhau (có test RLS). Đăng nhập xong thấy tiến độ đã học lúc là khách |
| M3 | Ôn tập Leitner cho mục `quiz`. Trang `/on-tap`. Trang `/bug-hom-nay` (mục 4c) | Câu trả lời sai hôm nay xuất hiện trong phiên ôn khi chỉnh `due_at` về quá khứ. Có test cho luật lên mức, về mức 1 |
| M4 | `/api/correct` với hai mode, giao diện diff kết quả, các mức chặn, mục ôn `own_error`, trang `/so-loi` có phân tích lỗi, trang `/phong-van-thu` | Tài khoản hết dùng thử bị chặn ở lần sửa thứ 2 trong 7 ngày. Tài khoản dùng thử bị chặn ở lần thứ 11 trong ngày. Kết quả sai schema không làm hỏng trang và không trừ lượt. Có test cho từng mức chặn với AI giả lập |
| M5 | Khóa bài và tính năng Premium ở server. Bốn điểm mời nâng cấp dùng số liệu thật của người dùng. `/nang-cap`, tạo đơn, mã VietQR qua payOS, tự mở Premium khi nhận đúng tiền. `/admin` xác nhận và hoàn tiền | Đặt `trial_until` về quá khứ thì tài khoản mất quyền Premium ngay nhưng dữ liệu còn nguyên. Gọi thẳng API bài bị khóa trả 403. Xác nhận đơn xong tài khoản mở khóa ngay |
| M6 | Bot Telegram, liên kết, worker cron, tin nhắc, báo cáo tuần, đếm ngược phỏng vấn | Đặt giờ standup sau hiện tại 40 phút thì nhận đúng một tin. Gọi tay hàm báo cáo tuần thì tài khoản Premium có câu đã sửa nhận đúng một tin. `/stop` hoạt động |
| M8 | Mục 14: nghĩa tiếng Việt, tự sửa trước, bot sửa câu, bản đồ lỗi, mở rộng nội dung 30 bài | Sửa một câu sai thì thấy chỗ tô và nhóm lỗi trước, sửa khớp thì được báo đúng, rồi thấy diff và nghĩa tiếng Việt. Nhắn một câu cho bot đã liên kết thì nhận bản sửa và lỗi vào sổ lỗi. `/so-loi` có bản đồ 8 tuần. Học lại một bài thấy câu trắc nghiệm khác |
| M10 | Mục 16: chọn ngành | Chọn Dev và BA sau test xếp trình độ thì bài của ngày bỏ qua bài chỉ dành cho QA hoặc PM. Đổi ngành được ở `/tai-khoan`. Trang chủ lọc bài theo ngành khi tắt JavaScript |
| M9 | Mục 15: nâng cấp chất lượng bài học | Mỗi bài có tin nhắn hoàn chỉnh và danh sách "Bài viết nên có"; viết thiếu ý thì AI chỉ ra ý còn thiếu. Trắc nghiệm có câu chọn giọng điệu và câu đọc hiểu. 7 bài mới. Các lỗi nội dung trong `docs/research/content-audit.md` đã sửa |
| M7 | Sự kiện phễu và bảng trong `/admin`. Trang điều khoản, bảo mật. Sitemap, thẻ OG, favicon. Soạn 27 bài còn lại và `placement.json`. Chạy `docs/LAUNCH_CHECKLIST.md` | Mọi mục trong checklist ra mắt được đánh dấu, gồm cả việc chủ dự án đã duyệt nội dung |

## 13. Sau khi ra mắt

Đo 30 ngày bằng bảng phễu. Ngưỡng do chủ dự án và cố vấn đặt trước, không đổi sau khi thấy số:

| Con số | Ngưỡng tiếp tục | Ngưỡng dừng |
| --- | --- | --- |
| Người bắt đầu bài 1 học xong bài 1 | Từ 30% | Dưới 10% |
| Người xong bài 1 đăng ký tài khoản | Từ 10% | Dưới 3% |
| Người đăng ký quay lại ở ngày 7 | Từ 15% | Dưới 5% |
| Người dùng thử có ít nhất 5 câu được sửa trong 7 ngày | Từ 25% | Dưới 8% |
| Đơn đã trả trên 100 người đăng ký | Từ 3 | 0 sau 300 người đăng ký |

Chạm ngưỡng dừng ở dòng cuối thì ngừng thêm tính năng và xem lại lời chào, giá, đối tượng.

Dòng "5 câu được sửa trong 7 ngày" là dòng quan trọng nhất: người chưa tích lũy được sổ lỗi thì không có lý do gì để trả tiền.

## 14. Bản 1.1: học sâu hơn trong ngành phần mềm

Thêm ngày 06/10/2026 theo quyết định của chủ dự án, sau khi xem báo cáo mở rộng sang ngành khác. EPC chỉ phục vụ người làm phần mềm (dev, QA, BA, PM), không mở sang ngành khác.

- **Nghĩa tiếng Việt của câu đúng** ở mọi chỗ hiện đáp án: kết quả sửa câu (`corrected_vi`), lỗi hay gặp (`right_vi`), trắc nghiệm (`answer_vi`), Bug của ngày, phần ôn.
- **Tự sửa trước** ở ô "Sửa câu của tôi" (bài học phần 5 và `/hom-nay`). AI trả kết quả như cũ nhưng giao diện chưa hiện bản sửa: hiện câu gốc, tô các đoạn `from` tìm thấy trong câu, ghi số chỗ cần sửa và nhóm lỗi. Người dùng sửa ngay trong ô rồi bấm "Kiểm tra". Chấm theo từng chỗ trong `changes` (có đoạn `to`, không còn đoạn `from`; bỏ khác biệt chữ hoa thường, khoảng trắng, kiểu dấu nháy), hoặc khớp cả câu `corrected`. Đúng hết thì báo "Bạn đã sửa đúng"; chưa đủ thì báo "đã sửa đúng k trên n chỗ" và cho thử thêm một lần, rồi hiện đáp án kèm diff giữa bản của người dùng và bản sửa. Luôn có nút "Xem đáp án". Không gọi AI thêm, không tốn thêm lượt. Câu đã đúng thì hiện kết quả ngay. Phỏng vấn thử giữ cách hiện thẳng kết quả.
- **Bot sửa câu** qua Telegram (mục 9). Mọi trang có nút Telegram nổi ở góc phải dưới, trỏ tới `/telegram`: đã đăng nhập mà chưa liên kết thì mở bot kèm mã liên kết, còn lại mở chat với bot. Đây là một link, không phải popup.
- **Bản đồ lỗi** ở `/so-loi` (mục 5b).
- **Nội dung đa dạng hơn:** mỗi bài có 5 ví dụ, 3 lỗi hay gặp, 10 câu trắc nghiệm (mục 6). Trình học lấy ngẫu nhiên 3 ví dụ và 5 câu trắc nghiệm mỗi lượt, nên học lại không gặp y hệt lần trước. Điểm bài vẫn tính trên 5. Câu mới soạn ghi vào `docs/CONTENT_REVIEW.md` để chủ dự án duyệt.

## 15. Bản 1.2: bài học sát việc thật hơn

Thêm ngày 06/10/2026 theo yêu cầu của chủ dự án, sau khi đánh giá nội dung (báo cáo ở `docs/research/content-audit.md` và `docs/research/content-needs.md`). Kết luận: tiếng Anh trong bài đúng, nhưng mỗi bài chỉ dạy một khung câu ở mức A2 đến B1, trong khi làm việc với khách nước ngoài cần B1+ đến B2: tin nhiều câu có cấu trúc, lý do, giọng điệu phù hợp, và hiểu tin của người bản ngữ.

- **Tin nhắn hoàn chỉnh (`model`):** mỗi bài có một mẫu đầy đủ như ngoài đời. Ví dụ: cập nhật standup đủ ba phần; mô tả PR có What, Why, How to test; báo bug có Steps, Expected, Actual, Environment; câu trả lời phỏng vấn theo STAR khoảng 80 đến 150 từ.
- **Bài viết nên có (`checklist_vi`):** 3 đến 5 ý. Phần 5 yêu cầu viết đúng loại tin thật. AI nhận danh sách này cùng câu của người dùng (mọi mode có bài) và trả `missing_vi` là những ý còn thiếu; giao diện hiện "Còn thiếu" dưới kết quả. Ý thiếu không vào sổ lỗi.
- **Trắc nghiệm đa dạng hơn:** trong 10 câu của mỗi bài có khoảng 4 câu hình thức (ngữ pháp, cách viết), 3 câu chọn cách nói tự nhiên hoặc lịch sự hơn mà cả ba đáp án đều đúng ngữ pháp, 3 câu đọc hiểu ("Đồng nghiệp nhắn ... Ý họ là gì?") thay cho phần nghe chưa có. Một quy tắc ngữ pháp không lặp quá 2 lần trong một bài. Quy ước của team (ví dụ tiêu đề PR dùng động từ nguyên mẫu) được giải thích là quy ước, không gọi là sai ngữ pháp.
- **7 bài mới, Premium:** Standup 11 đến 13, Viết 11 đến 14 (mục 6).
- **Sửa nội dung:** các lỗi trong báo cáo audit (câu sai logic, câu hỏi có hai đáp án đúng, giải thích chưa chính xác, dịch "by Friday" thành "muộn nhất thứ Sáu").

## 16. Chọn ngành

Thêm ngày 06/10/2026 theo quyết định của chủ dự án. Không tách thành khóa riêng cho từng ngành, vì phần lớn bài (standup, Slack, báo tiến độ, phỏng vấn) dùng chung. Ngành chỉ dùng để đưa đúng bài lên trước.

- **Ngành:** Dev, QA (tester), BA, PM, mỗi ngành có một dòng giải thích cho người mới (ví dụ BA: phân tích nghiệp vụ, làm rõ yêu cầu với khách, viết user story). Chọn được nhiều ngành. Chọn ở bước cuối của test xếp trình độ (cùng form chọn track), đổi được ở `/tai-khoan`. Lưu ở `profiles.roles`, người dùng tự sửa được qua RLS.
- **Nhãn bài:** bài chuyên ngành có `roles` (ví dụ Commit message chỉ Dev; Acceptance criteria cho BA và QA). Bài không có `roles` là bài chung.
- **Bài của ngày:** trong track đang học, bài chưa xong hợp ngành (bài chung hoặc có ngành của người dùng) đi trước, theo `id`; bài không hợp ngành để cuối, vẫn mở học được. Chưa chọn ngành thì như cũ.
- **Hiển thị:** `/hom-nay` ghi nhãn ngành cạnh bài chuyên ngành. Trang chủ có nút lọc Tất cả, Dev, QA, BA, PM, chạy bằng CSS nên vẫn dùng được khi tắt JavaScript.
- **AI sửa câu** nhận ngành của người viết để giải thích đúng ngữ cảnh (ví dụ BA viết user story).

## 17. Vận hành an toàn trước khi bán (07/10/2026)

- **Cảnh báo:** app gửi tin văn bản thường qua bot Telegram tới chat của các admin (ADMIN_EMAILS) đã liên kết khi: webhook payOS hoặc Telegram lỗi 500; khách chuyển thiếu tiền (chỉ mã đơn và số tiền); chạm `AI_DAILY_CALL_CAP` (tối đa một tin mỗi ngày giờ Việt Nam cho mỗi isolate). Worker cron báo thẳng qua Bot API khi tick lỗi hoặc không gọi được app, dùng secret `TELEGRAM_BOT_TOKEN` và `ADMIN_CHAT_IDS` của worker cron. Tin cảnh báo không chứa email, câu của người dùng hay token.
- **Sao lưu:** GitHub Actions (`db-backup.yml`) dump schema và dữ liệu mỗi ngày, mã hóa AES-256 (pbkdf2) bằng `BACKUP_PASSPHRASE`, giữ 30 ngày dưới dạng artifact. Chạy tay trước mỗi lần release. Bản mới lỗi thì `wrangler rollback`, không quay lại DB; nếu các migration từ bản đích có `drop` thì sửa và deploy lại thay vì rollback (xem SETUP.md).
- **Bảng events:** client không ghi trực tiếp (anon không có INSERT). Sự kiện trình duyệt chỉ qua `POST /api/events`: zod, body tối đa 1 KB, 60 lần mỗi phút theo IP (binding `EVENTS_LIMIT`), ghi bằng service role. DB giới hạn `props` 1 KB và `anon_id` 64 ký tự. Riêng `placement_complete` còn được ghi bằng session của chính người dùng.
- **Hoàn tiền:** chỉ trừ đúng số ngày của gói trong đơn bị hoàn (30 hoặc 90), không sớm hơn thời điểm hiện tại; ngày từ các đơn khác giữ nguyên.
- **/admin:** lấy đơn kèm email và tên người mua bằng một lần gọi `admin_list_orders` (chỉ service role).
