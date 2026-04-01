# Calorie Counter

Mobile-first calorie counter app for fast food logging with photo estimation and manual correction.

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

Copy `.env.example` to `.env` and fill values.

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
