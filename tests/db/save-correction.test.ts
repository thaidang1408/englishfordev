import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser } from './harness';

const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b1';
const C = '00000000-0000-4000-8000-0000000000c1';
const D = '00000000-0000-4000-8000-0000000000d1';

const RESULT = {
  is_already_correct: false,
  corrected: 'Yesterday I fixed the bug.',
  corrected_vi: 'Hôm qua mình đã sửa bug.',
  changes: [
    { from: 'have fixed', to: 'fixed', why_vi: 'Quá khứ đơn.', category: 'tense' },
    { from: 'bug', to: 'the bug', why_vi: 'Cần mạo từ.', category: 'article' },
  ],
  tip_vi: '',
};

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, A, 'An');
  await createUser(db, B, 'Bình');
  await createUser(db, C, 'Chi');
  await createUser(db, D, 'Dũng');
}, 60_000);

afterAll(async () => {
  await db.close();
});

type Reserve = { status: string; id?: string; used?: number };
type ReserveOpts = { user?: string; limit?: number; cap?: number; premium?: boolean };

async function reserve(o: ReserveOpts = {}): Promise<Reserve | undefined> {
  const res = await db.query<{ r: Reserve }>(
    `select public.reserve_ai_call($1, $2, now() - interval '1 day', $3, $4, now() - interval '1 day') as r`,
    [o.user ?? A, o.limit ?? 10, o.cap ?? 500, o.premium ?? false],
  );
  return res.rows[0]?.r;
}

async function save(reservationId: string, ownErrors = true) {
  const res = await db.query<{ r: { status: string; id?: string } }>(
    `select public.save_correction($1, 'standup-01', 'work', 'Yesterday I have fixed bug.', $2::jsonb, 'test', $3, now() + interval '1 day') as r`,
    [reservationId, JSON.stringify(RESULT), ownErrors],
  );
  return res.rows[0]?.r;
}

const release = (id: string) => db.query('select public.release_ai_call($1)', [id]);
const svc = <T>(fn: () => Promise<T>) => as(db, 'service_role', null, fn);

const scalar = async (sql: string, params: unknown[] = []) =>
  (await db.query<{ n: number }>(sql, params)).rows[0]?.n ?? -1;
const totalCalls = () => scalar('select coalesce(sum(calls), 0)::int as n from public.ai_reservations');

describe('save_correction', () => {
  it('ghi một dòng corrections và một mục own_error cho mỗi chỗ sửa', async () => {
    const r = await svc(async () => save((await reserve())!.id!));
    expect(r?.status).toBe('ok');
    expect(await scalar('select count(*)::int as n from public.corrections where user_id = $1', [A])).toBe(1);
    const items = await db.query<{ ref: string; box: number; payload: { from: string; to: string; original: string; corrected_vi: string } }>(
      `select ref, box, payload from public.review_items where user_id = $1 and kind = 'own_error' order by ref`,
      [A],
    );
    expect(items.rows.map((i) => i.ref)).toEqual([`${r?.id}:0`, `${r?.id}:1`]);
    expect(items.rows[0]).toMatchObject({ box: 1, payload: { from: 'have fixed', to: 'fixed', original: 'Yesterday I have fixed bug.', corrected_vi: 'Hôm qua mình đã sửa bug.' } });
  });

  it('tài khoản miễn phí: lưu lần sửa nhưng không tạo mục ôn', async () => {
    const r = await svc(async () => save((await reserve({ user: B, limit: 1 }))!.id!, false));
    expect(r?.status).toBe('ok');
    expect(await scalar(`select count(*)::int as n from public.review_items where user_id = $1`, [B])).toBe(0);
  });

  it('chỗ giữ đã dùng thì không lưu lần hai', async () => {
    const id = (await svc(() => reserve({ user: D })))!.id!;
    await svc(() => save(id));
    await expect(svc(() => save(id))).rejects.toThrow(/pending/);
  });

  it('người dùng đăng nhập và khách không gọi được các hàm này', async () => {
    for (const role of ['authenticated', 'anon'] as const) {
      await expect(as(db, role, role === 'anon' ? null : A, () => reserve())).rejects.toThrow(/permission denied/);
      await expect(as(db, role, null, () => release(A))).rejects.toThrow(/permission denied/);
      await expect(as(db, role, null, () => save(A))).rejects.toThrow(/permission denied/);
    }
    await expect(as(db, 'authenticated', A, () => db.query('select * from public.ai_reservations'))).rejects.toThrow(/permission denied/);
  });

  it('người dùng không tự thêm được mục own_error', async () => {
    await expect(
      as(db, 'authenticated', A, () =>
        db.query(`insert into public.review_items (user_id, kind, ref, due_at) values ($1, 'own_error', 'x:0', now())`, [A]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('người dùng tự chấm được mục own_error của mình, không đụng được của người khác', async () => {
    const own = await as(db, 'authenticated', A, () =>
      db.query(`update public.review_items set box = 2 where kind = 'own_error' and user_id = $1 returning id`, [A]),
    );
    expect(own.rows.length).toBe(2);
    const other = await as(db, 'authenticated', B, () =>
      db.query(`update public.review_items set box = 3 where user_id = $1 returning id`, [A]),
    );
    expect(other.rows.length).toBe(0);
  });
});

describe('reserve_ai_call', () => {
  it('còn một request đang chạy thì trả busy; xong thì gửi tiếp được', async () => {
    const first = await svc(() => reserve({ user: C }));
    expect(first).toMatchObject({ status: 'ok', used: 1 });
    expect(await svc(() => reserve({ user: C }))).toEqual({ status: 'busy' });
    await svc(() => save(first!.id!));
    expect(await svc(() => reserve({ user: C }))).toMatchObject({ status: 'ok', used: 2 });
  });

  it('hết lượt thì trả quota, tính cả lượt đang giữ', async () => {
    expect(await svc(() => reserve({ user: B, limit: 1 }))).toEqual({ status: 'quota' });
  });

  it('AI lỗi: trả lại lượt cho người dùng nhưng vẫn tính lần gọi AI', async () => {
    const r = await svc(() => reserve({ user: B, limit: 2 }));
    expect(r).toMatchObject({ status: 'ok', used: 2 });
    const calls = await totalCalls();
    await svc(() => release(r!.id!));
    expect(await totalCalls()).toBe(calls);
    // Lượt thứ 2 vẫn còn, và không còn bị coi là đang chạy.
    expect(await svc(() => reserve({ user: B, limit: 2 }))).toMatchObject({ status: 'ok', used: 2 });
  });

  it('mỗi lần giữ chỗ tính 2 lần gọi AI vào tổng trong ngày', async () => {
    const before = await totalCalls();
    const r = await svc(() => reserve({ user: D }));
    expect(await totalCalls()).toBe(before + 2);
    await svc(() => release(r!.id!));
  });

  it('không Premium dừng ở 80% tổng lượt, Premium dùng tới 100%', async () => {
    const total = await totalCalls();
    // total vừa bằng 80% cap: người không Premium bị chặn, Premium vẫn qua.
    const cap = Math.ceil(total / 0.8);
    expect(Math.floor(cap * 0.8)).toBeLessThanOrEqual(total);
    expect(await svc(() => reserve({ user: D, cap }))).toEqual({ status: 'cap' });
    const p = await svc(() => reserve({ user: D, cap, premium: true }));
    expect(p?.status).toBe('ok');
    await svc(() => release(p!.id!));
    expect(await svc(() => reserve({ user: D, cap: total + 2, premium: true }))).toEqual({ status: 'cap' });
  });
});
