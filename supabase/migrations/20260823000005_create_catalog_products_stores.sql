create table if not exists public.catalog_stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  hostname text not null check (hostname = lower(hostname)),
  url text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hostname)
);

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.catalog_stores(id) on delete restrict,
  source text not null,
  external_product_id text not null,
  product_url text not null,
  name text not null check (length(btrim(name)) between 1 and 500),
  brand text,
  original_price numeric(12,2) check (original_price is null or original_price >= 0),
  pix_price numeric(12,2) check (pix_price is null or pix_price >= 0),
  pix_discount_percent numeric(5,2) check (pix_discount_percent is null or pix_discount_percent between 0 and 100),
  card_price numeric(12,2) check (card_price is null or card_price >= 0),
  installments_quantity integer check (installments_quantity is null or installments_quantity > 0),
  installment_amount numeric(12,2) check (installment_amount is null or installment_amount >= 0),
  price_difference_pix_to_card numeric(12,2),
  availability text not null default 'unknown' check (availability in ('in_stock', 'out_of_stock', 'unknown')),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  seller text,
  special_status text,
  shipping_from text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_product_id)
);

create index if not exists catalog_products_store_idx on public.catalog_products(store_id);
create index if not exists catalog_products_updated_at_idx on public.catalog_products(updated_at desc);
create index if not exists catalog_products_brand_idx on public.catalog_products(brand);

create or replace function public.set_catalog_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_stores_updated_at on public.catalog_stores;
create trigger catalog_stores_updated_at
before update on public.catalog_stores
for each row execute function public.set_catalog_updated_at();

drop trigger if exists catalog_products_updated_at on public.catalog_products;
create trigger catalog_products_updated_at
before update on public.catalog_products
for each row execute function public.set_catalog_updated_at();

alter table public.catalog_stores enable row level security;
alter table public.catalog_products enable row level security;

revoke all on table public.catalog_stores from anon, authenticated;
revoke all on table public.catalog_products from anon, authenticated;
