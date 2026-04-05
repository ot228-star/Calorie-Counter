import { FOOD_DATABASE, type FoodRecord } from "../data/foodDatabase";
import { getSupabaseConfig } from "../lib/env";

type SearchResult = {
  foods: FoodRecord[];
  source: "cloud" | "local";
};

const localSearch = (query: string): FoodRecord[] => {
  const q = query.trim().toLowerCase();
  if (!q) return FOOD_DATABASE.slice(0, 40);
  return FOOD_DATABASE.filter((food) => food.name.toLowerCase().includes(q)).slice(0, 80);
};

export const searchFoods = async (query: string): Promise<SearchResult> => {
  const { url, anonKey } = getSupabaseConfig();
  const q = query.trim();

  if (!url || !anonKey) {
    return { foods: localSearch(query), source: "local" };
  }

  try {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/foods?select=name,category,calories,protein_g,carbs_g,fat_g&order=name.asc&limit=80`;
    const queryPart = q ? `&name=ilike.*${encodeURIComponent(q)}*` : "";
    const response = await fetch(`${endpoint}${queryPart}`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });
    if (!response.ok) throw new Error("Cloud search request failed");
    const raw = await response.text();
    if (!raw.trim()) return { foods: localSearch(query), source: "local" };
    const data = JSON.parse(raw) as FoodRecord[];
    if (Array.isArray(data) && data.length > 0) {
      return { foods: data, source: "cloud" };
    }
    // Gracefully fallback if table is empty or not seeded yet.
    return { foods: localSearch(query), source: "local" };
  } catch {
    return { foods: localSearch(query), source: "local" };
  }
};

