# V1 Requirements

## Product Goals

1. Let users log meals in under 20 seconds for common cases.
2. Provide AI estimate from meal photo with manual correction controls.
3. Keep dashboard clear: consumed, remaining, and macro totals.

## In-Scope Features

- Authentication: email/password plus social-ready structure.
- Onboarding: age, height, weight, activity, goal type, calorie target.
- Manual meal logging: create, edit, delete meal items.
- Camera estimate: upload photo and receive itemized estimate.
- Mandatory review when estimate confidence is below threshold.
- Daily dashboard with meals grouped by meal type.
- Event analytics for funnel and estimate quality.

## User Stories

- As a new user, I can create an account and set my goal in minutes.
- As a user, I can manually add a meal and see totals update.
- As a user, I can take a meal photo and get estimated calories.
- As a user, I can correct detected items before saving.
- As a user, I can check how many calories remain for today.

## Non-Goals (MVP)

- Barcode scanning
- Social feed/challenges
- Subscription billing
- Deep wearable integrations

## Success Criteria

- Time to first meal logged: < 3 minutes from first open.
- Meal save success rate: > 98%.
- AI estimate edit rate tracked for every estimated meal.
