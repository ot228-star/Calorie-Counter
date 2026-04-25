import { FOOD_DATABASE, type FoodImageReviewStatus, type FoodRecord } from "../data/foodDatabase";
import { getSupabaseConfig } from "../lib/env";
import { authClient } from "./auth";

type SearchResult = {
  foods: FoodRecord[];
  source: "cloud" | "local";
};

const FOODS_SELECT =
  "name,category,calories,protein_g,carbs_g,fat_g,image_url,image_urls,photo_source,photo_attribution,slug,image_review_status";

export function normalizeFoodRow(raw: Record<string, unknown>): FoodRecord {
  const imageUrlsRaw = raw.image_urls;
  let image_urls: string[] | undefined;
  if (Array.isArray(imageUrlsRaw)) {
    image_urls = imageUrlsRaw.filter((x): x is string => typeof x === "string" && x.length > 0);
  } else if (typeof imageUrlsRaw === "string" && imageUrlsRaw.trim()) {
    try {
      const parsed = JSON.parse(imageUrlsRaw) as unknown;
      if (Array.isArray(parsed)) {
        image_urls = parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
      }
    } catch {
      /* ignore */
    }
  }

  const st = raw.image_review_status;
  const image_review_status: FoodImageReviewStatus | undefined =
    st === "pending" || st === "approved" || st === "rejected" ? st : undefined;

  return {
    name: String(raw.name),
    category: String(raw.category),
    calories: Number(raw.calories),
    protein_g: Number(raw.protein_g),
    carbs_g: Number(raw.carbs_g),
    fat_g: Number(raw.fat_g),
    image_url: raw.image_url != null && String(raw.image_url).trim() ? String(raw.image_url).trim() : null,
    image_urls: image_urls?.length ? image_urls : undefined,
    photo_source: raw.photo_source != null && String(raw.photo_source) ? String(raw.photo_source) : undefined,
    photo_attribution:
      raw.photo_attribution != null && String(raw.photo_attribution) ? String(raw.photo_attribution) : undefined,
    slug: raw.slug != null && String(raw.slug) ? String(raw.slug) : undefined,
    image_review_status,
  };
}

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
    const {
      data: { session }
    } = await authClient.auth.getSession();
    const accessToken = session?.access_token ?? anonKey;
    // We merge cloud rows over local rows in App.tsx; use a high enough cap to cover full catalog.
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/foods?select=${FOODS_SELECT}&order=name.asc&limit=500`;
    const queryPart = q ? `&name=ilike.*${encodeURIComponent(q)}*` : "";
    const response = await fetch(`${endpoint}${queryPart}`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) throw new Error("Cloud search request failed");
    const raw = await response.text();
    if (!raw.trim()) return { foods: localSearch(query), source: "local" };
    const data = JSON.parse(raw) as Record<string, unknown>[];
    if (Array.isArray(data) && data.length > 0) {
      return { foods: data.map(normalizeFoodRow), source: "cloud" };
    }
    // Gracefully fallback if table is empty or not seeded yet.
    return { foods: localSearch(query), source: "local" };
  } catch {
    return { foods: localSearch(query), source: "local" };
  }
};
