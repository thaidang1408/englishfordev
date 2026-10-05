import { useEffect, useRef, type RefObject } from 'react';

const isTyping = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const isActionable = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && (el.tagName === 'A' || (el instanceof HTMLButtonElement && !el.disabled));

/**
 * Phím tắt trắc nghiệm (skill design-system): 1 2 3 để chọn, Enter để sang câu sau.
 * Chỉ hoạt động khi khung đang trên màn hình và con trỏ không ở ô nhập.
 */
export function useQuizKeys(
  active: boolean,
  boxRef: RefObject<HTMLElement | null>,
  choose: (shown: number) => void,
  goNext: () => void,
): void {
  const visible = useRef(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, boxRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active || !visible.current) return;
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
  }, [active, choose, goNext]);
}
