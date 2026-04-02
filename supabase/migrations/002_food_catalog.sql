create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  calories numeric not null check (calories >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now()
);

create index if not exists foods_name_idx on public.foods (name);
create index if not exists foods_category_idx on public.foods (category);

alter table public.foods enable row level security;

drop policy if exists "foods_read_all" on public.foods;
create policy "foods_read_all" on public.foods
for select
using (true);

