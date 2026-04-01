# Setup Guide

## Prerequisites

- Node 20+
- Expo CLI (through `npx expo`)
- Supabase project

## Supabase

1. Create tables by running `supabase/migrations/001_init.sql`.
2. Create storage bucket `meal-images`.
3. Deploy edge functions:
   - `estimate-meal`
   - `daily-summary`
   - `analytics-events`
   - `cleanup-images`
4. Configure function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER_API_KEY` (optional at first)
   - `AI_PROVIDER_BASE_URL` (optional at first)

## Mobile App

1. `cd app`
2. `npm install`
3. Set env vars in `.env`.
4. `npm run start`

## Developer Ownership

- Dev A: app screens, UX, and local state.
- Dev B: SQL, edge functions, and analytics.
