-- Optional explicit cuisine region tags for Plan filters (client also ships a name→region map).
-- Valid values align with app `CuisineRegionTag`: northAmerican, mediterranean, southAsian,
-- eastAsian, latinAmerican, middleEastern. NULL = client-side map + keyword fallback.

alter table public.foods
  add column if not exists cuisine_regions text[] null;

comment on column public.foods.cuisine_regions is
  'Optional tags for regional Plan chips; null uses bundled client map / heuristics.';
