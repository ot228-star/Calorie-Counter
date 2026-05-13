import type { FoodRecord } from "./foodDatabase";
import {
  type CuisineRegionId,
  type CuisineRegionTag,
  cuisineRegionPresets,
  foodMatchesCuisineKeywords
} from "./cuisineRegions";

/** Unprepared staples: only appear under the Global mix chip (not assigned to a single world region). */
export const FOOD_STAPLE_CATEGORIES = new Set(["Fruit", "Vegetable", "Grain", "Dairy", "Fat", "Protein"]);

/**
 * Curated primary region(s) per catalog meal name. Multi-region entries reflect authentic spread
 * (e.g. tacos: Mexico & US Tex-Mex). Cloud rows may override via `cuisine_regions` from Postgres.
 */
export const CUISINE_BY_FOOD_NAME: Record<string, readonly CuisineRegionTag[]> = {
  // --- Bundled `extraFoods` ---
  Shakshuka: ["middleEastern"],
  "Chicken Tandoori": ["southAsian"],
  "Palak Paneer": ["southAsian"],
  "Chana Masala": ["southAsian"],
  "Dal Tadka": ["southAsian"],
  "Chicken Souvlaki": ["mediterranean"],
  "Beef Shawarma Plate": ["middleEastern"],
  "Falafel Bowl": ["middleEastern"],
  "Chicken Caesar Wrap": ["northAmerican"],
  "Turkey Sandwich": ["northAmerican"],
  "Tuna Salad Sandwich": ["northAmerican"],
  "Avocado Toast": ["northAmerican", "mediterranean"],
  "Chicken Fajitas": ["northAmerican", "latinAmerican"],
  "Beef Fajitas": ["northAmerican", "latinAmerican"],
  "Chicken Enchiladas": ["northAmerican", "latinAmerican"],
  "Beef Enchiladas": ["northAmerican", "latinAmerican"],
  Pozole: ["latinAmerican"],
  "Chicken Tortilla Soup": ["northAmerican", "latinAmerican"],
  Bibimbap: ["eastAsian"],
  "Korean BBQ Beef": ["eastAsian"],
  "Kimchi Fried Rice": ["eastAsian"],
  "Miso Soup": ["eastAsian"],
  "Chicken Teriyaki": ["eastAsian"],
  "Beef Bulgogi Bowl": ["eastAsian"],
  "General Tso Chicken": ["eastAsian", "northAmerican"],
  "Orange Chicken": ["eastAsian", "northAmerican"],
  "Kung Pao Chicken": ["eastAsian", "northAmerican"],
  "Sweet and Sour Chicken": ["eastAsian", "northAmerican"],
  "Chicken Satay": ["eastAsian"],
  "Beef Rendang": ["eastAsian"],
  "Tom Yum Soup": ["eastAsian"],
  "Green Curry Chicken": ["eastAsian"],
  "Red Curry Tofu": ["eastAsian"],
  "Pasta Primavera": ["mediterranean"],
  "Minestrone Soup": ["mediterranean"],
  Risotto: ["mediterranean"],
  "Chicken Parmesan": ["mediterranean", "northAmerican"],
  "Eggplant Parmesan": ["mediterranean", "northAmerican"],
  "Margherita Pizza": ["mediterranean"],
  "Pepperoni Pizza": ["mediterranean", "northAmerican"],
  "Pesto Pasta": ["mediterranean"],
  "Chicken Noodle Stir Fry": ["eastAsian"],
  "Vegetable Stir Fry": ["eastAsian"],
  "Tofu Stir Fry": ["eastAsian"],
  "Chicken Pot Pie": ["northAmerican"],
  "Turkey Chili": ["northAmerican"],
  "Chicken Burrito Bowl": ["northAmerican", "latinAmerican"],
  "Steak Burrito Bowl": ["northAmerican", "latinAmerican"],
  "Shrimp Burrito Bowl": ["northAmerican", "latinAmerican"],
  "Chicken Gyro": ["mediterranean"],
  "Lamb Gyro": ["mediterranean"],
  "Beef Kofta": ["middleEastern"],
  "Chicken Katsu": ["eastAsian"],
  Tonkatsu: ["eastAsian"],
  "Chicken Yakisoba": ["eastAsian"],
  "Beef Udon": ["eastAsian"],
  "Salmon Nigiri": ["eastAsian"],
  "Tuna Nigiri": ["eastAsian"],
  "Chicken Congee": ["eastAsian"],
  "Porridge (oatmeal milk)": ["northAmerican", "mediterranean"],
  "Greek Yogurt Bowl": ["mediterranean", "northAmerican"],
  "Fruit Salad": ["mediterranean", "northAmerican"],
  "Chicken and Quinoa Bowl": ["northAmerican", "mediterranean"],
  "Tofu and Quinoa Bowl": ["eastAsian", "northAmerican"],
  "Poke Bowl (chicken)": ["eastAsian", "northAmerican"],
  "Chicken Caesar Salad": ["northAmerican", "mediterranean"],
  "Quinoa Salad": ["mediterranean", "latinAmerican"],
  Tabbouleh: ["middleEastern", "mediterranean"],
  Fattoush: ["middleEastern"],
  "Chicken Pita Pocket": ["middleEastern", "mediterranean"],
  "Vegetable Omelette": ["northAmerican", "mediterranean"],
  "Egg and Avocado Toast": ["northAmerican"],
  "Protein Pancakes": ["northAmerican"],
  "Banana Smoothie": ["northAmerican", "latinAmerican"],
  "Berry Smoothie": ["northAmerican"],
  "Green Smoothie": ["northAmerican"],
  "Iced Latte": ["northAmerican", "mediterranean"],
  Cappuccino: ["mediterranean", "northAmerican"],
  Mocha: ["northAmerican", "mediterranean"],
  "Matcha Latte": ["eastAsian"],
  "Acai Bowl": ["latinAmerican", "northAmerican"],
  "Chicken Pasta Salad": ["mediterranean", "northAmerican"],
  "Tuna Pasta Salad": ["mediterranean", "northAmerican"],
  "Cobb Salad": ["northAmerican"],
  "Chicken and Veggie Soup": ["northAmerican", "mediterranean"],
  "Mediterranean Salmon Bowl": ["mediterranean"],
  "Grilled Chicken Power Bowl": ["northAmerican"],
  "Turkey Quinoa Bowl": ["northAmerican"],
  "Lentil Buddha Bowl": ["southAsian", "northAmerican"],
  "Roasted Veggie Grain Bowl": ["mediterranean", "northAmerican"],
  "Tofu Buddha Bowl": ["eastAsian", "northAmerican"],
  "Chickpea Shawarma Bowl": ["middleEastern"],
  "Grilled Shrimp Bowl": ["mediterranean", "eastAsian", "northAmerican"],
  "Chicken Taco Salad": ["northAmerican", "latinAmerican"],
  "Black Bean Burrito Bowl": ["northAmerican", "latinAmerican"],
  "Mediterranean Chickpea Salad": ["mediterranean", "middleEastern"],
  "Tuna Nicoise Salad": ["mediterranean"],
  "Salmon Caesar Salad": ["northAmerican", "mediterranean"],
  "Kale Chicken Salad": ["northAmerican"],
  "Quinoa Tabbouleh": ["middleEastern", "mediterranean"],
  "Greek Chicken Pita": ["mediterranean"],
  "Veggie Hummus Wrap": ["middleEastern", "mediterranean"],
  "Turkey Avocado Wrap": ["northAmerican"],
  "Salmon Avocado Bowl": ["northAmerican", "mediterranean"],
  "Tofu Poke Bowl": ["eastAsian", "northAmerican"],
  "Edamame Sushi Bowl": ["eastAsian"],
  "Chicken Soba Bowl": ["eastAsian"],
  "Miso Salmon Bowl": ["eastAsian"],
  "Thai Peanut Chicken Bowl": ["eastAsian"],
  "Teriyaki Tofu Bowl": ["eastAsian"],
  "Vegetable Pho Bowl": ["eastAsian"],
  "Chicken Udon Soup": ["eastAsian"],
  "Tofu Miso Soup": ["eastAsian"],
  "Sardine Rice Bowl": ["eastAsian", "mediterranean"],
  "Kimchi Tofu Bowl": ["eastAsian"],
  "Paneer Tikka Bowl": ["southAsian"],
  "Rajma Rice Bowl": ["southAsian"],
  "Lemon Herb Chicken Plate": ["mediterranean", "northAmerican"],
  "Baked Cod Plate": ["mediterranean", "northAmerican"],
  "Roasted Turkey Plate": ["northAmerican"],
  "Turkey Meatball Bowl": ["northAmerican", "mediterranean"],
  "Chicken Meatball Bowl": ["mediterranean", "northAmerican"],
  "Baked Falafel Plate": ["middleEastern"],
  "Hummus Power Plate": ["middleEastern", "mediterranean"],
  "Chicken Lentil Soup": ["mediterranean", "southAsian", "middleEastern"],
  "Vegetable Lentil Soup": ["mediterranean", "middleEastern"],
  "Tomato Basil Soup": ["mediterranean"],
  "Mushroom Barley Soup": ["mediterranean", "northAmerican"],
  "Butternut Squash Soup": ["northAmerican", "mediterranean"],
  "Overnight Oats with Chia": ["northAmerican", "mediterranean"],
  "Protein Yogurt Parfait": ["northAmerican"],
  "Egg White Scramble Bowl": ["northAmerican"],
  "Smoked Salmon Toast": ["mediterranean", "northAmerican"],
  "Peanut Butter Oatmeal Bowl": ["northAmerican"],
  "Berry Chia Pudding": ["northAmerican"],
  "Tropical Smoothie Bowl": ["latinAmerican", "northAmerican"],
  "Matcha Yogurt Bowl": ["eastAsian"],
  "Chicken and Broccoli Bowl": ["eastAsian", "northAmerican"],
  "Salmon and Asparagus Plate": ["mediterranean", "northAmerican"],
  "Tuna and White Bean Salad": ["mediterranean"],
  "Tofu Veggie Noodle Bowl": ["eastAsian"],
  "Cottage Cheese Fruit Bowl": ["northAmerican"],
  "Mediterranean Tuna Bowl": ["mediterranean"],
  "Roasted Chickpea Snack Bowl": ["middleEastern", "mediterranean"],
  "Broccoli Cheddar Soup Light": ["northAmerican"],
  "Homemade Chicken Noodle Soup": ["northAmerican"],
  "Beef and Broccoli Stir Fry": ["eastAsian", "northAmerican"],
  "Mediterranean Chickpea Stew": ["mediterranean", "middleEastern"],
  "Mediterranean Grilled Salmon": ["mediterranean"],
  "Healthy Turkey Chili": ["northAmerican"],
  "Simple Oven-Baked Sea Bass": ["mediterranean"],
  "Broccoli Garlic Pasta": ["mediterranean"],
  "Vegan Pancakes": ["northAmerican"],
  "Chicken Tikka Masala Light": ["southAsian"],
  "Spinach Shakshuka": ["middleEastern"],
  "Grilled Shrimp Skewers": ["mediterranean", "eastAsian", "latinAmerican"],
  "Lentil Tomato Soup": ["mediterranean", "middleEastern"],
  "Quinoa Veggie Salad": ["mediterranean", "latinAmerican"],
  "Baked Lemon Herb Cod": ["mediterranean", "northAmerican"],
  "Tofu Veggie Stir-Fry": ["eastAsian"],
  "Greek Yogurt Fruit Parfait": ["mediterranean", "northAmerican"],
  "Air Fryer Salmon Bites": ["northAmerican"],
  "Instant Pot Chicken Soup": ["northAmerican"],
  "Ground Turkey Lettuce Wraps": ["eastAsian", "northAmerican"],
  "Cauliflower Chickpea Curry": ["southAsian"],
  "Mediterranean Tuna Salad": ["mediterranean"],
  "Stuffed Zucchini Boats": ["mediterranean"],

  // --- `BASE_FOODS` prepared & other ---
  "Chicken Curry with Rice": ["southAsian"],
  "Butter Chicken": ["southAsian"],
  "Tikka Masala": ["southAsian"],
  "Fried Rice (chicken)": ["eastAsian", "northAmerican"],
  "Fried Rice (vegetable)": ["eastAsian", "northAmerican"],
  "Spaghetti Bolognese": ["mediterranean"],
  Lasagna: ["mediterranean"],
  "Chicken Alfredo Pasta": ["mediterranean", "northAmerican"],
  "Grilled Chicken Wrap": ["northAmerican"],
  "Chicken Shawarma Wrap": ["middleEastern"],
  "Falafel Wrap": ["middleEastern"],
  "Caesar Salad with Chicken": ["northAmerican", "mediterranean"],
  "Greek Salad": ["mediterranean"],
  "Chicken Salad Sandwich": ["northAmerican"],
  "Club Sandwich": ["northAmerican"],
  "Chicken Burger": ["northAmerican"],
  Cheeseburger: ["northAmerican"],
  "Beef Taco": ["latinAmerican", "northAmerican"],
  "Chicken Quesadilla": ["latinAmerican", "northAmerican"],
  "Sushi Roll (salmon)": ["eastAsian"],
  "Sushi Roll (avocado)": ["eastAsian"],
  "Pad Thai": ["eastAsian"],
  "Pho (beef)": ["eastAsian"],
  "Chicken Dumplings": ["eastAsian"],
  "Beef Meatballs with Sauce": ["mediterranean", "northAmerican"],
  "Lentil Soup": ["mediterranean", "middleEastern", "southAsian"],
  "Tomato Soup": ["mediterranean", "northAmerican"],
  "Chicken Noodle Soup": ["northAmerican"],
  "Mashed Potatoes with Gravy": ["northAmerican"],
  "Roast Chicken with Potatoes": ["mediterranean", "northAmerican"],
  "Salmon with Rice": ["mediterranean", "eastAsian"],
  "Teriyaki Chicken Bowl": ["eastAsian"],
  "Poke Bowl (salmon)": ["eastAsian", "northAmerican"],
  "Poke Bowl (tuna)": ["eastAsian", "northAmerican"],
  "Chicken Kebab": ["mediterranean", "middleEastern"],
  "Scrambled Eggs with Toast": ["northAmerican", "mediterranean"],
  "Breakfast Burrito": ["northAmerican", "latinAmerican"],
  "Oatmeal with Banana": ["northAmerican"],
  "Yogurt with Granola": ["northAmerican", "mediterranean"],
  "Fried Egg Sandwich": ["northAmerican"],
  "Dark Chocolate": ["mediterranean", "northAmerican"],
  "Milk Chocolate": ["mediterranean", "northAmerican"],
  Granola: ["northAmerican"],
  "Toasted Sandwich": ["northAmerican", "mediterranean"],
  Croissant: ["mediterranean"],
  Bagel: ["northAmerican", "mediterranean"],
  Muffin: ["northAmerican"],
  "Ice Cream (vanilla)": ["northAmerican", "mediterranean"],
  "Potato Chips": ["northAmerican"],
  Pretzels: ["northAmerican", "mediterranean"],
  Crackers: ["northAmerican", "mediterranean"],
  "Granola Bar": ["northAmerican"],
  "Energy Bar": ["northAmerican"],
  "Peanut Butter Jelly Sandwich": ["northAmerican"],
  "Chocolate Milk": ["northAmerican"],
  "Milkshake (vanilla)": ["northAmerican"],
  "Smoothie (fruit)": ["northAmerican", "latinAmerican"]
};

export function resolveFoodCuisineRegions(food: FoodRecord): readonly CuisineRegionTag[] | undefined {
  const explicit = food.cuisine_regions;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit;
  }
  const mapped = CUISINE_BY_FOOD_NAME[food.name];
  if (mapped !== undefined) {
    return mapped.length ? mapped : undefined;
  }
  return undefined;
}

export function attachCatalogCuisineRegions(food: FoodRecord): FoodRecord {
  const explicit = food.cuisine_regions;
  if (Array.isArray(explicit) && explicit.length > 0) return food;
  const mapped = CUISINE_BY_FOOD_NAME[food.name];
  if (mapped === undefined) return food;
  if (mapped.length === 0) return food;
  return { ...food, cuisine_regions: [...mapped] };
}

/** No regional cuisine claim — only listed under Global mix. */
const GLOBAL_PANTRY_NAMES = new Set<string>(["Sugar", "Honey", "Jam", "Protein Powder"]);

export function foodMatchesRegionSelection(food: FoodRecord, region: CuisineRegionId): boolean {
  if (region === "global") return true;
  if (FOOD_STAPLE_CATEGORIES.has(food.category)) {
    return false;
  }
  if (GLOBAL_PANTRY_NAMES.has(food.name)) {
    return false;
  }
  const tags = resolveFoodCuisineRegions(food);
  const tagHit = Boolean(tags?.length && (tags as readonly CuisineRegionTag[]).includes(region as CuisineRegionTag));
  const keywordHit = foodMatchesCuisineKeywords(food, cuisineRegionPresets[region].keywords);
  return tagHit || keywordHit;
}
