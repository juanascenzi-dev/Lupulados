create table if not exists public.business_profiles (
  id text primary key,
  business_name text not null,
  address text,
  opening_hours text,
  email text,
  pricing_status text not null default 'estimated',
  price_disclaimer text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_pricing_status_check check (pricing_status in ('estimated', 'confirmed')),
  constraint business_profiles_disclaimer_check check (pricing_status <> 'estimated' or length(btrim(price_disclaimer)) > 0)
);

create table if not exists public.whatsapp_channels (
  id text primary key,
  label text not null,
  phone_display text not null,
  phone_e164 text not null,
  purpose text not null,
  is_primary boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_channels_phone_check check (phone_e164 ~ '^[1-9][0-9]{7,14}$'),
  constraint whatsapp_channels_purpose_check check (purpose in ('orders', 'contact', 'orders_and_contact')),
  constraint whatsapp_channels_sort_order_check check (sort_order >= 0)
);

create unique index if not exists whatsapp_channels_one_active_primary
  on public.whatsapp_channels (is_primary)
  where is_primary = true and active = true;

create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  style text,
  category text not null,
  image_url text,
  status text not null default 'active',
  sort_order integer not null default 0,
  abv numeric,
  ibu numeric,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_category_check check (category in ('beer', 'pack')),
  constraint products_status_check check (status in ('active', 'archived')),
  constraint products_sort_order_check check (sort_order >= 0),
  constraint products_abv_check check (abv is null or abv > 0),
  constraint products_ibu_check check (ibu is null or ibu >= 0)
);

create table if not exists public.product_presentations (
  id text primary key,
  product_id text not null references public.products(id),
  presentation_type text not null,
  label text not null,
  volume_liters numeric,
  unit_price numeric not null,
  status text not null default 'active',
  sort_order integer not null default 0,
  category text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_presentations_type_check check (presentation_type in ('barril20L', 'barril30L', 'barril50L', 'growler1L', 'growler2L', 'porron500ml')),
  constraint product_presentations_status_check check (status in ('active', 'archived')),
  constraint product_presentations_category_check check (category is null or category in ('barril', 'growler', 'porrón', 'pack')),
  constraint product_presentations_volume_check check (volume_liters is null or volume_liters > 0),
  constraint product_presentations_price_check check (unit_price >= 0),
  constraint product_presentations_sort_order_check check (sort_order >= 0)
);

create table if not exists public.delivery_options (
  id text primary key,
  label text not null,
  description text,
  price numeric not null,
  requires_address boolean not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_options_price_check check (price >= 0),
  constraint delivery_options_sort_order_check check (sort_order >= 0)
);

create table if not exists public.extra_options (
  id text primary key,
  label text not null,
  price numeric not null,
  unit text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extra_options_price_check check (price >= 0),
  constraint extra_options_sort_order_check check (sort_order >= 0)
);

create table if not exists public.promotions (
  id text primary key,
  code text unique not null,
  promotion_type text not null,
  value numeric not null,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_type_check check (promotion_type in ('percentage', 'fixed')),
  constraint promotions_value_check check (value >= 0),
  constraint promotions_percentage_check check (promotion_type <> 'percentage' or value <= 1),
  constraint promotions_dates_check check (starts_at is null or ends_at is null or starts_at <= ends_at),
  constraint promotions_code_check check (length(btrim(code)) > 0)
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create table if not exists public.admin_audit_log (
  id bigint generated by default as identity primary key,
  actor_user_id uuid,
  table_name text not null,
  record_id text,
  operation text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.write_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  changed_id text;
begin
  changed_id = coalesce(new.id::text, old.id::text);
  insert into public.admin_audit_log(actor_user_id, table_name, record_id, operation, old_data, new_data)
  values (auth.uid(), tg_table_name, changed_id, tg_op, to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end;
$$;

revoke all on function public.write_admin_audit_log() from public;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_profiles',
    'whatsapp_channels',
    'products',
    'product_presentations',
    'delivery_options',
    'extra_options',
    'promotions'
  ] loop
    execute format('drop trigger if exists set_updated_at_%I on public.%I', table_name, table_name);
    execute format('create trigger set_updated_at_%I before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    execute format('drop trigger if exists audit_%I on public.%I', table_name, table_name);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.write_admin_audit_log()', table_name, table_name);
  end loop;
end;
$$;

alter table public.business_profiles enable row level security;
alter table public.whatsapp_channels enable row level security;
alter table public.products enable row level security;
alter table public.product_presentations enable row level security;
alter table public.delivery_options enable row level security;
alter table public.extra_options enable row level security;
alter table public.promotions enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.business_profiles, public.whatsapp_channels, public.products, public.product_presentations, public.delivery_options, public.extra_options, public.promotions to anon, authenticated;
grant insert, update on public.business_profiles, public.whatsapp_channels, public.products, public.product_presentations, public.delivery_options, public.extra_options, public.promotions to authenticated;
grant select on public.admin_audit_log to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Public can read active business profiles" on public.business_profiles;
create policy "Public can read active business profiles" on public.business_profiles
for select to anon, authenticated using (active = true);
drop policy if exists "Admin can manage business profiles" on public.business_profiles;
create policy "Admin can manage business profiles" on public.business_profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active whatsapp channels" on public.whatsapp_channels;
create policy "Public can read active whatsapp channels" on public.whatsapp_channels
for select to anon, authenticated using (active = true);
drop policy if exists "Admin can manage whatsapp channels" on public.whatsapp_channels;
create policy "Admin can manage whatsapp channels" on public.whatsapp_channels
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products" on public.products
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active presentations" on public.product_presentations;
create policy "Public can read active presentations" on public.product_presentations
for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage presentations" on public.product_presentations;
create policy "Admin can manage presentations" on public.product_presentations
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active delivery options" on public.delivery_options;
create policy "Public can read active delivery options" on public.delivery_options
for select to anon, authenticated using (active = true);
drop policy if exists "Admin can manage delivery options" on public.delivery_options;
create policy "Admin can manage delivery options" on public.delivery_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active extra options" on public.extra_options;
create policy "Public can read active extra options" on public.extra_options
for select to anon, authenticated using (active = true);
drop policy if exists "Admin can manage extra options" on public.extra_options;
create policy "Admin can manage extra options" on public.extra_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active promotions" on public.promotions;
create policy "Public can read active promotions" on public.promotions
for select to anon, authenticated using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
drop policy if exists "Admin can manage promotions" on public.promotions;
create policy "Admin can manage promotions" on public.promotions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin can read admin users" on public.admin_users;
create policy "Admin can read admin users" on public.admin_users
for select to authenticated using (public.is_admin());

drop policy if exists "Admin can read audit log" on public.admin_audit_log;
create policy "Admin can read audit log" on public.admin_audit_log
for select to authenticated using (public.is_admin());
