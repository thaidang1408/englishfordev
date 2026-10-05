-- M7: sự kiện phễu và bảng phễu trong /admin (SPEC mục 10).
-- Sự kiện xảy ra ở database (đăng ký, sửa câu, tạo đơn, trả tiền, liên kết Telegram) ghi bằng trigger,
-- nên client không giả được và code server không cần nhớ ghi. Sự kiện trên trình duyệt đi qua POST /api/events.
-- trial_end do cron ghi. Không ghi nội dung câu của người dùng.

-- Chỉ nhận đúng 13 tên ở SPEC mục 10.
alter table public.events add constraint events_name_check check (name in (
  'page_view', 'lesson_start', 'lesson_complete', 'signup', 'placement_complete', 'correction_request',
  'paywall_view', 'order_create', 'order_paid', 'review_complete', 'telegram_linked',
  'mock_interview_complete', 'trial_end'
));

create index events_user_created_idx on public.events (user_id, created_at) where user_id is not null;

-- ============ trigger ghi sự kiện ============
create function public.log_db_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'corrections' then
    insert into public.events (user_id, name, props)
    values (new.user_id, 'correction_request', jsonb_strip_nulls(jsonb_build_object('lesson_key', new.lesson_key, 'mode', new.mode)));
  elsif tg_table_name = 'orders' and tg_op = 'INSERT' then
    insert into public.events (user_id, name, props) values (new.user_id, 'order_create', jsonb_build_object('plan', new.plan));
  elsif tg_table_name = 'orders' then
    insert into public.events (user_id, name, props) values (new.user_id, 'order_paid', jsonb_build_object('plan', new.plan));
  elsif tg_table_name = 'profiles' then
    insert into public.events (user_id, name) values (new.id, 'telegram_linked');
  end if;
  return null;
end;
$$;

revoke execute on function public.log_db_event() from public, anon, authenticated;

create trigger corrections_event after insert on public.corrections
  for each row execute function public.log_db_event();
create trigger orders_create_event after insert on public.orders
  for each row execute function public.log_db_event();
create trigger orders_paid_event after update of status on public.orders
  for each row when (new.status = 'paid' and old.status is distinct from 'paid')
  execute function public.log_db_event();
create trigger profiles_telegram_event after update of telegram_chat_id on public.profiles
  for each row when (new.telegram_chat_id is not null and old.telegram_chat_id is null)
  execute function public.log_db_event();

-- signup: ghi cùng lúc tạo hồ sơ và dùng thử.
create function public.log_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.events (user_id, name) values (new.id, 'signup');
  return null;
end;
$$;

revoke execute on function public.log_signup() from public, anon, authenticated;

create trigger on_auth_user_created_event after insert on auth.users
  for each row execute function public.log_signup();

-- ============ bảng phễu ============
-- Số người ở mỗi bước trong p_days ngày gần nhất, và tỷ lệ quay lại ngày 1, 7, 30.
-- Người: anon_id nếu có (khách và người đã đăng nhập trên cùng trình duyệt là một), không thì user_id.
-- Quay lại ngày N: có sự kiện đúng ngày thứ N sau ngày đăng ký (giờ Việt Nam). Nhóm tính là những người
-- có ngày thứ N rơi vào khoảng p_days ngày, để ngày 30 vẫn có số trong bảng 7 ngày.
create function public.admin_funnel(p_days int)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with since as (
    select now() - make_interval(days => p_days) as at,
           (now() at time zone 'Asia/Ho_Chi_Minh')::date as today
  ),
  ev as (
    select e.*, coalesce(e.anon_id, e.user_id::text) as actor
    from public.events e, since
    where e.created_at >= since.at
  ),
  first_fix as (
    select user_id from public.events where name = 'correction_request' and user_id is not null
    group by user_id having min(created_at) >= (select at from since)
  ),
  signups as (
    select user_id, min((created_at at time zone 'Asia/Ho_Chi_Minh')::date) as day
    from public.events where name = 'signup' and user_id is not null group by user_id
  ),
  active as (
    select distinct user_id, (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day
    from public.events where user_id is not null and name <> 'signup'
  ),
  ret as (
    select n,
           count(*)::int as cohort,
           count(*) filter (where exists (select 1 from active a where a.user_id = s.user_id and a.day = s.day + n))::int as returned
    from unnest(array[1, 7, 30]) as n
    cross join signups s, since
    where s.day + n between since.today - p_days + 1 and since.today
    group by n
  )
  select jsonb_build_object(
    'visitors', (select count(distinct actor) from ev where name = 'page_view'),
    'lesson1_start', (select count(distinct actor) from ev where name = 'lesson_start' and props->>'lesson_key' = 'standup-01'),
    'lesson1_complete', (select count(distinct actor) from ev where name = 'lesson_complete' and props->>'lesson_key' = 'standup-01'),
    'signup', (select count(distinct user_id) from ev where name = 'signup'),
    'placement', (select count(distinct user_id) from ev where name = 'placement_complete'),
    'first_correction', (select count(*) from first_fix),
    'order_create', (select count(distinct user_id) from ev where name = 'order_create'),
    'order_paid', (select count(distinct user_id) from ev where name = 'order_paid'),
    'retention', coalesce((select jsonb_object_agg('d' || n, jsonb_build_object('cohort', cohort, 'returned', returned)) from ret), '{}'::jsonb)
  );
$$;

revoke execute on function public.admin_funnel(int) from public, anon, authenticated;
grant execute on function public.admin_funnel(int) to service_role;
