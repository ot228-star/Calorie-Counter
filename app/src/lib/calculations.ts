import { DailySummary, Meal, MealItem } from "../types";

export const sumItems = (items: MealItem[]) => {
  return items.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.protein_g += item.protein_g;
      acc.carbs_g += item.carbs_g;
      acc.fat_g += item.fat_g;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
};

export const summaryFromMeals = (meals: Meal[], targetCalories: number): DailySummary => {
  const totals = meals.reduce(
    (acc, meal) => {
      const mealTotals = sumItems(meal.items);
      acc.consumedCalories += mealTotals.calories;
      acc.protein_g += mealTotals.protein_g;
      acc.carbs_g += mealTotals.carbs_g;
      acc.fat_g += mealTotals.fat_g;
      return acc;
    },
    { consumedCalories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return {
    targetCalories,
    consumedCalories: totals.consumedCalories,
    remainingCalories: Math.max(targetCalories - totals.consumedCalories, 0),
    protein_g: Number(totals.protein_g.toFixed(1)),
    carbs_g: Number(totals.carbs_g.toFixed(1)),
    fat_g: Number(totals.fat_g.toFixed(1))
  };
};

export const suggestedCalorieTarget = ({
  weightKg,
  heightCm,
  age,
  goalType,
  sex
}: {
  weightKg: number;
  heightCm: number;
  age: number;
  goalType: "lose" | "maintain" | "gain";
  sex?: "man" | "woman";
}) => {
  // Mifflin-St Jeor estimate. Uses sex-specific constant when available.
  const sexConstant = sex === "woman" ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant;
  const maintenance = Math.round(bmr * 1.4);
  if (goalType === "lose") return Math.max(maintenance - 350, 1200);
  if (goalType === "gain") return maintenance + 300;
  return maintenance;
};
