-- One-off: replace any Unsplash meal URLs still stored on public.foods (re-run after fixing batch seeds).
-- Safe to run multiple times.

begin;

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/burrito-bean.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
where name = 'Beef Burrito' and image_url ilike '%unsplash.com%';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/beef-stew.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
where name = 'Beef Chili' and image_url ilike '%unsplash.com%';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/hummus-power-plate.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
where name = 'Hummus with Pita' and image_url ilike '%unsplash.com%';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/chicken-noodle-stir-fry.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
where name = 'Noodles with Chicken' and image_url ilike '%unsplash.com%';

update public.foods
set
  image_url = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/margherita-pizza.jpg',
  image_urls = '[]'::jsonb,
  photo_source = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
where name = 'Vegetable Pizza' and image_url ilike '%unsplash.com%';

commit;
