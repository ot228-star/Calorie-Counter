-- Curated food imagery and catalog metadata (single source of truth with app fallback maps).
-- Anonymous clients keep read-only access to public.foods (see 002_food_catalog.sql).

alter table public.foods
  add column if not exists image_url text,
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists photo_source text,
  add column if not exists photo_attribution text,
  add column if not exists slug text,
  add column if not exists image_review_status text not null default 'approved'
    check (image_review_status in ('pending', 'approved', 'rejected'));

comment on column public.foods.image_url is 'Primary hero image (HTTPS). Prefer stable CDN URLs.';
comment on column public.foods.image_urls is 'Ordered alternates for client fallback chains (JSON array of strings).';
comment on column public.foods.photo_attribution is 'License / credit line for UI (e.g. Unsplash photographer link).';
comment on column public.foods.slug is 'Optional stable id for renames; not required for MVP.';
comment on column public.foods.image_review_status is 'Editorial gate: rejected rows should be ignored by the client for imagery.';

create index if not exists foods_image_review_idx on public.foods (image_review_status);

-- Optional uniqueness when you assign slugs (partial index allows many null slugs).
create unique index if not exists foods_slug_unique_idx on public.foods (slug) where slug is not null;

-- RLS: no broad policy change — anon remains select-only on public.foods.
-- Writes remain service-role / dashboard (no insert/update policy for authenticated/anon).
