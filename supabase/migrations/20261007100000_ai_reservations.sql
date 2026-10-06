-- M11: giữ chỗ trước khi gọi AI (SPEC mục 7), để request song song không đốt quota AI.
-- Lượt của người dùng bị trừ lúc giữ chỗ, không phải lúc lưu. AI lỗi thì trả lại lượt,
-- nhưng số lần gọi AI toàn hệ thống vẫn giữ vì đã tốn tiền thật.
-- Mỗi lần giữ chỗ tính 2 lần gọi AI: correctWith gọi tối đa 2 lần (gọi lại khi sai schema hoặc thiếu nghĩa tiếng Việt).
-- Tài khoản không Premium dừng ở 80% AI_DAILY_CALL_CAP, 20% còn lại dành cho người trả tiền.
-- Chỉ server gọi được (service role).

create table public.ai_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calls int not null,
  -- pending: đang gọi AI; done: đã lưu kết quả; failed: AI lỗi, không tính vào lượt của người dùng.
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.ai_reservations enable row level security;
revoke all on public.ai_reservations from anon, authenticated;

create index ai_reservations_user_created_idx on public.ai_reservations (user_id, created_at);
create index ai_reservations_created_idx on public.ai_reservations (created_at);

-- Lượt đã dùng trước đây giờ đếm từ bảng này, nên chép các lần sửa cũ sang.
insert into public.ai_reservations (user_id, calls, status, created_at, finished_at)
select user_id, 1, 'done', created_at, created_at from public.corrections;

-- Giữ chỗ: busy khi người dùng còn một request đang chạy (dưới 90 giây), quota khi hết lượt,
-- cap khi đủ tổng lần gọi AI trong ngày. ok thì trả id giữ chỗ và số lượt đã dùng tính cả lần này.
create function public.reserve_ai_call(
  p_user_id uuid,
  p_limit int,
  p_since timestamptz,
  p_daily_cap int,
  p_premium boolean,
  p_cap_since timestamptz
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_used int;
  v_id uuid;
begin
  -- ponytail: một khóa chung cho mọi người dùng (giao dịch vài ms); tách khóa theo người dùng khi lượng request lớn.
  perform pg_advisory_xact_lock(hashtextextended('reserve_ai_call', 0));

  if exists (
    select 1 from public.ai_reservations
    where user_id = p_user_id and status = 'pending' and created_at > now() - interval '90 seconds'
  ) then
    return jsonb_build_object('status', 'busy');
  end if;

  select count(*) into v_used from public.ai_reservations
  where user_id = p_user_id and status <> 'failed' and created_at >= p_since;
  if v_used >= p_limit then
    return jsonb_build_object('status', 'quota');
  end if;

  if (select coalesce(sum(calls), 0) from public.ai_reservations where created_at >= p_cap_since)
     >= (case when p_premium then p_daily_cap else floor(p_daily_cap * 0.8) end) then
    return jsonb_build_object('status', 'cap');
  end if;

  insert into public.ai_reservations (user_id, calls) values (p_user_id, 2) returning id into v_id;
  return jsonb_build_object('status', 'ok', 'id', v_id, 'used', v_used + 1);
end;
$$;

-- AI lỗi: trả lại lượt cho người dùng, giữ số lần gọi AI.
create function public.release_ai_call(p_reservation_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.ai_reservations set status = 'failed', finished_at = now()
  where id = p_reservation_id and status = 'pending';
$$;

-- save_correction không kiểm hạn mức nữa: lượt đã trừ lúc giữ chỗ. Người dùng lấy từ chỗ giữ.
drop function public.save_correction(uuid, text, text, text, jsonb, text, boolean, timestamptz, int, timestamptz, int, timestamptz);

create function public.save_correction(
  p_reservation_id uuid,
  p_lesson_key text,
  p_mode text,
  p_original text,
  p_result jsonb,
  p_model text,
  p_own_errors boolean,
  p_due_at timestamptz
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_id uuid;
  v_change jsonb;
  v_index int := 0;
begin
  update public.ai_reservations set status = 'done', finished_at = now()
  where id = p_reservation_id and status = 'pending'
  returning user_id into v_user_id;
  if v_user_id is null then
    raise exception 'ai_reservation không ở trạng thái pending';
  end if;

  insert into public.corrections (user_id, lesson_key, mode, original, result, model)
  values (v_user_id, p_lesson_key, p_mode, p_original, p_result, p_model)
  returning id into v_id;

  if p_own_errors then
    for v_change in select value from jsonb_array_elements(coalesce(p_result -> 'changes', '[]'::jsonb))
    loop
      insert into public.review_items (user_id, kind, lesson_key, ref, payload, box, due_at)
      values (
        v_user_id,
        'own_error',
        p_lesson_key,
        v_id::text || ':' || v_index,
        jsonb_build_object(
          'original', p_original,
          'corrected', p_result ->> 'corrected',
          'corrected_vi', coalesce(p_result ->> 'corrected_vi', ''),
          'from', v_change ->> 'from',
          'to', v_change ->> 'to',
          'why_vi', v_change ->> 'why_vi',
          'category', v_change ->> 'category'
        ),
        1,
        p_due_at
      );
      v_index := v_index + 1;
    end loop;
  end if;

  return jsonb_build_object('status', 'ok', 'id', v_id);
end;
$$;

revoke execute on function public.reserve_ai_call(uuid, int, timestamptz, int, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_ai_call(uuid, int, timestamptz, int, boolean, timestamptz) to service_role;
revoke execute on function public.release_ai_call(uuid) from public, anon, authenticated;
grant execute on function public.release_ai_call(uuid) to service_role;
revoke execute on function public.save_correction(uuid, text, text, text, jsonb, text, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.save_correction(uuid, text, text, text, jsonb, text, boolean, timestamptz) to service_role;
