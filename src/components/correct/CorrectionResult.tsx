import { CATEGORY_NAMES, type Correction } from '../../lib/ai/schema';
import ReviewDiffView from '../ReviewDiffView';

type Props = { original: string; result: Correction; headLeft?: string };

/** Kết quả AI sửa câu: khung diff, mỗi chỗ sửa một dòng ghi chú, mẹo nếu có. Chỉ render văn bản. */
export default function CorrectionResult({ original, result, headLeft = 'Câu của bạn' }: Props) {
  if (result.is_already_correct) {
    return (
      <div className="answer-in">
        <p className="note ok">Câu này đã đúng, không cần sửa.</p>
        {result.tip_vi && <p className="why">{result.tip_vi}</p>}
      </div>
    );
  }
  return (
    <div className="answer-in">
      <ReviewDiffView before={original} after={result.corrected} headLeft={headLeft} headRight={`${result.changes.length} chỗ sửa`}>
        <ul className="changes">
          {result.changes.map((c, i) => (
            <li key={i}>
              <span className="change-pair" lang="en">
                <del>{c.from || '(thiếu)'}</del> → <ins>{c.to || '(bỏ)'}</ins>
              </span>
              <span className="change-cat">{CATEGORY_NAMES[c.category]}</span>
              <span className="change-why">{c.why_vi}</span>
            </li>
          ))}
        </ul>
        {result.tip_vi && <p className="muted">{result.tip_vi}</p>}
      </ReviewDiffView>
    </div>
  );
}
