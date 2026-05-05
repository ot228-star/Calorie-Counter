export const CRAWLER_FAILED_MEALS: string[] = [];

export const CRAWLER_WRONG_FILES_REMOVED: string[] = [
  "apple.jpg",
  "asparagus.jpg",
  "avocado-toast.jpg",
  "beef-chili.jpg",
  "beef-meatballs-with-sauce.jpg",
  "butter.jpg",
  "cottage-cheese.jpg",
  "french-fries.png",
  "fried-chicken.png",
  "grapes.jpg",
  "hot-dog.png",
  "hummus-with-pita.jpg",
  "mac-and-cheese.jpg",
  "milk-2.png",
  "miso-soup.png",
  "noodles-with-chicken.jpg",
  "orange.jpg",
  "pad-thai.png",
  "parmesan.jpg",
  "peach.jpg",
  "pizza-cheese.jpg",
  "roasted-turkey-plate.png",
  "spinach-berry-salad.jpg",
  "steak-with-rice.jpg",
  "stuffed-bell-pepper.jpg",
  "sweet-potato.jpg",
  "vegetable-pizza.jpg",
];

/** Re-crawl target list (removed wrong files + any failed meals). */
export const CRAWLER_RETRY_FILE_TARGETS: string[] = [...CRAWLER_WRONG_FILES_REMOVED];
