-- /admin: danh sách đơn kèm email và tên người mua trong một lần gọi.
-- Trước đây gọi auth admin từng người mua, quá 50 subrequest của Workers khi nhiều người mua.
-- security definer để đọc auth.users; chỉ service role gọi được, email không ra trình duyệt.
create function public.admin_list_orders(p_limit int)
returns table (
  id uuid, user_id uuid, code text, plan text, amount int, status text,
  created_at timestamptz, paid_at timestamptz, order_number bigint,
  checkout_url text, qr_code text, bank_ref text, paid_by text,
  email text, name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.user_id, o.code, o.plan, o.amount, o.status, o.created_at, o.paid_at, o.order_number,
         o.checkout_url, o.qr_code, o.bank_ref, o.paid_by, u.email::text, p.display_name
  from public.orders o
  left join auth.users u on u.id = o.user_id
  left join public.profiles p on p.id = o.user_id
  order by o.created_at desc
  limit p_limit;
$$;

revoke execute on function public.admin_list_orders(int) from public, anon, authenticated;
grant execute on function public.admin_list_orders(int) to service_role;
