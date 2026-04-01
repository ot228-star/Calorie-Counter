# Analytics and Model Feedback Loop

## Tracked Events

- `onboarding_completed`
- `manual_meal_saved`
- `camera_estimate_requested`
- `estimate_received`
- `estimate_edited`
- `meal_saved`

## Why These Events

- Funnel health: onboarding -> first log -> repeat logs
- AI quality: confidence distribution and edit frequency
- UX reliability: estimate request failures and save success

## Quality Iteration Loop

1. Collect estimate output in `estimation_requests`.
2. Collect user changes in `estimation_corrections`.
3. Review high-edit patterns weekly.
4. Update prompts/provider mapping rules.
5. Re-check edit-rate trend after each update.
