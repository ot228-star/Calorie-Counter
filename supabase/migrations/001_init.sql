create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age int,
  height_cm int,
  weight_kg numeric,
  activity_level text check (activity_level in ('low','moderate','high')),
  goal_type text check (goal_type in ('lose','maintain','gain')),
  daily_calorie_target int not null default 2200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  source text not null check (source in ('manual','camera')),
  eaten_at timestamptz not null,
  note text,
  total_calories int not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null check (unit in ('g','ml','cup','piece','tbsp')),
  calories int not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  estimation_confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estimation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  image_path text not null,
  provider text not null,
  status text not null check (status in ('queued','succeeded','failed')),
  raw_response jsonb,
  confidence numeric,
  latency_ms int,
  created_at timestamptz not null default now()
);

create table if not exists public.estimation_corrections (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.estimation_requests(id) on delete cascade,
  meal_item_id uuid references public.meal_items(id) on delete set null,
  field_name text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_name text not null,
  props jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.estimation_requests enable row level security;
alter table public.estimation_corrections enable row level security;
alter table public.analytics_events enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "meals_own_all" on public.meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meal_items_own_all" on public.meal_items for all
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_items.meal_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_items.meal_id and m.user_id = auth.uid()
    )
  );

create policy "estimation_requests_own_all" on public.estimation_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "analytics_events_own_insert_select" on public.analytics_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
