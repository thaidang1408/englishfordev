# EPC: what Vietnamese dev/QA/BA/PM actually need from workplace English

Research date: 2026-10-06. Every claim carries a source tag [n]; the URLs are in section (d).
Note: [n*] means the claim comes from a search-index summary that could not be fully fetched (expired page, PDF, 403). Treat these as medium confidence.

---

## TL;DR

1. The pain is mostly **live speaking and listening**: following fast native speech, breaking into a meeting, asking for clarification instead of saying "yes", and raising problems early. Writing comes second. Async writing is the easiest place to win because the learner gets time to think [3][4][5][6][7][8].
2. The real bar for client-facing outsourcing roles is **B2 (IELTS 6.0, roughly TOEIC 740-820)**. Only about **22% of VN IT candidates** report advanced English, and they earn about **48% more** than candidates with basic English [9][10][11][12].
3. Employers don't complain about grammar. They complain about **behaviour expressed through language**: a "yes" that only means "I heard you", late escalation, no clarifying questions, hidden problems, and weak follow-through on commitments [5][6][13][14].
4. Real workplace messages are **multi-part structures**, not single sentences: standup = 3 parts in 30-60 s; PR = What/Why/How-to-test; bug = Steps/Expected/Actual/Env; incident = status + impact + next update; STAR interview answer = 90-120 s [15][16][17][18][19][20][21].
5. EPC's single-pattern lessons build the right *bricks*, but they don't teach *assembling a message*, *tone calibration*, *listening and clarifying*, or *answer length and structure*. The fix is to add a "full message" layer on top of each lesson, not to replace the pattern core.

---

## (a) Top 10 real needs, ranked

The ranking weighs frequency × difficulty × career impact for a VN IT worker in outsourcing or product companies.

| # | Need | Why it ranks here (evidence) |
|---|------|------------------------------|
| 1 | **Ask for clarification and confirm understanding live** ("Just to make sure I follow, do you mean A or B?") instead of a silent "yes" | VN teams "may wait before asking questions" and "try to solve it first before raising it" [5]. A "yes" might mean "I hear you", not "I will do it" [6]. The same pattern ("say yes, figure it out later") is the top complaint about Indian offshore teams [13*][14]. A Viblo case shows a whole team scrambling over an ambiguous "meeting at 3" with no timezone [22]. |
| 2 | **Understand fast native and non-native speech in meetings** | Speaking and listening are the most critical workplace skills for VN IT grads and engineers [23*][24*]. Japanese engineers report that native speed puts much of the content "out of reach", and one study found learners missed about 50% of words at native speed even though they knew them in writing [7*]. |
| 3 | **Take the floor in meetings: interrupt, add a point, disagree politely** | "The hardest thing for non-native speakers is finding a way to interrupt people and contribute… with fast-talking native speakers". Experts stay quiet [8]. |
| 4 | **Report status, risk and delay early, with a plan** (standup blockers, client status update, "we'll miss Friday, here's the option") | Hidden problems and fear of losing face [6]. US-client complaints centre on commitments, candor, and acknowledging failures [14]. A PMI study is cited as attributing 42% of project failures to tech/non-tech communication gaps [25*]. |
| 5 | **Async writing that stands alone**: Slack question with full context, PR description, bug report, handover | GitLab defaults to async, "low context" writing: be explicit and include links [26]. "No hello": put the question in the first message [27]. Google says "Fix bug" is a useless description; you must state what and why [16]. |
| 6 | **Tone calibration: neither blunt nor over-hedged** | Non-native speakers often sound "too blunt… because they do not hedge" [28*]. The opposite failure also exists: over-hedging makes them sound "fuzzy and vague" [29]. In code review, comment on the code, not the person, and label the severity (Nit/Optional/FYI) [30][31]. |
| 7 | **Job interview answers: structured, timed, with specific numbers** | STAR is the standard (Amazon) [19]. Target 90 s to 2 min. Under 60 s lacks depth and over 3 min loses the interviewer [20*]. English is the 1.5-2× salary lever for remote US/EU/SG jobs [32]. |
| 8 | **Explain technical things to non-technical clients/PMs** (impact-first, no jargon, analogies) | Focus on outcomes and avoid jargon. Executives prefer high-level insight [25*]. BrSE/BA job ads require "explaining technical requirements back to customers" [33*]. |
| 9 | **Push back and negotiate scope/estimates** ("We can hit Friday if we drop X; full scope needs one more week") | Trade-off framing (scope/time/resources) beats a flat "no" [34*]. This connects directly to need #4. |
| 10 | **Small talk and rapport** (call openers, Monday chat, jokes) | An Amazon engineer: "able to handle any work related English… terrible at almost any other non-tech… topics, jokes, vocabulary" [35]. |

Also relevant but lower priority: tech phrasal verbs (roll back, look into, follow up, spin up, hand off, wrap up, flag, chase down) are used "dozens of times a day" [36]. BA/QA need acceptance criteria in Given/When/Then [37]. Reading docs is a pain point, but devs already self-teach it [38].

---

## (b) What a single-sentence-pattern course covers well vs. misses

### Covers well
- **Grammatical accuracy of core moves**: past/present progressive for standup, imperative for commits, modal softeners. This is the "brick" layer.
- **Topic coverage matches reality**: the 30 lesson topics map closely to real tasks (standup, PR, bug, review reply, delay, interview Qs). This matches the needs above better than generic IT textbooks, which are topic-reading oriented (e.g. Oxford EIT: 25 units on Architecture, Networks, OS…, with the "main emphasis on reading") [39*].
- **Low time cost** (10 min) and **AI correction of free writing** both fit busy devs.
- **Common-mistakes section** is valuable, because VN learners translate word for word and run to Google Translate to check grammar [38].

### Misses (gap → which need it hurts)
| Gap | Impact |
|---|---|
| **No message-level structure.** One sentence ≠ a standup (3 parts), PR (What/Why/How to test), bug (Steps/Expected/Actual/Env), incident update, STAR answer | Needs 4, 5, 7. Real artefacts are 3-10 sentences in fixed slots [15][17][18][21] |
| **No tone/register dimension.** One "correct" form per pattern; no blunt → balanced → over-hedged ladder; no severity labels | Need 6 [28][29][30][31] |
| **No listening input.** MCQ on written sentences only | Needs 2, 3: the #1-#2 pain is comprehension at speed [7][23] |
| **No interaction/turn-taking.** No interrupt, check, paraphrase-back, or "A or B?" moves | Needs 1, 3 [8][40] |
| **No audience switch.** The same content isn't rewritten for a teammate vs. a client vs. a non-tech PM | Need 8 [25] |
| **No length/time targets.** No "30-60 s standup", no "90-120 s interview answer" | Needs 4, 7 [15][20] |
| **Behavioural content missing.** Language for *escalating early*, *admitting a mistake*, *saying "I don't know, I'll check by 3pm"* | Needs 1, 4, the employer complaint core [5][6][14] |
| **Avg 15-word examples are uniform.** No contrast pairs (bad → good), no real-world artefacts | All writing needs |
| **Gaps in track coverage**: incident/outage update, client call opener/small talk, demo, 1:1/feedback, explaining to non-tech, scope negotiation, BA/QA artefacts (acceptance criteria, test case) | Needs 8, 9, 10 |

---

## (c) Concrete upgrade recommendations

Principle: **keep the 10-min pattern core and add a "Full message" step**. Each lesson becomes: Pattern → examples → mistakes → MCQ → **Assemble (template + slots)** → **AI-graded scenario writing**. The rest of this section is content, not features.

### 1. Message templates per lesson (slot-filling, then free writing)
- **Standup (30-60 s, one sentence per part)** [15]
  `Yesterday I ___. Today I'm ___. Blocker: ___ / No blockers.` + optional `I'll follow up on Slack with the details.` (Scrum Guide 2020 no longer requires the 3 questions, but teams still use the format; timebox is 15 min for everyone [41].)
- **PR description** [16][17][42]
  `Title (imperative, specific): Fix overflow in profile modal`
  `## What` (2-4 sentences) · `## Why` (problem/ticket link) · `## How to test` (numbered steps) · `## Screenshots` · `## Notes/limitations`
- **Commit message**: `type(scope): imperative summary` + body explaining why. "Fix bug", not "Fixed bug" [43]. Bad examples to contrast: "Fix bug", "Fix build" [16].
- **Bug report (QA)** [18]
  `Title` · `Steps to reproduce (1..n)` · `Expected` · `Actual` · `Environment (OS/browser/version)` · `Frequency` · `Severity/impact`
- **Code review comment** [30][31]: `label (blocking|non-blocking): subject` + `why`. Labels: praise, nitpick, suggestion, issue, question, thought. Rule: talk about the code, not "you".
  Contrast: "Why did you use threads here when there's obviously no benefit?" → "The concurrency model adds complexity without performance benefit; single-threaded would be simpler." [30]
- **Client status update (weekly)** [44*]: `Subject: [Project] Weekly update – W41` · Overall status (Green/Amber/Red) · Done this week · In progress · Next week · Risks/blockers + ask · Next milestone.
- **Incident/outage update** (new lesson) [21][45]: `[Investigating|Identified|Monitoring|Resolved]` + what's affected + workaround + "Next update by HH:MM (timezone)". Example: "We have implemented a fix and are monitoring to ensure it has addressed the issue."
- **Acceptance criteria (BA)** [37]: `Given ___, when ___, then ___.` Must be testable, with no implementation detail.
- **Slack question** [26][27]: `Context (1 line) → What I tried → Specific question → Deadline/impact`, all in one message, never a bare "hi".
- **Delay report** (needs 4, 9): `What's late → why (1 line) → new ETA → options/trade-off → what I need from you`.

### 2. Tone ladders (one per "social" lesson)
Show three rungs. Mark the middle one as the target, and say when to use the top or bottom.
| Too blunt (sounds rude) | Balanced (target) | Over-hedged (sounds unsure) [28][29] |
|---|---|---|
| "This is wrong." | "I think this might break when the list is empty. Could we add a check?" | "Sorry, I'm not sure, but maybe possibly this could perhaps be an issue?" |
| "Send me the API doc." | "Could you share the API doc when you get a chance? I need it to start the integration." | "I was just wondering if it might be possible, if not too much trouble…" |
| "I can't finish by Friday." | "Friday is at risk. I can deliver A and B by Friday, or everything by Tuesday. Which works better?" | "I'll try my best…" (hides the risk) |
Add the Google/Conventional severity labels (Nit / Optional / FYI / blocking) as a tone tool for review comments [30][31].

### 3. Phrase banks (5-8 phrases, attached to existing lessons)
- **Clarify / check understanding** [40]: "Sorry, I didn't catch that. Could you say it again?" · "Just to make sure I follow: do you mean A or B?" · "So the next step is X, right?" · "Could you type that in the chat?"
- **Take the floor / interrupt** [40][8]: "Sorry to jump in, can I add something?" · "Can I come back to the point about X?" · "Before we move on…"
- **Say you don't know** (also used in the interview track): "I'm not sure. Let me check and get back to you by 3pm."
- **Tech phrasal verbs** [36]: roll back/out, look into vs dig into, follow up, hand off, wrap up, kick off, spin up, flag, chase down, back out. Use 2-3 per lesson inside the examples.
- **Small talk openers for client calls**: weather/weekend/holiday, plus closing lines ("Thanks, everyone. I'll send the notes in an hour.")

### 4. Scenario-based writing tasks (replace "write 1-3 sentences")
Give a **role + audience + facts + constraint**, and have the AI grade against a rubric: structure slots present, specificity, tone rung, length.
- "You're a QA. Login fails on Safari 17 only, 3/5 times. Write the bug ticket." (graded: all 5 sections)
- "Client (non-technical) asks why the release slipped. Cause: third-party API rate limit. Write 4-6 sentences: impact first, no jargon, new ETA, option." [25]
- "Reviewer left 'why not use a Map here?'. You disagree (Map breaks ordering). Reply politely with your reason."
- "Prod checkout errors 12% since 14:05. Write the first incident update and the 'monitoring' update." [21]
- **Same facts, two audiences**: rewrite a teammate Slack message as a client email (register shift).

### 5. Interview answer frameworks
- **STAR with length targets** [19][20]: S+T 2-3 sentences, **A 3-5 sentences with "I" not "we"**, R 1-2 sentences **with a number**. Total 90-120 s, roughly 200-280 words spoken.
- **Self-intro**: Present (role, years, stack) → Past (1 achievement with a number) → Future (why this role). About 60 s.
- **"I don't know"**: acknowledge → reason aloud from what you know → how you'd find out.
- **Salary**: range + flexibility phrase; **Questions for interviewer**: 2-3 prepared.
- The AI should grade completeness of STAR slots and flag missing metrics or "we" overuse, not just grammar.

### 6. Listening (smallest viable)
- Add TTS audio for the 5 examples at **normal native speed** and one "dictation/gap-fill" MCQ per session. This targets need #2 at near-zero content cost [7][23].

### 7. New lessons to consider (swap or extend)
Incident update · Explaining to a non-tech stakeholder · Scope/estimate negotiation · Client call opening & small talk · Demo walk-through · Giving feedback in a 1:1 · BA: acceptance criteria / clarifying requirements · QA: test result summary.

### 8. Target level
Pitch the examples at **B1+ → B2**. B2 = "can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible without strain" [10]. It is the IELTS 6.0 bar common in client-facing VN job ads [9*][11].

---

## Market facts (Q2: required level and complaints)
- Client-facing roles in VN ads typically want **IELTS 6.0+ / fluency in 4 skills** [9*]. IELTS 6.0 ≈ B2 ≈ TOEIC 740-820 [11].
- Developer ads say things like "communicate and collaborate with clients in English to clearly understand their requirements. Fluent English communication skills are mandatory" (Alpaca Solutions, ITviec; posting since expired) [46*].
- Only **22%** of 800+ surveyed IT candidates have advanced English. Advanced English pays about **48% more** than basic (VietnamWorks/topITworks) [12].
- Remote work for US/EU/SG/AU companies pays **1.5-2×** more than foreign companies' VN branches [32].
- VN national level: EF EPI 2024 rank **63/116**, score 498 ("moderate"), down from 58th [47].
- Employers mostly expect English "limited to technical roles", and Japanese/Korean are rising alternatives [48*].
- Complaints cluster on **behaviour-in-language** (late questions, hidden problems, an ambiguous "yes") rather than grammar [5][6][14].
- University English for IT in VN shows a documented gap from workplace needs [24]. A 291-engineer/40-employer VN study identified 30 frequent English workplace tasks that HEI training doesn't match [23*].

---

## (d) Sources
1. Bocasay, How to develop software in Vietnam without speaking English: https://www.bocasay.com/?p=15703
2. Computerworld, Vietnam: https://www.computerworld.com/article/1726586/vietnam.html
3. Babel/Cambridge Network, 5 tips for non-native speakers in meetings: https://www.cambridgenetwork.co.uk/news/babel-5-tips-help-non-native-english-speakers-work-meetings
4. Codementor, communication mistakes talk: https://codementor.io/events/communication-mistakes-doif9xt7yj
5. 8seneca, What European clients get wrong about IT outsourcing in Vietnam: https://www.8seneca.com/en/blog/technology/what-european-clients-often-get-wrong-about-it-outsourcing-companies-in-vietnam
6. CMC Global, Cultural alignment, Vietnam & UK firms: https://cmcglobal.com.vn/it-insights/cultural-alignment-in-multi-outsourcing-how-vietnam-bridges-the-gap-for-uk-firms/ (also https://www.orientsoftware.com/blog/build-a-tech-team-in-vietnam)
7. Japanese engineers & listening speed: https://senshu-u.repo.nii.ac.jp/record/2395/files/087_11.pdf ; https://www.tokyodev.com/articles/working-and-communicating-with-japanese-engineers ; https://blog.kinto-technologies.com/posts/2024-01-23-communication_tips_in_global/
8. Babel Group, 5 tips (interrupting quote): https://www.babelgroup.co.uk/about-us/babel-blog/5-tips-to-help-non-native-english-speakers-in-work-meetings
9. IDP Vietnam, IELTS or TOEIC to apply for a job: https://ielts.idp.com/vietnam/about/news-and-articles/article-ielts-or-toeic-to-apply-for-a-job
10. CEFR global scale (B2 descriptor): https://www.unibz.it/assets/Documents/Languages/unibz-languages-CEFR-Global-scale-EN.pdf
11. IELTS ↔ CEFR ↔ TOEIC conversion: https://studychain.jp/media/ielts-6-0-guide/ ; https://www.ielts.international/ja/cefr-to-ielts
12. VietTimes, Only 22% of IT candidates have advanced English: https://viettimes.vn/chi-22-ung-vien-it-co-trinh-do-tieng-anh-cao-cap-post60044.html
13. EngineerBabu, Outsourcing to India: https://engineerbabu.com/blog/?p=22583
14. IndiaPractice case study (US client complaints): https://www.indiapractice.com/node/53
15. Talaera, Standup meeting template: https://www.talaera.com/industry-specific-english/standup-meeting-template/
16. Google eng-practices, Writing good CL descriptions: https://google.github.io/eng-practices/review/developer/cl-descriptions.html
17. SoundCloud, PR templates: https://developers.soundcloud.com/blog/pr-templates-for-effective-pull-requests
18. Atlassian Community, Bug report template: https://community.atlassian.com/forums/discussion/2620657/how-to-report-a-bug-smarter-bug-template-inside
19. Interview Query, Amazon STAR method: https://www.interviewquery.com/p/amazon-star-method ; AWS recruiters: https://aws.amazon.com/careers/life-at-aws-recruiters-share-10-ways-to-excel-in-your-aws-in-person-interview/
20. STAR answer length: https://thinkinsights.net/consulting/star-behavioral-interview-framework ; https://www.teamblind.com/post/how-long-my-answers-should-be-for-behavioral-interviews-i62ysqyy
21. OneUptime, Incident communication templates: https://oneuptime.com/blog/post/2026-01-30-incident-communication-templates/view
22. Viblo, Giao tiếp hiệu quả (timezone case): https://viblo.asia/p/giao-tiep-hieu-qua-Az45b4moZxY
23. Task-based needs analysis, 291 engineers + 40 employers, Vietnam: https://nccur.lib.nccu.edu.tw/handle/140.119/154235
24. Vo, Wyatt & McCullagh (2016), gap between VN workplace English and university teaching (IT grads, HCMC): https://researchportal.port.ac.uk/en/publications/exploring-the-gap-between-vietnamese-workplace-communication-in-e/
25. AlgoCademy / dev.to, explaining tech to non-tech (McKinsey 80%, PMI 42% cited): https://algocademy.com/blog/?p=3540 ; https://dev.to/dalbir/speaking-their-language-tips-for-developers-to-talk-to-non-technical-audiences-1e06
26. GitLab Handbook, Effective communication (async, low-context): https://handbook.gitlab.com/handbook/company/culture/all-remote/effective-communication
27. No Hello: https://nohello.net/ (summary via https://dev.to/mattioo/the-no-hello-policy-13hn)
28. Hedging & non-native directness: https://kata.petra.ac.id/index.php/ing/article/view/15482/15474 ; https://engage.mosaicbc.org/blog/language-of-the-day-corporate-english
29. Gabi Widurek, Over-hedging by non-native speakers: https://typeshare.co/gabiwidurek/posts/hedging-by-non-native-speakers-of-english-explained-why-it-happens-and-how-to-avoid-it-especially-in-professional-setting-
30. Google eng-practices, How to write code review comments: https://google.github.io/eng-practices/review/reviewer/comments.html
31. Conventional Comments: https://conventionalcomments.org/
32. Cake.me, IT salary 2025 (remote 1.5-2×): https://www.cake.me/resources/career-development/muc-luong-it-2025
33. ITviec BrSE job ad (Mynavi TechTus): https://itviec.com/it-jobs/japanese-it-comtor-bridge-engineer-brse-mynavi-techtus-vietnam-0251
34. Deadline/scope trade-offs: https://trevorlasn.com/blog/unrealistic-deadlines-in-software-engineering ; https://kentbeck.com/summaries/scope-is-the-steering-wheel/
35. Blind, non-work English for engineers: https://www.teamblind.com/post/looking-for-suggestions-to-improve-non-work-related-english-skill-ev5dxu3q
36. Llexi, Phrasal verbs for software development: https://llexi.com/phrasal-verbs/phrasal-verbs-software-development.html
37. Acceptance criteria (Given/When/Then): https://www.atlassian.com/it/work-management/project-management/acceptance-criteria ; https://technology.blog.gov.uk/2015/03/04/creating-better-acceptance-criteria-for-user-stories/
38. ITviec, Ngoại ngữ có quan trọng với lập trình viên?: https://itviec.com/cuoc-thi-viet/ngoai-ngu-co-quan-trong-voi-lap-trinh-vien
39. Oxford English for Information Technology (contents): https://www.betterread.com.au/book/oxford-english-for-information-technology.do ; review: https://www.cc.kyoto-su.ac.jp/information/tesl-ej/ej24/r3.html
40. Meeting phrases (interrupting, clarifying): https://www.stgeorges.co.uk/how-to-interrupt-in-business-english/ ; https://blog.openl.io/english-phrases-for-clarifying-misunderstandings/
41. Scrum.org, Daily Scrum 2020 changes: https://www.scrum.org/resources/blog/getting-forensic-daily-scrum-2020
42. Graphite, PR description best practices: https://graphite.dev/guides/github-pr-description-best-practices
43. Conventional commit messages: https://dev.to/ageekdev/writing-conventional-git-commit-messages-49m8
44. Status update email templates: https://www.4cornerresources.com/career-advice/status-update-email/ ; https://www.maestrolabs.com/blog/project-status-email
45. Dartmouth, Statuspage outage templates: https://services.dartmouth.edu/TDClient/1806/Portal/KB/Article/148456/Statuspage-Outages-Templates
46. ITviec job (Alpaca Solutions, expired): https://itviec.com/it-jobs/fresher-junior-python-developer-mongodb-english-alpaca-solutions-3453
47. EF EPI 2024 Vietnam: https://vietnamnews.vn/society/1687179/viet-nam-ranks-63rd-out-of-116-countries-regions-in-english-proficiency.html
48. TopDev Vietnam IT Market Report (via VnEconomy): https://vneconomy.vn/viet-nam-co-the-thieu-tu-150-000-200-000-nhan-su-cong-nghe-thong-tin-moi-nam.htm
