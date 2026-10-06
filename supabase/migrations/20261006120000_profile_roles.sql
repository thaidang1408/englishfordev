-- M10: ngành người dùng chọn (SPEC mục 16). Chọn nhiều ngành; mảng rỗng là chưa chọn.
alter table public.profiles
  add column roles text[] not null default '{}'
  check (roles <@ array['dev', 'qa', 'ba', 'pm']::text[] and cardinality(roles) <= 4);

-- Người dùng tự sửa ngành của mình qua policy "sửa hồ sơ của mình" đã có.
grant update (roles) on public.profiles to authenticated;
