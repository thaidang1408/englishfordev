import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CATEGORY_NAMES, SENTENCE_MAX, SENTENCE_MIN } from '../../lib/ai/schema';
import { countByCategory, type InterviewQuestion } from '../../lib/interview/session';
import CorrectionResult from './CorrectionResult';
import { isSubmitKey, requestCorrection, type CorrectData } from './api';

type Props = { questions: InterviewQuestion[] };

const MAX = SENTENCE_MAX.interview;

/**
 * Phỏng vấn thử (SPEC mục 7b): mỗi câu hỏi một câu trả lời, AI sửa ở mode interview.
 * Cuối phiên: số chỗ sửa theo nhóm lỗi. Không chấm điểm, không xếp loại.
 */
export default function MockInterview({ questions }: Props) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(CorrectData | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const id = useId();
  // HTML render sẵn khóa ô nhập cho tới khi React sẵn sàng, để form không bị gửi kiểu cũ và tải lại trang.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const q = questions[index];
  const current = answers[index] ?? null;
  const last = index === questions.length - 1;

  async function submit(e?: { preventDefault(): void }) {
    e?.preventDefault();
    if (busy || !q) return;
    const sentence = text.trim();
    if (sentence.length < SENTENCE_MIN) {
      setError(`Câu trả lời cần ít nhất ${SENTENCE_MIN} ký tự.`);
      return;
    }
    setBusy(true);
    setError(null);
    const out = await requestCorrection({ sentence, mode: 'interview', question: q.question, lessonKey: q.lessonKey });
    setBusy(false);
    if (out.kind === 'ok') setAnswers((a) => questions.map((_, i) => (i === index ? out.data : a[i] ?? null)));
    else if (out.kind === 'login') setError('Phiên đăng nhập đã hết. Tải lại trang để đăng nhập.');
    else setError(out.message);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (isSubmitKey(e)) {
      e.preventDefault();
      void submit();
    }
  }

  function goNext() {
    if (last) {
      setFinished(true);
    } else {
      setIndex(index + 1);
      setText('');
      setError(null);
    }
    boxRef.current?.focus({ preventScroll: true });
  }

  if (finished) {
    const done = answers.filter((a): a is CorrectData => a !== null);
    const groups = countByCategory(done.flatMap((a) => a.result.changes));
    return (
      <div className="quiz answer-in" ref={boxRef} tabIndex={-1}>
        <h3>
          Xong phiên: bạn trả lời {done.length} trên {questions.length} câu.
        </h3>
        {groups.length === 0 ? (
          <p className="muted">Không có chỗ nào cần sửa trong các câu trả lời này.</p>
        ) : (
          <>
            <p className="muted">Số chỗ sửa theo nhóm lỗi:</p>
            <ul className="cat-count">
              {groups.map((g) => (
                <li key={g.category}>
                  <span>{CATEGORY_NAMES[g.category]}</span>
                  <b className="num">{g.count}</b>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="quiz-foot">
          <a className="btn btn-primary" href="/phong-van-thu">
            Phỏng vấn lại
          </a>
        </div>
      </div>
    );
  }

  if (!q) return null;
  return (
    <div className="quiz" ref={boxRef} tabIndex={-1} aria-labelledby={`${id}-q`}>
      <div className="quiz-top">
        <span>
          Câu {index + 1} trên {questions.length}
        </span>
        <span className="steps" aria-hidden="true">
          {questions.map((_, i) => (
            <i key={i} className={i === index ? 'now' : answers[i] ? 'ok' : ''} />
          ))}
        </span>
      </div>
      <p className="prompt interview-q" id={`${id}-q`} lang="en">
        {q.question}
      </p>

      {current ? (
        <div aria-live="polite">
          <CorrectionResult original={current.original} result={current.result} headLeft="Câu trả lời của bạn" />
          {current.result.stronger && (
            <section className="stronger answer-in" aria-labelledby={`${id}-s`}>
              <h4 id={`${id}-s`}>Một cách trả lời tốt hơn</h4>
              <p lang="en">{current.result.stronger}</p>
            </section>
          )}
          <div className="quiz-foot">
            <button className="btn btn-primary" type="button" onClick={goNext}>
              {last ? 'Xem tổng kết' : 'Câu tiếp theo'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <label className="sr-only-label" htmlFor={id}>
            Câu trả lời của bạn
          </label>
          <textarea
            id={id}
            className="correct-input"
            lang="en"
            rows={5}
            maxLength={MAX}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="I'm a backend developer with three years of experience in..."
            aria-describedby={`${id}-count`}
            disabled={!ready || busy}
          />
          <div className="correct-foot">
            <span className="muted" id={`${id}-count`} style={{ fontSize: 'var(--fs-xs)' }}>
              {text.length}/{MAX} ký tự. Mỗi câu tính một lượt sửa.
            </span>
            <span style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
              <button className="btn btn-quiet" type="button" onClick={goNext} disabled={busy}>
                Bỏ qua
              </button>
              <button className="btn btn-primary" type="submit" disabled={!ready || busy}>
                {busy ? 'Đang sửa' : 'Sửa câu trả lời'}
                <kbd className="kbd-hint" aria-hidden="true">
                  Ctrl Enter
                </kbd>
              </button>
            </span>
          </div>
          <div aria-live="polite">{error && <p className="note err">{error}</p>}</div>
        </form>
      )}
    </div>
  );
}
