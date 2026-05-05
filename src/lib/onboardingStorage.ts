import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@cc_onboarding_pending_";
const DONE_PREFIX = "@cc_onboarding_done_";
const DRAFT_PREFIX = "@cc_onboarding_draft_";

export type OnboardingDraft = {
  onboardingStep: 0 | 1 | 2 | 3 | 4;
  age: string;
  heightCm: string;
  weightKg: string;
  biologicalSex: "man" | "woman" | null;
  nickname: string;
  surveyGoals: string[];
  surveyHabits: string[];
  mealPlanFrequency: string;
};

export function onboardingPendingKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export async function setOnboardingPending(userId: string): Promise<void> {
  await AsyncStorage.setItem(onboardingPendingKey(userId), "1");
}

export async function clearOnboardingPending(userId: string): Promise<void> {
  await AsyncStorage.removeItem(onboardingPendingKey(userId));
}

export async function hasOnboardingPending(userId: string): Promise<boolean> {
  const v = await AsyncStorage.getItem(onboardingPendingKey(userId));
  return v === "1";
}

export async function setOnboardingDone(userId: string): Promise<void> {
  await AsyncStorage.setItem(`${DONE_PREFIX}${userId}`, "1");
}

export async function hasOnboardingDone(userId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`${DONE_PREFIX}${userId}`)) === "1";
}

export async function saveOnboardingDraft(userId: string, draft: OnboardingDraft): Promise<void> {
  await AsyncStorage.setItem(`${DRAFT_PREFIX}${userId}`, JSON.stringify(draft));
}

export async function loadOnboardingDraft(userId: string): Promise<OnboardingDraft | null> {
  const raw = await AsyncStorage.getItem(`${DRAFT_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export async function clearOnboardingDraft(userId: string): Promise<void> {
  await AsyncStorage.removeItem(`${DRAFT_PREFIX}${userId}`);
}

/** New OAuth / social accounts created within this window are sent through onboarding. */
export function isRecentlyCreatedAccount(createdAtIso: string | undefined, windowMs = 5 * 60 * 1000): boolean {
  if (!createdAtIso) return false;
  const t = new Date(createdAtIso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < windowMs;
}
