import { assertSupabaseConfigured, getSupabaseConfig } from "../lib/env";
import { sumItems } from "../lib/calculations";
import { EstimateResult, Meal, MealItem } from "../types";
import { authClient } from "./auth";

const restBaseUrl = () => {
  const { url } = getSupabaseConfig();
  return `${url.replace(/\/$/, "")}/rest/v1`;
};

const apiHeaders = async () => {
  const { anonKey } = getSupabaseConfig();
  const {
    data: { session }
  } = await authClient.auth.getSession();
  const accessToken = session?.access_token ?? anonKey;
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
  };
};

const requestJson = async <T>(url: string, init: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  // Some Supabase endpoints return 204/empty body; parsing that as JSON throws.
  const raw = await response.text();
  if (!raw.trim()) return undefined as T;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON response";
    throw new Error(`Could not parse server response: ${detail}`);
  }
};

export const estimateMealFromImage = async (imageUrl: string, mealType: Meal["mealType"]): Promise<EstimateResult> => {
  assertSupabaseConfigured();
  const { url: supabaseUrl, anonKey } = getSupabaseConfig();
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/estimate-meal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      imageUrl,
      mealType,
      eatenAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });

  if (!response.ok) throw new Error("Could not estimate meal.");
  const raw = await response.text();
  if (!raw.trim()) throw new Error("Could not estimate meal: empty response.");
  return JSON.parse(raw) as EstimateResult;
};

export const saveMeal = async (meal: Meal, requestId?: string) => {
  assertSupabaseConfigured();
  const totals = sumItems(meal.items);
  const rb = restBaseUrl();
  const headers = await apiHeaders();
  const mealRows = await requestJson<Array<{ id: string }>>(`${rb}/meals?select=id`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([
      {
        meal_type: meal.mealType,
        source: meal.source,
        eaten_at: meal.eatenAt,
        note: meal.note ?? null,
        total_calories: totals.calories,
        total_protein_g: totals.protein_g,
        total_carbs_g: totals.carbs_g,
        total_fat_g: totals.fat_g,
      },
    ]),
  });
  const mealId = mealRows[0]?.id;
  if (!mealId) throw new Error("Could not save meal.");

  const insertItems = meal.items.map((item) => ({
    meal_id: mealId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    protein_g: item.protein_g,
    carbs_g: item.carbs_g,
    fat_g: item.fat_g,
    estimation_confidence: item.estimation_confidence ?? null,
  }));

  await requestJson<unknown>(`${rb}/meal_items`, {
    method: "POST",
    headers,
    body: JSON.stringify(insertItems),
  });

  if (requestId) {
    await requestJson<unknown>(`${rb}/estimation_requests?id=eq.${requestId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "succeeded" }),
    });
  }
};

export const listMealsForToday = async (): Promise<Meal[]> => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return [];

  const rb = restBaseUrl();
  const headers = await apiHeaders();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const mealsData = await requestJson<
    Array<{ id: string; meal_type: Meal["mealType"]; source: Meal["source"]; eaten_at: string; note: string | null }>
  >(
    `${rb}/meals?select=id,meal_type,source,eaten_at,note&eaten_at=gte.${encodeURIComponent(start.toISOString())}&eaten_at=lte.${encodeURIComponent(end.toISOString())}&order=eaten_at.desc`,
    {
      method: "GET",
      headers,
    },
  );

  const ids = mealsData.map((meal) => meal.id);
  if (!ids.length) return [];

  const itemsData = await requestJson<
    Array<{
      id: string;
      meal_id: string;
      name: string;
      quantity: number;
      unit: MealItem["unit"];
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      estimation_confidence: number | null;
    }>
  >(`${rb}/meal_items?select=*&meal_id=in.(${ids.join(",")})`, {
    method: "GET",
    headers,
  });

  return mealsData.map((meal) => ({
    id: meal.id,
    mealType: meal.meal_type,
    source: meal.source,
    eatenAt: meal.eaten_at,
    note: meal.note ?? undefined,
    items: itemsData
      .filter((item) => item.meal_id === meal.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        calories: item.calories,
        protein_g: Number(item.protein_g),
        carbs_g: Number(item.carbs_g),
        fat_g: Number(item.fat_g),
        estimation_confidence: item.estimation_confidence ?? undefined,
      })),
  }));
};

export const deleteMealById = async (mealId: string) => {
  assertSupabaseConfigured();
  const rb = restBaseUrl();
  const headers = await apiHeaders();
  await requestJson<unknown>(`${rb}/meals?id=eq.${mealId}`, {
    method: "DELETE",
    headers,
  });
};

export const upsertProfile = async (profile: {
  id: string;
  display_name?: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_type: "lose" | "maintain" | "gain";
  daily_calorie_target: number;
}) => {
  assertSupabaseConfigured();
  const headers = await apiHeaders();
  await requestJson<unknown>(`${restBaseUrl()}/profiles?on_conflict=id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([
      {
        ...profile,
        display_name: profile.display_name ?? null
      }
    ])
  });
};

export const getProfile = async (userId: string): Promise<{
  display_name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_type: "lose" | "maintain" | "gain" | null;
  daily_calorie_target: number | null;
} | null> => {
  assertSupabaseConfigured();
  const headers = await apiHeaders();
  const rows = await requestJson<
    Array<{
      display_name: string | null;
      age: number | null;
      height_cm: number | null;
      weight_kg: number | null;
      goal_type: "lose" | "maintain" | "gain" | null;
      daily_calorie_target: number | null;
    }>
  >(`${restBaseUrl()}/profiles?select=display_name,age,height_cm,weight_kg,goal_type,daily_calorie_target&id=eq.${userId}&limit=1`, {
    method: "GET",
    headers
  });
  return rows[0] ?? null;
};

export const logEstimateCorrections = async (requestId: string, originalItems: MealItem[], editedItems: MealItem[]) => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return;

  const corrections: Array<{ field_name: string; old_value: string; new_value: string }> = [];
  const max = Math.max(originalItems.length, editedItems.length);

  for (let index = 0; index < max; index += 1) {
    const original = originalItems[index];
    const edited = editedItems[index];
    if (!original && edited) {
      corrections.push({
        field_name: `item_${index}_added`,
        old_value: "",
        new_value: JSON.stringify(edited),
      });
      continue;
    }
    if (original && !edited) {
      corrections.push({
        field_name: `item_${index}_removed`,
        old_value: JSON.stringify(original),
        new_value: "",
      });
      continue;
    }
    if (!original || !edited) continue;
    (["name", "quantity", "unit", "calories", "protein_g", "carbs_g", "fat_g"] as const).forEach((field) => {
      if (String(original[field]) !== String(edited[field])) {
        corrections.push({
          field_name: `${index}.${field}`,
          old_value: String(original[field]),
          new_value: String(edited[field]),
        });
      }
    });
  }

  const headers = await apiHeaders();
  if (!corrections.length) return;
  const payload = corrections.map((c) => ({
    request_id: requestId,
    field_name: c.field_name,
    old_value: c.old_value,
    new_value: c.new_value,
  }));
  await requestJson<unknown>(`${restBaseUrl()}/estimation_corrections`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
};
