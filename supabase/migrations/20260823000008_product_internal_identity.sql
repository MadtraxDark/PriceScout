alter table public.google_drive_product_files
  add column if not exists catalog_product_id uuid references public.catalog_products(id) on delete cascade;

alter table public.product_category_assignments
  add column if not exists catalog_product_id uuid references public.catalog_products(id) on delete cascade;

update public.google_drive_product_files as image
set catalog_product_id = product.id
from public.catalog_products as product
where image.catalog_product_id is null
  and image.user_id = product.created_by
  and image.product_source = product.source
  and image.external_product_id = product.external_product_id;

update public.product_category_assignments as assignment
set catalog_product_id = product.id
from public.catalog_products as product
where assignment.catalog_product_id is null
  and assignment.product_source = product.source
  and assignment.external_product_id = product.external_product_id;

alter table public.catalog_products
  add column if not exists primary_image_id uuid;

update public.catalog_products as product
set primary_image_id = (
  select image.id
  from public.google_drive_product_files as image
  where image.catalog_product_id = product.id
  order by image.sort_order asc, image.created_at asc
  limit 1
)
where product.primary_image_id is null
  and exists (
    select 1
    from public.google_drive_product_files as image
    where image.catalog_product_id = product.id
  );

create index if not exists google_drive_product_files_catalog_product_idx
  on public.google_drive_product_files(catalog_product_id, sort_order, created_at);

create index if not exists product_category_assignments_catalog_product_idx
  on public.product_category_assignments(catalog_product_id, level);

create unique index if not exists catalog_products_primary_image_unique_idx
  on public.catalog_products(primary_image_id)
  where primary_image_id is not null;

create unique index if not exists google_drive_product_files_product_file_unique_idx
  on public.google_drive_product_files(catalog_product_id, drive_file_id)
  where catalog_product_id is not null;

alter table public.catalog_products
  add constraint catalog_products_primary_image_fk
  foreign key (primary_image_id) references public.google_drive_product_files(id) on delete set null;

alter table public.catalog_products enable row level security;
alter table public.google_drive_product_files enable row level security;
alter table public.product_category_assignments enable row level security;
