import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

// Đáp án có dấu tiếng Việt thì đọc bằng giọng tiếng Việt (screen reader).
const VI = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;
const langOf = (s: string) => (VI.test(s) ? 'vi' : 'en');

export type Question = { id: string; prompt_vi: string; options: string[]; answer: number; answer_vi?: string; why_vi: string };
export type Step = 'ok' | 'no' | 'now' | '';

type Props = {
  question: Question;
  /** Vị trí hiển thị → vị trí đáp án gốc. */
  order: number[];
  picked: number | null;
  onChoose: (shown: number) => void;
  onNext: () => void;
  nextLabel: string;
  /** Đang chờ máy chủ: khóa nút sang câu sau. */
  busy?: boolean;
  label: string;
  steps: Step[];
  /** Thêm dưới phần giải thích, ví dụ lỗi lưu kết quả. */
  after?: ReactNode;
  boxRef: RefObject<HTMLDivElement | null>;
};

/** Một câu trắc nghiệm theo mẫu reference/styleguide.html. Đúng và sai báo bằng cả chữ, không chỉ màu. */
export default function QuestionCard({ question, order, picked, onChoose, onNext, nextLabel, busy, label, steps, after, boxRef }: Props) {
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const correctShown = order.indexOf(question.answer);
  const isRight = picked !== null && picked === correctShown;

  useEffect(() => {
    if (picked !== null && !busy) nextBtnRef.current?.focus({ preventScroll: true });
  }, [picked, busy]);

  return (
    <div className="quiz" ref={boxRef} tabIndex={-1} aria-labelledby={`q-${question.id}`}>
      <div className="quiz-top">
        <span>{label}</span>
        <span className="steps" aria-hidden="true">
          {steps.map((s, i) => (
            <i key={i} className={s} />
          ))}
        </span>
      </div>
      <p className="prompt" id={`q-${question.id}`}>
        {question.prompt_vi}
      </p>
      <div role="group" aria-labelledby={`q-${question.id}`}>
        {order.map((original, shown) => {
          let cls = 'opt';
          let mark = '';
          if (picked !== null) {
            if (shown === correctShown) {
              cls += ' right';
              mark = shown === picked ? 'Đúng' : 'Đáp án đúng';
            } else if (shown === picked) {
              cls += ' wrong';
              mark = 'Chưa đúng';
            } else {
              cls += ' dim';
            }
          }
          return (
            <button key={`${question.id}-${original}`} className={cls} type="button" disabled={picked !== null} onClick={() => onChoose(shown)}>
              <kbd aria-hidden="true">{shown + 1}</kbd>
              <span lang={langOf(question.options[original])}>{question.options[original]}</span>
              <span className="opt-mark">{mark}</span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && (
          <p className="why answer-in">
            <b>{isRight ? 'Đúng.' : 'Chưa đúng.'}</b> {question.why_vi}
            {question.answer_vi && (
              <span className="vi-line">
                <span lang={langOf(question.options[question.answer])}>{question.options[question.answer]}</span>: {question.answer_vi}
              </span>
            )}
          </p>
        )}
        {after}
      </div>
      {picked !== null && (
        <div className="quiz-foot">
          <button className="btn btn-primary" type="button" ref={nextBtnRef} onClick={onNext} disabled={busy}>
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
