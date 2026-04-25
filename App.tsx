import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
  type AppStateStatus,
  Alert,
  Easing,
  Linking,
  Platform,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold
} from "@expo-google-fonts/manrope";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold
} from "@expo-google-fonts/plus-jakarta-sans";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Provider, Session } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as LocalAuthentication from "expo-local-authentication";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  deleteMealById,
  estimateMealFromImage,
  getProfile,
  listMealsForToday,
  logEstimateCorrections,
  saveMeal,
  upsertProfile
} from "./src/services/api";
import {
  authClient,
  getSession,
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  startOAuth
} from "./src/services/auth";
import { trackEvent } from "./src/services/analytics";
import { FOOD_DATABASE, type FoodRecord } from "./src/data/foodDatabase";
import { getFoodDetail, getFoodPhotoCandidates, getFoodPlanTagline, getFoodSearchBlob } from "./src/data/foodDetails";
import { searchFoods } from "./src/services/foodFinder";
import { mapPhotoUrisForMaxWidth } from "./src/lib/photoUrls";
import { suggestedCalorieTarget, summaryFromMeals } from "./src/lib/calculations";
import { EstimateResult, Meal, MealItem, MealType } from "./src/types";
import { StitchLoadingScreen } from "./src/components/StitchLoadingScreen";
import { StitchAuthScreen } from "./src/components/stitch/StitchAuthScreen";
import { StitchBottomNav, type StitchNavId } from "./src/components/stitch/StitchBottomNav";
import { StitchDashboard } from "./src/components/stitch/StitchDashboard";
import { StitchTopBar, stitchScrollPaddingTop } from "./src/components/stitch/StitchTopBar";
import { StitchManualMealForm } from "./src/components/stitch/StitchManualMealForm";
import { StitchFoodPlanScreen } from "./src/components/stitch/StitchFoodPlanScreen";
import { StitchFoodDetailScreen } from "./src/components/stitch/StitchFoodDetailScreen";
import { StitchFavouritesScreen } from "./src/components/stitch/StitchFavouritesScreen";
import { StitchCameraScreen } from "./src/components/stitch/StitchCameraScreen";
import { StitchReviewEstimateScreen } from "./src/components/stitch/StitchReviewEstimateScreen";
import { StitchSettingsScreen } from "./src/components/stitch/StitchSettingsScreen";
import { onPrimaryByAccent, stitchDark, stitchFonts } from "./src/theme/stitch";
import { AppThemeProvider } from "./src/theme/AppThemeContext";
import { semanticSurfaces } from "./src/lib/themeColors";
import { loadFavorites, saveFavorites } from "./src/lib/favoritesStorage";
import { loadPrivacyLockEnabled, setPrivacyLockEnabled } from "./src/lib/privacyStorage";
import {
  clearOnboardingDraft,
  clearOnboardingPending,
  hasOnboardingDone,
  hasOnboardingPending,
  isRecentlyCreatedAccount,
  loadOnboardingDraft,
  saveOnboardingDraft,
  setOnboardingDone,
  setOnboardingPending
} from "./src/lib/onboardingStorage";
import { importExpoNotifications } from "./src/lib/expoNotifications";

WebBrowser.maybeCompleteAuthSession();

type Screen = "onboarding" | "dashboard" | "manual" | "foodPlan" | "foodDetail" | "favourites" | "camera" | "review" | "settings";
type ThemeMode = "light" | "dark";
type OnboardingStep = 0 | 1 | 2 | 3 | 4;
type AccentPresetId = "blue" | "emerald" | "violet" | "rose" | "orange";
type UiPaletteId = "midnight" | "forest" | "ocean" | "graphite" | "sunrise";
type CuisineRegionId = "global" | "northAmerican" | "mediterranean" | "southAsian" | "eastAsian" | "latinAmerican" | "middleEastern";
type BiologicalSex = "man" | "woman";
type DetailBackScreen = "foodPlan" | "favourites";
type DetailContent = {
  title: string;
  subtitle: string;
  description: string;
  photoUrl: string;
  photoCandidates: string[];
  sourceLabel: string;
  keyIngredients: string[];
  wellnessTip: string;
  caloriesPer100: number;
  proteinGPer100: number;
  carbsGPer100: number;
  fatGPer100: number;
};
const extra = Constants.expoConfig?.extra as { EXPO_PUBLIC_AUTH_DISABLED?: string } | undefined;
/** When true, skips login and backend session checks (local UI dev only). Default: auth required. */
const AUTH_DISABLED = extra?.EXPO_PUBLIC_AUTH_DISABLED === "true";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const onboardingGoalOptions = ["Lose weight", "Maintain weight", "Gain weight", "Gain muscle", "Modify my diet", "Plan meals", "Manage stress"];
const recommendedHabitOptions = [
  "Eat more protein",
  "Plan more meals",
  "Meal prep and cook",
  "Eat more fiber",
  "Move more",
  "Workout more"
];
const habitOptions = [
  "Track nutrients",
  "Track calories",
  "Track macros",
  "Eat mindfully",
  "Eat a balanced diet",
  "Eat whole foods",
  "Eat more vegetables",
  "Eat more fruit",
  "Drink more water",
  "Prioritize sleep"
];
const mealPlanFrequencyOptions = ["Never", "Rarely", "Occasionally", "Frequently", "Always"];
const ONBOARDING_STEPS_TOTAL = 5;
const GOAL_DETAILS: Record<string, { subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = {
  "Lose weight": { subtitle: "Burn fat and improve definition", icon: "barbell-outline" },
  "Maintain weight": { subtitle: "Keep a stable daily calorie balance", icon: "scale-outline" },
  "Gain weight": { subtitle: "Add calories for healthy mass gain", icon: "trending-up-outline" },
  "Gain muscle": { subtitle: "Fuel strength, growth, and recovery", icon: "flash-outline" },
  "Modify my diet": { subtitle: "Improve food quality and consistency", icon: "nutrition-outline" },
  "Plan meals": { subtitle: "Build a routine with less decision stress", icon: "calendar-outline" },
  "Manage stress": { subtitle: "Support mood and energy with nutrition", icon: "heart-outline" }
};
const FREQUENCY_DETAILS: Record<string, string> = {
  Never: "You mostly decide meals on the spot.",
  Rarely: "You plan now and then, but not weekly.",
  Occasionally: "You loosely plan part of the week.",
  Frequently: "You often prep or decide ahead.",
  Always: "You follow a consistent weekly meal structure."
};
const accentPresets: Record<AccentPresetId, { label: string; light: string; dark: string }> = {
  blue: { label: "Blue", light: "#2563eb", dark: "#3b82f6" },
  /** Stitch mint primary */
  emerald: { label: "Emerald", light: "#4edea2", dark: "#4edea2" },
  violet: { label: "Violet", light: "#7c3aed", dark: "#8b5cf6" },
  rose: { label: "Rose", light: "#e11d48", dark: "#f43f5e" },
  orange: { label: "Orange", light: "#ea580c", dark: "#fb923c" }
};
const accentOrder: AccentPresetId[] = ["emerald", "blue", "violet", "rose", "orange"];
const uiPalettes: Record<
  UiPaletteId,
  {
    label: string;
    light: {
      background: string;
      cardBackground: string;
      text: string;
      mutedText: string;
      border: string;
      inputBackground: string;
    };
    dark: {
      background: string;
      cardBackground: string;
      text: string;
      mutedText: string;
      border: string;
      inputBackground: string;
    };
  }
> = {
  midnight: {
    label: "Midnight",
    light: { background: "#eef4f8", cardBackground: "#ffffff", text: "#0f172a", mutedText: "#64748b", border: "rgba(15, 23, 42, 0.12)", inputBackground: "#ffffff" },
    dark: { background: "#060e20", cardBackground: "#0b1325", text: "#dae2fc", mutedText: "#94a3b8", border: "rgba(148, 163, 184, 0.18)", inputBackground: "#111c33" }
  },
  forest: {
    label: "Forest",
    light: { background: "#eef7f1", cardBackground: "#ffffff", text: "#0f2b1f", mutedText: "#4f7266", border: "rgba(22, 101, 52, 0.2)", inputBackground: "#f7fffb" },
    dark: { background: "#071710", cardBackground: "#0d221a", text: "#d8fbe8", mutedText: "#8ab9a1", border: "rgba(74, 222, 128, 0.18)", inputBackground: "#123024" }
  },
  ocean: {
    label: "Ocean",
    light: { background: "#edf4fb", cardBackground: "#ffffff", text: "#10233f", mutedText: "#5c7394", border: "rgba(37, 99, 235, 0.18)", inputBackground: "#f5f9ff" },
    dark: { background: "#071324", cardBackground: "#0f1f35", text: "#d8e9ff", mutedText: "#91a8c8", border: "rgba(96, 165, 250, 0.2)", inputBackground: "#122742" }
  },
  graphite: {
    label: "Graphite",
    light: { background: "#f2f3f5", cardBackground: "#ffffff", text: "#1f2937", mutedText: "#6b7280", border: "rgba(31, 41, 55, 0.14)", inputBackground: "#ffffff" },
    dark: { background: "#111217", cardBackground: "#1a1d25", text: "#eceff6", mutedText: "#98a2b3", border: "rgba(148, 163, 184, 0.18)", inputBackground: "#232936" }
  },
  sunrise: {
    label: "Sunrise",
    light: { background: "#fff5ef", cardBackground: "#ffffff", text: "#3d1b0f", mutedText: "#8f5d4d", border: "rgba(234, 88, 12, 0.18)", inputBackground: "#fffaf6" },
    dark: { background: "#1c120f", cardBackground: "#2a1814", text: "#ffe7dc", mutedText: "#d3a295", border: "rgba(251, 146, 60, 0.2)", inputBackground: "#38211b" }
  }
};
const uiPaletteOrder: UiPaletteId[] = ["midnight", "forest", "ocean", "graphite", "sunrise"];
const cuisineRegionPresets: Record<CuisineRegionId, { label: string; keywords: string[] }> = {
  global: {
    label: "Global mix",
    keywords: ["rice", "chicken", "salmon", "oatmeal", "wrap", "soup"]
  },
  northAmerican: {
    label: "North American",
    keywords: ["hamburger", "cheeseburger", "hot dog", "mac and cheese", "club sandwich", "pancakes", "waffles"]
  },
  mediterranean: {
    label: "Mediterranean",
    keywords: ["greek salad", "hummus", "pita", "chicken kebab", "falafel", "olive oil"]
  },
  southAsian: {
    label: "South Asian",
    keywords: ["biryani", "butter chicken", "tikka masala", "curry", "lentil"]
  },
  eastAsian: {
    label: "East Asian",
    keywords: ["ramen", "sushi", "pad thai", "pho", "dumplings", "teriyaki", "fried rice", "poke"]
  },
  latinAmerican: {
    label: "Latin American",
    keywords: ["taco", "burrito", "quesadilla", "corn tortilla", "beans"]
  },
  middleEastern: {
    label: "Middle Eastern",
    keywords: ["shawarma", "falafel", "hummus", "kebab", "pita"]
  }
};
const cuisineRegionOrder: CuisineRegionId[] = [
  "global",
  "northAmerican",
  "mediterranean",
  "southAsian",
  "eastAsian",
  "latinAmerican",
  "middleEastern"
];
const cuisineRegionLabels: Record<string, string> = Object.fromEntries(
  cuisineRegionOrder.map((id) => [id, cuisineRegionPresets[id].label])
);

const inferGoalTypeFromSelections = (goals: string[]): "lose" | "maintain" | "gain" => {
  const normalized = goals.map((g) => g.toLowerCase());
  if (normalized.some((g) => g.includes("lose"))) return "lose";
  if (normalized.some((g) => g.includes("gain"))) return "gain";
  return "maintain";
};

const inferCuisineRegion = (): CuisineRegionId => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  if (/(in|pk|bd|lk|np)/.test(locale)) return "southAsian";
  if (/(jp|kr|cn|tw|vn|th|ph|sg|my)/.test(locale)) return "eastAsian";
  if (/(mx|ar|br|cl|co|pe)/.test(locale)) return "latinAmerican";
  if (/(tr|ae|sa|eg|jo|lb|iq|ir|il)/.test(locale)) return "middleEastern";
  if (/(it|es|gr|fr|pt)/.test(locale)) return "mediterranean";
  if (/(us|ca)/.test(locale)) return "northAmerican";
  return "global";
};

const createId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/** Avoid RN `Button` on Android (TouchableNativeFeedback) — use opacity press target instead. */
const PrimaryButton = ({
  title,
  onPress,
  color,
  fullWidth,
  textColor
}: {
  title: string;
  onPress: () => void;
  color?: string;
  fullWidth?: boolean;
  /** Label color on solid primary fills (e.g. dark text on mint). */
  textColor?: string;
}) => (
  <TouchableOpacity
    style={[styles.primaryBtn, { backgroundColor: color ?? "#2563eb" }, fullWidth ? styles.primaryBtnFull : null]}
    onPress={onPress}
    activeOpacity={0.7}
    delayPressIn={0}
  >
    <Text style={[styles.primaryBtnText, textColor ? { color: textColor } : null]}>{title}</Text>
  </TouchableOpacity>
);

const FallbackImage = memo(function FallbackImage({
  uris,
  style,
  urlMaxWidth,
  priority = "normal"
}: {
  uris: string[];
  style: object;
  /** Smaller CDN width for list rows — same photo, less decode lag when supported by the URL. */
  urlMaxWidth?: number;
  priority?: "low" | "normal" | "high";
}) {
  const displayUris = useMemo(
    () => (urlMaxWidth != null && uris.length > 0 ? mapPhotoUrisForMaxWidth(uris, urlMaxWidth) : uris),
    [uris, urlMaxWidth]
  );
  const [index, setIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const safeUris = displayUris.length > 0 ? displayUris : [];
  const current = safeUris[Math.min(index, Math.max(0, safeUris.length - 1))];

  useEffect(() => {
    setIndex(0);
    setAllFailed(false);
  }, [displayUris]);

  if (safeUris.length === 0 || allFailed) {
    return <View style={[style, styles.photoEmpty]} />;
  }

  return (
    <ExpoImage
      source={{ uri: current }}
      style={style}
      cachePolicy="memory-disk"
      contentFit="cover"
      priority={priority}
      transition={120}
      onError={() => {
        if (index >= safeUris.length - 1) {
          setAllFailed(true);
          return;
        }
        setIndex((prev) => Math.min(prev + 1, safeUris.length - 1));
      }}
    />
  );
});

const makeItem = (): MealItem => ({
  id: createId(),
  name: "",
  quantity: 1,
  unit: "piece",
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0
});

const displayNumber = (value: number) => (value === 0 ? "" : String(value));

/**
 * Supabase OAuth may return `code` (PKCE) or tokens in the query string or hash fragment.
 * `new URL()` is unreliable for some custom-scheme redirects, so we parse manually.
 */
const parseOAuthCallback = (callbackUrl: string) => {
  const hashIdx = callbackUrl.indexOf("#");
  const beforeHash = hashIdx === -1 ? callbackUrl : callbackUrl.slice(0, hashIdx);
  const hashPart = hashIdx === -1 ? "" : callbackUrl.slice(hashIdx + 1);
  const qIdx = beforeHash.indexOf("?");
  const queryPart = qIdx === -1 ? "" : beforeHash.slice(qIdx + 1);
  const searchParams = new URLSearchParams(queryPart);
  const hashParams = new URLSearchParams(hashPart);
  const get = (key: string) => searchParams.get(key) ?? hashParams.get(key);
  return {
    code: get("code"),
    accessToken: get("access_token"),
    refreshToken: get("refresh_token"),
    error: get("error"),
    errorDescription: get("error_description")
  };
};

const makeOAuthRedirectUri = () =>
  AuthSession.makeRedirectUri({
    path: "auth"
  });

const palettes = {
  light: {
    background: "#f4f9f7",
    cardBackground: "#ffffff",
    text: "#0f172a",
    mutedText: "#64748b",
    border: "rgba(15, 23, 42, 0.12)",
    inputBackground: "#ffffff",
    primary: "#2563eb",
    danger: "#dc2626",
    success: "#065f46"
  },
  dark: {
    ...stitchDark,
    primary: "#3b82f6"
  }
} as const;

const STITCH_TAB_BAR_VISUAL = 72;

export default function App() {
  const previousUserIdRef = useRef<string | null>(null);
  const previousOnboardingStepRef = useRef<OnboardingStep>(0);
  const onboardingStepOpacity = useRef(new Animated.Value(1)).current;
  const onboardingStepTranslate = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold
  });
  const insets = useSafeAreaInsets();

  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [accentId, setAccentId] = useState<AccentPresetId>("emerald");
  const [uiPaletteId, setUiPaletteId] = useState<UiPaletteId>("midnight");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [targetCalories, setTargetCalories] = useState(2200);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [mealItems, setMealItems] = useState<MealItem[]>([makeItem()]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [estimatedOriginalItems, setEstimatedOriginalItems] = useState<MealItem[]>([]);
  const [age, setAge] = useState("25");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("70");
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | null>(null);
  const [goalType, setGoalType] = useState<"lose" | "maintain" | "gain">("maintain");
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(0);
  const [nickname, setNickname] = useState("");
  const [surveyGoals, setSurveyGoals] = useState<string[]>([]);
  const [surveyHabits, setSurveyHabits] = useState<string[]>([]);
  const [mealPlanFrequency, setMealPlanFrequency] = useState("Occasionally");
  const [selectedCuisineRegion, setSelectedCuisineRegion] = useState<CuisineRegionId>(inferCuisineRegion);
  const [detailBackScreen, setDetailBackScreen] = useState<DetailBackScreen>("foodPlan");
  const [detailContent, setDetailContent] = useState<DetailContent | null>(null);
  const [detailFood, setDetailFood] = useState<FoodRecord | null>(null);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodPortions, setFoodPortions] = useState<Record<string, string>>({});
  const [foodResults, setFoodResults] = useState<FoodRecord[]>([]);
  const [foodSource, setFoodSource] = useState<"cloud" | "local">("local");
  const [foodLoading, setFoodLoading] = useState(false);
  const [favouriteFoodNames, setFavouriteFoodNames] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [privacyLockOn, setPrivacyLockOn] = useState(false);
  const [privacyUnlocked, setPrivacyUnlocked] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isExpoGo = Constants.appOwnership === "expo";

  const resetProfileInputs = useCallback(() => {
    setNickname("");
    setAge("25");
    setHeightCm("170");
    setWeightKg("70");
    setBiologicalSex(null);
    setGoalType("maintain");
    setTargetCalories(2200);
  }, []);

  const accent = accentPresets[accentId];
  const uiPalette = uiPalettes[uiPaletteId];
  const theme = useMemo(() => {
    const base = {
      mode: themeMode,
      ...palettes[themeMode],
      ...(themeMode === "dark" ? uiPalette.dark : uiPalette.light),
      primary: themeMode === "dark" ? accent.dark : accent.light,
      onPrimary: onPrimaryByAccent[accentId]
    };
    return {
      ...base,
      ...semanticSurfaces({
        mode: themeMode,
        background: base.background,
        cardBackground: base.cardBackground,
        text: base.text,
        mutedText: base.mutedText,
        primary: base.primary
      })
    };
  }, [themeMode, accent.dark, accent.light, accentId, uiPalette]);
  const font = fontsLoaded ? stitchFonts : null;
  const summary = useMemo(() => summaryFromMeals(meals, targetCalories), [meals, targetCalories]);
  const caloriesProgress = summary.targetCalories > 0 ? Math.min(summary.consumedCalories / summary.targetCalories, 1) : 0;
  const recentMeals = meals.slice(0, 3);
  const mealsLogged = meals.length;
  const avgMealCalories = mealsLogged ? Math.round(summary.consumedCalories / mealsLogged) : 0;
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const toggleTheme = () => setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  /** Shown in main header only after user enters a nickname during onboarding. */
  const headerBrandTitle = nickname.trim();
  const inferredGoalType = useMemo(() => inferGoalTypeFromSelections(surveyGoals), [surveyGoals]);
  const bmiValue = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const meters = h / 100;
    return Number((w / (meters * meters)).toFixed(1));
  }, [heightCm, weightKg]);
  const bmrValue = useMemo(() => {
    const ageN = Number(age);
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!ageN || !h || !w || ageN <= 0 || h <= 0 || w <= 0) return null;
    const sexConstant = biologicalSex === "woman" ? -161 : 5;
    return Math.round(10 * w + 6.25 * h - 5 * ageN + sexConstant);
  }, [age, heightCm, weightKg, biologicalSex]);
  const bmiLabel = useMemo(() => {
    if (!bmiValue) return "Unavailable";
    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Healthy";
    if (bmiValue < 30) return "Overweight";
    return "Obese";
  }, [bmiValue]);
  const calculateQuestionnaireTarget = useCallback(() => {
    const ageN = Number(age);
    const heightN = Number(heightCm);
    const weightN = Number(weightKg);
    if (!Number.isFinite(ageN) || !Number.isFinite(heightN) || !Number.isFinite(weightN) || ageN <= 0 || heightN <= 0 || weightN <= 0) {
      return 2200;
    }

    const selectedGoal = surveyGoals[0]?.toLowerCase() ?? "";
    const normalizedHabits = surveyHabits.map((h) => h.toLowerCase());

    // Activity multiplier from meal planning frequency and habits.
    const frequencyActivityOffset: Record<string, number> = {
      Never: -0.04,
      Rarely: -0.02,
      Occasionally: 0,
      Frequently: 0.04,
      Always: 0.08
    };
    let activityMultiplier = 1.3 + (frequencyActivityOffset[mealPlanFrequency] ?? 0);
    if (normalizedHabits.some((h) => h.includes("move more"))) activityMultiplier += 0.05;
    if (normalizedHabits.some((h) => h.includes("workout more"))) activityMultiplier += 0.09;
    if (normalizedHabits.some((h) => h.includes("prioritize sleep"))) activityMultiplier += 0.01;
    activityMultiplier = Math.max(1.2, Math.min(1.65, activityMultiplier));

    // Direct goal-based calorie adjustment (single-choice goal).
    let calorieAdjustment = 0;
    if (selectedGoal.includes("lose weight")) {
      calorieAdjustment = -200;
    } else if (selectedGoal.includes("gain weight")) {
      calorieAdjustment = 180;
    } else if (selectedGoal.includes("gain muscle")) {
      calorieAdjustment = 250;
    } else if (selectedGoal.includes("modify my diet")) {
      calorieAdjustment = -50;
    } else if (selectedGoal.includes("plan meals")) {
      calorieAdjustment = 0;
    } else if (selectedGoal.includes("manage stress")) {
      calorieAdjustment = 30;
    }

    // Habit-based fine-tuning.
    if (normalizedHabits.some((h) => h.includes("eat more protein"))) calorieAdjustment += 75;
    if (normalizedHabits.some((h) => h.includes("eat more fiber"))) calorieAdjustment -= 45;
    if (normalizedHabits.some((h) => h.includes("eat mindfully"))) calorieAdjustment -= 25;
    if (normalizedHabits.some((h) => h.includes("drink more water"))) calorieAdjustment -= 10;
    if (normalizedHabits.some((h) => h.includes("prioritize sleep"))) calorieAdjustment -= 10;
    if (normalizedHabits.some((h) => h.includes("track calories"))) calorieAdjustment -= 15;
    if (normalizedHabits.some((h) => h.includes("track macros"))) calorieAdjustment -= 10;
    if (normalizedHabits.some((h) => h.includes("plan more meals"))) calorieAdjustment -= 10;
    if (normalizedHabits.some((h) => h.includes("meal prep"))) calorieAdjustment -= 10;

    // BMI-aware safety guardrails.
    const bmiEstimate = weightN / Math.pow(heightN / 100, 2);
    if (bmiEstimate >= 30 && inferredGoalType === "lose") calorieAdjustment -= 100;
    if (bmiEstimate < 19 && inferredGoalType !== "lose") calorieAdjustment += 130;
    if (bmiEstimate < 17.5) calorieAdjustment += 90;
    if (bmiEstimate > 34) calorieAdjustment -= 90;

    // Age context: avoid aggressive targets at extremes.
    if (ageN >= 50 && inferredGoalType === "lose") calorieAdjustment += 50;
    if (ageN <= 25 && inferredGoalType === "gain") calorieAdjustment += 40;
    calorieAdjustment = Math.max(-450, Math.min(450, calorieAdjustment));

    return suggestedCalorieTarget({
      age: ageN,
      heightCm: heightN,
      weightKg: weightN,
      goalType: inferredGoalType,
      sex: biologicalSex ?? undefined,
      activityMultiplier,
      calorieAdjustment
    });
  }, [age, heightCm, weightKg, biologicalSex, inferredGoalType, mealPlanFrequency, surveyHabits, surveyGoals]);
  /** Unified Plan catalog: cloud + local, optional cuisine filter, optional search. */
  const planFoodsForScreen = useMemo(() => {
    // Build from local first, then let cloud rows override by name so image_url/image_urls are not dropped.
    const merged = Array.from(new Map([...FOOD_DATABASE, ...foodResults].map((food) => [food.name, food])).values());
    const base =
      selectedCuisineRegion === "global"
        ? merged
        : merged.filter((food) =>
            cuisineRegionPresets[selectedCuisineRegion].keywords.some((keyword) =>
              food.name.toLowerCase().includes(keyword.toLowerCase())
            )
          );
    const q = foodSearch.trim().toLowerCase();
    if (!q) {
      return [...base].sort((a, b) => a.name.localeCompare(b.name));
    }
    const numericQuery = Number(q);
    const hasNumericQuery = !Number.isNaN(numericQuery);
    return base
      .map((food) => {
        const text = getFoodSearchBlob(food);
        let score = 0;
        if (food.name.toLowerCase().includes(q)) score += 5;
        if (food.category.toLowerCase().includes(q)) score += 3;
        if (text.includes(q)) score += 2;
        if (hasNumericQuery && Math.abs(food.calories - numericQuery) <= 20) score += 2;
        if (hasNumericQuery && Math.abs(food.protein_g - numericQuery) <= 5) score += 1;
        return { food, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
      .map((item) => item.food);
  }, [foodResults, foodSearch, selectedCuisineRegion]);

  const toPositiveIntOrNull = useCallback((value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n);
    return rounded > 0 ? rounded : null;
  }, []);

  const toPositiveNumberOrNull = useCallback((value: string) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, []);

  const persistProfile = useCallback(
    async (userId: string, nextGoalType: "lose" | "maintain" | "gain", target: number) => {
      const safeTarget = Number.isFinite(target) && target > 0 ? Math.round(target) : 2200;
      await upsertProfile({
        id: userId,
        display_name: nickname.trim() || null,
        age: toPositiveIntOrNull(age),
        height_cm: toPositiveIntOrNull(heightCm),
        weight_kg: toPositiveNumberOrNull(weightKg),
        goal_type: nextGoalType,
        daily_calorie_target: safeTarget
      });
    },
    [nickname, age, heightCm, weightKg, toPositiveIntOrNull, toPositiveNumberOrNull]
  );

  const stitchNavActive = useMemo((): StitchNavId | null => {
    if (screen === "dashboard") return "home";
    if (screen === "foodPlan") return "plan";
    if (screen === "manual") return "log";
    if (screen === "settings") return "settings";
    if (screen === "camera" || screen === "review") return "camera";
    if (screen === "foodDetail") {
      if (detailBackScreen === "foodPlan") return "plan";
      return null;
    }
    return null;
  }, [screen, detailBackScreen]);

  const stitchDateLabel = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    []
  );

  const bottomSafe = Math.max(insets.bottom, 6);
  const scrollBottomPad = STITCH_TAB_BAR_VISUAL + bottomSafe + 88;
  const stitchTopPad = stitchScrollPaddingTop(insets.top);
  const scrollPadTop = screen === "foodDetail" ? insets.top + 10 : stitchTopPad;

  useEffect(() => {
    getSession()
      .then(async (existingSession) => {
        setSession(existingSession);
        if (existingSession?.user?.id && !AUTH_DISABLED) {
          const pending = await hasOnboardingPending(existingSession.user.id);
          if (pending) {
            const draft = await loadOnboardingDraft(existingSession.user.id);
            if (draft) {
              setOnboardingStep(draft.onboardingStep);
              setAge(draft.age);
              setHeightCm(draft.heightCm);
              setWeightKg(draft.weightKg);
              setBiologicalSex(draft.biologicalSex);
              setNickname(draft.nickname);
              setSurveyGoals(draft.surveyGoals);
              setSurveyHabits(draft.surveyHabits);
              setMealPlanFrequency(draft.mealPlanFrequency);
            }
          }
          setScreen(pending ? "onboarding" : "dashboard");
        }
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const {
      data: { subscription }
    } = authClient.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession) {
        setSession(nextSession);
        // Do not change `screen` here — login vs signup vs resume is handled in auth handlers
        // and getSession (onboarding only when pending flag is set for new signups).
        return;
      }

      // Ignore transient null events; only clear auth on explicit sign out.
      if (event === "SIGNED_OUT") {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || screen !== "onboarding") return;
    void saveOnboardingDraft(userId, {
      onboardingStep,
      age,
      heightCm,
      weightKg,
      biologicalSex,
      nickname,
      surveyGoals,
      surveyHabits,
      mealPlanFrequency
    });
  }, [session?.user?.id, screen, onboardingStep, age, heightCm, weightKg, biologicalSex, nickname, surveyGoals, surveyHabits, mealPlanFrequency]);

  useEffect(() => {
    if (screen !== "onboarding") return;
    const previousStep = previousOnboardingStepRef.current;
    const direction = onboardingStep >= previousStep ? 1 : -1;
    onboardingStepOpacity.setValue(0);
    onboardingStepTranslate.setValue(direction * 18);
    Animated.parallel([
      Animated.timing(onboardingStepOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(onboardingStepTranslate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
    previousOnboardingStepRef.current = onboardingStep;
  }, [onboardingStep, onboardingStepOpacity, onboardingStepTranslate, screen]);

  useEffect(() => {
    if (!session) return;
    listMealsForToday()
      .then((savedMeals) => setMeals(savedMeals))
      .catch(() => {
        // Allow app to continue in local-only mode if backend is unavailable.
      });
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) {
      setFavouriteFoodNames([]);
      return;
    }
    loadFavorites(session.user.id)
      .then((saved) => setFavouriteFoodNames(saved))
      .catch(() => setFavouriteFoodNames([]));
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    void saveFavorites(session.user.id, favouriteFoodNames);
  }, [session?.user?.id, favouriteFoodNames]);

  const attemptPrivacyUnlock = useCallback(
    async (promptMessage = "Unlock Inertia") => {
      if (!privacyLockOn) {
        setPrivacyUnlocked(true);
        return true;
      }
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert("Biometric unavailable", "No biometric method is set up on this device.");
          setPrivacyUnlocked(false);
          return false;
        }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          cancelLabel: "Cancel",
          disableDeviceFallback: false
        });
        setPrivacyUnlocked(result.success);
        return result.success;
      } catch {
        setPrivacyUnlocked(false);
        Alert.alert("Unlock failed", "Could not verify your identity.");
        return false;
      }
    },
    [privacyLockOn]
  );

  useEffect(() => {
    loadPrivacyLockEnabled()
      .then((enabled) => {
        setPrivacyLockOn(enabled);
        setPrivacyUnlocked(!enabled);
      })
      .catch(() => {
        setPrivacyLockOn(false);
        setPrivacyUnlocked(true);
      });

    if (isExpoGo) {
      setNotificationsEnabled(null);
      return;
    }

    void (async () => {
      const Notifications = await importExpoNotifications();
      if (!Notifications) {
        setNotificationsEnabled(null);
        return;
      }
      try {
        const status = await Notifications.getPermissionsAsync();
        const enabled =
          status.granted ||
          status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
          status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
        setNotificationsEnabled(enabled);
      } catch {
        setNotificationsEnabled(null);
      }
    })();
  }, [isExpoGo]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active" && privacyLockOn && session) {
        void attemptPrivacyUnlock();
      }
    });
    return () => sub.remove();
  }, [attemptPrivacyUnlock, privacyLockOn, session]);

  useEffect(() => {
    if (!session?.user?.id || AUTH_DISABLED) return;
    if (previousUserIdRef.current !== session.user.id) {
      resetProfileInputs();
      previousUserIdRef.current = session.user.id;
    }
    getProfile(session.user.id)
      .then((profile) => {
        if (!profile) return;
        setNickname(profile.display_name ?? "");
        if (profile.age != null) setAge(String(profile.age));
        if (profile.height_cm != null) setHeightCm(String(profile.height_cm));
        if (profile.weight_kg != null) setWeightKg(String(profile.weight_kg));
        if (profile.goal_type) setGoalType(profile.goal_type);
        if (profile.daily_calorie_target != null && profile.daily_calorie_target > 0) {
          setTargetCalories(profile.daily_calorie_target);
        }
      })
      .catch(() => {
        // Silent fail: profile may not exist yet.
      });
  }, [session?.user?.id, resetProfileInputs]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      setFoodLoading(true);
      const result = await searchFoods(foodSearch);
      if (!active) return;
      setFoodResults(result.foods);
      setFoodSource(result.source);
      setFoodLoading(false);
    }, 180);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [foodSearch]);

  const handleEmailAuth = async () => {
    setAuthError(null);
    setAuthInfo(null);
    if (!email.trim() || !password.trim()) {
      setAuthError("Please enter both email and password.");
      return;
    }
    if (!emailLooksValid) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (authMode === "signup" && password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await signUpWithEmail(email.trim(), password);
        if (error) throw error;
        if (data.session) {
          try {
            await persistProfile(data.session.user.id, inferredGoalType, calculateQuestionnaireTarget());
          } catch {
            // Profile row can be re-attempted at onboarding completion.
          }
          await setOnboardingPending(data.session.user.id);
          setSession(data.session);
          setAuthInfo("Account created and signed in.");
          setOnboardingStep(0);
          setScreen("onboarding");
        } else {
          // Common when email confirmation is enabled in Supabase.
          setAuthInfo("Account created. Check your email to confirm, then log in.");
          setAuthMode("login");
        }
      } else {
        const { data, error } = await signInWithEmail(email.trim(), password);
        if (error) throw error;
        if (data.session) {
          await clearOnboardingPending(data.session.user.id);
          setSession(data.session);
          setScreen("dashboard");
        } else {
          setAuthError("Login did not return an active session. Please try again.");
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setAuthError(
        msg.includes("Unexpected character")
          ? "Supabase URL looks incorrect. Use https://<project-ref>.supabase.co in EXPO_PUBLIC_SUPABASE_URL and restart Expo."
          : msg
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setAuthInfo(null);
    if (!emailLooksValid) {
      setAuthError("Enter your email above first, then tap Forgot password.");
      return;
    }
    setAuthBusy(true);
    try {
      const redirectTo = makeOAuthRedirectUri();
      const { error } = await requestPasswordReset(email.trim(), redirectTo);
      if (error) throw error;
      setAuthInfo("Password reset email sent. Check your inbox and spam folder.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : String(error));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleOAuth = async (provider: Provider) => {
    setAuthBusy(true);
    try {
      const redirectTo = makeOAuthRedirectUri();
      console.log("OAuth redirect URI:", redirectTo);
      const { data, error } = await startOAuth(provider, redirectTo);
      if (error) throw error;
      if (!data?.url) throw new Error("Could not start OAuth.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return;
      if (result.url.includes("localhost:3000")) {
        throw new Error(
          "OAuth redirected to localhost. In Supabase Auth URL Configuration, add redirect URLs for both caloriecounter://* and exp://* then retry."
        );
      }

      const parsed = parseOAuthCallback(result.url);
      if (parsed.error) {
        const detail = parsed.errorDescription ? decodeURIComponent(parsed.errorDescription) : parsed.error;
        throw new Error(detail);
      }

      if (parsed.code) {
        const { data: exchangeData, error: exchangeError } = await authClient.auth.exchangeCodeForSession(parsed.code);
        if (exchangeError) throw exchangeError;
        if (!exchangeData.session) {
          throw new Error("OAuth code exchange did not return a session.");
        }
      } else if (parsed.accessToken) {
        const { error: setSessionError } = await authClient.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken ?? ""
        });
        if (setSessionError) throw setSessionError;
      } else {
        console.warn(
          "OAuth callback could not be parsed (no code or access_token). URL shape:",
          result.url.split("#")[0]?.slice(0, 120)
        );
        throw new Error(
          "OAuth callback missing access token and code. Add this redirect URL in Supabase Auth → URL Configuration, then retry."
        );
      }
      const { data: sessionData } = await authClient.auth.getSession();
      if (sessionData.session) {
        const u = sessionData.session.user;
        setSession(sessionData.session);
        if (u?.id) {
          try {
            await persistProfile(u.id, inferredGoalType, calculateQuestionnaireTarget());
          } catch {
            // Best-effort at first auth; onboarding finish retries.
          }
          const done = await hasOnboardingDone(u.id);
          const pending = await hasOnboardingPending(u.id);
          const brandNew = isRecentlyCreatedAccount(u.created_at);
          if (done) {
            setScreen("dashboard");
          } else if (pending || brandNew) {
            await setOnboardingPending(u.id);
            setOnboardingStep(0);
            setScreen("onboarding");
          } else {
            await clearOnboardingPending(u.id);
            setScreen("dashboard");
          }
        } else {
          setScreen("dashboard");
        }
      } else {
        throw new Error("Authentication completed but no session is active.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Alert.alert(
        "OAuth failed",
        msg.includes("Unexpected character")
          ? "Supabase URL looks incorrect. Use https://<project-ref>.supabase.co in EXPO_PUBLIC_SUPABASE_URL and restart Expo."
          : msg
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await authClient.auth.signOut();
    if (error) {
      Alert.alert("Sign out failed", error.message);
      return;
    }
    setMeals([]);
    setOnboardingStep(0);
    setPrivacyUnlocked(true);
    setScreen("dashboard");
  };

  const handleSaveNickname = async () => {
    if (!session?.user?.id || AUTH_DISABLED) {
      Alert.alert("Saved", "Username updated locally.");
      return;
    }
    try {
      await persistProfile(session.user.id, goalType, targetCalories);
      Alert.alert("Saved", "Username updated.");
    } catch (error) {
      Alert.alert("Could not save username", String(error));
    }
  };

  const handleNotificationsTilePress = useCallback(async () => {
    if (isExpoGo) {
      Alert.alert(
        "Notifications unavailable in Expo Go",
        "Remote push notifications were removed from Expo Go. Use a development build to fully test notifications."
      );
      return;
    }
    try {
      const Notifications = await importExpoNotifications();
      if (!Notifications) {
        Alert.alert(
          "Notifications unavailable",
          "Use a development build instead of Expo Go to enable push notifications."
        );
        return;
      }
      const current = await Notifications.getPermissionsAsync();
      const alreadyEnabled =
        current.granted ||
        current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
        current.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      if (alreadyEnabled) {
        setNotificationsEnabled(true);
        Alert.alert("Notifications", "Notifications are enabled.");
        return;
      }

      const requested = await Notifications.requestPermissionsAsync();
      const granted =
        requested.granted ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      setNotificationsEnabled(granted);

      if (granted) {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT
          });
        }
        Alert.alert("Notifications enabled", "You will now receive reminders and nudges.");
        return;
      }

      Alert.alert("Notifications disabled", "Enable notifications in system settings if you want reminders.", [
        { text: "Not now", style: "cancel" },
        { text: "Open settings", onPress: () => void Linking.openSettings() }
      ]);
    } catch {
      Alert.alert("Notifications error", "Could not check notification permissions.");
    }
  }, [isExpoGo]);

  const handlePrivacyTilePress = useCallback(() => {
    Alert.alert(
      "Privacy controls",
      privacyLockOn ? "Biometric app lock is enabled." : "Biometric app lock is disabled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Test unlock",
          onPress: () => {
            void attemptPrivacyUnlock("Confirm your identity");
          }
        },
        privacyLockOn
          ? {
              text: "Disable lock",
              style: "destructive",
              onPress: () => {
                void (async () => {
                  await setPrivacyLockEnabled(false);
                  setPrivacyLockOn(false);
                  setPrivacyUnlocked(true);
                  Alert.alert("Privacy updated", "Biometric lock has been disabled.");
                })();
              }
            }
          : {
              text: "Enable lock",
              onPress: () => {
                void (async () => {
                  const hasHardware = await LocalAuthentication.hasHardwareAsync();
                  const enrolled = await LocalAuthentication.isEnrolledAsync();
                  if (!hasHardware || !enrolled) {
                    Alert.alert("Biometric unavailable", "Set up face/fingerprint unlock on your device first.");
                    return;
                  }
                  const verified = await LocalAuthentication.authenticateAsync({
                    promptMessage: "Enable biometric app lock",
                    cancelLabel: "Cancel"
                  });
                  if (!verified.success) return;
                  await setPrivacyLockEnabled(true);
                  setPrivacyLockOn(true);
                  setPrivacyUnlocked(true);
                  Alert.alert("Privacy updated", "Biometric lock is now enabled.");
                })();
              }
            }
      ]
    );
  }, [attemptPrivacyUnlock, privacyLockOn]);

  const handleSupportTilePress = useCallback(async () => {
    const to = "strive.fitness.contact@gmail.com";
    const gmailUrl = `googlegmail://co?to=${encodeURIComponent(to)}&subject=${encodeURIComponent("Inertia Support")}`;
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent("Inertia Support")}`;

    try {
      const canOpenGmail = await Linking.canOpenURL(gmailUrl);
      if (canOpenGmail) {
        await Linking.openURL(gmailUrl);
        return;
      }

      const canOpenMail = await Linking.canOpenURL(mailtoUrl);
      if (canOpenMail) {
        await Linking.openURL(mailtoUrl);
        return;
      }

      Alert.alert("Support unavailable", `No email app found. Contact us at ${to}.`);
    } catch {
      Alert.alert("Support unavailable", `Could not open email app. Contact us at ${to}.`);
    }
  }, []);

  const handleShareAppPress = useCallback(async () => {
    const appName = "Inertia";
    const androidPackage = Constants.expoConfig?.android?.package;
    const appLink = androidPackage
      ? `https://play.google.com/store/apps/details?id=${androidPackage}`
      : "https://play.google.com/store/apps";
    try {
      await Share.share({
        message: `${appName} helps track calories and meals quickly. Try it here: ${appLink}`
      });
    } catch {
      Alert.alert("Share unavailable", "Could not open the share menu right now.");
    }
  }, []);

  const handleRateAppPress = useCallback(async () => {
    const androidPackage = Constants.expoConfig?.android?.package;
    const playStoreUrl = androidPackage
      ? `https://play.google.com/store/apps/details?id=${androidPackage}`
      : "https://play.google.com/store/apps";
    try {
      const canOpen = await Linking.canOpenURL(playStoreUrl);
      if (!canOpen) {
        Alert.alert("Store unavailable", "Could not open the app store link.");
        return;
      }
      await Linking.openURL(playStoreUrl);
    } catch {
      Alert.alert("Store unavailable", "Could not open the app store link.");
    }
  }, []);

  const handleAboutPress = useCallback(() => {
    const version = Constants.expoConfig?.version ?? "Unknown";
    Alert.alert("About Inertia", `Version: ${version}\n\nCalorie tracking, meal planning, and nutrition logging.`);
  }, []);

  const saveCurrentMeal = async (source: Meal["source"], requestId?: string) => {
    const cleanItems = mealItems.filter((item) => item.name.trim().length > 0);
    if (!cleanItems.length) {
      Alert.alert("Add at least one meal item.");
      return;
    }

    const meal: Meal = {
      id: createId(),
      mealType,
      source,
      eatenAt: new Date().toISOString(),
      items: cleanItems
    };

    try {
      if (source === "camera" && requestId) {
        await logEstimateCorrections(requestId, estimatedOriginalItems, cleanItems);
        await trackEvent("estimate_edited", {
          requestId,
          editedItemCount: cleanItems.length
        });
      }
      if (!AUTH_DISABLED) {
        await saveMeal(meal, requestId);
      }
      setMeals((prev) => [meal, ...prev]);
      setMealItems([makeItem()]);
      setEstimate(null);
      setEstimatedOriginalItems([]);
      setPhotoUri(null);
      await trackEvent(source === "manual" ? "manual_meal_saved" : "meal_saved", {
        source,
        items: cleanItems.length
      });
      setScreen("dashboard");
    } catch (error) {
      Alert.alert("Could not save meal", String(error));
    }
  };

  const openPhotoPicker = async () => {
    const permissions = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert("Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7
    });

    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setScreen("camera");
  };

  const requestEstimate = async () => {
    if (!photoUri) return;
    try {
      await trackEvent("camera_estimate_requested");
      const uploadPath = `mock://${photoUri}`;
      const result = await estimateMealFromImage(uploadPath, mealType);
      setEstimate(result);
      setMealItems(result.detectedItems);
      setEstimatedOriginalItems(result.detectedItems);
      await trackEvent("estimate_received", { confidence: result.confidence });
      setScreen("review");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Alert.alert(
        "Estimate failed",
        msg.includes("Supabase is not configured")
          ? msg
          : `${msg}\n\nYou can still log meals manually.`
      );
      setScreen("manual");
      console.error(error);
    }
  };

  const updateItem = (id: string, key: keyof MealItem, value: string) => {
    setMealItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (key === "name" || key === "unit") return { ...item, [key]: value };
        return { ...item, [key]: Number(value || 0) };
      })
    );
  };

  const getPortionValue = (foodName: string): number => {
    const raw = foodPortions[foodName];
    const parsed = Number(raw);
    if (!raw || Number.isNaN(parsed)) return 1;
    return Math.min(20, Math.max(0.25, parsed));
  };

  const setPortionValue = (foodName: string, value: string) => {
    setFoodPortions((prev) => ({ ...prev, [foodName]: value }));
  };

  const adjustPortionValue = (foodName: string, delta: number) => {
    const next = Math.min(20, Math.max(0.25, getPortionValue(foodName) + delta));
    setFoodPortions((prev) => ({ ...prev, [foodName]: String(Number(next.toFixed(2))) }));
  };

  const addFoodToMeal = (food: FoodRecord, portions = 1) => {
    const clamped = Math.min(20, Math.max(0.25, portions));
    const newItem: MealItem = {
      id: createId(),
      name: food.name,
      quantity: Number((100 * clamped).toFixed(0)),
      unit: "g",
      calories: Math.round(food.calories * clamped),
      protein_g: Number((food.protein_g * clamped).toFixed(1)),
      carbs_g: Number((food.carbs_g * clamped).toFixed(1)),
      fat_g: Number((food.fat_g * clamped).toFixed(1))
    };
    setMealItems((prev) => [...prev, newItem]);
    setScreen("manual");
  };

  const toggleFavouriteFood = useCallback((foodName: string) => {
    setFavouriteFoodNames((prev) => (prev.includes(foodName) ? prev.filter((n) => n !== foodName) : [...prev, foodName]));
  }, []);

  const favouriteFoods = useMemo(
    () =>
      favouriteFoodNames
        .map((name) => FOOD_DATABASE.find((f) => f.name === name))
        .filter((f): f is FoodRecord => Boolean(f)),
    [favouriteFoodNames]
  );

  const openFoodDetail = (food: FoodRecord, backScreen: DetailBackScreen) => {
    const detail = getFoodDetail(food);
    setDetailBackScreen(backScreen);
    setDetailFood(food);
    setDetailContent({
      title: food.name,
      subtitle: `${food.category} • ${food.calories} kcal per 100g`,
      description: detail.description,
      photoUrl: detail.photoUrl,
      photoCandidates: detail.photoCandidates ?? getFoodPhotoCandidates(food),
      sourceLabel: detail.sourceLabel,
      keyIngredients: detail.keyIngredients,
      wellnessTip: detail.wellnessTip,
      caloriesPer100: food.calories,
      proteinGPer100: food.protein_g,
      carbsGPer100: food.carbs_g,
      fatGPer100: food.fat_g
    });
    setScreen("foodDetail");
  };

  const selectGoal = (goal: string) => {
    setSurveyGoals([goal]);
  };

  const toggleHabitSelection = (habit: string) => {
    setSurveyHabits((prev) => (prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]));
  };

  const finishOnboarding = async () => {
    const computedTarget = calculateQuestionnaireTarget();
    setGoalType(inferredGoalType);
    setTargetCalories(computedTarget);

    if (session?.user?.id) {
      try {
        await persistProfile(session.user.id, inferredGoalType, computedTarget);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        Alert.alert(
          "Could not save profile",
          `You can continue using the app. If this keeps happening, check Supabase profiles table / RLS.\n\nDetails: ${detail}`
        );
      }
    }
    await trackEvent("onboarding_completed", {
      targetCalories: computedTarget,
      goalType: inferredGoalType,
      sex: biologicalSex,
      surveyGoals,
      surveyHabits,
      mealPlanFrequency,
      accent: accentId,
      nickname: nickname.trim()
    });
    if (session?.user?.id) {
      await setOnboardingDone(session.user.id);
      await clearOnboardingDraft(session.user.id);
      await clearOnboardingPending(session.user.id);
    }
    setScreen("dashboard");
  };

  if (!fontsLoaded) {
    return <StitchLoadingScreen />;
  }

  if (authLoading && !AUTH_DISABLED) {
    return <StitchLoadingScreen useCustomFonts />;
  }

  if (!session && !AUTH_DISABLED) {
    return (
      <StitchAuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        authError={authError}
        authInfo={authInfo}
        authBusy={authBusy}
        onEmailAuth={() => void handleEmailAuth()}
        onForgotPassword={() => void handleForgotPassword()}
        onGoogle={() => void handleOAuth("google")}
        onFacebook={() => void handleOAuth("facebook")}
        useCustomFonts={Boolean(font)}
      />
    );
  }

  if (session && privacyLockOn && !privacyUnlocked) {
    return (
      <AppThemeProvider value={theme}>
        <View style={[styles.lockWrap, { backgroundColor: theme.background }]}>
          <View style={[styles.lockCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Ionicons name="lock-closed" size={34} color={theme.primary} />
            <Text style={[styles.lockTitle, { color: theme.text }, font?.display && { fontFamily: font.display }]}>App locked</Text>
            <Text style={[styles.lockBody, { color: theme.mutedText }, font?.body && { fontFamily: font.body }]}>
              Unlock with biometrics to continue.
            </Text>
            <PrimaryButton
              title="Unlock"
              onPress={() => {
                void attemptPrivacyUnlock("Unlock Inertia");
              }}
              color={theme.primary}
              textColor={theme.onPrimary}
              fullWidth
            />
          </View>
        </View>
      </AppThemeProvider>
    );
  }

  if (screen === "onboarding") {
    const onboardingProgressWidth: `${number}%` = `${((onboardingStep + 1) / ONBOARDING_STEPS_TOTAL) * 100}%`;
    const surveyTheme = {
      background: "#030d20",
      shell: "#071730",
      cardBackground: "rgba(9, 29, 52, 0.92)",
      inputBackground: "rgba(9, 24, 43, 0.96)",
      text: "#e8eefc",
      mutedText: "#9eb0ca",
      border: "rgba(122, 153, 188, 0.3)"
    } as const;
    const onboardingSuggestedTarget = calculateQuestionnaireTarget();
    return (
      <View style={[styles.onboardingScreen, { backgroundColor: surveyTheme.background }]}>
      <View style={[styles.onboardingGlow, styles.onboardingGlowTop, { backgroundColor: `${theme.primary}18` }]} pointerEvents="none" />
      <View style={[styles.onboardingGlow, styles.onboardingGlowBottom, { backgroundColor: `${theme.primary}16` }]} pointerEvents="none" />
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: 16, paddingBottom: 34 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          decelerationRate="normal"
          scrollEventThrottle={16}
          disableIntervalMomentum
          bounces={Platform.OS === "ios"}
          overScrollMode="never"
        >
          <View style={[styles.onboardingShell, { backgroundColor: surveyTheme.shell, borderColor: surveyTheme.border }]}>
            <View style={styles.onboardingHeaderRow}>
              <TouchableOpacity
                style={[styles.onboardingBackCircle, { borderColor: surveyTheme.border, backgroundColor: surveyTheme.inputBackground }]}
                onPress={() => setOnboardingStep((prev) => Math.max(0, prev - 1) as OnboardingStep)}
                activeOpacity={0.82}
              >
                <Ionicons name="arrow-back" size={20} color={surveyTheme.text} />
              </TouchableOpacity>
              <View style={styles.onboardingHeaderProgressWrap}>
                <View style={[styles.onboardingStepTrack, { backgroundColor: "rgba(122, 153, 188, 0.24)" }]}>
                  <View style={[styles.onboardingStepFill, { width: onboardingProgressWidth, backgroundColor: theme.primary }]} />
                </View>
              </View>
              <Text style={[styles.onboardingStepText, { color: surveyTheme.mutedText }, font?.bodySemibold && { fontFamily: font.bodySemibold }]}>
                Step {onboardingStep + 1} of {ONBOARDING_STEPS_TOTAL}
              </Text>
            </View>

            <Animated.View style={{ opacity: onboardingStepOpacity, transform: [{ translateX: onboardingStepTranslate }] }}>
              {onboardingStep === 0 && (
                <View style={[styles.onboardingMainCard, { backgroundColor: surveyTheme.cardBackground, borderColor: surveyTheme.border }]}>
                <Text style={[styles.onboardingMainTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>
                  What are your primary goals?
                </Text>
                <Text style={[styles.onboardingMainSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                  Choose your primary goal to calibrate your energy target.
                </Text>
                <View style={{ gap: 10 }}>
                  {onboardingGoalOptions.map((goal) => {
                    const selected = surveyGoals.includes(goal);
                    const detail = GOAL_DETAILS[goal] ?? { subtitle: "Build a sustainable nutrition routine.", icon: "sparkles-outline" as const };
                    return (
                      <TouchableOpacity
                        key={goal}
                        style={[
                          styles.onboardingChoiceRow,
                          {
                            borderColor: selected ? `${theme.primary}AA` : surveyTheme.border,
                            backgroundColor: selected ? `${theme.primary}22` : surveyTheme.inputBackground
                          }
                        ]}
                        onPress={() => selectGoal(goal)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.onboardingChoiceIcon, { backgroundColor: "rgba(148, 163, 184, 0.14)" }]}>
                          <Ionicons name={detail.icon} size={20} color={selected ? theme.primary : surveyTheme.mutedText} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.onboardingChoiceTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>{goal}</Text>
                          <Text style={[styles.onboardingChoiceSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                            {detail.subtitle}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.onboardingCircleCheck,
                            { borderColor: selected ? theme.primary : surveyTheme.border, backgroundColor: selected ? theme.primary : "transparent" }
                          ]}
                        >
                          {selected ? <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: theme.onPrimary }} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                </View>
              )}

              {onboardingStep === 1 && (
                <View style={[styles.onboardingMainCard, { backgroundColor: surveyTheme.cardBackground, borderColor: surveyTheme.border }]}>
                <Text style={[styles.onboardingMainTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>
                  Which habits matter most?
                </Text>
                <Text style={[styles.onboardingMainSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                  Choose habits you want this plan to prioritize.
                </Text>
                <Text style={[styles.fieldLabel, { color: surveyTheme.mutedText }]}>Recommended</Text>
                <View style={styles.row}>
                  {recommendedHabitOptions.map((habit) => {
                    const selected = surveyHabits.includes(habit);
                    return (
                      <TouchableOpacity
                        key={habit}
                        style={[
                          styles.tag,
                          {
                            borderColor: selected ? `${theme.primary}CC` : surveyTheme.border,
                            backgroundColor: selected ? `${theme.primary}22` : surveyTheme.inputBackground
                          }
                        ]}
                        onPress={() => toggleHabitSelection(habit)}
                      >
                        <Text style={[styles.tagText, { color: selected ? theme.primary : surveyTheme.text, fontWeight: selected ? "700" : "500" }]}>{habit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.fieldLabel, { color: surveyTheme.mutedText }]}>More options</Text>
                <View style={styles.row}>
                  {habitOptions.map((habit) => {
                    const selected = surveyHabits.includes(habit);
                    return (
                      <TouchableOpacity
                        key={habit}
                        style={[
                          styles.tag,
                          {
                            borderColor: selected ? `${theme.primary}CC` : surveyTheme.border,
                            backgroundColor: selected ? `${theme.primary}22` : surveyTheme.inputBackground
                          }
                        ]}
                        onPress={() => toggleHabitSelection(habit)}
                      >
                        <Text style={[styles.tagText, { color: selected ? theme.primary : surveyTheme.text, fontWeight: selected ? "700" : "500" }]}>{habit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                </View>
              )}

              {onboardingStep === 2 && (
                <View style={[styles.onboardingMainCard, { backgroundColor: surveyTheme.cardBackground, borderColor: surveyTheme.border }]}>
                <Text style={[styles.onboardingMainTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>
                  How often do you plan meals?
                </Text>
                <Text style={[styles.onboardingMainSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                  Planning frequency changes your activity and intake estimate.
                </Text>
                {mealPlanFrequencyOptions.map((option) => {
                  const selected = option === mealPlanFrequency;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.onboardingChoiceRow,
                        {
                          borderColor: selected ? `${theme.primary}AA` : surveyTheme.border,
                          backgroundColor: selected ? `${theme.primary}22` : surveyTheme.inputBackground
                        }
                      ]}
                      onPress={() => setMealPlanFrequency(option)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.onboardingChoiceTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>{option}</Text>
                        <Text style={[styles.onboardingChoiceSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                          {FREQUENCY_DETAILS[option]}
                        </Text>
                      </View>
                      <View style={[styles.onboardingCircleCheck, { borderColor: selected ? `${theme.primary}CC` : surveyTheme.border }]}>
                        {selected ? <View style={[styles.onboardingMealDot, { backgroundColor: theme.primary }]} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                </View>
              )}

              {onboardingStep === 3 && (
                <View style={[styles.onboardingMainCard, { backgroundColor: surveyTheme.cardBackground, borderColor: surveyTheme.border }]}>
                <Text style={[styles.onboardingMainTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>
                  Body details for your target
                </Text>
                <Text style={[styles.onboardingMainSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                  We use these values plus your survey answers to estimate calories.
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: surveyTheme.inputBackground, borderColor: surveyTheme.border, color: surveyTheme.text }]}
                  placeholderTextColor={surveyTheme.mutedText}
                  placeholder="Age"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: surveyTheme.inputBackground, borderColor: surveyTheme.border, color: surveyTheme.text }]}
                  placeholderTextColor={surveyTheme.mutedText}
                  placeholder="Height cm"
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: surveyTheme.inputBackground, borderColor: surveyTheme.border, color: surveyTheme.text }]}
                  placeholderTextColor={surveyTheme.mutedText}
                  placeholder="Weight kg"
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
                <Text style={[styles.fieldLabel, { color: surveyTheme.mutedText }]}>Sex (for BMR estimate)</Text>
                <View style={styles.row}>
                  {(["man", "woman"] as const).map((value) => {
                    const selected = biologicalSex === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.tag,
                          {
                            borderColor: selected ? `${theme.primary}CC` : surveyTheme.border,
                            backgroundColor: selected ? `${theme.primary}22` : surveyTheme.inputBackground
                          }
                        ]}
                        onPress={() => setBiologicalSex(value)}
                      >
                        <Text style={[styles.tagText, { color: selected ? theme.primary : surveyTheme.text, fontWeight: selected ? "700" : "500" }]}>
                          {value === "man" ? "Man" : "Woman"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.row}>
                  <View style={[styles.metricPill, { borderColor: surveyTheme.border, backgroundColor: surveyTheme.inputBackground }]}>
                    <Text style={[styles.helperText, { color: surveyTheme.mutedText }]}>BMI</Text>
                    <Text style={[styles.statValue, { color: surveyTheme.text }]}>{bmiValue ?? "--"}</Text>
                  </View>
                  <View style={[styles.metricPill, { borderColor: surveyTheme.border, backgroundColor: surveyTheme.inputBackground }]}>
                    <Text style={[styles.helperText, { color: surveyTheme.mutedText }]}>BMR</Text>
                    <Text style={[styles.statValue, { color: surveyTheme.text }]}>{bmrValue ?? "--"}</Text>
                  </View>
                </View>
                <View style={[styles.metricPill, { borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}18` }]}>
                  <Text style={[styles.helperText, { color: surveyTheme.mutedText }]}>Estimated target from survey</Text>
                  <Text style={[styles.statValue, { color: surveyTheme.text }]}>{Math.round(onboardingSuggestedTarget)} kcal</Text>
                </View>
                </View>
              )}

              {onboardingStep === 4 && (
                <View style={[styles.onboardingMainCard, { backgroundColor: surveyTheme.cardBackground, borderColor: surveyTheme.border }]}>
                <Text style={[styles.onboardingMainTitle, { color: surveyTheme.text }, font?.display && { fontFamily: font.display }]}>
                  Finalize your profile
                </Text>
                <Text style={[styles.onboardingMainSub, { color: surveyTheme.mutedText }, font?.body && { fontFamily: font.body }]}>
                  Choose a nickname and confirm your daily target.
                </Text>
                <View style={[styles.metricPill, { borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}18`, marginBottom: 12 }]}>
                  <Text style={[styles.helperText, { color: surveyTheme.mutedText }]}>Your goal</Text>
                  <Text style={[styles.statValue, { color: surveyTheme.text }]}>{surveyGoals[0] ?? "Not selected"}</Text>
                  <Text style={[styles.helperText, { color: surveyTheme.mutedText, marginTop: 8 }]}>Calculated daily target</Text>
                  <Text style={[styles.statValue, { color: theme.primary, fontSize: 28 }]}>{Math.round(onboardingSuggestedTarget)} kcal</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: surveyTheme.inputBackground, borderColor: surveyTheme.border, color: surveyTheme.text }]}
                  placeholderTextColor={surveyTheme.mutedText}
                  placeholder="Nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={24}
                  autoCapitalize="words"
                />
                <Text style={[styles.fieldLabel, { color: surveyTheme.mutedText }]}>App accent color</Text>
                <View style={styles.row}>
                  {accentOrder.map((id) => {
                    const preset = accentPresets[id];
                    const isSelected = id === accentId;
                    const preview = themeMode === "dark" ? preset.dark : preset.light;
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.colorOption,
                          { borderColor: isSelected ? theme.primary : surveyTheme.border, backgroundColor: surveyTheme.inputBackground }
                        ]}
                        onPress={() => setAccentId(id)}
                      >
                        <View style={[styles.colorSwatch, { backgroundColor: preview }]} />
                        <Text style={[styles.helperText, { color: surveyTheme.text, fontWeight: isSelected ? "700" : "500" }]}>{preset.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                </View>
              )}
            </Animated.View>

            <View style={styles.onboardingFooter}>
              <TouchableOpacity
                style={[styles.onboardingBackBtn, { borderColor: surveyTheme.border, backgroundColor: surveyTheme.inputBackground }]}
                onPress={() => setOnboardingStep((prev) => Math.max(0, prev - 1) as OnboardingStep)}
              >
                <Text style={[styles.secondaryBtnText, { color: surveyTheme.text }]}>Back</Text>
              </TouchableOpacity>
              <PrimaryButton
                title={onboardingStep === 4 ? "Finish onboarding" : "Next"}
                color={theme.primary}
                textColor={theme.onPrimary}
                onPress={() => {
                  if (onboardingStep === 4) {
                    void finishOnboarding();
                    return;
                  }
                  setOnboardingStep((prev) => Math.min(4, prev + 1) as OnboardingStep);
                }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const shellBg = theme.background;

  const onStitchNav = (id: StitchNavId) => {
    switch (id) {
      case "home":
        setScreen("dashboard");
        return;
      case "plan":
        setScreen("foodPlan");
        return;
      case "log":
        setScreen("manual");
        return;
      case "camera":
        Alert.alert("Camera Feature Coming Soon", "Camera Feature Coming Soon");
        return;
      case "settings":
        setScreen("settings");
        return;
      default:
    }
  };

  const showMainTopBar = screen !== "foodDetail";
  const notificationsHint =
    isExpoGo
      ? "Use development build for push"
      : notificationsEnabled == null
      ? "Tap to check push permission"
      : notificationsEnabled
      ? "Enabled on this device"
      : "Disabled. Tap to enable";
  const privacyHint = privacyLockOn ? "Biometric app lock is enabled" : "Biometric app lock is disabled";

  return (
    <AppThemeProvider value={theme}>
    <View style={[styles.appShell, { backgroundColor: shellBg }]}>
      {showMainTopBar ? (
        <StitchTopBar
          title={headerBrandTitle}
          onFavourites={() => setScreen("favourites")}
          favouritesActive={screen === "favourites"}
          useCustomFonts={Boolean(font)}
          themeMode={themeMode}
          primaryColor={theme.primary}
          textColor={theme.primary}
        />
      ) : null}
      <ScrollView
        style={{ backgroundColor: shellBg }}
        contentContainerStyle={[styles.container, { paddingTop: scrollPadTop, paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        overScrollMode="never"
        decelerationRate="normal"
        scrollEventThrottle={16}
        disableIntervalMomentum
        bounces={Platform.OS === "ios"}
      >
      {screen === "dashboard" && (
        <StitchDashboard
          remainingCalories={summary.remainingCalories}
          targetCalories={summary.targetCalories}
          consumedCalories={summary.consumedCalories}
          mealsLogged={mealsLogged}
          progress01={caloriesProgress}
          proteinG={summary.protein_g}
          carbsG={summary.carbs_g}
          fatG={summary.fat_g}
          avgMealCalories={avgMealCalories || 0}
          recentMeals={recentMeals.map((meal) => ({
            id: meal.id,
            mealType: meal.mealType,
            source: meal.source,
            itemCount: meal.items.length,
            calories: meal.items.reduce((sum, i) => sum + i.calories, 0)
          }))}
          dateLabel={stitchDateLabel}
          useCustomFonts={Boolean(font)}
          onQuickLog={() => setScreen("manual")}
          onLogBreakfast={() => {
            setMealType("breakfast");
            setScreen("manual");
          }}
          onDeleteMeal={async (mealId) => {
            try {
              if (!AUTH_DISABLED) {
                await deleteMealById(mealId);
              }
              setMeals((prev) => prev.filter((m) => m.id !== mealId));
            } catch {
              Alert.alert("Could not delete meal.");
            }
          }}
        />
      )}

      {screen === "manual" && (
        <View style={{ gap: 16 }}>
          <View style={{ marginBottom: 4 }}>
            <Text
              style={[
                { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, color: theme.text },
                font?.display && { fontFamily: font.display }
              ]}
            >
              Log Nutrition
            </Text>
            <Text style={[{ fontSize: 15, color: theme.mutedText, marginTop: 6, fontWeight: "500" }, font?.body && { fontFamily: font.body }]}>
              Record your journey, one meal at a time.
            </Text>
          </View>
          <StitchManualMealForm
            mealTypes={mealTypes}
            mealType={mealType}
            setMealType={setMealType}
            mealItems={mealItems}
            updateItem={updateItem}
            displayNumber={displayNumber}
            onAddItem={() => setMealItems((prev) => [...prev, makeItem()])}
            onSave={() => void saveCurrentMeal("manual")}
            useCustomFonts={Boolean(font)}
          />
        </View>
      )}

      {screen === "foodPlan" && (
        <StitchFoodPlanScreen
          foodSearch={foodSearch}
          onSearchChange={setFoodSearch}
          foodSource={foodSource}
          foodLoading={foodLoading}
          regionOrder={cuisineRegionOrder}
          regionLabels={cuisineRegionLabels}
          selectedRegion={selectedCuisineRegion}
          onSelectRegion={(id) => setSelectedCuisineRegion(id as CuisineRegionId)}
          foods={planFoodsForScreen}
          useCustomFonts={Boolean(font)}
          getPlanTagline={getFoodPlanTagline}
          renderFoodThumb={(food) => (
            <FallbackImage
              uris={getFoodPhotoCandidates(food)}
              style={{ width: "100%", height: "100%" }}
              urlMaxWidth={560}
              priority="low"
            />
          )}
          onOpenDetail={(food) => openFoodDetail(food, "foodPlan")}
          onAdd={(food) => addFoodToMeal(food, getPortionValue(food.name))}
          onAdjustPortion={adjustPortionValue}
          portionValue={(name) => foodPortions[name] ?? "1"}
          onPortionChange={setPortionValue}
        />
      )}

      {screen === "foodDetail" && detailContent && (
        <StitchFoodDetailScreen
          title={detailContent.title}
          subtitle={detailContent.subtitle}
          description={detailContent.description}
          sourceLabel={detailContent.sourceLabel}
          keyIngredients={detailContent.keyIngredients}
          wellnessTip={detailContent.wellnessTip}
          caloriesPer100={detailContent.caloriesPer100}
          proteinGPer100={detailContent.proteinGPer100}
          carbsGPer100={detailContent.carbsGPer100}
          fatGPer100={detailContent.fatGPer100}
          isFavorite={Boolean(detailFood && favouriteFoodNames.includes(detailFood.name))}
          onToggleFavorite={() => {
            if (detailFood) toggleFavouriteFood(detailFood.name);
          }}
          imageSlot={
            <FallbackImage uris={detailContent.photoCandidates} style={{ width: "100%", height: 280 }} urlMaxWidth={1080} />
          }
          onBack={() => {
            setDetailFood(null);
            setScreen(detailBackScreen);
          }}
          onLogToDay={
            detailFood
              ? (servings) => {
                  addFoodToMeal(detailFood, servings);
                  setDetailFood(null);
                }
              : undefined
          }
          useCustomFonts={Boolean(font)}
        />
      )}

      {screen === "favourites" && (
        <StitchFavouritesScreen
          favourites={favouriteFoods}
          useCustomFonts={Boolean(font)}
          onOpenDetail={(food) => openFoodDetail(food, "favourites")}
          onAdd={(food) => addFoodToMeal(food, getPortionValue(food.name))}
          onRemove={(foodName) => setFavouriteFoodNames((prev) => prev.filter((n) => n !== foodName))}
        />
      )}

      {screen === "camera" && <StitchCameraScreen photoUri={photoUri} onEstimate={requestEstimate} useCustomFonts={Boolean(font)} />}

      {screen === "settings" && (
        <StitchSettingsScreen
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          accentId={accentId}
          setAccentId={setAccentId}
          accentOrder={accentOrder}
          accentPresets={accentPresets}
          uiPaletteId={uiPaletteId}
          setUiPaletteId={setUiPaletteId}
          uiPaletteOrder={uiPaletteOrder}
          uiPalettes={uiPalettes}
          biologicalSex={biologicalSex}
          setBiologicalSex={setBiologicalSex}
          bmiValue={bmiValue}
          bmrValue={bmrValue}
          bmiLabel={bmiLabel}
          nickname={nickname}
          setNickname={setNickname}
          onSaveNickname={() => void handleSaveNickname()}
          onOpenNotifications={() => void handleNotificationsTilePress()}
          onOpenPrivacy={() => void handlePrivacyTilePress()}
          onOpenSupport={() => void handleSupportTilePress()}
          onShareApp={() => void handleShareAppPress()}
          onRateApp={() => void handleRateAppPress()}
          onOpenAbout={() => void handleAboutPress()}
          notificationsHint={notificationsHint}
          privacyHint={privacyHint}
          supportHint="Open Gmail to contact support"
          shareHint="Share Inertia with friends"
          rateHint="Rate Inertia in Google Play"
          aboutHint="View app version and product info"
          onRecalculateCalories={() => {
            const suggested = calculateQuestionnaireTarget();
            setTargetCalories(suggested);
          }}
          onSignOut={() => void handleSignOut()}
          showSignOut={!AUTH_DISABLED}
          useCustomFonts={Boolean(font)}
        />
      )}

      {screen === "review" && (
        <StitchReviewEstimateScreen
          confidence={estimate?.confidence ?? 0}
          useCustomFonts={Boolean(font)}
          mealForm={
            <StitchManualMealForm
              mealTypes={mealTypes}
              mealType={mealType}
              setMealType={setMealType}
              mealItems={mealItems}
              updateItem={updateItem}
              displayNumber={displayNumber}
              onAddItem={() => setMealItems((prev) => [...prev, makeItem()])}
              onSave={() => void saveCurrentMeal("camera", estimate?.requestId)}
              useCustomFonts={Boolean(font)}
            />
          }
        />
      )}
      </ScrollView>

      <StitchBottomNav active={stitchNavActive} onSelect={onStitchNav} useCustomFonts={Boolean(font)} />
    </View>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  lockWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  lockCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    alignItems: "center"
  },
  lockTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  lockBody: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4
  },
  container: {
    padding: 18,
    gap: 14
  },
  onboardingScreen: {
    flex: 1,
    overflow: "hidden"
  },
  onboardingGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999
  },
  onboardingGlowTop: {
    top: -120,
    right: -90
  },
  onboardingGlowBottom: {
    bottom: -140,
    left: -120
  },
  onboardingShell: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 16,
    gap: 14
  },
  onboardingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  onboardingBackCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  onboardingHeaderProgressWrap: {
    flex: 1
  },
  onboardingStepTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden"
  },
  onboardingStepFill: {
    height: "100%",
    borderRadius: 999
  },
  onboardingStepText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700"
  },
  onboardingMainCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12
  },
  onboardingMainTitle: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 46
  },
  onboardingMainSub: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 4
  },
  onboardingChoiceRow: {
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  onboardingChoiceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  onboardingChoiceTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4
  },
  onboardingChoiceSub: {
    fontSize: 13,
    lineHeight: 18
  },
  onboardingCircleCheck: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  onboardingMealOption: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  onboardingMealRadio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  onboardingMealDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  onboardingFooter: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  onboardingBackBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  signOutBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  signOutBtnText: {
    fontWeight: "700",
    fontSize: 15
  },
  authContainer: {
    padding: 20,
    gap: 14,
    justifyContent: "center",
    flexGrow: 1
  },
  authCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  authSubtext: {
    color: "#555"
  },
  dashboardStack: {
    gap: 12
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700"
  },
  heroSubtitle: {
    fontSize: 13
  },
  heroGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  heroMetricBlock: {
    gap: 2
  },
  heroRightMetrics: {
    gap: 4,
    alignItems: "flex-end"
  },
  metricBig: {
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 44
  },
  metricLabel: {
    fontSize: 12
  },
  metricRow: {
    fontSize: 13,
    fontWeight: "600"
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  onboardingGoalsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12
  },
  onboardingGoalsH1: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3
  },
  onboardingGoalsSub: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500"
  },
  onboardingGoalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  onboardingGoalText: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    paddingRight: 12
  },
  onboardingGoalCheck: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  statsRow: {
    flexDirection: "row",
    gap: 8
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4
  },
  statTitle: {
    fontSize: 12
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700"
  },
  metricPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2
  },
  recentMealRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 8
  },
  recentMealTextWrap: {
    gap: 2
  },
  recentMealRight: {
    alignItems: "flex-end",
    gap: 4
  },
  recentMealTitle: {
    fontWeight: "600"
  },
  recentMealSub: {
    fontSize: 12
  },
  recentMealKcal: {
    fontWeight: "700"
  },
  foodRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  surveyOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  selectionBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  colorOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
    minWidth: 88
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 999
  },
  foodRowLeft: {
    flex: 1,
    gap: 2
  },
  foodThumb: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 6
  },
  portionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4
  },
  portionBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  portionBtnText: {
    fontWeight: "700",
    fontSize: 15
  },
  portionInput: {
    minWidth: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: "center"
  },
  addFoodBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "center"
  },
  addFoodBtnText: {
    color: "#fff",
    fontWeight: "700"
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 14,
    gap: 10
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10
  },
  tag: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  tagText: {
    color: "#333"
  },
  tagSelected: {
    color: "#2563eb",
    fontWeight: "700"
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 10
  },
  detailImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginVertical: 8
  },
  photoEmpty: {
    backgroundColor: "rgba(148, 163, 184, 0.12)"
  },
  warning: {
    color: "#b45309",
    fontWeight: "600"
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#efefef",
    borderRadius: 8,
    padding: 8,
    gap: 6
  },
  spacer: {
    height: 8
  },
  primaryBtn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start"
  },
  primaryBtnFull: {
    alignSelf: "stretch",
    alignItems: "center"
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center"
  },
  authSwitcher: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden"
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5"
  },
  switchBtnActive: {
    backgroundColor: "#2563eb"
  },
  switchText: {
    color: "#374151"
  },
  switchTextActive: {
    color: "#fff",
    fontWeight: "700"
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: "#d1d5db"
  },
  dividerText: {
    color: "#6b7280",
    fontSize: 12
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "600"
  },
  helperText: {
    color: "#6b7280",
    fontSize: 12
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12
  },
  infoText: {
    color: "#065f46",
    fontSize: 12
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  secondaryBtnText: {
    fontWeight: "600",
    fontSize: 12
  }
});
