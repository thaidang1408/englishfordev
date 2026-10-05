import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createTestDb, createUser } from './harness';

const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b1';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await createUser(db, A, 'An');
  await createUser(db, B, 'Bình');
}, 60_000);

afterAll(async () => {
  await db.close();
});

const names = async (user: string): Promise<string[]> =>
  (await db.query<{ name: string }>('select name from public.events where user_id = $1 order by id', [user])).rows.map((r) => r.name);

const funnel = async (days: number) =>
  (await db.query<{ f: Record<string, unknown> }>('select public.admin_funnel($1) as f', [days])).rows[0]!.f;

describe('sự kiện ghi bằng trigger', () => {
  it('đăng ký, sửa câu, tạo đơn, trả tiền, liên kết Telegram', async () => {
    await db.exec(`
      insert into public.corrections (user_id, lesson_key, mode, original, result, model) values ('${A}', 'standup-01', 'work', 'I fixed bug', '{}', 't');
      insert into public.orders (user_id, code, plan, amount) values ('${A}', 'EPCAAAAA', '30d', 79000);
      update public.orders set status = 'paid' where code = 'EPCAAAAA';
      update public.orders set status = 'paid' where code = 'EPCAAAAA';
      update public.profiles set telegram_chat_id = 42 where id = '${A}';
      update public.profiles set telegram_chat_id = 42 where id = '${A}';
    `);
    expect(await names(A)).toEqual(['signup', 'correction_request', 'order_create', 'order_paid', 'telegram_linked']);
    const props = await db.query<{ props: unknown }>(`select props from public.events where user_id = '${A}' and name = 'correction_request'`);
    // Không có câu của người dùng trong props.
    expect(props.rows[0]?.props).toEqual({ lesson_key: 'standup-01', mode: 'work' });
  });

  it('không nhận tên sự kiện lạ', async () => {
    await expect(db.exec(`insert into public.events (name) values ('hacked')`)).rejects.toThrow(/events_name_check/);
  });

  it('khách ghi được sự kiện của mình, không ghi thay người khác, không đọc được', async () => {
    await as(db, 'anon', null, () => db.exec(`insert into public.events (anon_id, name) values ('k1', 'page_view')`));
    await expect(
      as(db, 'authenticated', B, () => db.exec(`insert into public.events (user_id, name) values ('${A}', 'page_view')`)),
    ).rejects.toThrow();
    await expect(as(db, 'authenticated', A, () => db.query('select * from public.events'))).rejects.toThrow();
  });

  it('chỉ service role gọi được admin_funnel', async () => {
    await expect(as(db, 'authenticated', A, () => db.query('select public.admin_funnel(7)'))).rejects.toThrow();
    await expect(as(db, 'anon', null, () => db.query('select public.admin_funnel(7)'))).rejects.toThrow();
  });
});

describe('bảng phễu', () => {
  it('đếm người theo từng bước, khách và tài khoản cùng trình duyệt là một người', async () => {
    await db.exec(`
      insert into public.events (anon_id, name, props) values
        ('k1', 'lesson_start', '{"lesson_key":"standup-01"}'),
        ('k1', 'lesson_complete', '{"lesson_key":"standup-01"}'),
        ('k2', 'page_view', null),
        ('k2', 'lesson_start', '{"lesson_key":"standup-02"}');
      insert into public.events (user_id, anon_id, name) values
        ('${A}', 'k1', 'page_view'),
        ('${A}', 'k1', 'placement_complete');
      -- Sự kiện cũ hơn khoảng 7 ngày không được tính.
      insert into public.events (anon_id, name, created_at) values ('k9', 'page_view', now() - interval '10 days');
    `);
    const f = await funnel(7);
    expect(f).toMatchObject({
      visitors: 2,
      lesson1_start: 1,
      lesson1_complete: 1,
      signup: 2,
      placement: 1,
      first_correction: 1,
      order_create: 1,
      order_paid: 1,
    });
    expect((await funnel(30)).visitors).toBe(3);
  });

  it('quay lại ngày 1: có hoạt động đúng ngày sau ngày đăng ký', async () => {
    const C = '00000000-0000-4000-8000-0000000000c1';
    const D = '00000000-0000-4000-8000-0000000000d1';
    await createUser(db, C);
    await createUser(db, D);
    await db.exec(`
      update public.events set created_at = now() - interval '1 day' where name = 'signup' and user_id in ('${C}', '${D}');
      insert into public.events (user_id, name) values ('${C}', 'page_view');
    `);
    const d1 = (await funnel(7)).retention as Record<string, { cohort: number; returned: number }>;
    expect(d1.d1).toEqual({ cohort: 2, returned: 1 });
  });
});
