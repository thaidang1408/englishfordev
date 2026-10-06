# EPC lesson content audit (30 lessons)

Scope: `docs/SPEC.md` §4, §6, §14, `.claude/skills/lesson/SKILL.md`, and all 30 files in `content/lessons/` (standup-01..10, writing-01..10, interview-01..10). Reviewed from two angles: an English-for-IT teacher and a native-speaker senior engineer. Date: 2026-10-06. Read-only audit, no project files were changed.

---

## 1. Overall verdict

**The English is clean, but the lessons are shallow.** Out of roughly 600 English sentences, I found only one example that is logically wrong, one quiz that has two acceptable answers, and one mistake explanation that is misleading. Vietnamese learners' real errors (`*I'm not agree`, `*Sorry for late`, `*explain me`, `*My nearest project`, `*How does it look like`, `*contact to`, `*more two days`) are well chosen. The tone is right for devs.

The weakness is in the design, not the writing. The SKILL rules say "one lesson, one pattern" and "write 1–2 sentences", so every lesson teaches **one sentence frame**, and each title promises a **workplace task**. Here is what a learner can do after each track:

- **Standup:** say one sentence per slot. They have never put yesterday, today and blockers together into one 3–4 sentence update.
- **Writing:** write a commit subject line and a one-line PR summary. They have never written a full PR description, a bug report, a client status email or a handover note.
- **Interview:** give 2–3 sentence answers. Real behavioral answers run 45–120 seconds (about 100–250 words) and follow the STAR structure. A 2–3 sentence answer to "Tell me about a difficult bug" reads as evasive or junior.

About 96% of quiz items (289/300) test **sentence-level grammar form**: articles, modifier order, base verb after a modal, -s agreement, V3, prepositions. Only 11/300 test appropriateness or tone. Nothing tests **understanding a native colleague's message**, even though the persona's main difficulty in real projects is decoding fast, idiomatic Slack and meeting English, then answering at the right register.

**Bottom line:** this is a good **A2+/B1 accuracy on-ramp**. As a course that gets a Vietnamese dev ready to work with foreign clients, it stops about one CEFR band short (it needs B1+/B2 discourse skills). Do the fixes in §7 P0 now. Grow the depth through the existing JSON plus two or three small optional fields, not by making each lesson longer.

---

## 2. Level

| Dimension | What the lessons require | CEFR estimate |
|---|---|---|
| Grammar targeted | past simple, present perfect (+yet/just), going to/will, present continuous, first conditional, embedded questions, gerund vs infinitive, comparatives, used to | A2–B1 |
| Output length | 1 sentence (standup, writing), 2–3 sentences (interview). Average example is 14.8 words; average correct quiz option is 9 words | A2+ |
| Discourse | no linking of 3+ sentences, no paragraph structure, no sequencing (first/then/so/however/as a result appears only once or twice) | below B1 |
| Pragmatics | some politeness (Could we…, I see your point, I'm afraid). No hedging scale, no softeners (just, a bit, might, I was wondering), no register switching | B1 (partial) |
| Reception | none: learners never read a native message to interpret it | not trained |

**Target fit.** The persona "reads English docs fine but is shy speaking/writing" is typically **receptive B1–B2, productive A2+–B1**. The content sits right at their *productive* floor. That is good for confidence in week 1–2, but most learners will master it quickly, and they will feel it is "too easy" because they already *recognise* every correct option. Working with foreign clients and teams needs **B1+ to B2 production**: an unprompted 3–5 sentence status update, explaining *why*, disagreeing with reasons, handling follow-up questions, and writing structured documents (bug report, PR description, status email). The grammar is enough. The **task size and the pragmatics are not**.

---

## 3. Per-lesson gaps (what is missing to be truly useful at work)

| lesson_key | title | What is missing |
|---|---|---|
| standup-01 | Hôm qua đã làm gì | Only "Yesterday I + V2". There is no linking of 2–3 items ("I wrapped up X, then started on Y"), no "also / and then", and no outcome ("so it's ready for QA"). All 5 examples and most quiz items start with "Yesterday I…", which is robotic. The lesson never builds the full update. |
| standup-02 | Hôm nay làm gì | Three future forms but no guidance on when a native uses each; in a standup "I'm going to / I'll / I'm working on" are interchangeable. Missing: priorities ("First I'll…, then…"), "pick up" (a ticket), "plan to", and a full yesterday→today→blockers update. |
| standup-03 | Đang kẹt ở đâu | Missing "blocked **on**", which is very common in US standups and has the same meaning as "blocked by". Missing what you have tried, what exactly you need and from whom, and the follow-up ("Can we sync after standup?"). In practice a blocker statement should end in an ask. |
| standup-04 | Việc xong, việc còn dở | Missing "wrap up / almost there / should be done by…" combos, "the remaining part is…", and a short reason why something is not done. The 80% phrasing is taught as fine, but the lesson never warns that percentages are vague. "2 of 3 endpoints are done" is better. |
| standup-05 | Ước lượng bao lâu | Missing ranges ("2 to 3 days"), assumptions ("assuming the API is ready"), risk caveats ("if nothing unexpected comes up"), pushing back on an unrealistic estimate, and "ballpark". Saying "it depends on X" is a core estimating skill and is absent. |
| standup-06 | Hỏi lại khi chưa hiểu | Good start. Missing paraphrase-check frames ("So what you're saying is…", "Let me make sure I got this right…"), asking someone to spell or type something ("Could you drop that in the chat?"), and asking about acceptance criteria and scope (key for BA/QA). No exposure to the fast idioms that cause the confusion in the first place. |
| standup-07 | Xin người khác giúp | Missing context before the ask (what you tried, why you are stuck), giving a time box ("15 minutes?"), "Would you mind…ing", "Any chance you could…", and closing the loop ("Thanks, that fixed it"). |
| standup-08 | Báo trễ và đề xuất mốc mới | Missing the full delay message: what happened → impact → new date → what you need or mitigation. Missing "slip", "push to", "heads-up", and offering options ("We can ship A on Friday and B next week"). E5 is logically broken (see §4). |
| standup-09 | Không đồng ý lịch sự | Missing the reason and evidence after "but", proposing a test or experiment, "disagree and commit", and escalating gracefully ("Let's take this offline"). Softener scale (I'm not sure… / I wonder if… / Have we considered…?) is only partly covered. |
| standup-10 | Tóm tắt một buổi họp | Missing open questions or parking lot, decision vs action item distinction, "Did I miss anything?", and written recap formatting (bullets with owner and date). Meeting-facilitation phrases are absent: opening, moving on, time-check. |
| writing-01 | Tiêu đề và mô tả PR | Only the title plus one sentence. A real PR description has **What / Why / How to test / Screenshots / Notes for reviewers / Risks**, and "Closes #123". The Why sentence ("so that…", "because…") is the most valuable sentence and is not taught. Also mixes commit conventions into PR titles (see §5). |
| writing-02 | Commit message | Missing the commit body (why), the 50/72 rule, Conventional Commits (`feat:`, `fix:`, `chore:`) which many teams require, and the "If applied, this commit will…" test. Good subject-line drilling, but it overlaps heavily with writing-01. |
| writing-03 | Comment khi review | Every comment uses "Could we… / Maybe we should…". Missing: giving the **reason** ("…since this runs on every request"), severity labels (nit / suggestion / blocking / question), "What do you think about…?", "Consider…", "Optional:", praise ("Nice cleanup!"), and asking questions instead of asserting ("Is there a reason we…?"). |
| writing-04 | Trả lời comment review | Only "Done, I've fixed X". Missing: politely **pushing back** ("I kept it this way because…"), asking for clarification, "Fixed in abc123", deferring with a ticket link, and resolving threads. Replying when you disagree is the hard part for Vietnamese devs, and it is not covered. |
| writing-05 | Báo một bug | One "When I…, X happens" sentence. A real report needs **title, environment, steps to reproduce (numbered imperatives), expected vs actual, frequency, severity, logs/screenshots**. The word bank lists "Steps to reproduce, Expected, Actual", but none of them is taught or practised. This is the biggest gap for QA learners. |
| writing-06 | Hỏi trên Slack | Embedded-question grammar is good. Missing: the "no hello" etiquette (put the question in the first message), context plus what you have tried, the specific ask plus urgency, thread/@mention etiquette, "Any pointers?", and "Thanks in advance". |
| writing-07 | Báo tiến độ cho khách | Only "We're on track to…". Missing: a **status email structure** (done / in progress / next / risks / what we need from you), **reporting bad news** to a client (at risk, delayed), greeting and closing, and plain-language explanation for non-technical clients. "On track" alone is the easy case. |
| writing-08 | Email xin nghỉ, dời lịch | Every sentence uses "I'd like to". Missing: subject line, greeting and sign-off, coverage/handover ("Nam will cover X while I'm out"), "I'll be OOO on…" (informing, not asking, which is the norm in many teams), "Would it be possible to…", and proposing alternative slots. |
| writing-09 | Ghi chú bàn giao | Only "If X, please Y". A real handover has **current status per item, links/locations, contacts, known issues, things NOT to do, and when you are back**. Missing "FYI", "heads-up", "for context". |
| writing-10 | Từ chối / xin thêm thời gian | "I'm afraid" is overused, and it is British and formal. Missing: giving the reason, **offering an alternative** ("I can't this sprint, but I could take it next sprint / Nam might have bandwidth"), "I don't have the bandwidth", "Unfortunately…", and negotiating scope instead of time. The "until vs by" distinction conflicts with earlier lessons and is not explained (see §5). |
| interview-01 | Giới thiệu bản thân | 2–3 sentences, but a real answer is 60–90 s: present → past → why here/future. Missing the closing hook ("…which is why this role caught my eye"), one concrete achievement with a number, and a domain mention. |
| interview-02 | Dự án gần nhất | Product plus stack only. Missing: problem/business goal, scale (users, load), **your role**, challenges and result, and the architecture in one sentence. The interviewer's follow-ups ("Why Kafka?") are not prepared. |
| interview-03 | Vai trò và đóng góp | Good team/me split. Missing: impact with numbers ("cut build time by 60%"), "I proposed / I drove / I owned", and handling "What would you do differently?". |
| interview-04 | Một bug khó | 3 sentences. Missing the full **STAR**: context, how you investigated (hypotheses, tools, logs), the result/impact, and what you changed afterwards (test, alert, postmortem). Debugging *process* language is the point of this question and it is absent ("I narrowed it down to…", "I ruled out…", "I bisected…"). |
| interview-05 | Điểm mạnh / cần cải thiện | Missing concrete evidence for the strength (a short story) and evidence of progress for the weakness. "I work well under pressure" (i05q7) is a cliché that interviewers discount, so it should not be modelled. |
| interview-06 | Vì sao đổi việc | Missing the link to *this* company ("…and that's what I saw in your team"), and how to handle "Why so short at X?" or layoffs. |
| interview-07 | Bất đồng trong team | Missing the full STAR: the other person's reasoning, how you listened, data used, the outcome, and the lesson. "What I learned was…" is not taught. Also missing "disagree with my manager". |
| interview-08 | Không biết câu trả lời | Missing buying time ("Let me think out loud…"), reasoning aloud through an approach ("I'd start by checking…"), and the system-design or technical-question variant. Saying "I'd look it up" without reasoning reads as weak. |
| interview-09 | Hỏi lại nhà tuyển dụng | Fine for grammar. Missing follow-up on the answer, questions about remote/time-zone overlap, English usage, and on-call. Missing a thank-you and close ("Thanks, I really enjoyed this conversation"). |
| interview-10 | Lương và ngày bắt đầu | VND-centric. Foreign-company interviews often use USD/yearly/total-comp framing. Missing: deflecting first ("I'd like to learn more about the role first"), asking for their range, negotiating a counteroffer, benefits/13th-month/probation wording, and responding to a lowball. |

---

## 4. Correctness and naturalness issues (with fixes)

Severity: **H** = wrong or misleading, fix before launch. **M** = unnatural or teaches a wrong rule. **L** = polish.

### 4.1 English sentences

| # | Sev | File · field | Current | Problem | Suggested fix |
|---|---|---|---|---|---|
| 1 | H | standup-08 · examples[4].en | The client changed the requirements, so I can have the export feature ready by next Tuesday. | "so I can have it ready" reads as if the change *enabled* the date. It is not a delay message. | "The client changed the requirements, so the export feature will slip to next Tuesday." · vi: "Khách đổi yêu cầu nên tính năng xuất file sẽ lùi sang thứ Ba tuần sau." |
| 2 | M | interview-05 · examples[0].en | One of my strengths is debugging. I'm patient with logs and I don't stop until I find the real cause. | "patient with logs" is odd collocation (you are patient with *people*). | "…I'm patient when I dig through logs, and I don't stop until I find the root cause." |
| 3 | M | interview-05 · quiz i05q7 options[0] | I work well under pressure. | Grammatically fine, but it is the textbook interview cliché. Modelling it contradicts the lesson's "be concrete" advice. | Keep for grammar (well vs good) but change the prompt to a concrete line: "I stay calm during production incidents." / ✗ "I stay calmly during production incidents." |
| 4 | L | standup-09 · quiz s09q1 options[0] | I don't agree with this approach. | Correct, but in a *polite disagreement* lesson it models the blunt version. | "I'm not sure I agree with this approach." (✗ "I'm not sure I agree this approach." / ✗ "I'm not agree with this approach.") |
| 5 | L | writing-08 · quiz w08q10 options[0] | I'd like to skip today's standup because I have a client call. | "I'd like to skip" sounds like a preference. Natives inform. | "I'll have to skip today's standup because I have a client call." |
| 6 | L | writing-10 · examples[3].en | I'm afraid I can't review your PR today. I'm busy with a production issue. | Fine but abrupt, and offers no alternative. | "I'm afraid I can't review your PR today. I'm tied up with a production issue. Could Nam take a look instead?" |
| 7 | L | writing-03 · mistakes[0].right | Could we change this? | A review comment with no *what* or *why* is unhelpful even when polite. | "Could we change this to a map? The lookup runs on every request." |
| 8 | L | writing-03 · quiz w03q4 options[0] | nit: There's a missing semicolon here. | Correct. Natives usually write the clipped form. | Keep, and add "nit: missing semicolon" as an example of note style. |
| 9 | L | standup-03 · pattern / word_bank | I'm blocked by … | "blocked **on**" is at least as common in US standups. | Add "blocked on" to word_bank and note_vi: "blocked by/on đều được". |
| 10 | L | writing-05 · quiz w05q3; standup-06 · examples[1] | doesn't work on Firefox / happens on Safari | With browsers, "**in** Firefox / in Safari" is more common, while devices/OS take "on". This matters because the lessons teach "nền tảng đi với on". | Use "in Firefox / in Safari", or switch the example to "on iOS". |
| 11 | L | standup-01 · all examples + 8/10 quiz items | Yesterday I … | Not wrong, just mechanical. Natives say "Yesterday I…" once and then chain: "I also…, and then…". | Make 2 examples multi-clause: "Yesterday I fixed the login bug and reviewed Nam's PR." |
| 12 | L | interview-10 · examples (all) | …million VND… | Fine for Vietnamese companies. For foreign clients/companies, USD or yearly framing is common. | Add one USD/yearly example: "I'm looking for around 30,000 to 35,000 USD a year." |

### 4.2 Rule explanations (why_vi) that teach something wrong

| # | Sev | File · field | Problem | Fix |
|---|---|---|---|---|
| 13 | H | writing-06 · mistakes[2].why_vi ("không thêm or not ở cuối") | "Do you know **if/whether** the deploy is finished **or not**?" is correct English. The real error is the missing *if/whether*. | "Câu hỏi có/không nằm sau Do you know cần if hoặc whether." |
| 14 | M | s01q8, s02q10, s04q6, s05q7 · why_vi ("X đếm được nên cần the") | Countability does not require *the*. It requires *a* determiner (a/the/my/this). *The* is chosen because the noun is specific. Learners will over-generalise "countable = the". The same template is right when it says "cần a" (s09q5, w03q5…). | "app là danh từ đếm được số ít nên cần từ hạn định (a/the/my); ở đây là app cụ thể nên dùng the." |
| 15 | M | writing-10 · w10q3 why_vi + pattern; standup-05, standup-08, writing-07, standup-10 | Five lessons teach "until = sai cho hạn chót". Then writing-10 teaches "Could I have **until** Friday?" and s08q10 "delayed **until** Monday" as correct, with no explanation. | Add one line in writing-10 note_vi: "finish **by** Friday (xong muộn nhất thứ Sáu) ≠ have time **until** Friday (có thời gian kéo dài tới thứ Sáu)." |
| 16 | M | writing-01 w01q6, w01q8; writing-02 w02q1, w02q6, w02q7 · why_vi | "Removed… / Adding… / Added…" are grammatical. They are wrong only by **convention**, and for PR titles that convention varies by team. Presenting it as a grammar error is misleading. | Write the why_vi as a convention: "Quy ước phổ biến của git: dòng đầu commit viết dạng mệnh lệnh (Add, Fix)…" |
| 17 | L | interview-05 · i05q8 why_vi ("Tính từ ngắn như clear thì thêm er") | "clear" accepts both *clearer* and *more clear*. See ambiguous quiz §5. | Change the distractor; drop the rule. |
| 18 | L | standup-10 · s10q1 why_vi | "We are agreed" exists in formal British English. The option "we were agreed to ship" is still wrong, so the quiz is fine, but the rule "không dùng were agreed" is too absolute. | "Thống nhất làm gì: we agreed to + V." |
| 19 | L | writing-03 w03q6, writing-04 w04q8 · why_vi ("Chuyển vào đâu dùng to, không dùng in") | "move X **into** the config file" is also correct, and "put it in the config" is normal. The rule is too absolute. | "move X to/into the config file" |

### 4.3 Vietnamese translations

| # | Sev | File · field | Current | Problem | Fix |
|---|---|---|---|---|---|
| 20 | M | **Systematic:** standup-06 examples[4].vi; standup-10 examples[1].vi, s10q2 prompt/answer_vi, s10q8 prompt_vi; writing-07 examples[0–4].vi, mistakes[0].right_vi, w07q1, w07q2, w07q6, w07q9, w07q10 answer_vi | "by Friday" → "**trước** thứ Sáu" | In Vietnamese "trước thứ Sáu" means *before* Friday (Friday excluded). "by Friday" means *no later than* Friday (Friday included). This is the exact concept the lessons teach, and standup-05/08 already use "muộn nhất". | "muộn nhất là thứ Sáu" / "trong thứ Sáu" / "chậm nhất thứ Sáu". Use one wording everywhere. |
| 21 | M | interview-04 · examples[4].vi | "người dùng bị đăng xuất sau vài phút" | EN says "**every** few minutes", meaning it repeats. | "người dùng cứ vài phút lại bị đăng xuất" |
| 22 | L | standup-06 · mistakes[2].right_vi | "mình nghe không kịp bạn vừa nói gì" | Awkward. | "Xin lỗi, mình nghe chưa rõ bạn vừa nói gì." |
| 23 | L | writing-07 · examples[0].vi (and similar) | "đang đúng tiến độ để giao module thanh toán trước thứ Sáu" | Calque of "on track to". | "Bên mình đang đúng tiến độ, sẽ giao module thanh toán muộn nhất thứ Sáu." |
| 24 | L | writing-06 · examples[1].vi | "Mình đang chạy test ở máy." | Loses "trying" and "locally". | "Mình đang thử chạy test trên máy local." |
| 25 | L | writing-04 · examples[0].vi / [4].vi | "Bắt lỗi chuẩn đấy" | OK but slightly odd. | "Bạn để ý kỹ thật, mình sửa lỗi chính tả rồi." or "Chuẩn, mình sửa rồi." |

---

## 5. Ambiguous quizzes (a "wrong" option is acceptable English)

| Quiz | "Wrong" option | Why it is defensible | Fix |
|---|---|---|---|
| **i05q8** (H) | I'm learning to give **more clear** feedback in code reviews. | *more clear* is standard and used by native speakers (dictionaries list both). | Replace with "I'm learning to give feedback more clearer in code reviews." (double comparative) or "I'm learning giving clearer feedback…". |
| w01q1 (M) | Fix crash when cart empty | Headline/telegraphic style. PR titles often drop articles and verbs. Many reviewers would accept it. | Replace the distractor with a real error, e.g. "Fix crash when the cart empty" (missing verb after a full subject). |
| w01q6, w01q8 (M) | Removed old feature flags / Adding unit tests for the payment service | Grammatically correct. Past tense and -ing PR titles are common on GitHub. They are "wrong" only by some teams' convention. | Keep only for commits (writing-02) and say "theo quy ước". For PR titles, replace with a real error, e.g. "Remove feature flags old". |
| s04q8 (L) | QA has finished testing the sign-up screen, but the payment screen not yet. | Acceptable in casual chat ("…but the payment screen, not yet"). | Replace the distractor with "…, but the payment screen didn't yet." (clearly wrong). |
| i10q2 (L) | I can start after two weeks. | Understood and used by natives ("after two weeks' notice"). Less idiomatic but not wrong. | Replace the distractor with "I can start since two weeks." and keep the in-vs-after point in why_vi only. |
| i10q4 (L) | Earliest I can start is March 1st. | Normal in spoken English (dropped article). | Replace the distractor with "The earliest I can start is at March 1st." |
| i07q5 (L) | At the end, we went with the simpler option. | Borderline. "At the end (of the meeting)" is common in speech. | Replace the distractor with "In the last, we went with the simpler option." |
| w03q6, w04q8 (L) | …move this timeout value **in** the config file / moved this constant **in** the config file | "move it in the config file" is heard in casual speech. | Replace with "…move this timeout value at the config file." |

No quiz has the correct answer anywhere other than index 0. No quiz is fully broken.

---

## 6. Repetition

Counted across all 390 explanations (90 `mistakes.why_vi` + 300 `quiz.why_vi`). Categories overlap.

| Rule taught | Explanations | Lessons it appears in |
|---|---|---|
| Modifier before noun ("từ bổ nghĩa đứng trước": *login bug*, not *bug login*) | **69 (18%)** | **27 / 30** |
| Base verb after will/could/should/to/let ("nguyên mẫu") | **58 (15%)** | 25 / 30 |
| -ing after preposition / finish / stop / suggest | ~33 (8%) | ~20 / 30 |
| Countable noun needs article ("đếm được nên cần a/the") | 25 (6%), plus other article whys ≈ 12% total | 17 / 30 |
| have + V3 / tense choice | ~24–49 (6–13%) | ~18 / 30 |
| 3rd-person -s / singular-plural | ~37 (9%) | ~20 / 30 |
| by vs until vs in/on for time | ~22 (6%) | 8 / 30 |
| Tone / appropriateness | **11 (3%)** | 11 / 30 (one "Chọn câu phù hợp hơn" item per interview lesson, plus s09q4) |

Observations:
- About **55–60% of all items** come from the same four checks: modifier order, base verb after modal, article, -s agreement. The distractor recipe is nearly fixed: "✗ drop the article" + "✗ swap word order" or "✗ wrong verb form". After 5–6 lessons a learner can pass most quizzes by **pattern-spotting** ("the option with *X Y* in Vietnamese order is wrong") without reading for meaning.
- The same pairs recur across tracks: *until/by* (s05, s08, s10, w07, w10), *on iOS/Android* (s01, s02, s07, w04), *no `in` before this afternoon/this week* (s07, s10, w08, w10), *two more days* (s05, s08, w10), *it took me / spend* (s05, i04), *wait for* (s03, s04, w07).
- writing-01 and writing-02 overlap about 70% (imperative verb, add + noun, modifier order).
- These repeats are real Vietnamese errors, so some repetition is good spaced practice. But the **Review** and **Bug của ngày** features already handle spacing. Lesson quizzes should spend that budget on new skills.

---

## 7. Missing skills (course-wide)

| Skill | Status | Notes |
|---|---|---|
| Tone, softening, politeness scale | Partial (s07, s09, w03, w08, w10) | No explicit ladder (direct → neutral → soft), no softeners (*just, a bit, might, I was wondering if, would it be possible*), and no "too polite / too indirect" warning (Vietnamese learners often overshoot into *Could you please kindly…*). |
| Phrasal verbs common in tech | Scattered (look into, take on, push back, follow up, get back to) | No focused lesson. Missing: *roll out, spin up, tear down, figure out, run into, come up, sort out, hand off, loop in, circle back, sign off, drill down, fall back*. These are also what learners fail to *understand*. |
| Meeting interaction | Very thin | Missing: interrupting politely, adding to a point, holding the floor, checking time, handing over to someone, "Can you see my screen?", "You're on mute", ending a call. |
| Explaining technical things simply | Absent | Missing for client/BA/PM work: analogies, "In simple terms…", "What this means for you is…", avoiding jargon, explaining a trade-off to a non-technical stakeholder. |
| Client communication | One lesson (w07, happy path only) | Missing: bad news and risks, scope change, clarifying requirements, asking for approval or feedback, demo walkthrough, follow-up email, saying "no" to a client. |
| Incident updates | Absent (only mentions) | Missing: "We're aware of… / investigating / mitigated / resolved / root cause / next update in 30 min", the postmortem summary, and on-call handover. High-stakes and formulaic, so ideal for this app. |
| Small talk | Absent | Missing: start-of-call chit-chat (weekend, weather, time zones, holidays such as Tết), and ending a call warmly. Shy learners dread this most. |
| Listening / understanding others' messages | Absent | No audio is fine; use **reading as a proxy**: decode native Slack/PR/meeting-note messages full of idioms, abbreviations (LGTM, ETA, EOD, OOO, FYI, AFAIK, WIP, PTAL, TL;DR), and indirect requests ("Not sure this is the best approach" = please change it). |
| Multi-sentence structure | Absent | No 3–5 sentence messages and no document templates. |
| Async etiquette | Absent | Missing: no-hello, threads, @mentions, reactions, response-time expectations, time-zone awareness ("I'll pick this up tomorrow my time"). |

---

## 8. Prioritised upgrade recommendation (fits current constraints)

Constraints respected: about 10–15 min per lesson, JSON content, zod schema, AI corrects user writing in Vietnamese, no audio, 5-part lesson flow, randomized 3 examples / 5 quizzes.

### P0: Fix before or at launch (≈ 1–2 h, content-only, no code)
1. Apply fixes #1, #2, #13, #14, #20, #21 and the ambiguous quiz **i05q8** (§4, §5).
2. Replace the "wrong" options in w01q1, w01q6, w01q8 and s04q8, and reword the convention why_vi (#16).
3. Add the until/by note to writing-10 (#15).
4. Update `.claude/skills/lesson/SKILL.md` so future lessons stop repeating these:
   - at most 2 quiz items per lesson may hinge on modifier order or "base verb after modal"
   - why_vi for articles must say "từ hạn định", not "đếm được → the"
   - translate "by + time" as "muộn nhất"
   - separate grammar errors from convention

### P1: Make every lesson end in a real work artifact (biggest value, small schema change)
Add **two optional fields** (zod `.optional()`, so old files still pass):

```ts
model?: { en: string; vi: string; note_vi?: string };   // one full, realistic 3–6 sentence message / document / 60–90 s answer
checklist_vi?: string[];                                // 3–5 items the AI checks in "Câu của bạn" (e.g. "Có Steps to reproduce", "Có Expected và Actual")
```

- Render `model` as a 6th mini-section, "Bản hoàn chỉnh", after the examples (≈1 min read). The lesson's pattern becomes *one slot* inside a real message. Learners see where their sentence lives.
- Change `write_prompt_vi` from "1–2 câu" to the real artifact at a manageable size. Examples:
  - standup: a 3–4 sentence update
  - writing-05: a bug report with Title / Steps / Expected / Actual
  - writing-01: What / Why / How to test
  - interview: about 80–150 words using STAR
- Pass `checklist_vi` to `/api/correct` so the AI gives Vietnamese feedback on **structure and tone**, not only grammar ("Bạn chưa nêu Expected", "Câu này hơi thẳng, thử thêm 'Could we…'"). This uses the existing AI correction loop and stays within 10–15 minutes.
- For interview, the SPEC rule against "a model essay to memorise" still holds if `model` is a **skeleton with slots** ("Situation: At [company], we had… / Task… / Action: I first…, then… / Result: …, and since then we…") rather than a polished essay. The three short example answers stay as they are.

### P2: Rebalance the 10 quiz items per lesson (content-only, same schema)
Target mix per lesson, with the 5 drawn at random so every run touches all three kinds:
- **4 form items** (current style; the most typical Vietnamese errors only)
- **3 register items**: "Chọn câu tự nhiên / lịch sự hơn", where all options are grammatical and differ in tone (too blunt / right / over-polite or too indirect)
- **3 comprehension items**: `prompt_vi: "Đồng nghiệp nhắn: 'LGTM with one nit, feel free to merge once fixed.' Ý họ là gì?"`, with Vietnamese-language options. This needs no schema change: options can be Vietnamese, answer_vi gives the meaning, and why_vi explains the idiom. It is the "listening" substitute.

### P3: Add v1.2 lessons for the missing skills (same JSON format, 10–15 min each)
Suggested 10–12 new lessons. They can be a 4th track, "Làm việc với khách & sự cố", or slotted into the existing tracks:

1. Cập nhật standup đầy đủ (yesterday + today + blockers, 3–4 câu): a capstone for standup-01..03
2. Mô tả PR đầy đủ (What / Why / How to test)
3. Bug report đầy đủ (Steps / Expected / Actual / Env), for QA
4. Phản hồi review khi không đồng ý ("I kept it this way because…")
5. Báo sự cố & cập nhật incident ("We're investigating… / Next update in 30 min / Resolved")
6. Báo tin xấu / rủi ro cho khách (at risk, slip, options)
7. Giải thích kỹ thuật cho người không chuyên ("In short… / What this means for you…")
8. Làm rõ requirement với khách (BA/PM: acceptance criteria, edge cases, scope)
9. Tương tác trong họp (interrupt, add, hand over, "you're on mute", wrap up)
10. Small talk đầu cuộc gọi & kết thúc lịch sự
11. Phrasal verbs hay gặp trong team phần mềm (comprehension-heavy)
12. Đọc hiểu tin nhắn của đồng nghiệp nước ngoài (abbreviations, indirect requests, idioms)

For the interview track, consider turning interview-02/04/07 into 2-part lessons, "khung STAR" + "trả lời đầy đủ", or simply rely on P1's `model` + `checklist_vi`. The Phỏng vấn thử feature (§7b) is the natural place for the 60–90 s full answer.

### P4: Level signposting
- Label the current 30 lessons as "Nền tảng (A2+–B1)" internally. Unlock P1/P3 depth as "Thực chiến (B1+–B2)".
- Placement result "Khá" could start learners at the capstone lessons instead of standup-01.
- Do not call it CEFR in the UI (SPEC §6 rule).

---

## Appendix: what is already good (keep it)
- The selection of Vietnamese learner errors is accurate and specific (L1 transfer: *explain me, contact to, more two days, nearest project, How does it look like, I'm not agree, have experience to work, Sorry for late, open to discuss, years experience*).
- Sentences are dev-realistic (idempotency key, flaky tests, race condition, on-call swap, rebase onto main, Swagger link).
- The "Chọn câu trả lời phù hợp hơn" items in the interview track (overclaiming vs underselling vs balanced) are exactly the right kind of pragmatics item. Extend that format to every track.
- Vietnamese translations are natural and use "mình/bạn" correctly. Problems are limited to the by/trước issue and two or three small items.
