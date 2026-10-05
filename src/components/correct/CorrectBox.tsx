import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { SENTENCE_MAX, SENTENCE_MIN } from '../../lib/ai/schema';
import CorrectionResult from './CorrectionResult';
import { isSubmitKey, requestCorrection, type CorrectData } from './api';

type Props = {
  lessonKey?: string;
  /** Đường dẫn quay lại sau khi đăng nhập. */
  next: string;
  /** Nút gửi màu tím khi đây là hành động chính của màn hình. */
  primary?: boolean;
  label?: string;
};

type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done'; data: CorrectData }
  | { kind: 'login' }
  | { kind: 'error'; message: string };

const MAX = SENTENCE_MAX.work;

/** Ô "Sửa câu của tôi" (SPEC mục 4 phần 5 và trang /hom-nay). */
export default function CorrectBox({ lessonKey, next, primary = false, label = 'Câu tiếng Anh của bạn' }: Props) {
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  // HTML render sẵn khóa ô nhập cho tới khi React sẵn sàng, để form không bị gửi kiểu cũ và tải lại trang.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
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
    const out = await requestCorrection({ sentence: trimmed, lessonKey });
    setState(out.kind === 'ok' ? { kind: 'done', data: out.data } : out.kind === 'login' ? { kind: 'login' } : { kind: 'error', message: out.message });
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (isSubmitKey(e)) {
      e.preventDefault();
      void submit();
    }
  }

  function again() {
    setText('');
    setState({ kind: 'idle' });
    areaRef.current?.focus();
  }

  if (state.kind === 'done') {
    const { data } = state;
    return (
      <div className="correct-box" aria-live="polite">
        <CorrectionResult original={data.original} result={data.result} />
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
        rows={3}
        maxLength={MAX}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="Yesterday I fixed the login bug and..."
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
        {state.kind === 'error' && <p className="note err">{state.message}</p>}
      </div>
    </form>
  );
}
