import type { ReactNode } from 'react';
import { diffWords, type Segment } from '../lib/lesson/diff';

type Props = {
  before: string;
  after: string;
  headLeft?: string;
  headRight?: string;
  /** Comment của Coach dưới khung diff. */
  children?: ReactNode;
};

/**
 * Khung review như ReviewDiff.astro, cho phần tương tác. Câu của người dùng và kết quả AI
 * chỉ render dạng văn bản qua React, không HTML (skill security).
 */
export default function ReviewDiffView({ before, after, headLeft, headRight, children }: Props) {
  const diff = diffWords(before, after);
  const lines = [
    { cls: 'del', sign: '−', sr: 'Câu gốc: ', segs: diff.before },
    { cls: 'add', sign: '+', sr: 'Câu đã sửa: ', segs: diff.after },
  ];
  return (
    <figure className="review">
      {(headLeft || headRight) && (
        <div className="review-head">
          <span>{headLeft}</span>
          <span>{headRight}</span>
        </div>
      )}
      <div className="diff">
        {lines.map((line) => (
          <div key={line.cls} className={`diff-line ${line.cls}`}>
            <span className="sign" aria-hidden="true">
              {line.sign}
            </span>
            <span>
              <span className="sr-only-label">{line.sr}</span>
              <span lang="en">
                {line.segs.map((s, i) => (
                  <Seg key={i} seg={s} />
                ))}
              </span>
            </span>
          </div>
        ))}
      </div>
      {children && (
        <figcaption className="comment">
          <div className="avatar" aria-hidden="true">
            C
          </div>
          <div>{children}</div>
        </figcaption>
      )}
    </figure>
  );
}

function Seg({ seg }: { seg: Segment }) {
  const text = seg.text.trimEnd();
  const trail = seg.text.endsWith(' ') ? ' ' : '';
  return seg.changed ? (
    <>
      <mark>{text}</mark>
      {trail}
    </>
  ) : (
    <>{seg.text}</>
  );
}
