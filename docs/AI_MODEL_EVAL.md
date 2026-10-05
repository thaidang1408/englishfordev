# So sánh model AI sửa câu

Chạy ngày 05/10/2026, trên Cloudflare Workers AI, cùng system prompt trong `src/lib/ai/correct.ts`. 18 câu: 16 câu công việc (2 câu đã đúng) và 2 câu trả lời phỏng vấn. Mỗi câu gọi qua đúng đường code của `/api/correct`: kiểm schema, sai thì gọi lại một lần.

## Kết quả

| Model | Trả đúng schema | Neuron mỗi câu | Câu miễn phí mỗi ngày | Nhận xét |
| --- | --- | --- | --- | --- |
| `@cf/google/gemma-4-26b-a4b-it` (đã chọn) | 18/18, lần gọi đầu | khoảng 9 | khoảng 1.000 | Giải thích tiếng Việt đúng và rõ nhất. Bắt được lỗi "discuss about" mà hai model kia bỏ sót |
| `@cf/openai/gpt-oss-120b` | 18/18 | khoảng 33 | khoảng 300 | Có lời giải thích sai ngữ pháp ("detail là danh từ không đếm được... cần số nhiều") |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 18/18 | khoảng 41 | khoảng 240 | Giải thích chung chung ("hãy kiểm tra lại câu"), sửa thiếu |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | 9/18 | | | Loại: hay trả sai schema |
| `@cf/zai-org/glm-5.3-flash` | 0/18 | | | Loại: lỗi API |

Gemma 4 là model có bước suy luận. Phải tắt bằng `chat_template_kwargs: { enable_thinking: false }`, nếu không model dùng hết token để "nghĩ" và không trả JSON.

## Ví dụ của Gemma 4

| Câu gốc | Sửa thành | Giải thích (rút gọn) |
| --- | --- | --- |
| Yesterday I have fixed the bug in login page. | Yesterday I fixed the bug on the login page. | Có "yesterday" thì dùng quá khứ đơn. Trang web dùng "on", cần "the". |
| I am blocking by the server issue. | I am blocked by the server issue. | Bị chặn thì dùng bị động be + V3. |
| I'm waiting the review from Minh. | I'm waiting for the review from Minh. | wait for something. |
| I will discuss with team about this problem. | I will discuss this problem with the team. | discuss không đi với about. |
| Sorry, I will late for the meeting 10 minutes. | Sorry, I will be 10 minutes late for the meeting. | will + be + late; khoảng thời gian đứng trước late. |
| I has finished the unit test for this function. | I have finished the unit test for this function. | I đi với have. |
| We need to deploy before 5pm today. | (đã đúng) | |

Chỗ còn yếu: "Can you explain more detail about this ticket?" được sửa thành "explain in more detail about this ticket", vẫn hơi thừa "about". Ngoài câu này, mọi câu sửa và lời giải thích trong 18 câu đều đúng.

## Phỏng vấn thử

Lần chạy đầu, "Một cách trả lời tốt hơn" tự thêm ý người dùng không nói ("focusing on building robust backend systems"). Đã siết prompt: chỉ được dùng thông tin có trong câu trả lời. Chạy lại 4 lần, không còn thêm ý:

- "I am a backend developer with 3 years of experience. I work with Java and Spring Boot at a bank."
- "Last month, our system crashed many times. I found that the root cause was a memory leak in the cache, so I fixed it."

## Đổi model

Đặt `AI_MODEL` (ví dụ `npx wrangler secret put AI_MODEL`) rồi deploy. Muốn dùng Claude thì chạy lại `npm run setup:ai` và dán key Anthropic.
