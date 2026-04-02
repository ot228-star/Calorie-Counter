import type { FoodRecord } from "./foodDatabase";

export type FoodDetail = {
  description: string;
  photoUrl: string;
  sourceLabel: string;
  aliases?: string[];
};

const PHOTO_SOURCE = "Photo: Unsplash (real photography)";

const CATEGORY_PHOTO: Record<FoodRecord["category"], string> = {
  Fruit: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80",
  Grain: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  Protein: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80",
  Dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
  Vegetable: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  Fat: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
  Prepared: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  Other: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=80"
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

// Deterministic pinned photos for high-frequency foods/meals.
const PINNED_PHOTO_BY_FOOD: Record<string, string> = {
  "Hot Dog": "https://images.unsplash.com/photo-1612392062798-2eaede5f4c44?auto=format&fit=crop&w=1200&q=80",
  Hamburger: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
  Cheeseburger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  "Chicken Burger": "https://images.unsplash.com/photo-1606755962773-d324e2d53f8b?auto=format&fit=crop&w=1200&q=80",
  "Margherita Pizza": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80",
  "Pepperoni Pizza": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80",
  "Vegetable Pizza": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80",
  "Rice with Chicken": "https://images.unsplash.com/photo-1604908177225-3b8a6a4f7f42?auto=format&fit=crop&w=1200&q=80",
  "Chicken and Rice Bowl": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  "Chicken Biryani": "https://images.unsplash.com/photo-1701579231305-d84d8af9a3fd?auto=format&fit=crop&w=1200&q=80",
  "Beef Biryani": "https://images.unsplash.com/photo-1690989321640-8f4f0da8228a?auto=format&fit=crop&w=1200&q=80",
  "Chicken Curry with Rice": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80",
  "Butter Chicken": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80",
  "Tikka Masala": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80",
  "Chana Masala": "https://images.unsplash.com/photo-1666001061315-932b3fdf30a8?auto=format&fit=crop&w=1200&q=80",
  "Dal Tadka": "https://images.unsplash.com/photo-1626508035297-0cd27b2c6f82?auto=format&fit=crop&w=1200&q=80",
  "Pad Thai": "https://images.unsplash.com/photo-1637806930600-37fa8892069d?auto=format&fit=crop&w=1200&q=80",
  "Pho (beef)": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=80",
  "Sushi (mixed)": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
  "Sushi Roll (salmon)": "https://images.unsplash.com/photo-1617196038435-58e4d5f13d0a?auto=format&fit=crop&w=1200&q=80",
  "Sushi Roll (avocado)": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=80",
  "Salmon Nigiri": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80",
  "Tuna Nigiri": "https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&w=1200&q=80",
  "Ramen (prepared)": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80",
  "Chicken Yakisoba": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80",
  "Chicken Dumplings": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
  "Fried Rice (chicken)": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
  "Fried Rice (vegetable)": "https://images.unsplash.com/photo-1635321593217-40050ad13c74?auto=format&fit=crop&w=1200&q=80",
  "Noodles with Chicken": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80",
  "Spaghetti Bolognese": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
  Lasagna: "https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=1200&q=80",
  "Chicken Alfredo Pasta": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=1200&q=80",
  "Pasta Primavera": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
  "Pesto Pasta": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
  "Grilled Chicken Wrap": "https://images.unsplash.com/photo-1662116765994-1e4200c43589?auto=format&fit=crop&w=1200&q=80",
  "Chicken Shawarma Wrap": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
  "Falafel Wrap": "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?auto=format&fit=crop&w=1200&q=80",
  "Chicken Pita Pocket": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80",
  "Hummus with Pita": "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=1200&q=80",
  "Chicken Kebab": "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80",
  "Beef Kofta": "https://images.unsplash.com/photo-1572441713132-51c75654db73?auto=format&fit=crop&w=1200&q=80",
  "Greek Salad": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=1200&q=80",
  "Caesar Salad with Chicken": "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
  "Chicken Caesar Salad": "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
  "Quinoa Salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "Cobb Salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "Fruit Salad": "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=80",
  "Lentil Soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
  "Tomato Soup": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
  "Chicken Soup": "https://images.unsplash.com/photo-1604908177443-4f6f3f5b1f9f?auto=format&fit=crop&w=1200&q=80",
  "Chicken Noodle Soup": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
  "Chicken Tortilla Soup": "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1200&q=80",
  "Miso Soup": "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=1200&q=80",
  "Beef Chili": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
  "Turkey Chili": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
  "Chicken Fajitas": "https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1200&q=80",
  "Beef Fajitas": "https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=1200&q=80",
  "Beef Taco": "https://images.unsplash.com/photo-1611250188496-e966043a0629?auto=format&fit=crop&w=1200&q=80",
  "Beef Burrito": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80",
  "Chicken Quesadilla": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=1200&q=80",
  "Chicken Burrito Bowl": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80",
  "Steak Burrito Bowl": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80",
  "Shrimp Burrito Bowl": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80",
  "Chicken Gyro": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=1200&q=80",
  "Lamb Gyro": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=1200&q=80",
  "Poke Bowl (salmon)": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  "Poke Bowl (tuna)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80",
  "Poke Bowl (chicken)": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
  "Breakfast Burrito": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
  "Scrambled Eggs with Toast": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80",
  "Fried Egg Sandwich": "https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&w=1200&q=80",
  "Oatmeal with Banana": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1200&q=80",
  "Yogurt with Granola": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
  "Greek Yogurt Bowl": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
  Pancakes: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80",
  Waffles: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80",
  Omelette: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=1200&q=80",
  "Protein Pancakes": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80",
  "Egg and Avocado Toast": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
  "Acai Bowl": "https://images.unsplash.com/photo-1490323948794-cc6dde6e8f5b?auto=format&fit=crop&w=1200&q=80",
  "Banana Smoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=1200&q=80",
  "Berry Smoothie": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=80",
  "Green Smoothie": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=1200&q=80",
  "Milkshake (vanilla)": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80",
  "Chocolate Milk": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=1200&q=80",
  "Iced Latte": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80",
  Cappuccino: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  Mocha: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80"
};

const KEYWORD_PHOTO_FALLBACKS: Array<{ keys: string[]; url: string }> = [
  { keys: ["burger"], url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["pizza"], url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["biryani", "curry", "masala"], url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["sushi", "nigiri", "maki"], url: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["ramen", "pho", "soup"], url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["taco", "burrito", "quesadilla", "fajita"], url: "https://images.unsplash.com/photo-1611250188496-e966043a0629?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["wrap", "shawarma", "gyro", "kebab", "falafel"], url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["salad"], url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["smoothie", "shake"], url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=1200&q=80" },
  { keys: ["oatmeal", "pancake", "waffle", "toast", "omelette"], url: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80" }
];

const normalizeFoodName = (name: string): string =>
  name
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

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

const getPhotoUrlForFood = (food: FoodRecord): string => {
  const pinned = PINNED_PHOTO_BY_FOOD[food.name];
  if (pinned) return pinned;

  const lower = food.name.toLowerCase();
  for (const rule of KEYWORD_PHOTO_FALLBACKS) {
    if (rule.keys.some((k) => lower.includes(k))) return rule.url;
  }

  return CATEGORY_PHOTO[food.category];
};

export const getFoodDetail = (food: FoodRecord): FoodDetail => {
  const hint = DETAIL_HINTS[food.name];
  const descriptionLead =
    hint?.summary ??
    `${food.name} is commonly tracked under ${food.category.toLowerCase()} foods and works well for portion-based calorie logging.`;
  const description = `${descriptionLead} Per 100g, it has about ${food.calories} kcal, ${food.protein_g}g protein, ${food.carbs_g}g carbs, and ${food.fat_g}g fat. ${macroFocus(
    food
  )} ${calorieDensity(food.calories)}`;
  return {
    description,
    photoUrl: getPhotoUrlForFood(food),
    sourceLabel: PHOTO_SOURCE,
    aliases: getAliasesForFood(food)
  };
};

export const getFoodSearchBlob = (food: FoodRecord): string => {
  const detail = getFoodDetail(food);
  const aliases = detail.aliases?.join(" ") ?? "";
  return [food.name, food.category, detail.description, aliases, `${food.calories}`, `${food.protein_g}`, `${food.carbs_g}`, `${food.fat_g}`]
    .join(" ")
    .toLowerCase();
};

