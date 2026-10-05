# EPC — Hệ thống giao diện

Cập nhật: 05/10/2026. Tài liệu này mô tả toàn bộ giao diện đang chạy của EPC.

Nguồn sự thật trong code: `src/styles/tokens.css` (token), `src/styles/global.css` và `src/styles/app.css` (component), `src/components/Icon.astro` (icon), skill `design-system` và `ui-vi` (luật). Khi lệch nhau thì code và skill đúng, sửa tài liệu này.

## 1. Mẫu tham khảo

| | |
| --- | --- |
| Mẫu | Ruang Edit — Modern Design Learning Platform |
| Link | https://dribbble.com/shots/27505632-Ruang-Edit-Modern-Design-Learning-Platform |
| Tác giả | Ankur Maan, trên Dribbble |
| Chủ dự án chọn | 05/10/2026 |

**Lấy từ mẫu:**
- nền trắng ngả lavender;
- tiêu đề rất đậm, một từ tô tím kèm ô sparkle vàng;
- nhãn bo tròn trên tiêu đề;
- nút bo tròn có mũi tên;
- ô icon nền tím hoặc vàng;
- thẻ trắng bo 20px, đánh số 01 đến 04, ảnh minh họa trong khung màu nhạt;
- link chữ kèm vòng tròn mũi tên ("Xem bài 1 của track");
- dải kêu gọi cuối mục;
- hình tròn lavender sau hero, thẻ nổi đè lên;
- sparkle, vòng tròn và chấm trang trí.

**Không lấy:**

| Trong mẫu | Lý do |
| --- | --- |
| Ảnh người thật, avatar học viên | Không có ảnh của chính mình; skill `design-system` cấm ảnh minh họa người |
| "2K+ Members Joined", "+32" | EPC chưa có người dùng; skill `ui-vi` cấm số liệu giả |
| Font Latin không có dấu tiếng Việt | Giữ Be Vietnam Pro, đủ dấu và gần cùng dáng hình học |

Phần minh họa trong thẻ dùng chính giao diện của EPC: công thức mẫu câu, phím `1 2 3 Enter`, khung diff, các mốc ôn 1-3-7-14. Ảnh minh họa của mẫu không được dùng.

## 1b. Đối thủ và cách EPC khác họ

Khảo sát ngày 06/10/2026, trang chủ của bảy bên.

| Bên | Trang chủ của họ |
| --- | --- |
| ELSA Speak, Prep, NativeX | Nền xanh dương đậm, banner ưu đãi, mascot, popup cookie che nửa màn hình, "91% học viên 5 sao", logo báo chí, nút chat Zalo hoặc Messenger nổi |
| CodeGym, Global Link (khóa tiếng Anh IT) | Ảnh stock người cười trước màn hình, tiêu đề viết hoa "BỨT PHÁ", giá gạch ngang "chỉ còn", form đăng ký tư vấn, bài dài kiểu SEO |
| e-lish.io (gần EPC nhất) | Phong cách dev: nhãn chữ mono, thẻ trắc nghiệm từ vựng ở hero, đồ thị đường quên, lịch học, bảng xếp hạng. Chỉ dạy từ vựng |

EPC chọn khác ở bốn chỗ:

1. **Người xem tự review ở hero.** Không phải ảnh, không phải trắc nghiệm từ: bấm vào chữ sai trong một câu thật, rồi thấy bản sửa và lời giải thích. Đúng thứ sản phẩm làm.
2. **Cho xem trước sổ lỗi.** Giao diện thật của `/so-loi` với dữ liệu mẫu ghi rõ "Dữ liệu mẫu". Đây là thứ đối thủ không có và là lý do trả tiền.
3. **So sánh trung thực.** Bảng EPC với khóa học theo lớp và app học từ vựng, không nêu tên ai, có cả dòng EPC thua ("Luyện nói: chưa có").
4. **Nói thật thay cho quảng cáo.** Mục "Những điều EPC không làm": không quảng cáo, không popup, không tự gia hạn, không bán dữ liệu, không xóa gì khi hết dùng thử. Không số người dùng, không sao đánh giá, không giá gạch ngang.

## 2. Ý tưởng xuyên suốt

**Câu tiếng Anh của người dùng được review như một pull request.** Bốn chi tiết đặc trưng giữ nguyên qua mọi lần đổi giao diện:

1. **Khung review:** dòng gốc đỏ có dấu trừ, dòng sửa xanh có dấu cộng, chỗ đổi tô đậm bằng `mark`, comment của Coach bên dưới.
2. **Phím tắt:** `1` `2` `3` và `Enter` trong trắc nghiệm, `Ctrl`/`Cmd` + `Enter` trong ô sửa câu.
3. **Lịch luyện tập 16 tuần** ở `/hom-nay`, thay cho streak, XP, huy hiệu.
4. **Màu tím "merged"** cho hành động chính. Mỗi màn hình một nút tím.

## 3. Màu

Giao diện theo cài đặt hệ thống, có nút đổi. Lựa chọn lưu ở `epc:theme` trong `localStorage`, gắn `data-theme` lên `<html>` bằng script trong `<head>` nên không nháy màu khi tải.

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `--bg` | `#f8f7fd` | `#0f0d18` | Nền trang |
| `--bg-soft` | `#efecfb` | `#1a1630` | Hình tròn sau hero, dải kêu gọi |
| `--panel` | `#ffffff` | `#18152a` | Thẻ, khung review, ô nhập, chân trang |
| `--panel-2` | `#f4f2fb` | `#211d36` | Đầu khung review, nền phụ |
| `--line` | `#e4e0f2` | `#2f2a48` | Viền, đường kẻ |
| `--text` | `#17151f` | `#ecebf3` | Chữ chính |
| `--muted` | `#5b5870` | `#a7a3bd` | Chữ phụ |
| `--accent` | `#5b3fd6` | `#6c54f0` | Nút chính, gạch chân menu đang chọn |
| `--accent-text` | `#4a2fc4` | `#b3a6ff` | Chữ tím, link, từ được tô trong tiêu đề |
| `--accent-tint` | `#ece7ff` | `#2a2350` | Nhãn bo tròn, ô icon tím, khung minh họa |
| `--amber` | `#f6b33b` | `#f6b33b` | Ô sparkle, mốc 14 ngày, viền gói nổi bật |
| `--amber-tint` / `--amber-text` | `#fff2d9` / `#8a5300` | `#3a2c12` / `#ffd48a` | Ô icon vàng, nhãn vàng |
| `--del-*`, `--add-*` | đỏ và xanh nhạt | đỏ và xanh tối | Chỉ cho sai và đúng |
| `--warn-*` | vàng nhạt | vàng tối | Cảnh báo, đơn đang chờ |
| `--heat-0` … `--heat-4` | xám đến tím đậm | tối đến tím sáng | Lịch luyện tập |

Vàng là màu phụ, không dùng cho nút chính. Đỏ và xanh chỉ mang nghĩa sai và đúng.

## 4. Chữ

- **Be Vietnam Pro** 400, 500, 600, 800 cho mọi chữ giao diện. Tiêu đề hero nặng 800, khoảng cách chữ `-.035em`, dòng `1.05`.
- **JetBrains Mono** chỉ cho: câu tiếng Anh trong diff và đáp án, `kbd`, số thứ tự (01, 02), mã chuyển khoản, số trong bảng admin.
- Cỡ chữ: `--fs-xs` 13px, `--fs-sm` 15, `--fs-md` 17, `--fs-lg` 21, `--fs-xl` 26, `--fs-2xl` 34, `--fs-hero` 38 đến 68px theo màn hình. Tiêu đề mục ở trang chủ từ 28 đến 44px.
- Dòng đọc tối đa 680px. Đoạn văn căn trái; chỉ đầu mục ở trang chủ được căn giữa.

## 5. Khoảng cách, bố cục, bo góc, bóng

- Khoảng cách: 4, 8, 12, 16, 24, 36, 56, 72px (`--s-1` đến `--s-8`).
- Trang công khai rộng tối đa 1160px. Trang trong app một cột, tối đa 720px.
- Bo góc: `--r-sm` 8px, `--r-md` 12px, `--r-lg` 20px (thẻ), `--r-xl` 28px (dải kêu gọi), `--r-pill` cho nút và nhãn. Ô icon bo 14px.
- Bóng: `--shadow-card` cho thẻ; `--shadow` cho khung review ở hero.
- Mobile trước. Kiểm ở 375px và 1280px, không cuộn ngang.

## 6. Điều hướng

Người dùng đi tới mọi trang bằng nút, không phải gõ đường dẫn.

| Vị trí | Trang công khai | Trang trong app |
| --- | --- | --- |
| Thanh trên | Trang chủ, Bài học (`/#bai-hoc`), Bug của ngày, Bảng giá | Hôm nay, Ôn tập, Sổ lỗi, Phỏng vấn thử, Tài khoản; thêm Admin nếu email nằm trong `ADMIN_EMAILS` |
| Nút bên phải | "Vào học" → `/hom-nay` (chưa đăng nhập thì chuyển tới trang đăng nhập) | "Nâng cấp" → `/nang-cap` |
| Chân trang, ba cột | Học: Học thử bài 1, Ba track 30 bài, Bug của ngày, Bài hôm nay, Ôn tập. Tài khoản: Sổ lỗi, Phỏng vấn thử, Test xếp trình độ, Tài khoản và Telegram, Nâng cấp. Thông tin: Bảng giá, Điều khoản, Bảo mật | Như cột bên trái |

- Thanh trên dính ở đầu trang. Trang đang mở có chữ tím đậm và gạch chân tím; bài học và mẫu câu tính là mục "Bài học".
- Màn hẹp hơn 900px: link gom vào nút "Menu" (`details`/`summary`, chạy khi tắt JavaScript), nút "Giao diện" rút còn "Sáng"/"Tối".
- Màn hẹp hơn 480px: tên rút còn "EPC".
- Trong trang: bài học có "Học bài tiếp theo"; mẫu câu có nút sang bài học; trang chủ có link tới từng bài trong ba track, test xếp trình độ, từng gói giá.

## 7. Component

| Nhóm | Class | Luật dùng |
| --- | --- | --- |
| Khung trang | `.topbar`, `.bar`, `.brand`, `.logo`, `.nav`, `.bar-end`, `.menu`, `.site-foot`, `.foot-grid` | Logo là ô tím với hai vạch đỏ và xanh, gợi diff |
| Nút | `.btn`, `.btn-primary`, `.btn-quiet`, `.btn-sm`, `.btn-link`, `.go` | Một `.btn-primary` mỗi màn hình. Nút dẫn sang trang khác có mũi tên. `.go` là link chữ kèm vòng tròn mũi tên, thêm `.amber` cho thẻ vàng |
| Nhãn và icon | `.pill`, `.pill-plain`, `.pill.amber`, `.tile`, `.tile.amber`, `.spark`, `.hl` | Nhãn bo tròn đặt trên tiêu đề mục; `.hl` tô một cụm từ trong tiêu đề |
| Trang chủ | `.hero`, `.hero-art`, `.blob`, `.float`, `.deco`, `.feats`, `.sec-head`, `.cards2/3/4`, `.card`, `.card-art`, `.tile-float`, `.track-card`, `.cta-band`, `.plan-card`, `.faq-cards` | Trang trí chỉ ở hero, luôn `aria-hidden` |
| Khung review | `.review`, `.review-head`, `.diff`, `.diff-line`, `.del`, `.add`, `.comment`, `.avatar` | Cho lỗi hay gặp, kết quả sửa câu, ôn lỗi |
| Trắc nghiệm | `.quiz`, `.steps`, `.prompt`, `.opt`, `.why` | Một câu mỗi lần |
| Bài học | `.part`, `.part-label`, `.formula`, `.examples`, `.chips`, `.lessons`, `.lrow` | Năm phần có nhãn "Phần N trên 5" |
| Sửa câu, sổ lỗi | `.correct-box`, `.changes`, `.stronger`, `.stats`, `.cat-top`, `.trend` | |
| Hôm nay | `.today-card`, `.heat`, `.countdown` | |
| Nâng cấp | `.paywall`, `.plan`, `.checkout`, `.qr-box` | Chỉ ở bốn điểm mời nâng cấp của SPEC mục 2 |
| Thông báo, bảng | `.note`, `.tag`, `.compare`, `.orders`, `.legal` | |

Icon (`<Icon name="…" />`): arrow, sparkle, pen, repeat, bell, book, keyboard, diff, calendar, chat, mic, check, x, compass, menu, lock. Nét 1.8px, màu theo chữ, luôn đi kèm chữ.

## 8. Trang chủ

1. **Hero:** nhãn, tiêu đề "Câu của bạn, được **review** ✦ như một pull request.", nút "Học thử bài 1, miễn phí", ba ô tính năng. Bên phải: khung review cho người xem tự bấm chữ sai (mục 9), hai thẻ nổi.
2. **Dải chữ lỗi hay gặp.**
3. **Cách học:** câu chuyện bốn bước theo cuộn, dải kêu gọi làm test xếp trình độ.
4. **Sổ lỗi:** xem trước `/so-loi` với dữ liệu mẫu.
5. **Bài học** (`#bai-hoc`): ba thẻ track.
6. **So sánh:** bảng EPC, khóa học theo lớp, app học từ vựng.
7. **Dành cho ai.**
8. **Giá:** hai thẻ gói.
9. **Những điều EPC không làm.**
10. **Hỏi đáp.**

## 8b. Trang bên trong

Mọi trang ngoài trang chủ dùng chung một khung, để sau khi đăng nhập giao diện vẫn cùng phong cách với trang chủ.

- **Đầu trang (`PageHead.astro`):** dải nền lavender có lưới chấm mờ, nhãn bo tròn có icon, tiêu đề lớn với một cụm từ tô tím, đoạn dẫn, chữ viền lớn mờ ở góc phải (`echo`, ẩn trên điện thoại và khi có số liệu bên phải). Chỗ `aside` bên phải cho số liệu, ví dụ ba ô số ở `/hom-nay`.
- **Thân trang:** `.page` (rộng 1160px) cho bảng điều khiển, `.page.narrow` (760px) cho trang làm một việc: ôn tập, sổ lỗi, phỏng vấn thử, nâng cấp, test xếp trình độ, bài học, pháp lý.
- **Thẻ nội dung (`.panel`):** đầu thẻ gồm ô icon, tiêu đề, và link `.go` bên phải. `.panel.tint` (tím nhạt) cho việc cần làm ngay, `.panel.amber` cho thông tin phụ.

| Trang | Bố cục |
| --- | --- |
| `/hom-nay` | Đầu trang chào theo tên, ngày, gói đang dùng, ba ô số liệu. Người mới thấy thẻ "Bắt đầu trong 3 bước" (học một bài, nhờ AI sửa một câu, bật Telegram), đánh dấu theo dữ liệu thật, tự ẩn khi làm đủ. Lưới hai cột: trái là thẻ bài hôm nay (tiêu đề lớn, mục tiêu, nút "Học bài hôm nay", ô công thức có số bài) và thẻ sửa câu; phải là thẻ "Cần ôn hôm nay" (số lớn, nút ôn, mốc 1-3-7-14), lời mời nâng cấp, thẻ sổ lỗi. Dưới: lịch luyện tập 16 tuần, tiến độ track có thanh phần trăm và danh sách 10 bài hai cột |
| `/on-tap` | Đầu trang có mốc 1-3-7-14; phiên ôn trong thẻ |
| `/so-loi` | Ba ô số, mỗi mục (nhóm lỗi có thanh độ dài, xu hướng tuần, các câu đã sửa) là một thẻ |
| `/phong-van-thu`, `/nang-cap`, `/xep-trinh-do` | Một cột 760px, nội dung trong thẻ; kết quả xếp trình độ là thẻ tím nhạt |
| `/tai-khoan` | Lưới hai cột bốn thẻ: gói đang dùng, nhắc qua Telegram, lịch học, đăng xuất |
| `/dang-nhap` | Một thẻ giữa màn hình trên nền lavender: logo, hai nút có logo Google và GitHub, một dòng diff minh họa |
| `/hoc/[slug]`, `/mau-cau/[slug]` | Đầu trang có số bài làm chữ nền và ba nhãn (10 phút, 5 phần, 5 câu trắc nghiệm); mỗi phần của bài là một thẻ có nhãn "Phần N trên 5" |
| `/bang-gia`, `/bug-hom-nay`, `/dieu-khoan`, `/bao-mat`, 404, `/admin` | Cùng đầu trang; nội dung trong thẻ |

Design review các trang cần đăng nhập: `node .design-shots/mock-supabase.mjs` (Supabase giả có dữ liệu mẫu), build với `PUBLIC_SUPABASE_URL=http://localhost:54399`, rồi `node .design-shots/app-shots.mjs <url> <các trang>`. Chỉ dùng trên máy.

## 9. Chuyển động

Tham khảo thêm: landing page game OÁN (https://oanhorror.vercel.app), chủ dự án chọn ngày 05/10/2026. Lấy cách kể chuyện theo cảnh khi cuộn và chữ lớn có bóng viền phía sau. Không lấy: phong cách kinh dị, video nền, âm thanh, hạt bay, họa tiết máu. Mỗi hiệu ứng được chuyển sang ngôn ngữ của dev để EPC khác các trang học tiếng Anh dùng ảnh tĩnh:

| Hiệu ứng | Chỗ | Cách chạy |
| --- | --- | --- |
| Màn demo review | Hero | Gõ câu sai từng chữ có con trỏ, rồi mời "Bấm vào chữ bạn thấy sai" (chữ sai tô đỏ gạch lượn, chữ bấm nhầm bị gạch). Tìm đủ, bấm nhầm 3 lần, hoặc 5,5 giây không ai bấm thì hiện câu đúng và lời Coach. Không ai bấm thì tự sang ví dụ kế; đã bấm thì chờ nút "Câu khác". Năm ví dụ, bốn lấy từ bài học thật |
| Dải chữ lỗi hay gặp | Ngay dưới hero | Hai dải 16 lỗi chạy ngược chiều, 70 và 80 giây một vòng, mờ hai mép. Dừng khi trỏ chuột hoặc focus, nút "Dừng chạy chữ" |
| Câu chuyện theo cuộn | Mục "Một buổi sáng 10 phút" | Từ 1000px: bên trái bốn bước cao 62vh, bước ở giữa màn hình sáng lên; bên phải khung kiểu cửa sổ editor đứng yên, đổi màn hình: mẫu câu, trắc nghiệm có phím 2 được bấm, khung diff, lịch ôn 12 tuần bật từng ô |
| Chữ nền lớn | Sau tiêu đề mỗi mục | "10 PHÚT", "30 BÀI", "CHO DEV", "GIÁ", "HỎI ĐÁP", chữ viền màu `--line`, trôi tối đa 80px theo cuộn |
| Hiện dần | Đầu mục, thẻ, dải kêu gọi | Mờ và lệch 28px, hiện trong 0.7s khi vào màn hình, lệch nhịp 90ms trong một hàng |
| Vệt sáng và nổi | Thẻ, thẻ nổi ở hero | Vệt tím 9% theo con trỏ; thẻ nhấc 4px khi trỏ; thẻ nổi ở hero bồng bềnh 8px; sparkle nhấp nháy |

- Mọi chuyển động chỉ chạy khi JS đã chạy và người dùng không bật giảm chuyển động (class `motion` trên `<html>`). Không có JS: nội dung hiện đủ và đứng yên; dải chữ xuống dòng thành danh sách; câu chuyện là bốn thẻ.
- Chỉ dùng `transform`, `opacity`, CSS và JS viết tay, không thư viện. Demo hero chỉ chạy khi đang trên màn hình.
- Trong app: chỉ chuyển động trả lời hành động, dưới 300ms.

## 10. Truy cập

- Tương phản chữ đạt WCAG AA ở cả hai giao diện. Mọi thao tác làm được bằng bàn phím, có viền focus.
- Nội dung tự chạy quá 5 giây có nút dừng.
- Trang công khai đọc được khi tắt JavaScript, kể cả menu trên điện thoại.
