import type { FoodRecord } from "./foodDatabase";
import { getSupabaseConfig } from "../lib/env";

export type FoodDetail = {
  description: string;
  photoUrl: string;
  sourceLabel: string;
  keyIngredients: string[];
  wellnessTip: string;
  aliases?: string[];
  photoCandidates?: string[];
};

const PHOTO_SOURCE = "Catalog image (Supabase)";

const INGREDIENTS_BY_FOOD: Record<string, string[]> = {
  "Mediterranean Salmon Bowl": ["Salmon", "Quinoa", "Cucumber", "Tomatoes", "Feta"],
  "Chicken Burrito Bowl": ["Chicken", "Brown Rice", "Black Beans", "Corn", "Salsa"],
  "Steak Burrito Bowl": ["Steak", "Rice", "Beans", "Peppers", "Avocado"],
  "Shrimp Burrito Bowl": ["Shrimp", "Rice", "Beans", "Lime", "Cabbage"],
  "Poke Bowl (salmon)": ["Salmon", "Rice", "Seaweed", "Edamame", "Cucumber"],
  "Poke Bowl (tuna)": ["Tuna", "Rice", "Avocado", "Seaweed", "Sesame"],
  "Poke Bowl (chicken)": ["Chicken", "Rice", "Edamame", "Carrot", "Cucumber"],
  "Chicken Caesar Salad": ["Chicken", "Romaine", "Parmesan", "Croutons", "Caesar Dressing"],
  "Greek Salad": ["Tomatoes", "Cucumber", "Olives", "Feta", "Olive Oil"],
  Shakshuka: ["Eggs", "Tomato", "Bell Pepper", "Onion", "Paprika"],
  "Chana Masala": ["Chickpeas", "Tomato", "Onion", "Ginger", "Cumin"],
  "Dal Tadka": ["Lentils", "Garlic", "Cumin", "Turmeric", "Tomato"],
  "Pad Thai": ["Rice Noodles", "Egg", "Bean Sprouts", "Peanuts", "Lime"],
  "Pho (beef)": ["Beef Broth", "Rice Noodles", "Beef", "Herbs", "Lime"],
  "Sushi (mixed)": ["Rice", "Fish", "Seaweed", "Cucumber", "Soy"],
  "Chicken Teriyaki": ["Chicken", "Soy", "Ginger", "Garlic", "Rice"],
  Bibimbap: ["Rice", "Vegetables", "Egg", "Beef", "Gochujang"],
  "Quinoa Salad": ["Quinoa", "Cucumber", "Tomatoes", "Herbs", "Lemon"],
  "Minestrone Soup": ["Beans", "Tomato", "Vegetables", "Pasta", "Herbs"],
  "Oatmeal with Banana": ["Oats", "Banana", "Milk", "Cinnamon", "Seeds"],
  "Acai Bowl": ["Acai", "Banana", "Berries", "Granola", "Seeds"]
};

const DETAIL_HINTS: Record<string, { aliases: string[]; summary: string }> = {
  "Hot Dog": { aliases: ["hot dog", "frankfurter", "sausage bun"], summary: "A grilled or steamed sausage in a bun with optional sauces and toppings." },
  Hamburger: { aliases: ["hamburger", "burger", "beef burger"], summary: "A beef patty sandwich typically served with bun, lettuce, tomato, and sauces." },
  Cheeseburger: { aliases: ["cheeseburger", "burger with cheese"], summary: "A burger with added cheese, usually richer in calories and fat than a plain burger." },
  "Chicken Biryani": { aliases: ["chicken biryani", "biryani rice"], summary: "A spiced rice dish cooked with chicken and aromatic herbs." },
  "Butter Chicken": { aliases: ["butter chicken", "murgh makhani"], summary: "A creamy tomato-based chicken curry, often served with rice or naan." },
  "Tikka Masala": { aliases: ["chicken tikka masala", "masala curry"], summary: "Grilled chicken pieces in a rich tomato-spice sauce." },
  "Sushi (mixed)": { aliases: ["sushi platter", "japanese sushi"], summary: "Assorted sushi pieces with rice, fish, and seaweed." },
  "Pad Thai": { aliases: ["pad thai", "thai noodles"], summary: "Stir-fried rice noodles with sweet-savory sauce and optional protein." },
  "Pho (beef)": { aliases: ["beef pho", "vietnamese noodle soup"], summary: "A light aromatic broth with rice noodles and sliced beef." },
  "Rice with Chicken": { aliases: ["chicken rice", "rice bowl"], summary: "A balanced rice-and-chicken meal common in home cooking and meal prep." }
};

const normalizeFoodName = (name: string): string =>
  name
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const WHOLE_FOOD_CATEGORIES = new Set(["Fruit", "Vegetable", "Protein", "Grain", "Dairy", "Fat"]);

const macroFocus = (food: FoodRecord): string => {
  const map = [
    { key: "protein" as const, value: food.protein_g },
    { key: "carbs" as const, value: food.carbs_g },
    { key: "fat" as const, value: food.fat_g }
  ].sort((a, b) => b.value - a.value);
  if (map[0].value <= 1) return "This option is relatively light in all three macros.";
  if (map[0].key === "protein") return "Macro profile leans protein-forward.";
  if (map[0].key === "carbs") return "Macro profile leans carbohydrate-forward.";
  return "Macro profile leans fat-forward.";
};

const calorieDensity = (calories: number): string => {
  if (calories < 80) return "Calorie density is low.";
  if (calories < 170) return "Calorie density is moderate.";
  if (calories < 260) return "Calorie density is moderately high.";
  return "Calorie density is high.";
};

const getAliasesForFood = (food: FoodRecord): string[] => {
  const hinted = DETAIL_HINTS[food.name]?.aliases ?? [];
  const normalized = normalizeFoodName(food.name);
  const parts = normalized.split(" ").filter((x) => x.length > 2);
  return Array.from(new Set([...hinted, normalized, ...parts, food.category.toLowerCase()]));
};

const inferKeyIngredients = (food: FoodRecord): string[] => {
  const pinned = INGREDIENTS_BY_FOOD[food.name];
  if (pinned) return pinned.slice(0, 5);

  const n = normalizeFoodName(food.name);
  if (/(bowl)/.test(n)) return ["Protein", "Whole Grain", "Leafy Greens", "Colorful Veg", "Healthy Sauce"];
  if (/(salad)/.test(n)) return ["Leafy Greens", "Fresh Veg", "Protein", "Seeds", "Olive Oil"];
  if (/(soup|stew|chili)/.test(n)) return ["Broth Base", "Protein", "Legumes", "Vegetables", "Herbs"];
  if (/(wrap|gyro|shawarma|pita)/.test(n)) return ["Protein", "Flatbread", "Veggies", "Yogurt Sauce", "Herbs"];
  if (/(sushi|nigiri|poke)/.test(n)) return ["Rice", "Seafood", "Seaweed", "Vegetables", "Sesame"];
  if (/(curry|masala|dal|biryani)/.test(n)) return ["Protein/Legume", "Aromatics", "Spices", "Tomato/Stock", "Rice"];
  if (food.category === "Fruit") return ["Fresh Fruit", "Vitamin C", "Hydration", "Fiber", "Antioxidants"];
  if (food.category === "Protein") return ["Lean Protein", "Iron", "B Vitamins", "Minerals", "Amino Acids"];
  if (food.category === "Vegetable") return ["Vegetables", "Fiber", "Micronutrients", "Phytonutrients", "Water"];
  if (food.category === "Grain") return ["Whole Grains", "Complex Carbs", "Fiber", "Minerals", "B Vitamins"];
  if (food.category === "Dairy") return ["Dairy Protein", "Calcium", "Probiotics", "B12", "Phosphorus"];
  return ["Balanced Macros", "Whole Foods", "Fiber", "Micronutrients", "Flavor"];
};

const inferWellnessTip = (food: FoodRecord): string => {
  if (food.protein_g >= 18) return "High protein choice: great for fullness and muscle recovery.";
  if (food.carbs_g >= 30 && food.fat_g < 8) return "Carb-forward option: pair with protein for steadier energy.";
  if (food.fat_g >= 15) return "Higher-fat meal: keep portions moderate and add greens for volume.";
  if (food.calories < 120) return "Lighter meal: combine with protein if you need longer satiety.";
  if (food.calories > 280) return "Energy-dense choice: adjust servings to stay within your target.";
  return "Balanced option: fits well as part of a varied, whole-food meal plan.";
};

/** Short plan-card tagline keyed by exact `FoodRecord.name` where we want a specific note. */
const PLAN_TAGLINE_BY_NAME: Record<string, string> = {
  "Mediterranean Salmon Bowl": "Omega-3 · whole grains",
  "Chicken Burrito Bowl": "Meal-prep friendly bowl",
  "Steak Burrito Bowl": "Hearty · higher sat fat",
  "Shrimp Burrito Bowl": "Lean seafood · fresh veg",
  "Poke Bowl (salmon)": "Raw fish · sushi rice",
  "Poke Bowl (tuna)": "Lean tuna · avocado fat",
  "Poke Bowl (chicken)": "Mild · customizable",
  "Chicken Caesar Salad": "Classic salad · dressing adds fat",
  "Greek Salad": "Mediterranean veg · feta",
  Shakshuka: "Eggs · tomato iron",
  "Chana Masala": "Fiber-rich legumes",
  "Dal Tadka": "Comfort lentils · spices",
  "Pad Thai": "Sweet-savory noodles",
  "Pho (beef)": "Broth-forward · lower fat",
  "Sushi (mixed)": "Varied fish · rice carbs",
  "Chicken Teriyaki": "Sweet glaze · pair veg",
  Bibimbap: "Korean mixed rice bowl",
  "Quinoa Salad": "Complete protein grain",
  "Minestrone Soup": "Veg-heavy · broth volume",
  "Oatmeal with Banana": "Slow carbs · breakfast",
  "Acai Bowl": "Antioxidants · topping sugar",
  "Hot Dog": "Processed meat · moderate",
  Hamburger: "Grill classic · bun carbs",
  Cheeseburger: "Higher sat fat · indulgent",
  "Chicken Biryani": "Spiced rice · big flavor",
  "Butter Chicken": "Creamy · higher kcal",
  "Tikka Masala": "Tomato-cream curry",
  "Rice with Chicken": "Simple balanced plate"
};

const appendCandidate = (list: string[], value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!list.includes(trimmed)) list.push(trimmed);
};

const appendSupabaseUrlVariants = (list: string[], url: string) => {
  const objectMatch = url.match(/^(https:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i);
  if (objectMatch) {
    const [, host, bucket, objectPath] = objectMatch;
    const bucketLower = bucket.toLowerCase();
    const configuredHost = getSupabaseConfig().url.trim().replace(/\/$/, "");
    const hosts = configuredHost && configuredHost !== host ? [host, configuredHost] : [host];
    const bucketAliases = Array.from(new Set([bucket, bucketLower]));
    for (const h of hosts) {
      for (const b of bucketAliases) {
        appendCandidate(list, `${h}/storage/v1/object/public/${b}/${objectPath}`);
        appendCandidate(list, `${h}/storage/v1/render/image/public/${b}/${objectPath}`);
      }
    }
    return;
  }

  const renderMatch = url.match(/^(https:\/\/[^/]+)\/storage\/v1\/render\/image\/public\/([^/]+)\/(.+)$/i);
  if (renderMatch) {
    const [, host, bucket, objectPath] = renderMatch;
    const bucketLower = bucket.toLowerCase();
    const configuredHost = getSupabaseConfig().url.trim().replace(/\/$/, "");
    const hosts = configuredHost && configuredHost !== host ? [host, configuredHost] : [host];
    const bucketAliases = Array.from(new Set([bucket, bucketLower]));
    for (const h of hosts) {
      for (const b of bucketAliases) {
        appendCandidate(list, `${h}/storage/v1/render/image/public/${b}/${objectPath}`);
        appendCandidate(list, `${h}/storage/v1/object/public/${b}/${objectPath}`);
      }
    }
    return;
  }

  appendCandidate(list, url);
};

const taglineFromNamePattern = (food: FoodRecord): string | null => {
  const n = normalizeFoodName(food.name);
  if (/(smoothie|shake|milkshake)/.test(n)) return "Liquid calories · watch sugar";
  if (/(coffee|latte|cappuccino|mocha)/.test(n)) return "Caffeine · milk sugar";
  if (/(pizza)/.test(n)) return "Cheese · refined crust";
  if (/(burger|sandwich|wrap|gyro|shawarma)/.test(n)) return "Handheld · sauce adds kcal";
  if (/(taco|burrito|quesadilla|enchilada|fajita)/.test(n)) return "Tex-Mex · beans & rice";
  if (/(ramen|pho|noodle|pad thai|yakisoba)/.test(n)) return "Noodle bowl · broth or oil";
  if (/(curry|masala|biryani|dal|tikka)/.test(n)) return "Spiced sauce · often creamy";
  if (/(soup|chili|stew|minestrone)/.test(n)) return "High volume · watch sodium";
  if (/(salad)/.test(n)) return "Veg volume · dressing fat";
  if (/(poke|sushi|nigiri|sashimi)/.test(n)) return "Seafood · rice or raw";
  if (/(bowl)/.test(n)) return "Build-your macros bowl";
  if (/(pancake|waffle|french toast)/.test(n)) return "Breakfast carbs · syrup";
  if (/(oatmeal|porridge|congee)/.test(n)) return "Warm grains · steady fuel";
  if (/(egg|omelette|scrambled)/.test(n)) return "Protein + fat breakfast";
  if (/(ice cream|gelato|frozen)/.test(n)) return "Treat · high sugar/fat";
  if (/(chocolate|candy|dessert|cake|pie|cookie)/.test(n)) return "Dessert energy density";
  if (food.category === "Fruit") return "Whole fruit · fiber & water";
  if (food.category === "Vegetable") return "Low kcal · micronutrients";
  if (food.category === "Protein" && food.fat_g < 5) return "Lean protein anchor";
  if (food.category === "Protein" && food.fat_g >= 12) return "Fatty cut · rich flavor";
  if (food.category === "Grain") return "Starch base · portion matters";
  if (food.category === "Dairy") return "Calcium · protein varies";
  if (food.category === "Fat") return "Calorie-dense · small amounts";
  if (food.category === "Prepared") return "Restaurant-style · estimate";
  return null;
};

const taglineFromMacros = (food: FoodRecord): string => {
  if (food.protein_g >= 20) return "Protein-forward pick";
  if (food.carbs_g >= 35 && food.fat_g < 10) return "Carb energy source";
  if (food.fat_g >= 18) return "Higher-fat choice";
  if (food.calories <= 50 && WHOLE_FOOD_CATEGORIES.has(food.category)) return "Very light per 100g";
  if (food.calories >= 400) return "Very dense per 100g";
  if (food.calories < 100) return "Light per portion basis";
  return "Balanced macro spread";
};

export function getFoodPlanTagline(food: FoodRecord): string {
  const named = PLAN_TAGLINE_BY_NAME[food.name];
  if (named) return named;
  const pattern = taglineFromNamePattern(food);
  if (pattern) return pattern;
  return taglineFromMacros(food);
}

export const getFoodPhotoCandidates = (food: FoodRecord): string[] => {
  const candidates: string[] = [];
  const rejected = food.image_review_status === "rejected";
  if (!rejected) {
    const primary = food.image_url?.trim();
    if (primary) appendSupabaseUrlVariants(candidates, primary);
    for (const u of food.image_urls ?? []) {
      const t = typeof u === "string" ? u.trim() : "";
      if (t.length > 0) appendSupabaseUrlVariants(candidates, t);
    }
  }
  return candidates;
};

export const getFoodDetail = (food: FoodRecord): FoodDetail => {
  const hint = DETAIL_HINTS[food.name];
  const descriptionLead =
    hint?.summary ??
    `${food.name} is commonly tracked under ${food.category.toLowerCase()} foods and works well for portion-based calorie logging.`;
  const description = `${descriptionLead} Per 100g, it has about ${food.calories} kcal, ${food.protein_g}g protein, ${food.carbs_g}g carbs, and ${food.fat_g}g fat. ${macroFocus(
    food
  )} ${calorieDensity(food.calories)}`;
  const candidates = getFoodPhotoCandidates(food);
  const attribution = food.photo_attribution?.trim();
  return {
    description,
    photoUrl: candidates[0] ?? "",
    sourceLabel: attribution || PHOTO_SOURCE,
    keyIngredients: inferKeyIngredients(food),
    wellnessTip: inferWellnessTip(food),
    aliases: getAliasesForFood(food),
    photoCandidates: candidates
  };
};

export const getFoodSearchBlob = (food: FoodRecord): string => {
  const detail = getFoodDetail(food);
  const aliases = detail.aliases?.join(" ") ?? "";
  return [food.name, food.category, detail.description, aliases, `${food.calories}`, `${food.protein_g}`, `${food.carbs_g}`, `${food.fat_g}`]
    .join(" ")
    .toLowerCase();
};
