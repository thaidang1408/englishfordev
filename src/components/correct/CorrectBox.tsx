import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { SENTENCE_MAX, SENTENCE_MIN } from '../../lib/ai/schema';
import { track } from '../../lib/events/client';
import CorrectionResult from './CorrectionResult';
import ReviewDiffView from '../ReviewDiffView';
import SelfFix, { type SelfFixOutcome } from './SelfFix';
import { isSubmitKey, requestCorrection, type CorrectData } from './api';

type Props = {
  lessonKey?: string;
  /** Bài track Phỏng vấn: gửi ở chế độ phỏng vấn (câu dài hơn, có câu trả lời tốt hơn). */
  question?: string;
  /** Đường dẫn quay lại sau khi đăng nhập. */
  next: string;
  /** Nút gửi màu tím khi đây là hành động chính của màn hình. */
  primary?: boolean;
  label?: string;
};

type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  // fix: đang tự sửa trước (SPEC mục 14); done: đã hiện đáp án, kèm kết quả tự sửa nếu có.
  | { kind: 'fix'; data: CorrectData }
  | { kind: 'done'; data: CorrectData; self?: SelfFixOutcome }
  | { kind: 'login' }
  | { kind: 'error'; message: string; upgrade?: boolean };

// Câu đang gõ giữ trong sessionStorage, để đi đăng nhập rồi quay lại không mất.
const draftKey = (lessonKey?: string) => `epc-draft:${lessonKey ?? 'home'}`;

/** Ô "Sửa câu của tôi" (SPEC mục 4 phần 5 và trang /hom-nay). */
export default function CorrectBox({ lessonKey, question, next, primary = false, label = 'Câu tiếng Anh của bạn' }: Props) {
  const MAX = SENTENCE_MAX[question ? 'interview' : 'work'];
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  // HTML render sẵn khóa ô nhập cho tới khi React sẵn sàng, để form không bị gửi kiểu cũ và tải lại trang.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey(lessonKey));
      if (saved) setText(saved);
    } catch {
      // Không có sessionStorage (chế độ riêng tư): bỏ qua.
    }
    setReady(true);
  }, [lessonKey]);
  function keep(value: string) {
    setText(value);
    try {
      if (value) sessionStorage.setItem(draftKey(lessonKey), value);
      else sessionStorage.removeItem(draftKey(lessonKey));
    } catch {
      // Bỏ qua như trên.
    }
  }
  const trimmed = text.trim();
  const tooShort = trimmed.length < SENTENCE_MIN;

  async function submit(e?: { preventDefault(): void }) {
    e?.preventDefault();
    if (state.kind === 'busy') return;
    if (tooShort) {
      setState({ kind: 'error', message: `Câu cần ít nhất ${SENTENCE_MIN} ký tự.` });
      return;
    }
    setState({ kind: 'busy' });
    const out = await requestCorrection(question ? { sentence: trimmed, lessonKey, mode: 'interview', question } : { sentence: trimmed, lessonKey });
    if (out.kind === 'ok') keep('');
    if (out.kind === 'error' && out.code === 'free_quota_exceeded') track('paywall_view', lessonKey ? { lesson_key: lessonKey } : {});
    setState(
      out.kind === 'ok'
        ? out.data.result.is_already_correct || out.data.result.changes.length === 0
          ? { kind: 'done', data: out.data }
          : { kind: 'fix', data: out.data }
        : out.kind === 'login'
          ? { kind: 'login' }
          : // Hết lượt của tài khoản miễn phí: một trong bốn chỗ được mời nâng cấp (SPEC mục 2).
            { kind: 'error', message: out.message, upgrade: out.code === 'free_quota_exceeded' },
    );
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (isSubmitKey(e)) {
      e.preventDefault();
      void submit();
    }
  }

  function again() {
    keep('');
    setState({ kind: 'idle' });
    areaRef.current?.focus();
  }

  if (state.kind === 'fix') {
    const { data } = state;
    return (
      <div className="correct-box">
        <SelfFix original={data.original} result={data.result} primary={primary} onDone={(self) => setState({ kind: 'done', data, self })} />
      </div>
    );
  }

  if (state.kind === 'done') {
    const { data, self } = state;
    return (
      <div className="correct-box" aria-live="polite">
        {self?.kind === 'right' && <p className="note ok">Bạn đã sửa đúng. Đây là bản sửa và lý do từng chỗ.</p>}
        {self?.kind === 'miss' && (
          <div className="answer-in" style={{ marginBottom: 'var(--s-4)' }}>
            <ReviewDiffView before={self.attempt} after={data.result.corrected} headLeft="Bản bạn tự sửa" headRight="So với bản sửa" />
          </div>
        )}
        <CorrectionResult original={data.original} result={data.result} />
        {data.result.stronger && (
          <section className="stronger answer-in" aria-labelledby={`${id}-s`}>
            <h4 id={`${id}-s`}>Một cách trả lời tốt hơn</h4>
            <p lang="en">{data.result.stronger}</p>
          </section>
        )}
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 'var(--s-3) 0 0' }}>
          {data.review_items > 0 && `${data.review_items} chỗ sửa đã vào sổ lỗi và sẽ quay lại trong phần ôn. `}
          {data.period === 'day'
            ? `Hôm nay bạn còn ${data.remaining} lượt sửa.`
            : data.remaining > 0
              ? `Bạn còn ${data.remaining} lượt sửa trong 7 ngày này.`
              : 'Bạn đã dùng lượt sửa của 7 ngày này.'}
        </p>
        <div className="correct-foot">
          {(data.remaining > 0 || data.period === 'day') && (
            <button className="btn btn-quiet" type="button" onClick={again}>
              Sửa câu khác
            </button>
          )}
          <a className="btn btn-quiet" href="/so-loi">
            Mở sổ lỗi
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="correct-box" onSubmit={submit} noValidate>
      <label className="field" htmlFor={id} style={{ marginBottom: 0 }}>
        <span>{label}</span>
      </label>
      <textarea
        id={id}
        ref={areaRef}
        className="correct-input"
        lang="en"
        rows={5}
        maxLength={MAX}
        value={text}
        onChange={(e) => keep(e.target.value)}
        onKeyDown={onKey}
        placeholder="Viết bằng tiếng Anh ở đây"
        aria-describedby={`${id}-count`}
        disabled={!ready || state.kind === 'busy'}
      />
      <div className="correct-foot">
        <span className="muted" id={`${id}-count`} style={{ fontSize: 'var(--fs-xs)' }}>
          {text.length}/{MAX} ký tự
        </span>
        <button className={`btn ${primary ? 'btn-primary' : 'btn-quiet'}`} type="submit" disabled={!ready || state.kind === 'busy'}>
          {state.kind === 'busy' ? 'Đang sửa' : 'Sửa câu của tôi'}
          <kbd className="kbd-hint" aria-hidden="true">
            Ctrl Enter
          </kbd>
        </button>
      </div>
      <div aria-live="polite">
        {state.kind === 'login' && (
          <p className="note info">
            Cần đăng nhập để AI sửa câu của bạn. <a href={`/dang-nhap?next=${encodeURIComponent(next)}`}>Đăng nhập</a>
          </p>
        )}
        {state.kind === 'error' && (
          <p className="note err">
            {state.message}
            {state.upgrade && (
              <>
                {' '}
                <a href="/nang-cap?goi=30d">Xem gói nâng cấp</a>
              </>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
