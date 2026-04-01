export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealSource = "manual" | "camera";

export type MealItem = {
  id: string;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "cup" | "piece" | "tbsp";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  estimation_confidence?: number;
};

export type Meal = {
  id: string;
  mealType: MealType;
  source: MealSource;
  eatenAt: string;
  note?: string;
  items: MealItem[];
};

export type DailySummary = {
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type EstimateResult = {
  requestId: string;
  confidence: number;
  warnings: string[];
  detectedItems: MealItem[];
};
