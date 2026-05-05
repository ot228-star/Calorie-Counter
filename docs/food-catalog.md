# Food catalog: nutrition + images (single source of truth)

The app treats **`public.foods`** in Supabase as the canonical catalog for cloud search: macros (calories, protein, carbs, fat) plus curated **`image_url`** / **`image_urls`** after migration `003_food_images_and_catalog_meta.sql`.

The bundled [`src/data/foodDatabase.ts`](../src/data/foodDatabase.ts) remains the offline fallback when Supabase is missing, empty, or unreachable. Client-side maps in [`src/data/foodDetails.ts`](../src/data/foodDetails.ts) (pinned Unsplash, Foodiesfeed, Food.com) are used only **after** server-provided URLs, unless `EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES` is enabled for legacy random hosts.

## Migrations (order)

1. [`supabase/migrations/001_init.sql`](../supabase/migrations/001_init.sql) — core app tables.
2. [`supabase/migrations/002_food_catalog.sql`](../supabase/migrations/002_food_catalog.sql) — `public.foods` + read-only RLS for anon.
3. [`supabase/migrations/003_food_images_and_catalog_meta.sql`](../supabase/migrations/003_food_images_and_catalog_meta.sql) — `image_url`, `image_urls`, attribution, `slug`, `image_review_status`.

## Seeding `public.foods`

1. Apply migrations in the Supabase SQL editor (or CLI).
2. Generate fresh seed SQL from the repo’s TypeScript food lists and photo maps:

   ```bash
   npm run catalog:seed
   ```

   Output: [`supabase/seed/food_catalog_seed.sql`](../supabase/seed/food_catalog_seed.sql) (hundreds of `INSERT ... ON CONFLICT (name) DO UPDATE` rows).

3. Run that file against your project (SQL editor or `psql`).

4. (Optional) Validate that image URLs respond:

   ```bash
   npm run catalog:validate-urls
   ```

   Use `--warn-only` if some CDNs block automated checks.

## CSV import template

For manual curation or spreadsheet workflows, see [`docs/catalog_import_template.csv`](catalog_import_template.csv). Columns match the seed script’s intent: `name` must match app strings exactly; `image_urls_json` is a JSON array string of alternates.

## Client behavior

- [`src/services/foodFinder.ts`](../src/services/foodFinder.ts) selects image columns from PostgREST and normalizes `image_urls` JSON.
- [`getFoodPhotoCandidates`](../src/data/foodDetails.ts) prepends **`image_url`** and **`image_urls`** when `image_review_status` is not `rejected`.
- Set **`EXPO_PUBLIC_ALLOW_PLACEHOLDER_FOOD_IMAGES=false`** in production `.env` once every displayed food has a curated URL in the database (or bundled asset), so Unsplash Source and Picsum are never used.

## Licenses and attribution

- **Unsplash**: follow [Unsplash API guidelines](https://unsplash.com/api-guidelines) and photographer attribution when using `images.unsplash.com` links.
- **Third-party CDNs** (Foodiesfeed mirror, Food.com): respect their terms; `photo_attribution` on each row documents the credit line shown in the UI when present.
- **Self-hosted**: prefer a Supabase Storage bucket you control (`photo_source` / URLs you own) for long-term stability.

## Editorial workflow (`image_review_status`)

- **`approved`**: client may show `image_url` / `image_urls`.
- **`pending`**: shown the same today; tighten client logic later if you want to hide until reviewed.
- **`rejected`**: client ignores DB images for that row and falls back to maps / placeholders policy only.

## Related docs

- [setup.md](setup.md) — env vars and Supabase project configuration.
- [api-contracts.md](api-contracts.md) — edge function contracts (separate from catalog REST).
