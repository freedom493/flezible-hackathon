create extension if not exists pgcrypto;

-- ===== tables =====
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer','farm','supplier','logistics')),
  full_name text, phone text, city text, state text,
  notify jsonb not null default '{"whatsapp":true,"email":true,"push":false}',
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  commission_bps int not null check (commission_bps >= 0),
  trial_days int not null default 14,
  features jsonb not null default '[]',
  sort int not null default 0
);

create table if not exists public.plan_prices (
  plan_id text not null references public.plans(id) on delete cascade,
  period text not null check (period in ('daily','weekly','monthly')),
  amount_kobo bigint not null check (amount_kobo > 0),
  primary key (plan_id, period)
);

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('farm','supplier')),
  name text not null check (length(name) between 2 and 80),
  city text not null,
  state text not null,
  sells_to text[] not null default '{}',
  delivers boolean not null default false,
  sets_up_logistics boolean not null default false,
  active boolean not null default true,
  verified boolean not null default false,
  plan_id text references public.plans(id),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_areas (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  state text not null,
  city text,                                   -- null = whole state
  lead_time_days int not null default 1 check (lead_time_days >= 0),
  delivery_fee_kobo bigint not null default 0 check (delivery_fee_kobo >= 0)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  product text not null default 'eggs' check (product = 'eggs'),
  size text not null check (size in ('small','medium','large')),
  unit text not null check (unit in ('crate','tray')),
  price_per_unit_kobo bigint not null check (price_per_unit_kobo > 0),
  stock_units int not null default 0 check (stock_units >= 0),
  min_order_units int not null default 1 check (min_order_units > 0),
  available_from date not null default current_date,
  available_to date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('order','farm_onboarding')),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')),
  content text not null,
  tokens_in int, tokens_out int,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references public.sellers(id),
  status text not null default 'submitted'
    check (status in ('submitted','accepted','in_delivery','delivered','completed','declined','cancelled','disputed')),
  delivery_city text not null,
  delivery_state text not null,
  needed_by date not null,
  total_kobo bigint not null check (total_kobo >= 0),
  notes text,
  ai_conversation_id uuid references public.ai_conversations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  units int not null check (units > 0),
  unit_price_kobo bigint not null check (unit_price_kobo > 0)   -- copied at order time
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  actor_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.logistics_partners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand_name text not null,
  types text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists listings_seller_idx on public.listings(seller_id, active);
create index if not exists orders_buyer_idx on public.orders(buyer_id);
create index if not exists orders_seller_idx on public.orders(seller_id);
create index if not exists order_events_order_idx on public.order_events(order_id);
create index if not exists seller_areas_seller_idx on public.seller_areas(seller_id);

-- ===== helpers (security definer avoids RLS recursion) =====
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;

create or replace function public.my_seller_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.sellers where owner_id = (select auth.uid())
$$;

-- ===== RLS =====
alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.plan_prices enable row level security;
alter table public.sellers enable row level security;
alter table public.seller_areas enable row level security;
alter table public.listings enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.logistics_partners enable row level security;

-- make the migration re-runnable: drop old policies first
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('admins','profiles','plans','plan_prices',
      'sellers','seller_areas','listings','ai_conversations','ai_messages','orders','order_items',
      'order_events','logistics_partners')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

-- admins: no client policies at all (only is_admin() reads it)

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy plans_read on public.plans for select to anon, authenticated using (true);
create policy plan_prices_read on public.plan_prices for select to anon, authenticated using (true);

create policy sellers_read on public.sellers for select to anon, authenticated
  using (active or owner_id = (select auth.uid()));
create policy sellers_insert on public.sellers for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy sellers_update on public.sellers for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy areas_read on public.seller_areas for select to anon, authenticated
  using (exists (select 1 from public.sellers s where s.id = seller_id and (s.active or s.owner_id = (select auth.uid()))));
create policy areas_write on public.seller_areas for all to authenticated
  using (seller_id in (select public.my_seller_ids()))
  with check (seller_id in (select public.my_seller_ids()));

create policy listings_read on public.listings for select to anon, authenticated
  using (active or seller_id in (select public.my_seller_ids()));
create policy listings_write on public.listings for all to authenticated
  using (seller_id in (select public.my_seller_ids()))
  with check (seller_id in (select public.my_seller_ids()));

create policy conv_select on public.ai_conversations for select to authenticated
  using (user_id = (select auth.uid()));
create policy msg_select on public.ai_messages for select to authenticated
  using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));

create policy orders_select on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id in (select public.my_seller_ids()) or public.is_admin());
create policy items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
create policy events_select on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
-- orders, order_items, order_events, ai_* have NO client write policies: server functions only.

create policy logistics_own on public.logistics_partners for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- ===== column-level grants: sellers can never set verified or plan_id =====
revoke insert, update on public.sellers from anon, authenticated;
grant insert (owner_id, kind, name, city, state, sells_to, delivers, sets_up_logistics) on public.sellers to authenticated;
grant update (name, city, state, sells_to, delivers, sets_up_logistics, active) on public.sellers to authenticated;
revoke insert, update, delete on public.orders, public.order_items, public.order_events from anon, authenticated;
revoke insert, update, delete on public.ai_conversations, public.ai_messages from anon, authenticated;

-- ===== seed plans (prices in kobo; commission in basis points) =====
insert into public.plans (id, name, commission_bps, trial_days, features, sort) values
 ('A','Plan A',300,14,'["Verified badge","Basic analytics (14 days)","Limited WhatsApp/email notifications","Monthly WhatsApp business report"]',1),
 ('B','Plan B',130,14,'["Verified badge","WhatsApp and email notifications","Advanced analytics (90 days)","Weekly business report"]',2),
 ('C','Plan C',30,14,'["Verified badge","Platform promotion","SMS, email and WhatsApp notifications","Advanced analytics (180 days)","Daily WhatsApp/email business report","Business tracker"]',3)
on conflict (id) do update set name = excluded.name, commission_bps = excluded.commission_bps,
  trial_days = excluded.trial_days, features = excluded.features, sort = excluded.sort;

insert into public.plan_prices (plan_id, period, amount_kobo) values
 ('A','daily',25000),('A','weekly',150000),('A','monthly',500000),
 ('B','monthly',1000000),
 ('C','monthly',1500000)
on conflict (plan_id, period) do update set amount_kobo = excluded.amount_kobo;

-- ===== matching (deterministic, no model) =====
create or replace function public.match_listings(
  p_units int, p_size text, p_city text, p_state text, p_needed_by date
) returns table (
  listing_id uuid, seller_id uuid, seller_name text, verified boolean, size text, unit text,
  price_per_unit_kobo bigint, delivery_fee_kobo bigint, lead_time_days int, total_kobo bigint, same_city boolean
) language sql stable as $$
  select l.id, s.id, s.name, s.verified, l.size, l.unit, l.price_per_unit_kobo,
         a.delivery_fee_kobo, a.lead_time_days,
         p_units::bigint * l.price_per_unit_kobo + a.delivery_fee_kobo,
         lower(s.city) = lower(p_city)
  from public.listings l
  join public.sellers s on s.id = l.seller_id and s.active
  join lateral (
    select * from public.seller_areas sa
    where sa.seller_id = s.id and lower(sa.state) = lower(p_state)
      and (sa.city is null or lower(sa.city) = lower(p_city))
    order by (sa.city is null) limit 1
  ) a on true
  where l.active and l.stock_units >= p_units and l.min_order_units <= p_units
    and (p_size is null or l.size = p_size)
    and l.available_from <= p_needed_by
    and (l.available_to is null or l.available_to >= p_needed_by)
    and p_needed_by >= current_date + a.lead_time_days
  order by (lower(s.city) = lower(p_city)) desc,
           (p_units::bigint * l.price_per_unit_kobo + a.delivery_fee_kobo) asc,
           s.verified desc, a.lead_time_days asc
  limit 3
$$;

-- ===== server-only write functions =====
create or replace function public.create_order(
  p_buyer uuid, p_listing uuid, p_units int, p_city text, p_state text,
  p_needed_by date, p_notes text, p_conversation uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare l public.listings; s public.sellers; a public.seller_areas; v_order uuid; v_total bigint;
begin
  select * into l from public.listings where id = p_listing and active for update;
  if not found then raise exception 'listing_unavailable'; end if;
  if p_units < l.min_order_units or p_units > l.stock_units then raise exception 'units_out_of_range'; end if;
  select * into s from public.sellers where id = l.seller_id and active;
  if not found then raise exception 'seller_unavailable'; end if;
  select * into a from public.seller_areas sa
    where sa.seller_id = s.id and lower(sa.state) = lower(p_state)
      and (sa.city is null or lower(sa.city) = lower(p_city))
    order by (sa.city is null) limit 1;
  if not found then raise exception 'area_not_served'; end if;
  if p_needed_by < current_date + a.lead_time_days then raise exception 'too_soon'; end if;
  v_total := p_units::bigint * l.price_per_unit_kobo + a.delivery_fee_kobo;
  insert into public.orders (buyer_id, seller_id, status, delivery_city, delivery_state, needed_by, total_kobo, notes, ai_conversation_id)
    values (p_buyer, s.id, 'submitted', p_city, p_state, p_needed_by, v_total, left(p_notes, 300), p_conversation)
    returning id into v_order;
  insert into public.order_items (order_id, listing_id, units, unit_price_kobo)
    values (v_order, l.id, p_units, l.price_per_unit_kobo);
  update public.listings set stock_units = stock_units - p_units where id = l.id;
  insert into public.order_events (order_id, status, actor_id) values (v_order, 'submitted', p_buyer);
  return v_order;
end $$;

create or replace function public.set_order_status(p_order uuid, p_actor uuid, p_new text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; is_seller boolean; is_buyer boolean; ok boolean := false;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'order_not_found'; end if;
  is_buyer := (o.buyer_id = p_actor);
  is_seller := exists (select 1 from public.sellers s where s.id = o.seller_id and s.owner_id = p_actor);
  if is_seller then
    ok := (o.status = 'submitted' and p_new in ('accepted','declined'))
       or (o.status = 'accepted' and p_new = 'in_delivery')
       or (o.status = 'in_delivery' and p_new = 'delivered');
  end if;
  if not ok and is_buyer then
    ok := (o.status = 'delivered' and p_new in ('completed','disputed'))
       or (o.status in ('submitted','accepted') and p_new = 'cancelled');
  end if;
  if not ok then raise exception 'transition_not_allowed'; end if;
  update public.orders set status = p_new, updated_at = now() where id = p_order;
  if p_new in ('declined','cancelled') then
    update public.listings l set stock_units = l.stock_units + i.units
      from public.order_items i where i.order_id = p_order and l.id = i.listing_id;
  end if;
  insert into public.order_events (order_id, status, actor_id, note) values (p_order, p_new, p_actor, left(p_note, 300));
end $$;

revoke all on function public.create_order(uuid,uuid,int,text,text,date,text,uuid) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.create_order(uuid,uuid,int,text,text,date,text,uuid) to service_role;
grant execute on function public.set_order_status(uuid,uuid,text,text) to service_role;

-- the other party's phone is visible only once an order is accepted
create or replace function public.get_order_contact(p_order uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare o public.orders; me uuid := (select auth.uid()); r text;
begin
  select * into o from public.orders where id = p_order;
  if not found or o.status not in ('accepted','in_delivery','delivered','completed') then return null; end if;
  if me = o.buyer_id then
    select p.phone into r from public.profiles p join public.sellers s on s.owner_id = p.id where s.id = o.seller_id;
  elsif exists (select 1 from public.sellers s where s.id = o.seller_id and s.owner_id = me) then
    select phone into r from public.profiles where id = o.buyer_id;
  end if;
  return r;
end $$;
