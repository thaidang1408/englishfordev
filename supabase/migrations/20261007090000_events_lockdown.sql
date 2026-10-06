-- Khóa bảng events: không ai dùng anon key ghi thẳng để làm đầy database (gói Free 500 MB thì chuyển sang chỉ đọc).
-- Sự kiện trình duyệt đi qua POST /api/events (kiểm zod, giới hạn theo IP, ghi bằng service role).
-- Trigger (signup, sửa câu, đơn, Telegram) chạy security definer nên không bị ảnh hưởng.

drop policy "events: ghi sự kiện" on public.events;

revoke all on public.events from anon, authenticated;
revoke usage on sequence public.events_id_seq from anon, authenticated;

-- Còn một chỗ ghi bằng session người dùng: placement_complete ở /xep-trinh-do. Chỉ cho đúng tên đó, đúng chính mình.
-- ponytail: chuyển chỗ đó sang service role thì xóa policy và grant này.
create policy "events: ghi placement_complete của mình" on public.events
  for insert to authenticated
  with check (user_id = (select auth.uid()) and name = 'placement_complete' and anon_id is null and props is null);
grant insert (user_id, anon_id, name, props) on public.events to authenticated;
grant usage on sequence public.events_id_seq to authenticated;

-- Giới hạn kích thước. NOT VALID: chỉ kiểm dòng mới, để migration không hỏng nếu đã có dòng cũ lớn.
alter table public.events add constraint events_props_size check (props is null or pg_column_size(props) <= 1024) not valid;
alter table public.events add constraint events_anon_id_len check (anon_id is null or char_length(anon_id) <= 64) not valid;
