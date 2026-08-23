alter table public.catalog_products
  add column if not exists google_drive_file_id text;
