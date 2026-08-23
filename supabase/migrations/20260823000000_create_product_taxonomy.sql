create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete restrict,
  parent_scope text generated always as (coalesce(parent_id::text, 'root')) stored,
  source text not null default 'kabum',
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  level integer not null check (level > 0),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_scope, slug)
);

create table if not exists public.product_category_assignments (
  id uuid primary key default gen_random_uuid(),
  product_source text not null,
  external_product_id text not null,
  product_url text not null,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  level integer not null check (level > 0),
  created_at timestamptz not null default now(),
  unique (product_source, external_product_id, category_id)
);

create index if not exists product_categories_parent_id_idx on public.product_categories(parent_id);
create index if not exists product_category_assignments_product_idx on public.product_category_assignments(product_source, external_product_id);

create or replace function public.set_product_categories_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_categories_updated_at on public.product_categories;
create trigger product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_product_categories_updated_at();

create or replace function public.upsert_product_taxonomy(
  p_product_source text,
  p_external_product_id text,
  p_product_url text,
  p_taxonomy jsonb
)
returns table(category_id uuid, level integer, name text, slug text)
language plpgsql
set search_path = public
as $$
declare
  item jsonb;
  current_parent uuid := null;
  current_category uuid;
  current_level integer;
  current_name text;
  current_slug text;
  current_source_url text;
begin
  if coalesce(btrim(p_product_source), '') = '' or coalesce(btrim(p_external_product_id), '') = '' or coalesce(btrim(p_product_url), '') = '' then
    raise exception 'produto sem chave estável para classificar';
  end if;
  if jsonb_typeof(p_taxonomy) <> 'array' then
    raise exception 'taxonomy deve ser um array';
  end if;

  for item in select value from jsonb_array_elements(p_taxonomy) order by (value->>'level')::integer loop
    current_level := (item->>'level')::integer;
    current_name := btrim(item->>'name');
    current_slug := lower(btrim(item->>'slug'));
    current_source_url := nullif(btrim(item->>'source_url'), '');

    if current_level is null or current_level < 1 or current_name = '' or current_slug = '' then
      raise exception 'item de taxonomy inválido';
    end if;

    insert into public.product_categories (parent_id, source, name, slug, level, source_url)
    values (current_parent, p_product_source, current_name, current_slug, current_level, current_source_url)
    on conflict (parent_scope, slug) do update
      set name = excluded.name,
          source_url = coalesce(excluded.source_url, public.product_categories.source_url),
          level = excluded.level
    returning id into current_category;

    insert into public.product_category_assignments (product_source, external_product_id, product_url, category_id, level)
    values (p_product_source, p_external_product_id, p_product_url, current_category, current_level)
    on conflict (product_source, external_product_id, category_id) do update
      set product_url = excluded.product_url,
          level = excluded.level;

    category_id := current_category;
    level := current_level;
    name := current_name;
    slug := current_slug;
    return next;
    current_parent := current_category;
  end loop;
end;
$$;

alter table public.product_categories enable row level security;
alter table public.product_category_assignments enable row level security;

revoke all on table public.product_categories from anon, authenticated;
revoke all on table public.product_category_assignments from anon, authenticated;
grant select on table public.product_categories to authenticated;
grant select on table public.product_category_assignments to authenticated;

revoke all on function public.upsert_product_taxonomy(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_product_taxonomy(text, text, text, jsonb) to service_role;
