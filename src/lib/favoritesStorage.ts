import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_PREFIX = "@cc_favorites_";

const keyFor = (userId: string) => `${FAVORITES_PREFIX}${userId}`;

export async function loadFavorites(userId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export async function saveFavorites(userId: string, favorites: string[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(Array.from(new Set(favorites))));
}

