import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser } from './harness';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, A, 'An');
  await createUser(db, B, 'Bình');
  // Dữ liệu của B, ghi bằng quyền server.
  await db.exec(`
    insert into public.lesson_progress (user_id, lesson_key, score) values ('${B}', 'standup-01', 4);
    insert into public.review_items (user_id, kind, lesson_key, ref, due_at) values ('${B}', 'quiz', 'standup-01', 's01q2', now());
    insert into public.corrections (user_id, original, result, model) values ('${B}', 'I fixed bug', '{}', 'test');
    insert into public.orders (user_id, code, plan, amount) values ('${B}', 'EPCABCDE', '30d', 79000);
    insert into public.events (user_id, name) values ('${B}', 'signup');
  `);
}, 60_000);

afterAll(async () => {
  await db.close();
});

const count = async (table: string): Promise<number> => {
  const r = await db.query<{ n: number }>(`select count(*)::int as n from public.${table}`);
  return r.rows[0]?.n ?? -1;
};

describe('người dùng mới', () => {
  it('được tạo hồ sơ và 7 ngày dùng thử', async () => {
    const r = await db.query<{ display_name: string; days: number; token: string }>(
      `select p.display_name, p.telegram_link_token as token,
              round(extract(epoch from e.trial_until - now()) / 86400)::int as days
       from public.profiles p join public.entitlements e on e.user_id = p.id where p.id = $1`,
      [A],
    );
    expect(r.rows[0]?.display_name).toBe('An');
    expect(r.rows[0]?.days).toBe(7);
    expect(r.rows[0]?.token).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('RLS: A không đọc được dữ liệu của B', () => {
  for (const table of ['lesson_progress', 'review_items', 'corrections', 'orders']) {
    it(`bảng ${table}`, async () => {
      const n = await as(db, 'authenticated', A, () => count(table));
      expect(n).toBe(0);
      const own = await as(db, 'authenticated', B, () => count(table));
      expect(own).toBe(1);
    });
  }

  it('bảng profiles và entitlements chỉ thấy dòng của mình', async () => {
    const ids = await as(db, 'authenticated', A, async () => ({
      profiles: (await db.query<{ id: string }>('select id from public.profiles')).rows.map((r) => r.id),
      entitlements: (await db.query<{ user_id: string }>('select user_id from public.entitlements')).rows.map((r) => r.user_id),
    }));
    expect(ids).toEqual({ profiles: [A], entitlements: [A] });
  });

  it('không ai đọc được bảng events từ client', async () => {
    await expect(as(db, 'authenticated', B, () => count('events'))).rejects.toThrow(/permission denied/);
    await expect(as(db, 'anon', null, () => count('events'))).rejects.toThrow(/permission denied/);
  });

  it('khách chưa đăng nhập không đọc được bảng nào', async () => {
    for (const table of ['profiles', 'entitlements', 'lesson_progress', 'review_items', 'corrections', 'orders']) {
      await expect(as(db, 'anon', null, () => count(table))).rejects.toThrow(/permission denied/);
    }
  });
});

describe('RLS: A không ghi được dữ liệu của B', () => {
  it('không thêm tiến độ học cho B', async () => {
    await expect(
      as(db, 'authenticated', A, () =>
        db.query(`insert into public.lesson_progress (user_id, lesson_key, score) values ($1, 'standup-02', 5)`, [B]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('không sửa được tiến độ hay mục ôn của B', async () => {
    const r = await as(db, 'authenticated', A, async () => ({
      progress: (await db.query(`update public.lesson_progress set score = 0 where user_id = $1`, [B])).affectedRows,
      review: (await db.query(`update public.review_items set box = 4 where user_id = $1`, [B])).affectedRows,
    }));
    expect(r).toEqual({ progress: 0, review: 0 });
  });

  it('không sửa được hồ sơ của B', async () => {
    const r = await as(db, 'authenticated', A, () =>
      db.query(`update public.profiles set display_name = 'x' where id = $1`, [B]),
    );
    expect(r.affectedRows).toBe(0);
  });

  it('không ghi sự kiện mạo danh B', async () => {
    await expect(
      as(db, 'authenticated', A, () => db.query(`insert into public.events (user_id, name) values ($1, 'signup')`, [B])),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('quyền chỉ server được ghi', () => {
  it('người dùng không tự sửa được premium_until và trial_until', async () => {
    for (const col of ['premium_until', 'trial_until']) {
      await expect(
        as(db, 'authenticated', A, () =>
          db.query(`update public.entitlements set ${col} = now() + interval '1 year' where user_id = $1`, [A]),
        ),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it('người dùng không tự tạo được đơn, lượt sửa câu hay quyền', async () => {
    const attempts = [
      `insert into public.orders (user_id, code, plan, amount, status) values ('${A}', 'EPCZZZZZ', '30d', 1, 'paid')`,
      `insert into public.corrections (user_id, original, result, model) values ('${A}', 'x', '{}', 'x')`,
      `insert into public.entitlements (user_id, premium_until) values ('${A}', now())`,
      `delete from public.corrections`,
    ];
    for (const sql of attempts) {
      await expect(as(db, 'authenticated', A, () => db.exec(sql))).rejects.toThrow(/permission denied/);
    }
  });

  it('người dùng không tự đặt được chat Telegram, token liên kết, hay ngày đã nhắc', async () => {
    for (const col of ['telegram_chat_id = 123', `telegram_link_token = 'x'`, `reminded_on = '2030-01-01'`, `reported_on = '2030-01-01'`]) {
      await expect(
        as(db, 'authenticated', A, () => db.query(`update public.profiles set ${col} where id = $1`, [A])),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it('người dùng không tự tạo được mục ôn own_error', async () => {
    await expect(
      as(db, 'authenticated', A, () =>
        db.query(`insert into public.review_items (user_id, kind, ref, due_at) values ($1, 'own_error', 'x', now())`, [A]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('việc người dùng được tự làm', () => {
  it('lưu tiến độ, mục ôn quiz và sửa hồ sơ của chính mình', async () => {
    await as(db, 'authenticated', A, async () => {
      await db.query(`insert into public.lesson_progress (user_id, lesson_key, score) values ($1, 'standup-01', 5)`, [A]);
      await db.query(
        `insert into public.review_items (user_id, kind, lesson_key, ref, due_at) values ($1, 'quiz', 'standup-01', 's01q1', now())`,
        [A],
      );
      await db.query(`update public.review_items set box = 2, due_at = now() + interval '3 days' where user_id = $1`, [A]);
      await db.query(`update public.profiles set standup_time = '08:30', level = 'good' where id = $1`, [A]);
    });
    const r = await db.query<{ box: number; t: string }>(
      `select r.box, p.standup_time::text as t from public.review_items r join public.profiles p on p.id = r.user_id where r.user_id = $1`,
      [A],
    );
    expect(r.rows[0]).toEqual({ box: 2, t: '08:30:00' });
  });

  it('làm lại bài: ghi đè điểm của mình và đưa câu sai đã có về mức 1 (câu lệnh PostgREST sinh ra)', async () => {
    await as(db, 'authenticated', A, async () => {
      // upsert onConflict user_id,lesson_key (merge-duplicates) ghi lại mọi cột gửi lên.
      await db.query(
        `insert into public.lesson_progress (user_id, lesson_key, score, completed_at) values ($1, 'standup-01', 2, now())
         on conflict (user_id, lesson_key) do update set user_id = excluded.user_id, lesson_key = excluded.lesson_key,
           score = excluded.score, completed_at = excluded.completed_at`,
        [A],
      );
      // upsert ignoreDuplicates rồi update box, due_at cho câu đã có.
      await db.query(
        `insert into public.review_items (user_id, kind, lesson_key, ref, box, due_at) values ($1, 'quiz', 'standup-01', 's01q1', 1, now())
         on conflict (user_id, kind, ref) do nothing`,
        [A],
      );
      await db.query(
        `update public.review_items set box = 1, due_at = now() + interval '1 day' where user_id = $1 and kind = 'quiz' and ref in ('s01q1')`,
        [A],
      );
    });
    const r = await db.query<{ score: number; box: number }>(
      `select p.score, r.box from public.lesson_progress p join public.review_items r on r.user_id = p.user_id
       where p.user_id = $1 and p.lesson_key = 'standup-01' and r.ref = 's01q1'`,
      [A],
    );
    expect(r.rows).toEqual([{ score: 2, box: 1 }]);
  });

  it('upsert không ghi đè được điểm của người khác', async () => {
    await expect(
      as(db, 'authenticated', A, () =>
        db.query(
          `insert into public.lesson_progress (user_id, lesson_key, score) values ($1, 'standup-01', 0)
           on conflict (user_id, lesson_key) do update set score = excluded.score`,
          [B],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    const r = await db.query<{ score: number }>(`select score from public.lesson_progress where user_id = $1`, [B]);
    expect(r.rows[0]?.score).toBe(4);
  });

  it('khách chưa đăng nhập ghi được sự kiện không gắn người dùng', async () => {
    const before = await count('events');
    await as(db, 'anon', null, () => db.query(`insert into public.events (anon_id, name) values ('k1', 'page_view')`));
    expect(await count('events')).toBe(before + 1);
  });
});

describe('Telegram', () => {
  it('một chat Telegram chỉ gắn với một tài khoản', async () => {
    await db.query('update public.profiles set telegram_chat_id = 777 where id = $1', [A]);
    await expect(db.query('update public.profiles set telegram_chat_id = 777 where id = $1', [B])).rejects.toThrow(/unique|duplicate/);
    await db.query('update public.profiles set telegram_chat_id = null where id = $1', [A]);
  });
});
