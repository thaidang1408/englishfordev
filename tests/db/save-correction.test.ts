import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser } from './harness';

const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b1';

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
}, 60_000);

afterAll(async () => {
  await db.close();
});

type Opts = { user?: string; ownErrors?: boolean; limit?: number; cap?: number };

const SQL = `select public.save_correction($1, 'standup-01', 'work', 'Yesterday I have fixed bug.', $2::jsonb, 'test',
  $3, now() + interval '1 day', $4, now() - interval '1 day', $5, now() - interval '1 day') as r`;

async function save(o: Opts = {}) {
  const res = await db.query<{ r: { status: string; id?: string } }>(SQL, [
    o.user ?? A,
    JSON.stringify(RESULT),
    o.ownErrors ?? true,
    o.limit ?? 10,
    o.cap ?? 500,
  ]);
  return res.rows[0]?.r;
}

const scalar = async (sql: string, params: unknown[] = []) =>
  (await db.query<{ n: number }>(sql, params)).rows[0]?.n ?? -1;

describe('save_correction', () => {
  it('ghi một dòng corrections và một mục own_error cho mỗi chỗ sửa', async () => {
    const r = await as(db, 'service_role', null, () => save());
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
    const r = await as(db, 'service_role', null, () => save({ user: B, ownErrors: false, limit: 1 }));
    expect(r?.status).toBe('ok');
    expect(await scalar(`select count(*)::int as n from public.review_items where user_id = $1`, [B])).toBe(0);
  });

  it('đã đủ hạn mức thì trả quota và không ghi gì', async () => {
    const before = await scalar('select count(*)::int as n from public.corrections');
    const r = await as(db, 'service_role', null, () => save({ user: B, ownErrors: false, limit: 1 }));
    expect(r).toEqual({ status: 'quota' });
    expect(await scalar('select count(*)::int as n from public.corrections')).toBe(before);
  });

  it('đủ tổng lượt toàn hệ thống trong ngày thì trả cap và không ghi gì', async () => {
    const total = await scalar('select count(*)::int as n from public.corrections');
    const r = await as(db, 'service_role', null, () => save({ cap: total }));
    expect(r).toEqual({ status: 'cap' });
    expect(await scalar('select count(*)::int as n from public.corrections')).toBe(total);
  });

  it('người dùng đăng nhập và khách không gọi được hàm này', async () => {
    await expect(as(db, 'authenticated', A, () => save())).rejects.toThrow(/permission denied/);
    await expect(as(db, 'anon', null, () => save())).rejects.toThrow(/permission denied/);
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
      db.query(`update public.review_items set box = 2 where kind = 'own_error' returning id`),
    );
    expect(own.rows.length).toBe(2);
    const other = await as(db, 'authenticated', B, () =>
      db.query(`update public.review_items set box = 3 where user_id = $1 returning id`, [A]),
    );
    expect(other.rows.length).toBe(0);
  });
});
