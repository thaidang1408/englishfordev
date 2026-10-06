import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { CATEGORY_NAMES } from '../../lib/ai/schema';
import { splitAround, type OwnErrorPayload } from '../../lib/review/own-error';
import ReviewDiffView from '../ReviewDiffView';
import type { Step } from '../quiz/QuestionCard';

type Props = {
  item: OwnErrorPayload & { itemId: string };
  revealed: boolean;
  /** null: chưa chấm; true: nhớ; false: chưa nhớ. */
  graded: boolean | null;
  onReveal: () => void;
  onGrade: (remembered: boolean) => void;
  onNext: () => void;
  nextLabel: string;
  busy?: boolean;
  label: string;
  steps: Step[];
  after?: ReactNode;
  boxRef: RefObject<HTMLDivElement | null>;
};

/**
 * Ôn một lỗi trong câu của chính người dùng (SPEC mục 5): hiện câu gốc, hỏi sửa thế nào,
 * cho xem đáp án, người dùng tự chấm "Nhớ" hoặc "Chưa nhớ".
 */
export default function OwnErrorCard(props: Props) {
  const { item, revealed, graded, onReveal, onGrade, onNext, nextLabel, busy, label, steps, after, boxRef } = props;
  const nextRef = useRef<HTMLButtonElement>(null);
  const [head, wrong, tail] = splitAround(item.original, item.from);
  const promptId = `own-${item.itemId}`;

  useEffect(() => {
    if (graded !== null && !busy) nextRef.current?.focus({ preventScroll: true });
  }, [graded, busy]);

  return (
    <div className="quiz" ref={boxRef} tabIndex={-1} aria-labelledby={promptId}>
      <div className="quiz-top">
        <span>{label}</span>
        <span className="steps" aria-hidden="true">
          {steps.map((s, i) => (
            <i key={i} className={s} />
          ))}
        </span>
      </div>
      <p className="prompt" id={promptId}>
        Câu bạn từng viết. Chỗ được tô bạn sẽ sửa thế nào?
      </p>
      <p className="own-original" lang="en">
        {head}
        {wrong && <mark>{wrong}</mark>}
        {tail}
      </p>
      <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 'var(--s-2) 0 0' }}>
        Nhóm lỗi: {CATEGORY_NAMES[item.category]}
      </p>

      {!revealed && (
        <div className="quiz-foot">
          <button className="btn btn-quiet" type="button" onClick={onReveal}>
            Xem đáp án
            <kbd className="kbd-hint" aria-hidden="true">
              Enter
            </kbd>
          </button>
        </div>
      )}

      <div aria-live="polite">
        {revealed && (
          <div className="answer-in" style={{ marginTop: 'var(--s-4)' }}>
            <ReviewDiffView before={item.original} after={item.corrected} headLeft="Đáp án">
              {item.corrected_vi && <p className="vi-line">Nghĩa: {item.corrected_vi}</p>}
              <p>
                <span lang="en">
                  {item.from || '(thiếu)'} → {item.to || '(bỏ)'}
                </span>
                . {item.why_vi}
              </p>
            </ReviewDiffView>
            <p className="prompt" style={{ marginTop: 'var(--s-4)' }}>
              Bạn có nhớ cách sửa này không?
            </p>
            <div role="group" aria-label="Tự chấm">
              {[
                { value: true, text: 'Nhớ' },
                { value: false, text: 'Chưa nhớ' },
              ].map((o, i) => {
                const chosen = graded === o.value;
                const cls = `opt opt-vi${graded === null ? '' : chosen ? ' picked' : ' dim'}`;
                return (
                  <button key={o.text} className={cls} type="button" disabled={graded !== null || busy} onClick={() => onGrade(o.value)}>
                    <kbd aria-hidden="true">{i + 1}</kbd>
                    <span>{o.text}</span>
                    <span className="opt-mark">{chosen ? 'Đã chọn' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {after}
      </div>

      {graded !== null && (
        <div className="quiz-foot">
          <button className="btn btn-primary" type="button" ref={nextRef} onClick={onNext} disabled={busy}>
            {nextLabel}
            <kbd className="kbd-hint" aria-hidden="true">
              Enter
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}
