import { useEffect, useRef, useState } from 'react';
import ReviewDiffView from '../ReviewDiffView';
import {
  MAX_TRIES,
  formatSeconds,
  linePoints,
  prNumber,
  resultGrid,
  shareText,
  streakFrom,
  totalPoints,
  verdict,
  type LineResult,
} from '../../lib/bug/share';

/** Một dòng của PR. Trùng các trường cần dùng của DailyBug, thêm link bài học. */
export type BugLine = {
  wrong: string;
  right: string;
  right_vi: string;
  why_vi: string;
  words: string[];
  targets: number[];
  title: string;
  href: string;
};

type Props = { date: string; bugs: BugLine[]; practice: BugLine[]; url: string };

/** Tiến độ của một lượt: vị trí đã bấm ở từng dòng, lúc bắt đầu và số giây khi xong. */
type Run = { tries: number[][]; startedAt: number | null; seconds: number | null };
/** Lịch sử theo ngày trên trình duyệt này: điểm của PR mỗi ngày đã chơi xong. */
type History = Record<string, number>;

const RUN_KEY = (date: string) => `epc:pr:${date}`;
const HISTORY_KEY = 'epc:pr:history';

const empty = (n: number): Run => ({ tries: Array.from({ length: n }, () => []), startedAt: null, seconds: null });

function read<T>(key: string, ok: (v: unknown) => v is T): T | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return ok(v) ? v : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Không lưu được (chế độ riêng tư): vẫn chơi được, chỉ không nhớ sau khi tải lại.
  }
}
const isRun = (n: number) => (v: unknown): v is Run =>
  Boolean(v) &&
  typeof v === 'object' &&
  Array.isArray((v as Run).tries) &&
  (v as Run).tries.length === n &&
  (v as Run).tries.every((t) => Array.isArray(t) && t.every((i) => typeof i === 'number'));
const isHistory = (v: unknown): v is History =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v) && Object.values(v as object).every((x) => typeof x === 'number');

const result = (line: BugLine, tries: number[]): LineResult => {
  const hit = tries.findIndex((i) => line.targets.includes(i));
  return hit >= 0 ? { tries: hit + 1, found: true } : { tries: tries.length, found: false };
};
const lineDone = (line: BugLine, tries: number[]) => tries.some((i) => line.targets.includes(i)) || tries.length >= MAX_TRIES;

/** Thời gian tới 00:00 giờ Việt Nam (UTC+7), lúc có PR mới. */
function untilNextPr(now: number): string {
  const vn = now + 7 * 3_600_000;
  const left = Math.ceil((86_400_000 - (vn % 86_400_000)) / 1000);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return `${h} giờ ${String(m).padStart(2, '0')} phút`;
}

/** Ba câu ngẫu nhiên từ kho chơi thêm, khác lượt trước nếu đủ câu. */
function drawPractice(pool: BugLine[], prev: BugLine[]): BugLine[] {
  const rest = pool.filter((b) => !prev.includes(b));
  const from = rest.length >= 3 ? rest : pool;
  return [...from].sort(() => Math.random() - 0.5).slice(0, 3);
}

/**
 * Review PR mỗi ngày (SPEC mục 4c): 3 dòng, mỗi dòng một lỗi dev Việt hay viết. Bấm vào chữ sai,
 * mỗi dòng 3 lần thử, tìm càng sớm càng nhiều điểm. Xong thì có kết luận review, chuỗi ngày và ô kết quả để chia sẻ.
 * Kết quả chỉ lưu trên trình duyệt, không gửi lên máy chủ.
 */
export default function BugGame({ date, bugs, practice, url }: Props) {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily');
  const [lines, setLines] = useState<BugLine[]>(bugs);
  const [run, setRun] = useState<Run>(empty(bugs.length));
  const [history, setHistory] = useState<History>({});
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState<'idle' | 'ok' | 'manual'>('idle');
  const [flash, setFlash] = useState<{ line: number; i: number; hit: boolean } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  // Đọc tiến độ sau khi hydrate, để HTML render sẵn và lần render đầu ở trình duyệt khớp nhau.
  useEffect(() => {
    setRun(read(RUN_KEY(date), isRun(bugs.length)) ?? empty(bugs.length));
    setHistory(read(HISTORY_KEY, isHistory) ?? {});
    setReady(true);
  }, [date, bugs.length]);

  const results = lines.map((l, k) => result(l, run.tries[k] ?? []));
  const current = lines.findIndex((l, k) => !lineDone(l, run.tries[k] ?? []));
  const finished = current === -1;
  const points = totalPoints(results);
  const max = lines.length * MAX_TRIES;
  const playedDays = Object.keys(history);
  const streak = streakFrom(playedDays, date);
  const best = Math.max(0, ...playedDays.map((d) => streakFrom(playedDays.filter((x) => x <= d), d)));

  // Đồng hồ chạy từ lần bấm đầu tới khi xong; đếm ngược tới PR mới khi đã xong.
  useEffect(() => {
    if (finished ? mode !== 'daily' : run.startedAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finished, mode, run.startedAt]);

  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tap(k: number, i: number) {
    const line = lines[k];
    if (!line || k !== current || (run.tries[k] ?? []).includes(i)) return;
    const started = run.startedAt ?? Date.now();
    const tries = run.tries.map((t, j) => (j === k ? [...t, i] : t));
    const done = lines.every((l, j) => lineDone(l, tries[j] ?? []));
    const next: Run = { tries, startedAt: started, seconds: done ? Math.round((Date.now() - started) / 1000) : null };
    setRun(next);
    setFlash({ line: k, i, hit: line.targets.includes(i) });
    if (mode === 'daily') {
      write(RUN_KEY(date), next);
      if (done) {
        const h = { ...history, [date]: totalPoints(lines.map((l, j) => result(l, tries[j] ?? []))) };
        setHistory(h);
        write(HISTORY_KEY, h);
      }
    }
    if (done) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }));
  }

  function startPractice() {
    const next = drawPractice(practice, mode === 'practice' ? lines : []);
    setMode('practice');
    setLines(next);
    setRun(empty(next.length));
    setCopied('idle');
    requestAnimationFrame(() => activeRef.current?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }));
  }

  function backToDaily() {
    setMode('daily');
    setLines(bugs);
    setRun(read(RUN_KEY(date), isRun(bugs.length)) ?? empty(bugs.length));
  }

  async function copyResult() {
    const text = shareText(date, results, run.seconds, streak, url);
    try {
      await navigator.clipboard.writeText(text);
      setCopied('ok');
    } catch {
      setCopied('manual');
    }
  }

  const seconds = run.seconds ?? (run.startedAt === null ? 0 : Math.max(0, Math.round((now - run.startedAt) / 1000)));
  const v = verdict(points, max);
  const title = mode === 'daily' ? `PR ${prNumber(date)}` : 'PR luyện thêm';

  return (
    <div className="pr" data-mode={mode}>
      <div className="pr-head">
        <span className={`pr-state ${finished ? 'merged' : 'open'}`}>{finished ? 'Đã review' : 'Open'}</span>
        <b className="pr-title">
          {title} <span className="muted">fix: {lines.length} câu tiếng Anh trong tin nhắn công việc</span>
        </b>
        <span className="pr-clock" aria-label={`Thời gian review ${formatSeconds(seconds)}`}>
          {formatSeconds(seconds)}
        </span>
      </div>
      <div className="pr-meta">
        <span>Bạn là reviewer</span>
        <span>{lines.length} dòng có lỗi</span>
        <span>Mỗi dòng {MAX_TRIES} lần thử</span>
        <span className="pr-score" aria-live="polite">
          {points}/{max} điểm
        </span>
      </div>

      <ol className="pr-files">
        {lines.map((line, k) => {
          const tries = run.tries[k] ?? [];
          const r = results[k]!;
          const done = lineDone(line, tries);
          const active = k === current;
          const waiting = !done && !active;
          const left = MAX_TRIES - tries.length;
          return (
            <li
              key={`${mode}-${line.wrong}`}
              ref={active ? activeRef : undefined}
              className={`pr-file ${done ? (r.found ? 'is-found' : 'is-missed') : active ? 'is-active' : 'is-waiting'}`}
            >
              <div className="pr-file-head">
                <span className="pr-ln">L{k + 1}</span>
                <span className="pr-file-name">{line.title}</span>
                {done ? (
                  <span className={`pr-pts ${r.found ? 'ok' : 'no'}`}>{r.found ? `+${linePoints(r)}` : '+0'}</span>
                ) : (
                  <span className="pr-pips" aria-label={`Còn ${left} lần thử`}>
                    {Array.from({ length: MAX_TRIES }, (_, n) => (
                      <i key={n} className={n < tries.length ? 'used' : ''} />
                    ))}
                  </span>
                )}
              </div>
              <p className="bug-line" lang="en">
                {line.words.map((w, i) => {
                  const tried = tries.includes(i);
                  const isTarget = line.targets.includes(i);
                  const cls = ['tok', tried && !isTarget ? 'miss' : '', done && isTarget ? 'hit' : '', flash && flash.line === k && flash.i === i ? (flash.hit ? 'pop' : 'shake') : '']
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <span key={i}>
                      <button
                        type="button"
                        className={cls}
                        data-i={i}
                        disabled={!ready || !active || tried}
                        onClick={() => tap(k, i)}
                        aria-label={tried && !isTarget ? `${w}, không phải chỗ sai` : done && isTarget ? `${w}, chỗ sai` : undefined}
                      >
                        {w}
                      </button>{' '}
                    </span>
                  );
                })}
              </p>
              {active && (
                <p className="bug-status" aria-live="polite">
                  {tries.length === 0 ? `Bấm vào chữ sai. Còn ${left} lần thử.` : `Chưa phải chỗ này. Còn ${left} lần thử.`}
                </p>
              )}
              {waiting && <p className="bug-status muted">Đang chờ review dòng trước.</p>}
              {done && (
                <div className="pr-fix answer-in">
                  <p className="bug-status" aria-live="polite">
                    {r.found ? `Bắt được ở lần thử thứ ${r.tries}.` : `Lọt lỗi sau ${MAX_TRIES} lần thử. Chỗ sai đã được tô.`}
                  </p>
                  <ReviewDiffView before={line.wrong} after={line.right} headLeft="Bản sửa">
                    <p className="vi-line">Nghĩa: {line.right_vi}</p>
                    <p>{line.why_vi}</p>
                    <p style={{ margin: 0 }}>
                      <a href={line.href}>Học mẫu câu: {line.title}</a>
                    </p>
                  </ReviewDiffView>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {finished && ready && (
        <div className={`pr-result answer-in v-${v.key}`} ref={resultRef}>
          <div className="pr-stamp" aria-hidden="true">
            {v.label}
          </div>
          <h2 className="pr-verdict">{v.label}</h2>
          <p className="muted">{v.note}</p>
          <p className="pr-grid" aria-label="Ô kết quả: ô đặc là lần tìm ra, ô rỗng là lần bấm sai">
            {resultGrid(results)}
          </p>
          <dl className="pr-stats">
            <div>
              <dt>Điểm</dt>
              <dd>
                {points}/{max}
              </dd>
            </div>
            <div>
              <dt>Thời gian</dt>
              <dd>{formatSeconds(run.seconds ?? 0)}</dd>
            </div>
            {mode === 'daily' && (
              <>
                <div>
                  <dt>Chuỗi ngày</dt>
                  <dd>{streak}</dd>
                </div>
                <div>
                  <dt>Dài nhất</dt>
                  <dd>{best}</dd>
                </div>
              </>
            )}
          </dl>
          {mode === 'daily' ? (
            <>
              <p className="muted pr-next">
                PR mới sau {untilNextPr(now)}. Đã review {playedDays.length} ngày trên trình duyệt này.
              </p>
              <div className="pr-actions">
                <button type="button" className="btn btn-primary" onClick={startPractice} disabled={practice.length < 3}>
                  Chơi thêm 3 câu
                </button>
                <button type="button" className="btn btn-quiet" onClick={copyResult}>
                  {copied === 'ok' ? 'Đã chép' : 'Chép kết quả'}
                </button>
              </div>
              {copied === 'manual' && (
                <textarea className="bug-share-text" rows={5} readOnly value={shareText(date, results, run.seconds, streak, url)} onFocus={(e) => e.currentTarget.select()} />
              )}
              <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 'var(--s-2) 0 0' }}>
                Kết quả chép chỉ có ô và điểm, không lộ đáp án.
              </p>
            </>
          ) : (
            <div className="pr-actions">
              <button type="button" className="btn btn-primary" onClick={startPractice}>
                3 câu khác
              </button>
              <button type="button" className="btn btn-quiet" onClick={backToDaily}>
                Về PR hôm nay
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
