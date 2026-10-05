import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { shuffledIndexes } from '../lib/lesson/shuffle';
import QuestionCard, { type Question, type Step } from './quiz/QuestionCard';
import { useQuizKeys } from './quiz/useQuizKeys';

export type ReviewQuestion = Question & { itemId: string; lessonTitle: string; box: number };

type Props = { items: ReviewQuestion[] };

type Result = 'ok' | 'no';
type Phase = 'loading' | 'question' | 'done';

const responseSchema = z.union([
  z.object({ ok: z.literal(true), data: z.object({ correct: z.boolean(), box: z.number() }) }),
  z.object({ ok: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }),
]);

const BOX_TEXT = ['', 'ngày mai', 'sau 3 ngày', 'sau 7 ngày', 'sau 14 ngày'];

/** Phiên ôn (SPEC mục 5): mỗi lần một câu, máy chủ chấm và chuyển mức Leitner. */
export default function ReviewSession({ items }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [orders, setOrders] = useState<number[][]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<(Result | undefined)[]>([]);
  const [nextBox, setNextBox] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const item = items[index];
  const order = orders[index];

  useEffect(() => {
    setOrders(items.map((q) => shuffledIndexes(q.options.length)));
    setPhase('question');
  }, [items]);

  const choose = useCallback(
    (shown: number) => {
      if (phase !== 'question' || picked !== null || busy || !item || !order) return;
      const choice = order[shown];
      if (choice === undefined) return;
      setPicked(shown);
      setBusy(true);
      setSaveError(null);
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ item_id: item.itemId, choice }),
      })
        .then(async (res) => {
          const parsed = responseSchema.safeParse(await res.json().catch(() => null));
          if (res.status === 401) {
            setSaveError('Phiên đăng nhập đã hết. Tải lại trang để đăng nhập, câu này chưa được tính.');
          } else if (parsed.success && parsed.data.ok) {
            const { correct, box } = parsed.data.data;
            setResults((r) => items.map((_, i) => (i === index ? (correct ? 'ok' : 'no') : r[i])));
            setNextBox(box);
          } else {
            setSaveError(parsed.success && !parsed.data.ok ? parsed.data.error.message : 'Chưa lưu được kết quả câu này.');
          }
        })
        .catch(() => setSaveError('Chưa lưu được kết quả do lỗi kết nối. Câu này sẽ quay lại ở lần ôn sau.'))
        .finally(() => setBusy(false));
    },
    [phase, picked, busy, item, order, index, items],
  );

  const goNext = useCallback(() => {
    if (picked === null || busy) return;
    if (index < items.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      setNextBox(null);
      setSaveError(null);
      boxRef.current?.focus({ preventScroll: true });
      return;
    }
    setPhase('done');
  }, [picked, busy, index, items.length]);

  useQuizKeys(phase === 'question', boxRef, choose, goNext);

  if (phase === 'loading') {
    return (
      <div className="quiz" style={{ minHeight: '22rem' }} aria-busy="true">
        <p className="muted">Đang tải {items.length} câu cần ôn.</p>
      </div>
    );
  }

  if (phase === 'done') {
    const remembered = results.filter((r) => r === 'ok').length;
    return (
      <div className="quiz answer-in" ref={boxRef} tabIndex={-1}>
        <h3>
          Xong phiên ôn: nhớ {remembered} trên {items.length} câu.
        </h3>
        <p className="muted">
          {remembered < items.length
            ? 'Câu chưa nhớ sẽ quay lại vào ngày mai. Câu đã nhớ được giãn ra lâu hơn.'
            : 'Các câu này được giãn ra lâu hơn trước khi quay lại.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
          <a className="btn btn-primary" href="/hom-nay">
            Về trang Hôm nay
          </a>
        </div>
      </div>
    );
  }

  if (!item || !order) return null;
  const steps: Step[] = items.map((_, i) => (i === index && picked === null ? 'now' : results[i] ?? ''));
  const after = saveError ? (
    <p className="note err">{saveError}</p>
  ) : nextBox !== null ? (
    <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 'var(--s-3) 0 0' }}>
      {nextBox >= 5 ? 'Bạn đã thuộc câu này, không cần ôn nữa.' : `Câu này sẽ quay lại ${BOX_TEXT[nextBox]}.`}
    </p>
  ) : null;

  return (
    <QuestionCard
      question={item}
      order={order}
      picked={picked}
      onChoose={choose}
      onNext={goNext}
      nextLabel={index < items.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
      busy={busy}
      label={`Câu ${index + 1} trên ${items.length}, bài ${item.lessonTitle}`}
      steps={steps}
      after={after}
      boxRef={boxRef}
    />
  );
}
