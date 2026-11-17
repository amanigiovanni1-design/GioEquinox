create table if not exists public.catalogue_admins (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.catalogue_admins enable row level security;

revoke all on public.catalogue_admins from anon, authenticated;
grant select on public.catalogue_admins to authenticated;

drop policy if exists "Admins can read their own catalogue access" on public.catalogue_admins;
create policy "Admins can read their own catalogue access"
    on public.catalogue_admins for select to authenticated
    using ((select auth.uid()) = user_id);

create or replace function public.is_catalogue_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.catalogue_admins
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_catalogue_admin() from public;
grant execute on function public.is_catalogue_admin() to anon, authenticated;

create table if not exists public.catalogue_products (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(btrim(name)) between 1 and 120),
    description text not null check (char_length(btrim(description)) between 1 and 700),
    price numeric(12, 2) not null check (price > 0),
    product_type text not null check (product_type in ('fragrance', 'watch')),
    tags text[] not null default '{}'
        check (cardinality(tags) <= 5 and array_position(tags, null) is null),
    image_path text not null check (char_length(image_path) between 1 and 512),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists catalogue_products_type_name_unique
    on public.catalogue_products (product_type, lower(name));

alter table public.catalogue_products enable row level security;
grant select on public.catalogue_products to anon, authenticated;
grant insert, update, delete on public.catalogue_products to authenticated;

drop policy if exists "Anyone can view active catalogue products" on public.catalogue_products;
create policy "Anyone can view active catalogue products"
    on public.catalogue_products for select to anon, authenticated
    using (active or (select public.is_catalogue_admin()));

drop policy if exists "Catalogue admins can add products" on public.catalogue_products;
create policy "Catalogue admins can add products"
    on public.catalogue_products for insert to authenticated
    with check ((select public.is_catalogue_admin()));

drop policy if exists "Catalogue admins can update products" on public.catalogue_products;
create policy "Catalogue admins can update products"
    on public.catalogue_products for update to authenticated
    using ((select public.is_catalogue_admin()))
    with check ((select public.is_catalogue_admin()));

drop policy if exists "Catalogue admins can delete products" on public.catalogue_products;
create policy "Catalogue admins can delete products"
    on public.catalogue_products for delete to authenticated
    using ((select public.is_catalogue_admin()));

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'catalogue-product-images',
    'catalogue-product-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Catalogue admins can upload product images" on storage.objects;
create policy "Catalogue admins can upload product images"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'catalogue-product-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.is_catalogue_admin())
    );

drop policy if exists "Catalogue admins can replace their product images" on storage.objects;
create policy "Catalogue admins can replace their product images"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'catalogue-product-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.is_catalogue_admin())
    )
    with check (
        bucket_id = 'catalogue-product-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.is_catalogue_admin())
    );

drop policy if exists "Catalogue admins can remove their product images" on storage.objects;
create policy "Catalogue admins can remove their product images"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'catalogue-product-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.is_catalogue_admin())
    );
