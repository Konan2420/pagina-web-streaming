-- Finaliza el flujo del sorteo sin volver a cobrar la caja adquirida.
CREATE OR REPLACE FUNCTION public.create_festive_reward_order(_product_id uuid, _user_id uuid)
RETURNS TABLE(order_id uuid, product_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE p public.products%ROWTYPE; inventory_id uuid; created_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO p FROM public.products WHERE id=_product_id AND approval_status='approved' AND COALESCE(is_active,false) AND COALESCE(is_catalog_available,false) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product is not available'; END IF;
  SELECT id INTO inventory_id FROM public.account_inventory WHERE product_id=_product_id AND status IN ('available','disponible') ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;
  IF inventory_id IS NULL THEN RAISE EXCEPTION 'No stock available'; END IF;
  INSERT INTO public.orders(user_id,created_by,producto_id,producto_nombre,precio,estado,payment_verified) VALUES(_user_id,_user_id,_product_id::text,p.name,0,'entregado',true) RETURNING id INTO created_id;
  UPDATE public.account_inventory SET status='assigned',order_id=created_id,assigned_at=now(),payment_verified=true WHERE id=inventory_id;
  INSERT INTO public.delivered_accounts(order_id,user_id,email,password,access_link,notes) SELECT created_id,_user_id,email,password,access_link,notes FROM public.account_inventory WHERE id=inventory_id;
  RETURN QUERY SELECT created_id,p.name;
END;
$$;
REVOKE ALL ON FUNCTION public.create_festive_reward_order(uuid,uuid) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.open_festive_box(p_event_id uuid)
RETURNS TABLE(opening_id uuid,event_id uuid,product_id_won uuid,product_name text,order_id uuid,opened_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE actor_id uuid:=auth.uid(); e public.festive_events%ROWTYPE; selected_id uuid; total_weight numeric; draw_value numeric; placed record; opening_row public.festive_event_box_openings%ROWTYPE; available_boxes bigint; purchased_boxes bigint; winner_limit integer;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required to open a festive box'; END IF;
  SELECT * INTO e FROM public.festive_events WHERE id=p_event_id FOR UPDATE;
  IF NOT FOUND OR NOT e.is_active OR e.starts_at>now() OR e.ends_at>now() THEN RAISE EXCEPTION 'The festive draw can be opened after the event ends'; END IF;
  SELECT COALESCE(sum(quantity),0) INTO purchased_boxes FROM public.festive_event_box_purchases WHERE event_id=p_event_id AND user_id=actor_id;
  IF purchased_boxes<1 THEN RAISE EXCEPTION 'Purchase at least one festive box before opening it'; END IF;
  IF EXISTS(SELECT 1 FROM public.festive_event_box_openings WHERE event_id=p_event_id AND user_id=actor_id) THEN RAISE EXCEPTION 'You have already opened your box for this event'; END IF;
  SELECT count(*) INTO available_boxes FROM public.festive_event_box_openings WHERE event_id=p_event_id;
  winner_limit:=LEAST(GREATEST(COALESCE(e.draw_limit,3),1),3);
  IF available_boxes>=winner_limit THEN RAISE EXCEPTION 'No festive boxes are available'; END IF;
  SELECT COALESCE(sum(ep.weight),0) INTO total_weight FROM public.festive_event_products ep JOIN public.products p ON p.id=ep.product_id WHERE ep.event_id=p_event_id AND p.approval_status='approved' AND COALESCE(p.is_active,false) AND COALESCE(p.is_catalog_available,false) AND EXISTS(SELECT 1 FROM public.account_inventory ai WHERE ai.product_id=p.id AND ai.status IN ('available','disponible'));
  IF total_weight<=0 THEN RAISE EXCEPTION 'No configured festive product has available stock'; END IF;
  draw_value:=random()*total_weight;
  SELECT w.product_id INTO selected_id FROM (SELECT ep.product_id,sum(ep.weight) OVER(ORDER BY ep.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) cumulative_weight FROM public.festive_event_products ep JOIN public.products p ON p.id=ep.product_id WHERE ep.event_id=p_event_id AND p.approval_status='approved' AND COALESCE(p.is_active,false) AND COALESCE(p.is_catalog_available,false) AND EXISTS(SELECT 1 FROM public.account_inventory ai WHERE ai.product_id=p.id AND ai.status IN ('available','disponible'))) w WHERE w.cumulative_weight>=draw_value ORDER BY w.cumulative_weight LIMIT 1;
  IF selected_id IS NULL THEN RAISE EXCEPTION 'The festive draw did not produce a product'; END IF;
  SELECT * INTO placed FROM public.create_festive_reward_order(selected_id,actor_id);
  INSERT INTO public.festive_event_box_openings(event_id,user_id,product_id_won,order_id) VALUES(p_event_id,actor_id,selected_id,placed.order_id) RETURNING * INTO opening_row;
  RETURN QUERY SELECT opening_row.id,opening_row.event_id,opening_row.product_id_won,placed.product_name,opening_row.order_id,opening_row.opened_at;
END;
$$;
REVOKE ALL ON FUNCTION public.open_festive_box(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_festive_box(uuid) TO authenticated, service_role;
