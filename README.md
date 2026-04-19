# Calorie Counter

Mobile-first calorie counter app for fast food logging with photo estimation and manual correction.

**Repository:** [github.com/ot228-star/Calorie-Counter](https://github.com/ot228-star/Calorie-Counter)

```bash
git clone https://github.com/ot228-star/Calorie-Counter.git
```

## Scope

- Android-first MVP in 4-6 weeks
- React Native (Expo) client
- Supabase backend (Postgres, Auth, Storage, Edge Functions)
- AI-powered meal estimation with required review on low confidence

## Project Structure

- `app/` mobile client
- `supabase/` database migrations and edge functions
- `docs/` requirements and technical specs

## Quick Start

### 1) Install app dependencies

```bash
cd app
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` in the **repo root** (next to `README.md`) and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. The Expo app (`app/app.config.js`) loads that file automatically so you do not need to duplicate it under `app/` unless you prefer it.

### 3) Run app

```bash
npm run start
```

### 4) Apply Supabase migration

Run SQL in `supabase/migrations/001_init.sql` against your Supabase project.

## Current MVP Features

- Onboarding profile + calorie target
- Manual meal logging (CRUD)
- Daily dashboard totals
- Camera estimate flow
- Low-confidence review gate
- Event analytics logging
