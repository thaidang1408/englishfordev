# Nội dung chờ duyệt

Nội dung do Claude Code soạn nháp. Chủ dự án đọc và đánh dấu `[x]` khi đã duyệt. Phải duyệt hết trước khi ra mắt (M7).

Cách duyệt nhanh: chạy `npm run dev`, mở `/mau-cau/<slug>` để đọc mẫu câu, ví dụ, lỗi hay gặp; mở `/hoc/<slug>` (đã đăng nhập, đang dùng thử) để làm trắc nghiệm. Sửa thẳng file JSON trong `content/lessons/`, rồi chạy `npm run test` để kiểm schema.

Dòng "Cần xem" là câu người soạn còn phân vân. Đọc kỹ những chỗ đó trước.

## Test xếp trình độ

- [ ] placement — Test xếp trình độ, 12 câu (`content/placement.json`). Soạn sớm ở M2 vì trang `/xep-trinh-do` cần nội dung để chạy.

## Track Standup và họp

Bài 1 đến 3 là bài mẫu chủ dự án đưa vào từ đầu.

- [ ] standup-04 — Việc xong, việc còn dở (`viec-xong-viec-con-do`). Cần xem: s04q2 có đáp án sai "The UI is still doing." là câu dịch từng chữ, hơi lạ hơn là lỗi ngữ pháp rõ.
- [ ] standup-05 — Ước lượng bao lâu thì xong (`uoc-luong-bao-lau-thi-xong`). Cần xem: s05q3 đáp án sai "I need two days again." (dịch chữ "nữa").
- [ ] standup-06 — Hỏi lại khi chưa hiểu (`hoi-lai-khi-chua-hieu`).
- [ ] standup-07 — Xin người khác giúp (`xin-nguoi-khac-giup`).
- [ ] standup-08 — Báo trễ và đề xuất mốc mới (`bao-tre-va-de-xuat-moc-moi`). Cần xem: điểm "by" và "until" lặp lại với bài 5 (s08q3), cố ý để ôn lại.
- [ ] standup-09 — Không đồng ý một cách lịch sự (`khong-dong-y-mot-cach-lich-su`). Cần xem: lỗi hay gặp và s09q4 là lỗi giọng điệu ("You are wrong."), không phải lỗi ngữ pháp.
- [ ] standup-10 — Tóm tắt một buổi họp (`tom-tat-mot-buoi-hop`). Cần xem: s10q4 dùng "in Slack"; "on Slack" cũng phổ biến, hai đáp án sai vẫn sai rõ.

## Track Viết cho team

- [ ] writing-01 — Tiêu đề và mô tả pull request (`tieu-de-va-mo-ta-pull-request`). Cần xem: tiêu đề ví dụ có "the" ("for the email field"); tiêu đề thật hay bỏ mạo từ.
- [ ] writing-02 — Commit message (`commit-message`). Cần xem: commit thì quá khứ ("Fixed login bug") bị tính là sai theo quy ước git, không sai ngữ pháp; w02q5 "to the version 18" bị tính sai vì mạo từ.
- [ ] writing-03 — Comment khi review code (`comment-khi-review-code`).
- [ ] writing-04 — Trả lời comment review (`tra-loi-comment-review`).
- [ ] writing-05 — Báo một bug (`bao-mot-bug`).
- [ ] writing-06 — Hỏi trên Slack ngắn mà đủ ý (`hoi-tren-slack-ngan-ma-du-y`). Cần xem: w06q5 đáp án sai chỉ thiếu "the", lỗi nhẹ.
- [ ] writing-07 — Báo tiến độ cho khách (`bao-tien-do-cho-khach`).
- [ ] writing-08 — Email xin nghỉ, xin dời lịch (`email-xin-nghi-xin-doi-lich`).
- [ ] writing-09 — Viết ghi chú bàn giao (`viet-ghi-chu-ban-giao`).
- [ ] writing-10 — Từ chối hoặc xin thêm thời gian (`tu-choi-hoac-xin-them-thoi-gian`). Cần xem: công thức có hai phần (từ chối và xin thêm thời gian) vì tên bài gồm cả hai.

## Track Phỏng vấn (Premium)

- [ ] interview-01 — Giới thiệu bản thân (`gioi-thieu-ban-than`). Cần xem: ví dụ 3 nhắc tên công cụ thật (Playwright).
- [ ] interview-02 — Kể về dự án gần nhất (`ke-ve-du-an-gan-nhat`). Cần xem: i02q2 dùng "nearest" làm đáp án sai cho "gần nhất" về thời gian.
- [ ] interview-03 — Vai trò và đóng góp của bạn (`vai-tro-va-dong-gop`).
- [ ] interview-04 — Một bug khó bạn đã xử lý (`phong-van-bug-kho-da-xu-ly`). Cần xem: ví dụ 2 nhắc tên thư viện thật (Glide).
- [ ] interview-05 — Điểm mạnh và điểm cần cải thiện (`diem-manh-va-diem-can-cai-thien`).
- [ ] interview-06 — Vì sao muốn đổi việc (`vi-sao-muon-doi-viec`). Cần xem: i06q3 đúng nhưng hơi cứng.
- [ ] interview-07 — Bất đồng trong team và cách xử lý (`phong-van-bat-dong-trong-team`). Cần xem: lỗi "Me and my teammate disagreed" người bản ngữ vẫn nói khi nói chuyện thường, chỉ sai trong phỏng vấn.
- [ ] interview-08 — Trả lời khi không biết câu trả lời (`phong-van-khi-khong-biet-cau-tra-loi`). Cần xem: i08q1 đáp án sai "Kafka ago" có thể quá dễ.
- [ ] interview-09 — Hỏi lại nhà tuyển dụng (`hoi-lai-nha-tuyen-dung`).
- [ ] interview-10 — Nói về lương và ngày bắt đầu (`phong-van-luong-va-ngay-bat-dau`). Cần xem: i10q3 đáp án sai "inform before 30 days", why_vi giải thích ngắn.

## Trang điều khoản và bảo mật

- [ ] `/dieu-khoan` — Cần xem: cam kết "báo trước 30 ngày và hoàn tiền phần chưa dùng nếu EPC ngừng hoạt động", và việc khóa tài khoản vi phạm (làm tay trong Supabase).
- [ ] `/bao-mat` — Cần xem: cam kết xóa dữ liệu "trong vòng 7 ngày", và danh sách bên xử lý dữ liệu.

## Mở rộng nội dung M8 (06/10/2026)

Cả 30 bài được thêm: 2 ví dụ (đủ 5), lỗi thứ 3 cho bài còn thiếu, 5 câu trắc nghiệm mới (q6 đến q10), nghĩa tiếng Việt `right_vi` cho mọi lỗi hay gặp và `answer_vi` cho mọi câu trắc nghiệm. Không sửa câu cũ.

- [ ] Track Standup: 20 ví dụ mới, 50 câu trắc nghiệm mới. Cần xem: s06q9 (lỗi trật tự từ "make clear this requirement"), s09q7 ("so big" và "too big"), s08q10 (đáp án dạng bị động "will be delayed").
- [ ] Track Viết: 20 ví dụ mới, 50 câu trắc nghiệm mới, thêm lỗi thứ 3 cho writing-06. Cần xem: w03q6 (giới từ sau "move"), ví dụ 4 của w08 ("push the client call back by an hour" hơi khó), `right_vi` của w01 và w02 không có dấu chấm vì câu gốc là tiêu đề và commit.
- [ ] Track Phỏng vấn: 20 ví dụ mới, 50 câu trắc nghiệm mới, q6 mỗi bài là câu chọn giọng điệu ("Chọn câu trả lời phù hợp hơn."). Cần xem: i09q6 (đáp án sai vì thiếu tìm hiểu, không vì ngữ pháp), i10q7 (chỉ sai trật tự từ), i02q9.

## Nâng cấp chất lượng M9 (06/10/2026)

Cả 30 bài cũ được nâng theo SPEC mục 15: thêm tin hoàn chỉnh (`model`), danh sách "Bài viết nên có" (`checklist_vi`), đề viết theo tình huống thật, trắc nghiệm chia 4 câu hình thức, 3 câu giọng điệu, 3 câu đọc hiểu; sửa các lỗi trong `docs/research/content-audit.md`. Thêm 7 bài mới (Premium). Gắn nhãn ngành (SPEC mục 16) cho 10 bài chuyên ngành.

- [ ] standup-11 — Chen vào và xác nhận lại trong cuộc họp (bài mới)
- [ ] standup-12 — Giải thích kỹ thuật cho người không làm kỹ thuật (bài mới)
- [ ] standup-13 — Nói chuyện xã giao đầu buổi họp (bài mới)
- [ ] writing-11 — Cập nhật khi có sự cố (bài mới)
- [ ] writing-12 — Báo tin xấu hoặc rủi ro cho khách (bài mới)
- [ ] writing-13 — Acceptance criteria và kết quả test (bài mới)
- [ ] writing-14 — Đọc hiểu tin nhắn của đồng nghiệp nước ngoài (bài mới)
- [ ] Nhãn ngành: writing-01 đến 04 chỉ Dev; writing-05 QA và Dev; writing-07 và writing-12 PM và BA; writing-11 Dev và PM; writing-13 BA và QA; standup-12 Dev và QA. Các bài khác là bài chung.

Ghi chú của người soạn, cần chủ dự án xem:

### standup-01..05

- **standup-02:** note_vi nói rõ ba mẫu dùng thay nhau được trong standup và thêm cách nói thứ tự "First..., then...". Câu s02q10 (giải thích mạo từ sai) đã bỏ. Distractor của q2 đổi để bớt lặp lỗi "thiếu am". Thêm ví dụ có plan to và pick up.
- **standup-03:** note_vi và word_bank có thêm "blocked on" (#9). Các ví dụ giờ có việc đã thử và lời nhờ người giúp. Model là standup có chỗ vướng và kết bằng một lời nhờ cụ thể.
- **standup-04:** Distractor của s04q8 đổi thành "the payment screen didn't yet" theo audit §5. Câu s04q6 (giải thích mạo từ sai) đã bỏ. Có thêm ví dụ "Two of the three endpoints are done". Tip "nói cụ thể thay vì nói phần trăm" được đưa vào note_vi, mistake và một câu hỏi giọng điệu.
- **standup-05:** Câu s05q7 (giải thích mạo từ sai) đã bỏ. Các ví dụ có thêm khoảng thời gian, assuming và if nothing comes up. Mọi chỗ "by + thời điểm" đều dịch là "muộn nhất". Mistake về until có thêm ví dụ dùng until đúng. Có câu hỏi đẩy lùi khi khách đòi một deadline không thực tế.
**Cần chủ dự án xem lại:**
- s01q7: đáp án sai "Yesterday I finished the payment API." vẫn là câu dùng được. Lý do chọn đáp án đúng chỉ là "thiếu ý tiếp theo", nên câu này có thể gây tranh cãi.
- s04q7: đáp án sai "...because Minh still hasn't sent the API spec." bị coi là đổ lỗi. Cách đánh giá này phụ thuộc văn hóa từng team.
- s04q9: "done-done" là tiếng lóng thân mật. Cần xác nhận người học có cần biết từ này không.
- s01q9: cách viết tắt Y/T/B trong kênh standup có team dùng, có team không.
- Các prompt_vi của câu giọng điệu có kèm bối cảnh nên dài khoảng 15 đến 18 từ, hơi quá giới hạn 15 từ của skill.

### standup-06..10

- **standup-10:** All "trước + day" translations are now "muộn nhất". Rewrote the s10q1 `why_vi` so it no longer says "were agreed" is never used. Added open questions, a parking lot, "Did I miss anything?" and a recap split into decision, action items and open question. s10q2 now tests by vs until, and s10q8 now reads a meeting note.
- **s10q8:** "If I missed anything, shout." is a little British. "let me know" would be the neutral version.
- **s08q10:** "delayed until Monday" is used as correct English, side by side with "by Friday EOD". Check that this sits well with the until vs by note planned for writing-10.
- **standup-09 `mistakes[1]`:** "You are wrong → I see it a bit differently" is a tone problem, not a grammar error. I kept it from the original file.
- **s07q10:** The second wrong option, about the colleague offering to cover your shift, is fairly close to the right answer. Check that it is clearly wrong.

### writing-01..05

- **writing-02 (Commit):** The why_vi for w02q1 now calls "Added"/"Adds" a convention, not a grammar error, and so does `mistakes[0]`. `note_vi` adds the 50-character subject line, the "If applied, this commit will…" test, `feat:`/`fix:`/`chore:` prefixes, and a body that explains why. The model is a Conventional Commit with a body and "Closes #318". New quiz items cover choosing the commit type, a vague subject or body vs a clear one, and reading squash/WIP, a reverted commit and the 50-character rule.
- **writing-03 (Review comments):** `mistakes[0]` is fixed to "Could we change this to a map? The lookup runs on every request." The wrong option in w03q6 (now w03q4) is changed to "at the config file", and its why_vi says "move to/into" are both correct. The article why_vi now uses the determiner wording. Examples now give reasons. The model is a set of review comments with praise, a reason, a nit and a question. New quiz items cover blunt vs over-hedged comments, "Is there a reason we…?", and nit vs must, plus reading "not a blocker / pull out into / as is", "I'm not sure this handles…" and "nothing blocking, LGTM once CI is green".
- **writing-04 (Reply to review):** Removed the old w04q8 "in the config file" distractor. Fixed the translations of examples 0 and 4. Added a pushback example ("I've kept the loop because…"). The model is a reply covering a fix, a pushback with a reason, a deferral to a ticket, and a request to look again. New quiz items cover "I've fixed it yesterday", tone for disagreeing, asking for clarification and deferring, and reading "resolve the thread", "Fair enough", and "Not sure this is addressed yet".
- **writing-05 (Bug):** Changed "on Firefox" to "in Firefox". Example 5 now includes frequency ("3 out of 5 times"). The model is a full bug report (Title, Steps, Expected, Actual, Environment, Frequency). New quiz items cover tone and clarity for Steps to reproduce, the bug title and the Slack message to a dev, plus reading "Can't repro on my end / HAR", "Fixed on staging, verify and close" and "blocker for the release … till the next sprint".
**For the owner's review list:**
- w02q7 asks the learner to pick fix:, feat: or chore: under the Conventional Commits convention. I counted it as one of the 3 "phù hợp hơn" items, but the options differ by convention, not tone.
- w04q3 marks "I've fixed it yesterday" as wrong. This is standard textbook US/UK English, though some speakers (Indian or Australian English, for example) do say it.
- w05q3 treats "logout" as a noun only. Many apps write "logout" as a verb, so a native reviewer might call this distractor a spelling issue, not a grammar error.
- w01q5 and w02q5 use "Fix bug" as the too-blunt option. It is grammatical. The why_vi explains it is too vague to be useful.

### writing-06..10

- The writing-08 model translation calls the PM "chị Hoa" ("Cảm ơn chị"). The writing-07 and writing-10 translations use "bạn" for the recipient. In all of them the writer is "mình".
- Some tone-item wrong options are deliberately very short but still grammatical: w06q5 is just "Hi Lan", w09q6 is all caps ("DON'T TOUCH THE MIGRATION."). Please check these suit your style.
- For reading items, `answer_vi` is a Vietnamese translation of the colleague's original message, not a repeat of the Vietnamese answer in `options[0]`.
- w08q3 uses "a time off" as a wrong option, as a learner error. Please confirm it is a typical Vietnamese mistake.

### interview-01..05

- The audit (§8 P1) suggested the interview `model` be a skeleton with blanks, so learners don't memorise an essay. I followed the task brief and wrote full STAR answers of 80 to 150 words instead. Please confirm that's what you want.
- interview-01's `model` is not strictly STAR. It goes present, past, a result with a number, then the future, because that structure fits a self-intro better.
- i04q9 is a colleague's Slack message, not something an interviewer would say. I kept it because it teaches "roll back" and "RCA", which come up in this lesson's topic.
- Two wording choices may need your approval: i01q7 uses the very short "I'm a tester." as its too-brief option, and i05q3's explanation teaches that after "stay" you use "calm", not "calmly".
- Each write prompt is about 36 to 40 words, close to the ~40-word limit.

### interview-06..10

- **i07q7, "table it till Monday":** this means "postpone" in US English but "bring it up now" in British English. "till Monday's sync" makes the meaning clear, but please confirm it is acceptable.
- **i10q10, "move on base" and "sign-on bonus":** these are real recruiter phrases but may be too advanced for the level.
- **i08q6, the Go garbage-collection answer** ("runs alongside the program to keep pauses short"): I believe this is technically accurate but simplified. Please check it.
- **interview-07 mistake 1:** the native-speaker reviewer should confirm the softer "too casual" explanation for "Me and my teammate" is acceptable.
- **interview-09 model:** it assumes the Vietnam–Sydney overlap falls in the Vietnamese morning, and reading item i09q7 says the same. That is correct, since Sydney is 3 to 4 hours ahead.

### standup-11..13 (bài mới)

- **s13q1:** the wrong option "How is your weekend?" is grammatical. It is only wrong because the question says it's Monday morning, and `why_vi` explains that.
- **standup-13 model:** it is a two-person dialogue, not a single message, and has 8 sentences, the maximum allowed.
- **standup-12 model:** it has 9 sentences, one over the 3–8 limit in the lesson rules; the checker doesn't check this. Merging or cutting one line would bring it within the limit.
- **standup-12 mistake 2:** "The server is overload" is one I believe Vietnamese learners make, but please confirm it's common enough.
- **New `roles` field:** the schema now has an optional `roles` field (dev/qa/ba/pm) that wasn't in the field order I was given, so none of the three lessons has it.
- **Review checklist:** I didn't add these three lessons to `docs/CONTENT_REVIEW.md`, because the task limited me to these three files.

### writing-11..14 (bài mới)

- **writing-12:** example translations use "bên mình/anh" for client emails rather than "em/anh". The task said to use "mình", but you may prefer "em" in a client email.
- **writing-14, q6:** "OOO until Wednesday" doesn't say whether the manager is back on Wednesday or the day after. The Vietnamese "nghỉ đến thứ Tư" is just as vague, so it doesn't change the answer, but you may want to check it.
- **writing-14, q9:** the wrong option "I'll follow up the client" is sometimes used in Asian English, though native speakers say "follow up with".
- **writing-14, q3:** the correct answer reads "It might be worth..." as a firm "you should do this". That fits a tech lead before release; in other contexts it can be optional.
- **writing-11:** the model and examples use 24-hour times with "ICT"; a US or EU team might write "2:35 PM" and their own timezone.
- **Review list not updated:** I didn't add these four lessons to `docs/CONTENT_REVIEW.md`, because that file wasn't assigned to me.
