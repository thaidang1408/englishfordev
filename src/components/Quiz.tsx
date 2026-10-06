import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuizItem } from '../lib/content/schema';
import { track } from '../lib/events/client';
import { pickQuestions, QUIZ_SIZE, shuffledIndexes } from '../lib/lesson/shuffle';
import { fetchAccountResult, saveAccountResult } from '../lib/progress/client-sync';
import { completeLesson, loadProgress, recordAnswer, resetLesson, saveProgress } from '../lib/lesson/progress';
import QuestionCard, { type Step } from './quiz/QuestionCard';
import { useQuizKeys } from './quiz/useQuizKeys';

type Props = {
  lessonKey: string;
  /** Toàn bộ câu của bài; mỗi lượt lấy QUIZ_SIZE câu. */
  pool: QuizItem[];
  next?: { href: string; title: string };
};

/**
 * guest: chưa đăng nhập, tiến độ lưu localStorage, chuyển lên tài khoản ở lần đăng nhập đầu.
 * account: đã đăng nhập, kết quả đọc và lưu thẳng ở tài khoản.
 */
type Mode = 'guest' | 'account';
type Phase = 'loading' | 'question' | 'done';
type Save = 'idle' | 'saving' | 'saved' | 'error';

/** Phần 4 của bài học: 5 câu trắc nghiệm lấy ngẫu nhiên từ các câu của bài, mỗi lần một câu. */
export default function Quiz({ lessonKey, pool, next }: Props) {
  const [items, setItems] = useState<QuizItem[]>([]);
  const [mode, setMode] = useState<Mode>('guest');
  const [phase, setPhase] = useState<Phase>('loading');
  const [orders, setOrders] = useState<number[][]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  /** Điểm đã lưu trong tài khoản từ trước, khi chưa làm lại ở lần mở trang này. */
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [save, setSave] = useState<Save>('idle');
  const boxRef = useRef<HTMLDivElement>(null);

  const item = items[index];
  const order = orders[index];

  const startFrom = useCallback(
    (done: Record<string, boolean>) => {
      // Lượt đang dở thì giữ các câu đã trả lời; lượt mới thì lấy ngẫu nhiên, nên học lại gặp câu khác.
      const picked = pickQuestions(pool, Object.keys(done));
      setItems(picked);
      setOrders(picked.map((q) => shuffledIndexes(q.options.length)));
      setAnswers(done);
      const firstOpen = picked.findIndex((q) => !(q.id in done));
      setIndex(firstOpen === -1 ? picked.length - 1 : firstOpen);
      setPicked(null);
      setPhase('question');
    },
    [pool],
  );

  useEffect(() => {
    let cancelled = false;
    fetchAccountResult(lessonKey).then((result) => {
      if (cancelled) return;
      if (result.kind === 'account') {
        setMode('account');
        if (result.completed) {
          setSavedScore(result.completed.score);
          setPhase('done');
        } else {
          startFrom({});
        }
        return;
      }
      // Khách, hoặc không hỏi được máy chủ: dùng tiến độ trên trình duyệt. Lần vào app sau sẽ chuyển lên tài khoản.
      setMode('guest');
      const mine = loadProgress()[lessonKey];
      if (mine?.completed_at) {
        setAnswers(mine.answers);
        setPhase('done');
      } else {
        startFrom(mine?.answers ?? {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lessonKey, startFrom]);

  const choose = useCallback(
    (shown: number) => {
      if (phase !== 'question' || picked !== null || !item || !order) return;
      const original = order[shown];
      if (original === undefined) return;
      const correct = original === item.answer;
      setPicked(shown);
      // Chỉ tính lần chọn đầu tiên của mỗi câu, kể cả khi quay lại câu đã trả lời.
      if (!(item.id in answers)) setAnswers({ ...answers, [item.id]: correct });
      if (mode === 'guest') saveProgress(recordAnswer(loadProgress(), lessonKey, item.id, correct));
    },
    [phase, picked, item, order, answers, mode, lessonKey],
  );

  const persist = useCallback(
    (final: Record<string, boolean>) => {
      setSave('saving');
      saveAccountResult(lessonKey, { answers: final, completed_at: new Date().toISOString() }).then((okSaved) =>
        setSave(okSaved ? 'saved' : 'error'),
      );
    },
    [lessonKey],
  );

  const goNext = useCallback(() => {
    if (picked === null) return;
    if (index < items.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      boxRef.current?.focus({ preventScroll: true });
      // Câu mới ngắn hơn câu cũ thì trang không tự cuộn lên: kéo đầu câu vào màn hình.
      if (boxRef.current && boxRef.current.getBoundingClientRect().top < 0) boxRef.current.scrollIntoView({ block: 'start' });
      return;
    }
    setSavedScore(null);
    setPhase('done');
    track('lesson_complete', { lesson_key: lessonKey });
    if (mode === 'guest') saveProgress(completeLesson(loadProgress(), lessonKey, new Date()));
    else persist(answers);
  }, [picked, index, items.length, mode, lessonKey, persist, answers]);

  useQuizKeys(phase === 'question', boxRef, choose, goNext);

  const restart = () => {
    if (mode === 'guest') saveProgress(resetLesson(loadProgress(), lessonKey));
    setSave('idle');
    setSavedScore(null);
    startFrom({});
  };

  if (phase === 'loading') {
    return (
      <div className="quiz" style={{ minHeight: '22rem' }} aria-busy="true">
        <p className="muted">Đang tải {QUIZ_SIZE} câu trắc nghiệm.</p>
      </div>
    );
  }

  if (phase === 'done') {
    const correct = savedScore ?? Object.values(answers).filter(Boolean).length;
    const total = savedScore !== null ? QUIZ_SIZE : Object.keys(answers).length || QUIZ_SIZE;
    const wrong = total - correct;
    let note: string;
    if (mode === 'guest') {
      note =
        wrong > 0
          ? 'Câu sai sẽ được đưa vào phần ôn khi bạn đăng nhập. Tiến độ đang lưu trên trình duyệt này.'
          : 'Tiến độ đang lưu trên trình duyệt này. Đăng nhập để giữ lại khi đổi máy.';
    } else if (savedScore !== null) {
      note = 'Kết quả đã lưu trong tài khoản của bạn.';
    } else if (save === 'saved') {
      note = wrong > 0 ? 'Đã lưu vào tài khoản. Câu sai sẽ quay lại trong phần ôn ngày mai.' : 'Đã lưu vào tài khoản.';
    } else if (save === 'error') {
      note = '';
    } else {
      note = 'Đang lưu vào tài khoản.';
    }
    return (
      <div className="quiz answer-in" ref={boxRef} tabIndex={-1}>
        <h3>
          Bạn đúng {correct} trên {total} câu.
        </h3>
        <div aria-live="polite">
          {note && <p className="muted">{note}</p>}
          {save === 'error' && (
            <p className="note err">
              Chưa lưu được vào tài khoản do lỗi kết nối.{' '}
              <button type="button" className="btn-link" onClick={() => persist(answers)}>
                Lưu lại
              </button>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
          {/* Phần 5 (viết câu, AI sửa) là phần giá trị nhất, nên là bước chính sau trắc nghiệm. */}
          <a className="btn btn-primary" href="#cau-cua-ban">
            Sang phần 5: Viết câu của bạn
          </a>
          <button className="btn btn-quiet" type="button" onClick={restart}>
            Làm lượt mới, câu khác
          </button>
        </div>
        {next && (
          <p className="muted" style={{ marginTop: 'var(--s-3)', fontSize: 'var(--fs-sm)' }}>
            Bài tiếp theo: <a href={next.href}>{next.title}</a>
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
