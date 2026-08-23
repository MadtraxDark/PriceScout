create table if not exists public.google_drive_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_account_email text,
  refresh_token_ciphertext text not null,
  scope text not null,
  root_folder_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.google_drive_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drive_folder_id text not null,
  parent_drive_folder_id text,
  parent_scope text generated always as (coalesce(parent_drive_folder_id, 'root')) stored,
  folder_kind text not null check (folder_kind in ('brand', 'product', 'images')),
  folder_key text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, drive_folder_id),
  unique (user_id, parent_scope, folder_kind, folder_key)
);

create table if not exists public.google_drive_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drive_file_id text not null,
  drive_folder_id text not null,
  name text not null,
  mime_type text not null,
  byte_size bigint,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, drive_file_id),
  unique (user_id, sha256)
);

create table if not exists public.google_drive_product_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_source text not null,
  external_product_id text not null,
  product_url text not null,
  drive_file_id uuid not null references public.google_drive_files(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  source_image_url text,
  created_at timestamptz not null default now(),
  unique (user_id, product_source, external_product_id, drive_file_id)
);

create index if not exists google_drive_folders_parent_idx
  on public.google_drive_folders(user_id, parent_drive_folder_id);

create index if not exists google_drive_files_hash_idx
  on public.google_drive_files(user_id, sha256);

create index if not exists google_drive_product_files_product_idx
  on public.google_drive_product_files(user_id, product_source, external_product_id, sort_order);

create or replace function public.set_google_drive_storage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists google_drive_connections_updated_at on public.google_drive_connections;
create trigger google_drive_connections_updated_at
before update on public.google_drive_connections
for each row execute function public.set_google_drive_storage_updated_at();

drop trigger if exists google_drive_folders_updated_at on public.google_drive_folders;
create trigger google_drive_folders_updated_at
before update on public.google_drive_folders
for each row execute function public.set_google_drive_storage_updated_at();

drop trigger if exists google_drive_files_updated_at on public.google_drive_files;
create trigger google_drive_files_updated_at
before update on public.google_drive_files
for each row execute function public.set_google_drive_storage_updated_at();

alter table public.google_drive_connections enable row level security;
alter table public.google_drive_folders enable row level security;
alter table public.google_drive_files enable row level security;
alter table public.google_drive_product_files enable row level security;

revoke all on table public.google_drive_connections from anon;
revoke all on table public.google_drive_folders from anon;
revoke all on table public.google_drive_files from anon;
revoke all on table public.google_drive_product_files from anon;

grant select on table public.google_drive_connections to authenticated;
grant select on table public.google_drive_folders to authenticated;
grant select on table public.google_drive_files to authenticated;
grant select on table public.google_drive_product_files to authenticated;

create policy "Users can view their Google Drive connection"
on public.google_drive_connections for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their Google Drive folders"
on public.google_drive_folders for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their Google Drive files"
on public.google_drive_files for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their Google Drive product files"
on public.google_drive_product_files for select to authenticated
using ((select auth.uid()) = user_id);
