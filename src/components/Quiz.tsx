import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizItem } from '../lib/content/schema';
import { shuffledIndexes } from '../lib/lesson/shuffle';
import {
  completeLesson,
  countCorrect,
  loadProgress,
  recordAnswer,
  resetLesson,
  saveProgress,
  type Progress,
} from '../lib/lesson/progress';

type Props = {
  lessonKey: string;
  items: QuizItem[];
  next?: { href: string; title: string };
};

type Phase = 'loading' | 'question' | 'done';

const isTyping = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const isActionable = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && (el.tagName === 'A' || (el instanceof HTMLButtonElement && !el.disabled));

export default function Quiz({ lessonKey, items, next }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState<Progress>({});
  const [orders, setOrders] = useState<number[][]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const visibleRef = useRef(false);

  const answers = progress[lessonKey]?.answers ?? {};
  const item = items[index];
  const order = orders[index];

  // Đảo đáp án và đọc tiến độ sau khi chạy ở trình duyệt.
  useEffect(() => {
    const saved = loadProgress();
    const mine = saved[lessonKey];
    setProgress(saved);
    setOrders(items.map((q) => shuffledIndexes(q.options.length)));
    if (mine?.completed_at) {
      setPhase('done');
      return;
    }
    const firstOpen = items.findIndex((q) => !(q.id in (mine?.answers ?? {})));
    setIndex(firstOpen === -1 ? items.length - 1 : firstOpen);
    setPhase('question');
  }, [items, lessonKey]);

  // Phím tắt chỉ hoạt động khi khung trắc nghiệm đang trên màn hình.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry?.isIntersecting ?? false;
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [phase]);

  const choose = useCallback(
    (shown: number) => {
      if (phase !== 'question' || picked !== null || !item || !order) return;
      const original = order[shown];
      if (original === undefined) return;
      setPicked(shown);
      const updated = recordAnswer(progress, lessonKey, item.id, original === item.answer);
      setProgress(updated);
      saveProgress(updated);
    },
    [phase, picked, item, order, progress, lessonKey],
  );

  const goNext = useCallback(() => {
    if (picked === null) return;
    if (index < items.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      boxRef.current?.focus({ preventScroll: true });
      return;
    }
    const updated = completeLesson(progress, lessonKey, new Date());
    setProgress(updated);
    saveProgress(updated);
    setPhase('done');
  }, [picked, index, items.length, progress, lessonKey]);

  const restart = () => {
    const updated = resetLesson(progress, lessonKey);
    setProgress(updated);
    saveProgress(updated);
    setOrders(items.map((q) => shuffledIndexes(q.options.length)));
    setIndex(0);
    setPicked(null);
    setPhase('question');
  };

  useEffect(() => {
    if (picked !== null) nextBtnRef.current?.focus({ preventScroll: true });
  }, [picked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'question' || !visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        choose(Number(e.key) - 1);
      } else if (e.key === 'Enter' && !isActionable(e.target)) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, choose, goNext]);

  if (phase === 'loading') {
    return (
      <div className="quiz" style={{ minHeight: '22rem' }} aria-busy="true">
        <p className="muted">
          Đang tải {items.length} câu trắc nghiệm.
        </p>
      </div>
    );
  }

  if (phase === 'done') {
    const correct = countCorrect(progress[lessonKey]);
    const wrong = items.length - correct;
    return (
      <div className="quiz answer-in" ref={boxRef} tabIndex={-1}>
        <h3>
          Bạn đúng {correct} trên {items.length} câu.
        </h3>
        <p className="muted">
          {wrong > 0
            ? 'Câu sai sẽ được đưa vào phần ôn khi bạn đăng nhập. Tiến độ đang lưu trên trình duyệt này.'
            : 'Tiến độ đang lưu trên trình duyệt này. Đăng nhập để giữ lại khi đổi máy.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
          {next && (
            <a className="btn btn-primary" href={next.href}>
              Học bài tiếp theo
            </a>
          )}
          <button className="btn btn-quiet" type="button" onClick={restart}>
            Làm lại trắc nghiệm
          </button>
        </div>
        {next && <p className="muted" style={{ marginTop: 'var(--s-3)', fontSize: 'var(--fs-sm)' }}>Bài tiếp theo: {next.title}</p>}
      </div>
    );
  }

  if (!item || !order) return null;
  const correctShown = order.indexOf(item.answer);
  const isRight = picked !== null && picked === correctShown;

  return (
    <div className="quiz" ref={boxRef} tabIndex={-1} aria-labelledby={`q-${item.id}`}>
      <div className="quiz-top">
        <span>
          Câu {index + 1} trên {items.length}
        </span>
        <span className="steps" aria-hidden="true">
          {items.map((q, i) => {
            const result = answers[q.id];
            const cls = i === index && picked === null ? 'now' : result === true ? 'ok' : result === false ? 'no' : '';
            return <i key={q.id} className={cls} />;
          })}
        </span>
      </div>
      <p className="prompt" id={`q-${item.id}`}>
        {item.prompt_vi}
      </p>
      <div role="group" aria-labelledby={`q-${item.id}`}>
        {order.map((original, shown) => {
          const option = item.options[original];
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
            <button key={`${item.id}-${original}`} className={cls} type="button" disabled={picked !== null} onClick={() => choose(shown)}>
              <kbd aria-hidden="true">{shown + 1}</kbd>
              <span lang="en">{option}</span>
              <span className="opt-mark">{mark}</span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && (
          <p className="why answer-in">
            <b>{isRight ? 'Đúng.' : 'Chưa đúng.'}</b> {item.why_vi}
          </p>
        )}
      </div>
      {picked !== null && (
        <div className="quiz-foot">
          <button className="btn btn-primary" type="button" ref={nextBtnRef} onClick={goNext}>
            {index < items.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            <kbd className="kbd-hint" aria-hidden="true">
              Enter
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
}
