-- Fix semantically wrong photo assignments in public.foods.
-- Run this AFTER all batch seeds to correct bad mappings.
-- Safe to re-run: all updates are idempotent by food name.

begin;

-- ─── Mashed Potato + Mashed Potatoes with Gravy ─────────────────────────────
-- Was showing a stir-fry/curry dish (photo-1603133872878).
-- Fix to use the boiled potato Unsplash photo used for "Potato (boiled)".
UPDATE public.foods SET
  image_url         = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
  photo_source      = 'unsplash',
  photo_attribution = 'Unsplash',
  image_review_status = 'approved'
WHERE name IN ('Mashed Potato', 'Mashed Potatoes with Gravy');

-- ─── Bibimbap ────────────────────────────────────────────────────────────────
-- Was sharing the milkshake/burger photo (photo-1568901346375).
-- Point to the dedicated Supabase Storage upload from batch01.
UPDATE public.foods SET
  image_url         = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/bibimbap.jpg',
  photo_source      = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
WHERE name = 'Bibimbap';

-- ─── Chicken Burger ──────────────────────────────────────────────────────────
-- Was sharing the milkshake/bibimbap photo (photo-1568901346375).
-- Use the cheeseburger storage image as a close visual stand-in.
UPDATE public.foods SET
  image_url         = 'https://qgnzcqwonmlijdvnbqjd.supabase.co/storage/v1/object/public/Meals/cheeseburger.webp',
  photo_source      = 'supabase-storage',
  photo_attribution = 'supabase meals bucket',
  image_review_status = 'approved'
WHERE name = 'Chicken Burger';

-- ─── Honey ───────────────────────────────────────────────────────────────────
-- Was sharing the same photo as Watermelon and Onion (photo-1587049352846).
-- Use the golden/jar Unsplash photo for honey.
UPDATE public.foods SET
  image_url         = 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
  photo_source      = 'unsplash',
  photo_attribution = 'Unsplash',
  image_review_status = 'approved'
WHERE name = 'Honey';

-- ─── Onion ───────────────────────────────────────────────────────────────────
-- Was sharing the same photo as Watermelon and Honey (photo-1587049352846).
-- Use a vegetable-family Unsplash photo (currently assigned to Cauliflower/Cucumber).
UPDATE public.foods SET
  image_url         = 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=800&q=80',
  photo_source      = 'unsplash',
  photo_attribution = 'Unsplash',
  image_review_status = 'approved'
WHERE name = 'Onion';

-- ─── Jam ─────────────────────────────────────────────────────────────────────
-- Was sharing the same photo as Mozzarella (cheese/dairy photo-1589881133825).
-- Use a berry/strawberry Unsplash photo as a jam stand-in.
UPDATE public.foods SET
  image_url         = 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=800&q=80',
  photo_source      = 'unsplash',
  photo_attribution = 'Unsplash',
  image_review_status = 'approved'
WHERE name = 'Jam';

commit;
