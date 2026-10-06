import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CATEGORY_NAMES, type Correction } from '../../lib/ai/schema';
import { markFragments, sameSentence } from '../../lib/correct/selfcheck';
import { isSubmitKey } from './api';

export type SelfFixOutcome = { kind: 'right' } | { kind: 'miss'; attempt: string } | { kind: 'skip' };

type Props = {
  original: string;
  result: Correction;
  primary?: boolean;
  onDone: (outcome: SelfFixOutcome) => void;
};

const TRIES = 2;

/**
 * Tự sửa trước (SPEC mục 14): AI đã sửa xong nhưng chưa hiện bản sửa. Người dùng thấy chỗ được tô,
 * số chỗ cần sửa và nhóm lỗi, tự sửa trong ô, rồi mới xem đáp án. Không gọi AI thêm.
 */
export default function SelfFix({ original, result, primary = false, onDone }: Props) {
  const [text, setText] = useState(original);
  const [tries, setTries] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const pieces = markFragments(
    original,
    result.changes.map((c) => c.from),
  );
  const groups = [...new Set(result.changes.map((c) => CATEGORY_NAMES[c.category]))];

  useEffect(() => areaRef.current?.focus({ preventScroll: true }), []);

  function check(e?: { preventDefault(): void }) {
    e?.preventDefault();
    if (sameSentence(text, result.corrected)) return onDone({ kind: 'right' });
    const next = tries + 1;
    if (next >= TRIES) return onDone({ kind: 'miss', attempt: text.trim() });
    setTries(next);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (isSubmitKey(e)) {
      e.preventDefault();
      check();
    }
  }

  return (
    <form className="self-fix answer-in" onSubmit={check} noValidate>
      <p className="self-fix-head">
        <b>
          Câu của bạn có {result.changes.length} chỗ cần sửa
        </b>
        <span className="muted"> Nhóm lỗi: {groups.join(', ')}.</span>
      </p>
      <p className="own-original" lang="en">
        {pieces.map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
      </p>
      <label className="field" htmlFor={id} style={{ margin: 'var(--s-4) 0 0' }}>
        <span>Thử tự sửa trước khi xem đáp án</span>
      </label>
      <textarea
        id={id}
        ref={areaRef}
        className="correct-input"
        lang="en"
        rows={3}
        maxLength={1500}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
      />
      <div aria-live="polite">
        {tries > 0 && <p className="note info">Chưa khớp với bản sửa. Bạn thử thêm một lần, hoặc xem đáp án.</p>}
      </div>
      <div className="correct-foot">
        <button className="btn btn-quiet" type="button" onClick={() => onDone({ kind: 'skip' })}>
          Xem đáp án
        </button>
        <button className={`btn ${primary ? 'btn-primary' : 'btn-quiet'}`} type="submit">
          Kiểm tra
          <kbd className="kbd-hint" aria-hidden="true">
            Ctrl Enter
          </kbd>
        </button>
      </div>
    </form>
  );
}
