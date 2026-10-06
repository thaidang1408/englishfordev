---
name: lesson
description: Soạn hoặc sửa một bài học tiếng Anh cho dev trong content/lessons theo đúng schema và chuẩn chất lượng của EPC. Dùng khi tạo bài mới, sửa bài, hoặc soạn placement.json.
argument-hint: "[lesson_key, ví dụ standup-04]"
---

# Soạn bài $ARGUMENTS

1. Đọc mục 6 của `docs/SPEC.md` để lấy schema, danh sách tên bài và quy tắc.
2. Đọc cả ba file mẫu `content/lessons/standup-01.json` đến `standup-03.json`. Bài mới phải cùng độ dài, cùng giọng, cùng mức khó.
3. Viết file `content/lessons/<lesson_key>.json`.
4. Chạy kiểm schema (`npm run check` hoặc script kiểm nội dung của dự án).
5. Thêm một dòng vào `docs/CONTENT_REVIEW.md`: `- [ ] <lesson_key> — <title>` để chủ dự án duyệt.

## Chuẩn chất lượng

- **Tiếng Anh phải đúng và tự nhiên.** Mỗi câu là câu một dev thật sẽ nói trong standup, Slack hoặc PR. Không câu kiểu sách giáo khoa. Không chắc một câu có tự nhiên không thì chọn câu đơn giản hơn.
- **Một bài một mẫu câu.** Không nhồi hai điểm ngữ pháp.
- **Ví dụ:** đúng 5 câu, mỗi câu một ngữ cảnh công việc khác nhau (bug, tính năng, review, deploy, họp, khách hàng, incident). Trình học hiện 3 câu ngẫu nhiên, nên câu nào cũng phải tự đứng được.
- **Lỗi hay gặp:** đúng 3 lỗi, mỗi lỗi một kiểu khác nhau, mà người Việt thật sự mắc do dịch từng chữ: thiếu mạo từ, sai thì, sai giới từ, đặt từ bổ nghĩa sau danh từ. `why_vi` một câu, nói quy tắc, không dùng thuật ngữ ngữ pháp nặng. `right_vi` là nghĩa tiếng Việt tự nhiên của câu đúng.
- **Trắc nghiệm:** đúng 10 câu, mỗi câu 3 đáp án; mỗi lượt học lấy ngẫu nhiên 5. Không có hai câu hỏi gần giống nhau, đổi ngữ cảnh và đổi kiểu lỗi giữa các câu. `answer_vi` là nghĩa tiếng Việt của đáp án đúng; câu có `prompt_vi` là câu tiếng Việt thì `answer_vi` có thể gần giống `prompt_vi`. Đáp án đúng luôn ở vị trí 0. Hai đáp án sai phải là lỗi có thật, mỗi đáp án sai một kiểu lỗi khác nhau, và chỉ có một đáp án đúng không thể tranh cãi.
- **`prompt_vi`:** là câu tiếng Việt cần nói bằng tiếng Anh, hoặc "Chọn câu đúng." Không quá 15 từ.
- **`id` câu hỏi:** chữ cái đầu của track + số bài 2 chữ số + `q` + số thứ tự. Ví dụ `s04q1`, `w02q3`, `i05q2`.
- **`free`:** chỉ `standup-01` đến `standup-03` là `true`.
- **Track interview:** có `question_en` là câu nhà tuyển dụng thật sẽ hỏi. Mẫu câu là khung trả lời. Ba ví dụ là ba câu trả lời ngắn của ba người khác nhau, để người học không chép nguyên văn. Không dạy nói quá về bản thân.
- Tiếng Việt xưng "mình" trong câu ví dụ, "bạn" trong lời hướng dẫn.

Soạn xong tự đọc lại từng đáp án đúng một lần nữa như một người bản ngữ làm trong ngành phần mềm. Câu nào còn ngờ thì viết lại.
