alter table public.catalog_products
  drop column if exists image_url;

alter table public.catalog_products
  add column if not exists google_drive_file_id text;

update public.catalog_products as cp
set google_drive_file_id = (
  select gf.drive_file_id
  from public.google_drive_product_files as gpf
  join public.google_drive_files as gf on gf.id = gpf.drive_file_id
  where gpf.user_id = cp.created_by
    and gpf.product_source = cp.source
    and gpf.external_product_id = cp.external_product_id
  order by gpf.sort_order asc, gpf.created_at asc
  limit 1
)
where cp.google_drive_file_id is null
  and exists (
    select 1
    from public.google_drive_product_files as gpf
    where gpf.user_id = cp.created_by
      and gpf.product_source = cp.source
      and gpf.external_product_id = cp.external_product_id
  );
