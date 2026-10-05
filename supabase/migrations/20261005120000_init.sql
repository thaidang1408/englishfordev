-- EPC bản 1: bảng theo docs/SPEC.md mục 8.
-- RLS bật trên mọi bảng. Người dùng chỉ đọc dòng của mình.
-- entitlements, orders, corrections chỉ ghi từ server bằng service role.
-- Supabase mặc định cấp mọi quyền trên bảng public cho anon và authenticated,
-- nên migration thu hồi rồi cấp lại đúng những quyền cần, để quyền không chỉ dựa vào policy.

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  level text check (level in ('basic', 'intermediate', 'good')),
  weak_area text check (weak_area in ('reading', 'grammar', 'polite')),
  track text not null default 'standup' check (track in ('standup', 'writing', 'interview')),
  standup_time time not null default '09:00',
  interview_date date,
  telegram_chat_id bigint,
  telegram_link_token text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: đọc hồ sơ của mình" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: sửa hồ sơ của mình" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- Chỉ các cột hồ sơ. telegram_chat_id và telegram_link_token chỉ server ghi.
grant update (display_name, level, weak_area, track, standup_time, interview_date) on public.profiles to authenticated;

-- ============ entitlements ============
create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  premium_until timestamptz,
  trial_until timestamptz
);

alter table public.entitlements enable row level security;

create policy "entitlements: đọc quyền của mình" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

-- ============ lesson_progress ============
create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_key text not null check (lesson_key ~ '^(standup|writing|interview)-[0-9]{2}$'),
  score int not null check (score between 0 and 5),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_key)
);

alter table public.lesson_progress enable row level security;

create policy "lesson_progress: đọc của mình" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lesson_progress: thêm cho mình" on public.lesson_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lesson_progress: sửa của mình" on public.lesson_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.lesson_progress from anon, authenticated;
grant select, insert, update on public.lesson_progress to authenticated;

create index lesson_progress_completed_at_idx on public.lesson_progress (user_id, completed_at);

-- ============ review_items ============
create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('quiz', 'own_error')),
  lesson_key text,
  ref text not null, -- quiz: id câu trắc nghiệm; own_error: id lần sửa + vị trí chỗ sửa
  payload jsonb,
  -- Leitner: 1, 2, 3, 4 ứng với 1, 3, 7, 14 ngày. 5 là đã thuộc.
  box int not null default 1 check (box between 1 and 5),
  due_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.review_items enable row level security;

create policy "review_items: đọc của mình" on public.review_items
  for select to authenticated using ((select auth.uid()) = user_id);
-- Người dùng chỉ tự tạo mục ôn quiz. own_error do server tạo sau khi AI sửa câu (Premium).
create policy "review_items: thêm mục quiz cho mình" on public.review_items
  for insert to authenticated with check ((select auth.uid()) = user_id and kind = 'quiz');
create policy "review_items: sửa của mình" on public.review_items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.review_items from anon, authenticated;
grant select on public.review_items to authenticated;
grant insert (user_id, kind, lesson_key, ref, payload, box, due_at) on public.review_items to authenticated;
-- Ôn tập chỉ đổi mức và hạn ôn.
grant update (box, due_at) on public.review_items to authenticated;

-- Mỗi câu trắc nghiệm hay chỗ sửa chỉ có một mục ôn cho mỗi người.
alter table public.review_items add constraint review_items_user_kind_ref_key unique (user_id, kind, ref);
create index review_items_user_due_idx on public.review_items (user_id, due_at);

-- ============ corrections ============
create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_key text,
  mode text not null default 'work' check (mode in ('work', 'interview')),
  original text not null,
  result jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

alter table public.corrections enable row level security;

create policy "corrections: đọc của mình" on public.corrections
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.corrections from anon, authenticated;
grant select on public.corrections to authenticated;

create index corrections_user_created_idx on public.corrections (user_id, created_at);
-- Đếm tổng số lần gọi AI toàn hệ thống trong ngày (AI_DAILY_CALL_CAP).
create index corrections_created_idx on public.corrections (created_at);

-- ============ orders ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null unique,
  plan text not null check (plan in ('30d', '90d')),
  amount int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.orders enable row level security;

create policy "orders: đọc đơn của mình" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;

create index orders_user_idx on public.orders (user_id, created_at);
create index orders_status_idx on public.orders (status, created_at);

-- ============ events ============
create table public.events (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  anon_id text,
  name text not null,
  props jsonb,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Cho ghi, không cho đọc từ client.
create policy "events: ghi sự kiện" on public.events
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

revoke all on public.events from anon, authenticated;
grant insert (user_id, anon_id, name, props) on public.events to anon, authenticated;
grant usage on sequence public.events_id_seq to anon, authenticated;

create index events_created_idx on public.events (created_at);
create index events_name_created_idx on public.events (name, created_at);

-- ============ người dùng mới ============
-- Tạo hồ sơ và 7 ngày dùng thử. Mỗi tài khoản chỉ có một dòng entitlements, nên chỉ một lần dùng thử.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, telegram_link_token)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80),
    replace(gen_random_uuid()::text, '-', '')
  );
  insert into public.entitlements (user_id, trial_until)
  values (new.id, now() + interval '7 days');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
