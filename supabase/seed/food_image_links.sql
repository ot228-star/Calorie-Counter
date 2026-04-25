-- Idempotent food-image linking script for Supabase Storage.
-- Uses bucket: meals
-- Safe to run multiple times.

begin;

-- Ensure required columns exist before linking.
alter table public.foods
  add column if not exists image_url text,
  add column if not exists image_urls jsonb default '[]'::jsonb,
  add column if not exists photo_source text,
  add column if not exists photo_attribution text,
  add column if not exists slug text,
  add column if not exists image_review_status text;

-- Backfill slug if missing, based on food name.
update public.foods
set slug = lower(
  regexp_replace(
    regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-+|-+$)',
    '',
    'g'
  )
)
where slug is null or btrim(slug) = '';

with object_candidates as (
  select
    o.bucket_id,
    o.name as object_name,
    regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g') as stem,
    row_number() over (
      partition by regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g')
      order by
        case lower(split_part(o.name, '.', 2))
          when 'webp' then 1
          when 'png' then 2
          when 'jpg' then 3
          when 'jpeg' then 4
          else 99
        end,
        o.created_at desc nulls last,
        o.updated_at desc nulls last
    ) as rn
  from storage.objects o
  where lower(o.bucket_id) = 'meals'
    and o.name is not null
    and o.name <> ''
    and position('/' in o.name) = 0
),
object_best as (
  select bucket_id, stem, object_name
  from object_candidates
  where rn = 1
),
matches as (
  select
    f.id as food_id,
    f.slug,
    ob.bucket_id,
    ob.object_name
  from public.foods f
  join object_best ob
    on ob.stem = f.slug
),
linked as (
  update public.foods f
  set
    image_url = concat(
      'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/',
      m.bucket_id,
      '/',
      m.object_name
    ),
    image_urls = jsonb_build_array(
      concat(
        'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/',
        m.bucket_id,
        '/',
        m.object_name
      )
    ),
    photo_source = 'supabase-storage',
    photo_attribution = 'crawler upload',
    image_review_status = 'approved'
  from matches m
  where f.id = m.food_id
  returning f.id
)
select count(*) as linked_rows from linked;

commit;

-- Final counts required by handoff.
select count(*) as total_foods from public.foods;

select count(*) as foods_with_images
from public.foods
where image_url is not null and btrim(image_url) <> '';

select count(*) as foods_missing_images
from public.foods
where image_url is null or btrim(image_url) = '';

-- Debug output for unmatched foods vs available stems.
with object_stems as (
  select distinct
    regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g') as stem
  from storage.objects o
  where lower(o.bucket_id) = 'meals'
    and o.name is not null
    and o.name <> ''
    and position('/' in o.name) = 0
),
foods_unmatched as (
  select f.id, f.name, f.slug
  from public.foods f
  left join object_stems os on os.stem = f.slug
  where os.stem is null
)
select
  fu.id,
  fu.name as food_name,
  fu.slug as expected_stem
from foods_unmatched fu
order by fu.name;

-- Optional: quick stem inventory from storage.objects (for manual comparisons).
select
  regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g') as available_stem,
  o.name as object_name
from storage.objects o
where lower(o.bucket_id) = 'meals'
  and o.name is not null
  and o.name <> ''
  and position('/' in o.name) = 0
order by available_stem, object_name;
-- Idempotent food-image linking script for Supabase Storage.
-- Uses bucket: meals
-- Safe to run multiple times.

begin;

-- Ensure required columns exist before linking.
alter table public.foods
  add column if not exists image_url text,
  add column if not exists image_urls jsonb default '[]'::jsonb,
  add column if not exists photo_source text,
  add column if not exists photo_attribution text,
  add column if not exists slug text,
  add column if not exists image_review_status text;

-- Backfill slug if missing, based on food name.
update public.foods
set slug = lower(
  regexp_replace(
    regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-+|-+$)',
    '',
    'g'
  )
)
where slug is null or btrim(slug) = '';

with object_candidates as (
  select
    o.name as object_name,
    regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g') as stem,
    row_number() over (
      partition by regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g')
      order by
        case lower(split_part(o.name, '.', 2))
          when 'webp' then 1
          when 'png' then 2
          when 'jpg' then 3
          when 'jpeg' then 4
          else 99
        end,
        o.created_at desc nulls last,
        o.updated_at desc nulls last
    ) as rn
  from storage.objects o
  where o.bucket_id = 'meals'
    and o.name is not null
    and o.name <> ''
    and position('/' in o.name) = 0
),
object_best as (
  select stem, object_name
  from object_candidates
  where rn = 1
),
matches as (
  select
    f.id as food_id,
    f.slug,
    ob.object_name
  from public.foods f
  join object_best ob
    on ob.stem = f.slug
),
linked as (
  update public.foods f
  set
    image_url = concat(
      'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/meals/',
      m.object_name
    ),
    image_urls = jsonb_build_array(
      concat(
        'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/meals/',
        m.object_name
      )
    ),
    photo_source = 'supabase-storage',
    photo_attribution = 'crawler upload',
    image_review_status = 'approved'
  from matches m
  where f.id = m.food_id
  returning f.id
)
select count(*) as linked_rows from linked;

commit;

-- Final counts required by handoff.
select count(*) as total_foods from public.foods;

select count(*) as foods_with_images
from public.foods
where image_url is not null and btrim(image_url) <> '';

select count(*) as foods_missing_images
from public.foods
where image_url is null or btrim(image_url) = '';

-- Debug output for unmatched foods vs available stems.
with object_stems as (
  select distinct
    regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g') as stem
  from storage.objects o
  where o.bucket_id = 'meals'
    and o.name is not null
    and o.name <> ''
    and position('/' in o.name) = 0
),
foods_unmatched as (
  select f.id, f.name, f.slug
  from public.foods f
  left join object_stems os on os.stem = f.slug
  where os.stem is null
)
select
  fu.id,
  fu.name as food_name,
  fu.slug as expected_stem
from foods_unmatched fu
order by fu.name;

-- Optional: quick stem inventory from storage.objects (for manual comparisons).
select
  regexp_replace(split_part(o.name, '.', 1), '[^a-zA-Z0-9-]+', '-', 'g') as available_stem,
  o.name as object_name
from storage.objects o
where o.bucket_id = 'meals'
  and o.name is not null
  and o.name <> ''
  and position('/' in o.name) = 0
order by available_stem, object_name;
-- Auto-generated by scripts/build-food-image-link-sql.mjs
-- Project ref: qgnzcqwonmlijdvnbqjd
-- Bucket: crawler-meals
-- Prefix: (none)
-- Matched images: 327
-- Missing images: 18

begin;

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/apple.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Apple';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/banana.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Banana';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/orange.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Orange';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/strawberry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Strawberry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/blueberry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Blueberry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pineapple.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pineapple';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mango.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mango';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/watermelon.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Watermelon';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/avocado.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Avocado';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pear.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pear';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kiwi.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kiwi';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/plum.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Plum';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/guava.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Guava';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/dates.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Dates';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/raisins.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Raisins';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lemon.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lemon';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lime.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lime';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/white-rice-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'White Rice (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/brown-rice-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Brown Rice (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/quinoa-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Quinoa (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/oats-dry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Oats (dry)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/whole-wheat-bread.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Whole Wheat Bread';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/white-bread.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'White Bread';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pasta-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pasta (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/couscous-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Couscous (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/corn-tortilla.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Corn Tortilla';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/flour-tortilla.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Flour Tortilla';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sweet-potato.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sweet Potato';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/potato-boiled.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Potato (boiled)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mashed-potato.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mashed Potato';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/french-fries.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'French Fries';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/popcorn-air-popped.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Popcorn (air-popped)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-breast-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Breast (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-thigh-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Thigh (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/turkey-breast-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Turkey Breast (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lean-beef-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lean Beef (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/ground-beef-90-10-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Ground Beef 90/10 (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pork-loin-cooked.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pork Loin (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/salmon-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Salmon (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tuna-water.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tuna (water)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tilapia-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tilapia (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/shrimp-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Shrimp (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/egg-whole.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Egg (whole)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/egg-white.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Egg White';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-firm.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu (firm)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tempeh.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tempeh';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lentils-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lentils (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chickpeas-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chickpeas (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/black-beans-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Black Beans (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kidney-beans-cooked.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kidney Beans (cooked)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/peanut-butter.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Peanut Butter';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/almonds.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Almonds';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/milk-whole.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Milk (whole)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/milk-2.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Milk (2%)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/skim-milk.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Skim Milk';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/greek-yogurt-plain.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Greek Yogurt (plain)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/yogurt-plain.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Yogurt (plain)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cheddar-cheese.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cheddar Cheese';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mozzarella.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mozzarella';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/broccoli.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Broccoli';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/spinach.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Spinach';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kale.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kale';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/carrot.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Carrot';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cucumber.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cucumber';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tomato.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tomato';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/bell-pepper.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Bell Pepper';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/onion.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Onion';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mushroom.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mushroom';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cauliflower.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cauliflower';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/zucchini.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Zucchini';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cabbage.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cabbage';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/green-beans.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Green Beans';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/peas.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Peas';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/olive-oil.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Olive Oil';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/canola-oil.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Canola Oil';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/coconut-oil.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Coconut Oil';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mayonnaise.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mayonnaise';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/walnuts.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Walnuts';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cashews.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cashews';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pistachios.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pistachios';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sunflower-seeds.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sunflower Seeds';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chia-seeds.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chia Seeds';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/flax-seeds.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Flax Seeds';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-stew.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Stew';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/hamburger.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Hamburger';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/hot-dog.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Hot Dog';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/fried-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Fried Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-nuggets.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Nuggets';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sushi-mixed.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sushi (mixed)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/ramen-prepared.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Ramen (prepared)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/taco-beef.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Taco Beef';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/burrito-bean.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Burrito Bean';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pancakes.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pancakes';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/waffles.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Waffles';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/omelette.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Omelette';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/rice-with-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Rice with Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-and-rice-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken and Rice Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-biryani.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Biryani';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-biryani.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Biryani';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-curry-with-rice.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Curry with Rice';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/butter-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Butter Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tikka-masala.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tikka Masala';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/fried-rice-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Fried Rice (chicken)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/fried-rice-vegetable.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Fried Rice (vegetable)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/spaghetti-bolognese.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Spaghetti Bolognese';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lasagna.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lasagna';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-alfredo-pasta.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Alfredo Pasta';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/grilled-chicken-wrap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Grilled Chicken Wrap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-shawarma-wrap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Shawarma Wrap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/falafel-wrap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Falafel Wrap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/caesar-salad-with-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Caesar Salad with Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/greek-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Greek Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-salad-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Salad Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/club-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Club Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-burger.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Burger';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cheeseburger.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cheeseburger';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-taco.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Taco';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-quesadilla.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Quesadilla';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sushi-roll-salmon.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sushi Roll (salmon)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sushi-roll-avocado.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sushi Roll (avocado)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pad-thai.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pad Thai';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pho-beef.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pho (beef)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-dumplings.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Dumplings';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-meatballs-with-sauce.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Meatballs with Sauce';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lentil-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lentil Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tomato-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tomato Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-noodle-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Noodle Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mashed-potatoes-with-gravy.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mashed Potatoes with Gravy';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/roast-chicken-with-potatoes.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Roast Chicken with Potatoes';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/salmon-with-rice.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Salmon with Rice';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/teriyaki-chicken-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Teriyaki Chicken Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/poke-bowl-salmon.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Poke Bowl (salmon)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/poke-bowl-tuna.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Poke Bowl (tuna)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-kebab.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Kebab';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/scrambled-eggs-with-toast.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Scrambled Eggs with Toast';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/breakfast-burrito.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Breakfast Burrito';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/oatmeal-with-banana.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Oatmeal with Banana';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/yogurt-with-granola.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Yogurt with Granola';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/fried-egg-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Fried Egg Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sugar.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sugar';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/honey.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Honey';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/jam.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Jam';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/dark-chocolate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Dark Chocolate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/milk-chocolate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Milk Chocolate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/granola.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Granola';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/protein-powder.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Protein Powder';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/toasted-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Toasted Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/croissant.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Croissant';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/bagel.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Bagel';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/muffin.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Muffin';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/ice-cream-vanilla.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Ice Cream (vanilla)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/potato-chips.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Potato Chips';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pretzels.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pretzels';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/crackers.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Crackers';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/granola-bar.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Granola Bar';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/energy-bar.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Energy Bar';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/peanut-butter-jelly-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Peanut Butter Jelly Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chocolate-milk.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chocolate Milk';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/milkshake-vanilla.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Milkshake (vanilla)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/smoothie-fruit.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Smoothie (fruit)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/shakshuka.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Shakshuka';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-tandoori.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Tandoori';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/palak-paneer.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Palak Paneer';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chana-masala.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chana Masala';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/dal-tadka.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Dal Tadka';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-souvlaki.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Souvlaki';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-shawarma-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Shawarma Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/falafel-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Falafel Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-caesar-wrap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Caesar Wrap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/turkey-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Turkey Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tuna-salad-sandwich.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tuna Salad Sandwich';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-fajitas.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Fajitas';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-fajitas.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Fajitas';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-enchiladas.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Enchiladas';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-enchiladas.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Enchiladas';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pozole.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pozole';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-tortilla-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Tortilla Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/bibimbap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Bibimbap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/korean-bbq-beef.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Korean BBQ Beef';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kimchi-fried-rice.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kimchi Fried Rice';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/miso-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Miso Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-teriyaki.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Teriyaki';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-bulgogi-bowl.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Bulgogi Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/general-tso-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'General Tso Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/orange-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Orange Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kung-pao-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kung Pao Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sweet-and-sour-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sweet and Sour Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-satay.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Satay';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-rendang.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Rendang';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tom-yum-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tom Yum Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/green-curry-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Green Curry Chicken';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/red-curry-tofu.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Red Curry Tofu';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pasta-primavera.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pasta Primavera';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/minestrone-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Minestrone Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/risotto.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Risotto';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-parmesan.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Parmesan';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/eggplant-parmesan.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Eggplant Parmesan';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/margherita-pizza.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Margherita Pizza';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pepperoni-pizza.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pepperoni Pizza';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/pesto-pasta.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Pesto Pasta';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-noodle-stir-fry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Noodle Stir Fry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/vegetable-stir-fry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Vegetable Stir Fry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-stir-fry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu Stir Fry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-pot-pie.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Pot Pie';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/turkey-chili.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Turkey Chili';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-burrito-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Burrito Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/steak-burrito-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Steak Burrito Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/shrimp-burrito-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Shrimp Burrito Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-gyro.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Gyro';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lamb-gyro.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lamb Gyro';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-kofta.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Kofta';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-katsu.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Katsu';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tonkatsu.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tonkatsu';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-yakisoba.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Yakisoba';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-udon.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef Udon';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/salmon-nigiri.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Salmon Nigiri';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tuna-nigiri.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tuna Nigiri';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-congee.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Congee';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/porridge-oatmeal-milk.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Porridge (oatmeal milk)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/greek-yogurt-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Greek Yogurt Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/fruit-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Fruit Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-and-quinoa-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken and Quinoa Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-and-quinoa-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu and Quinoa Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/poke-bowl-chicken.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Poke Bowl (chicken)';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-caesar-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Caesar Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/quinoa-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Quinoa Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tabbouleh.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tabbouleh';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/fattoush.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Fattoush';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-pita-pocket.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Pita Pocket';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/vegetable-omelette.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Vegetable Omelette';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/egg-and-avocado-toast.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Egg and Avocado Toast';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/protein-pancakes.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Protein Pancakes';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/banana-smoothie.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Banana Smoothie';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/berry-smoothie.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Berry Smoothie';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/green-smoothie.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Green Smoothie';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/iced-latte.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Iced Latte';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cappuccino.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cappuccino';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mocha.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mocha';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/matcha-latte.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Matcha Latte';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/acai-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Acai Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-pasta-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Pasta Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tuna-pasta-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tuna Pasta Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cobb-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cobb Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-and-veggie-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken and Veggie Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mediterranean-salmon-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mediterranean Salmon Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/grilled-chicken-power-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Grilled Chicken Power Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/turkey-quinoa-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Turkey Quinoa Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lentil-buddha-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lentil Buddha Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/roasted-veggie-grain-bowl.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Roasted Veggie Grain Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-buddha-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu Buddha Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chickpea-shawarma-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chickpea Shawarma Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/grilled-shrimp-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Grilled Shrimp Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-taco-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Taco Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/black-bean-burrito-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Black Bean Burrito Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mediterranean-chickpea-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mediterranean Chickpea Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tuna-nicoise-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tuna Nicoise Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/salmon-caesar-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Salmon Caesar Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kale-chicken-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kale Chicken Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/quinoa-tabbouleh.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Quinoa Tabbouleh';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/greek-chicken-pita.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Greek Chicken Pita';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/veggie-hummus-wrap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Veggie Hummus Wrap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/turkey-avocado-wrap.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Turkey Avocado Wrap';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/salmon-avocado-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Salmon Avocado Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-poke-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu Poke Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/edamame-sushi-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Edamame Sushi Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-soba-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Soba Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/miso-salmon-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Miso Salmon Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/thai-peanut-chicken-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Thai Peanut Chicken Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/teriyaki-tofu-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Teriyaki Tofu Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/vegetable-pho-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Vegetable Pho Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-udon-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Udon Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-miso-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu Miso Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/sardine-rice-bowl.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Sardine Rice Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/kimchi-tofu-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Kimchi Tofu Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/paneer-tikka-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Paneer Tikka Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/rajma-rice-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Rajma Rice Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lemon-herb-chicken-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lemon Herb Chicken Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/baked-cod-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Baked Cod Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/roasted-turkey-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Roasted Turkey Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/turkey-meatball-bowl.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Turkey Meatball Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-meatball-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Meatball Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/baked-falafel-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Baked Falafel Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/hummus-power-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Hummus Power Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-lentil-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Lentil Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/vegetable-lentil-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Vegetable Lentil Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tomato-basil-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tomato Basil Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mushroom-barley-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mushroom Barley Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/butternut-squash-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Butternut Squash Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/overnight-oats-with-chia.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Overnight Oats with Chia';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/protein-yogurt-parfait.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Protein Yogurt Parfait';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/egg-white-scramble-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Egg White Scramble Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/smoked-salmon-toast.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Smoked Salmon Toast';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/peanut-butter-oatmeal-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Peanut Butter Oatmeal Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/berry-chia-pudding.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Berry Chia Pudding';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tropical-smoothie-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tropical Smoothie Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/matcha-yogurt-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Matcha Yogurt Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-and-broccoli-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken and Broccoli Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/salmon-and-asparagus-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Salmon and Asparagus Plate';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tuna-and-white-bean-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tuna and White Bean Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-veggie-noodle-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu Veggie Noodle Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cottage-cheese-fruit-bowl.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cottage Cheese Fruit Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mediterranean-tuna-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mediterranean Tuna Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/roasted-chickpea-snack-bowl.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Roasted Chickpea Snack Bowl';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/broccoli-cheddar-soup-light.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Broccoli Cheddar Soup Light';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/homemade-chicken-noodle-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Homemade Chicken Noodle Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/beef-and-broccoli-stir-fry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Beef and Broccoli Stir Fry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mediterranean-chickpea-stew.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mediterranean Chickpea Stew';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mediterranean-grilled-salmon.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mediterranean Grilled Salmon';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/healthy-turkey-chili.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Healthy Turkey Chili';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/simple-oven-baked-sea-bass.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Simple Oven-Baked Sea Bass';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/broccoli-garlic-pasta.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Broccoli Garlic Pasta';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/vegan-pancakes.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Vegan Pancakes';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/chicken-tikka-masala-light.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Chicken Tikka Masala Light';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/spinach-shakshuka.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Spinach Shakshuka';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/grilled-shrimp-skewers.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Grilled Shrimp Skewers';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/lentil-tomato-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Lentil Tomato Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/quinoa-veggie-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Quinoa Veggie Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/baked-lemon-herb-cod.webp',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Baked Lemon Herb Cod';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/tofu-veggie-stir-fry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Tofu Veggie Stir-Fry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/greek-yogurt-fruit-parfait.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Greek Yogurt Fruit Parfait';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/air-fryer-salmon-bites.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Air Fryer Salmon Bites';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/instant-pot-chicken-soup.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Instant Pot Chicken Soup';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/ground-turkey-lettuce-wraps.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Ground Turkey Lettuce Wraps';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/cauliflower-chickpea-curry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Cauliflower Chickpea Curry';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/mediterranean-tuna-salad.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Mediterranean Tuna Salad';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/crawler-meals/stuffed-zucchini-boats.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'crawler upload',
  image_review_status = 'approved'
where name = 'Stuffed Zucchini Boats';

commit;

-- Missing meals (no local downloaded image found):
-- Grapes
-- Peach
-- Papaya
-- Cottage Cheese
-- Parmesan
-- Butter
-- Asparagus
-- Pizza Cheese
-- Mac and Cheese
-- Noodles with Chicken
-- Beef Burrito
-- Steak with Rice
-- Hummus with Pita
-- Avocado Toast
-- Vegetable Pizza
-- Beef Chili
-- Spinach Berry Salad
-- Stuffed Bell Pepper