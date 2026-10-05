import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizItem } from '../lib/content/schema';
import { shuffledIndexes } from '../lib/lesson/shuffle';
import { syncLocalProgress, type SyncOutcome } from '../lib/progress/client-sync';
import {
  completeLesson,
  countCorrect,
  loadProgress,
  recordAnswer,
  resetLesson,
  saveProgress,
  type Progress,
} from '../lib/lesson/progress';
import QuestionCard, { type Step } from './quiz/QuestionCard';
import { useQuizKeys } from './quiz/useQuizKeys';

type Props = {
  lessonKey: string;
  items: QuizItem[];
  next?: { href: string; title: string };
};

type Phase = 'loading' | 'question' | 'done';

/** Phần 4 của bài học: 5 câu, tiến độ lưu localStorage, học xong thì gửi lên tài khoản nếu đã đăng nhập. */
export default function Quiz({ lessonKey, items, next }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState<Progress>({});
  const [orders, setOrders] = useState<number[][]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [saved, setSaved] = useState<SyncOutcome | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const answers = progress[lessonKey]?.answers ?? {};
  const item = items[index];
  const order = orders[index];

  // Đảo đáp án và đọc tiến độ sau khi chạy ở trình duyệt.
  useEffect(() => {
    const stored = loadProgress();
    const mine = stored[lessonKey];
    setProgress(stored);
    setOrders(items.map((q) => shuffledIndexes(q.options.length)));
    if (mine?.completed_at) {
      setPhase('done');
      return;
    }
    const firstOpen = items.findIndex((q) => !(q.id in (mine?.answers ?? {})));
    setIndex(firstOpen === -1 ? items.length - 1 : firstOpen);
    setPhase('question');
  }, [items, lessonKey]);

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
    // Đã đăng nhập thì lưu lên tài khoản; khách nhận 401 và giữ tiến độ ở trình duyệt.
    void syncLocalProgress().then(setSaved);
  }, [picked, index, items.length, progress, lessonKey]);

  useQuizKeys(phase === 'question', boxRef, choose, goNext);

  const restart = () => {
    const updated = resetLesson(progress, lessonKey);
    setProgress(updated);
    saveProgress(updated);
    setOrders(items.map((q) => shuffledIndexes(q.options.length)));
    setIndex(0);
    setPicked(null);
    setPhase('question');
  };

  if (phase === 'loading') {
    return (
      <div className="quiz" style={{ minHeight: '22rem' }} aria-busy="true">
        <p className="muted">Đang tải {items.length} câu trắc nghiệm.</p>
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
          {saved === 'synced'
            ? wrong > 0
              ? 'Đã lưu vào tài khoản. Câu sai sẽ quay lại trong phần ôn ngày mai.'
              : 'Đã lưu vào tài khoản.'
            : wrong > 0
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
        {next && (
          <p className="muted" style={{ marginTop: 'var(--s-3)', fontSize: 'var(--fs-sm)' }}>
            Bài tiếp theo: {next.title}
          </p>
        )}
      </div>
    );
  }

  if (!item || !order) return null;
  const steps: Step[] = items.map((q, i) => {
    const result = answers[q.id];
    return i === index && picked === null ? 'now' : result === true ? 'ok' : result === false ? 'no' : '';
  });

  return (
    <QuestionCard
      question={item}
      order={order}
      picked={picked}
      onChoose={choose}
      onNext={goNext}
      nextLabel={index < items.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
      label={`Câu ${index + 1} trên ${items.length}`}
      steps={steps}
      boxRef={boxRef}
    />
  );
}
