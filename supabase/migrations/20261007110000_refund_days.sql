-- Hoàn tiền chỉ trừ đúng số ngày của đơn bị hoàn, không xóa ngày đã mua ở đơn khác.
-- Ví dụ mua 30 rồi 90 ngày, hoàn đơn 90 ngày thì còn 30 ngày. Không trừ quá hiện tại.
create or replace function public.refund_order(p_order_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
  v_days int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if v_order.status <> 'paid' then
    return jsonb_build_object('status', 'not_paid');
  end if;

  v_days := case v_order.plan when '30d' then 30 when '90d' then 90 end;

  update public.orders set status = 'refunded' where id = p_order_id;
  update public.entitlements
  set premium_until = greatest(premium_until - make_interval(days => v_days), now())
  where user_id = v_order.user_id;

  return jsonb_build_object('status', 'refunded');
end;
$$;

revoke execute on function public.refund_order(uuid) from public, anon, authenticated;
grant execute on function public.refund_order(uuid) to service_role;
