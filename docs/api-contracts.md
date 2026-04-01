# API Contracts

## POST /functions/v1/estimate-meal

Request:

```json
{
  "imageUrl": "https://.../meal.jpg",
  "mealType": "lunch",
  "eatenAt": "2026-04-01T12:30:00Z",
  "timezone": "Africa/Kigali"
}
```

Response:

```json
{
  "requestId": "uuid",
  "confidence": 0.74,
  "warnings": ["low_confidence_portion"],
  "detectedItems": [
    {
      "name": "rice",
      "quantity": 1,
      "unit": "cup",
      "calories": 205,
      "protein_g": 4.3,
      "carbs_g": 45,
      "fat_g": 0.4
    }
  ],
  "totals": {
    "calories": 205,
    "protein_g": 4.3,
    "carbs_g": 45,
    "fat_g": 0.4
  }
}
```

## GET /functions/v1/daily-summary?date=YYYY-MM-DD

Response:

```json
{
  "date": "2026-04-01",
  "target_calories": 2200,
  "consumed_calories": 1460,
  "remaining_calories": 740,
  "macros": {
    "protein_g": 95,
    "carbs_g": 160,
    "fat_g": 50
  }
}
```

## POST /functions/v1/analytics-events

Request:

```json
{
  "eventName": "meal_saved",
  "timestamp": "2026-04-01T10:00:00Z",
  "props": {
    "source": "camera",
    "confidence": 0.81
  }
}
```
