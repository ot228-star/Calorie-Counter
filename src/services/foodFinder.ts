import { type FoodImageReviewStatus, type FoodRecord } from "../data/foodDatabase";
import { parseCuisineRegionTags } from "../data/cuisineRegions";
import { getSupabaseConfig } from "../lib/env";

type SearchResult = {
  foods: FoodRecord[];
  source: "cloud";
};

// Omit `cuisine_regions` until migration `005_food_cuisine_regions.sql` is applied — requesting an
// unknown column makes the whole foods query fail and empties the Plan catalog.
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

  let cuisineRaw: unknown = raw.cuisine_regions;
  if (typeof cuisineRaw === "string" && cuisineRaw.trim()) {
    try {
      cuisineRaw = JSON.parse(cuisineRaw) as unknown;
    } catch {
      cuisineRaw = undefined;
    }
  }
  const cuisine_regions = parseCuisineRegionTags(cuisineRaw);

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
    cuisine_regions
  };
}

export const searchFoods = async (query: string): Promise<SearchResult> => {
  const { url, anonKey } = getSupabaseConfig();
  const q = query.trim();

  if (!url || !anonKey) {
    return { foods: [], source: "cloud" };
  }

  try {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/foods?select=${FOODS_SELECT}&order=name.asc&limit=40`;
    const queryPart = q ? `&name=ilike.*${encodeURIComponent(q)}*` : "";
    const response = await fetch(`${endpoint}${queryPart}`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!response.ok) throw new Error("Cloud search request failed");
    const raw = await response.text();
    if (!raw.trim()) return { foods: [], source: "cloud" };
    const data = JSON.parse(raw) as Record<string, unknown>[];
    if (Array.isArray(data) && data.length > 0) return { foods: data.map(normalizeFoodRow), source: "cloud" };
    return { foods: [], source: "cloud" };
  } catch {
    return { foods: [], source: "cloud" };
  }
};
