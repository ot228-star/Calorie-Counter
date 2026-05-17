-- patch_null_image_urls.sql
-- Clears any non-Supabase image URLs that may have been left behind.
-- Run after all food_image_urls_batch_*.sql files.
-- Safe to re-run: only touches rows where image_url is not a Supabase Storage URL.

UPDATE public.foods
SET
  image_url           = NULL,
  image_urls          = '[]'::jsonb,
  photo_source        = NULL,
  photo_attribution   = NULL,
  image_review_status = 'pending'
WHERE
  image_url IS NOT NULL
  AND image_url NOT ILIKE '%supabase.co/storage/v1/object/public/%';
