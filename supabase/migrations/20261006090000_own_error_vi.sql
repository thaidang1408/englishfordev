-- M8: mục ôn own_error giữ thêm nghĩa tiếng Việt của câu đã sửa (SPEC mục 14).
-- Thân hàm giữ nguyên như 20261005130000_save_correction.sql, chỉ thêm khóa corrected_vi vào payload.

create or replace function public.save_correction(
  p_user_id uuid,
  p_lesson_key text,
  p_mode text,
  p_original text,
  p_result jsonb,
  p_model text,
  p_own_errors boolean,
  p_due_at timestamptz,
  p_limit int,
  p_since timestamptz,
  p_daily_cap int,
  p_cap_since timestamptz
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_change jsonb;
  v_index int := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended('save_correction:' || p_user_id::text, 0));

  if (select count(*) from public.corrections where user_id = p_user_id and created_at >= p_since) >= p_limit then
    return jsonb_build_object('status', 'quota');
  end if;
  if (select count(*) from public.corrections where created_at >= p_cap_since) >= p_daily_cap then
    return jsonb_build_object('status', 'cap');
  end if;

  insert into public.corrections (user_id, lesson_key, mode, original, result, model)
  values (p_user_id, p_lesson_key, p_mode, p_original, p_result, p_model)
  returning id into v_id;

  if p_own_errors then
    for v_change in select value from jsonb_array_elements(coalesce(p_result -> 'changes', '[]'::jsonb))
    loop
      insert into public.review_items (user_id, kind, lesson_key, ref, payload, box, due_at)
      values (
        p_user_id,
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

revoke execute on function public.save_correction(uuid, text, text, text, jsonb, text, boolean, timestamptz, int, timestamptz, int, timestamptz)
  from public, anon, authenticated;
grant execute on function public.save_correction(uuid, text, text, text, jsonb, text, boolean, timestamptz, int, timestamptz, int, timestamptz)
  to service_role;
