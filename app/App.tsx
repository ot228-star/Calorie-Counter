import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import type { Provider, Session } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import {
  deleteMealById,
  estimateMealFromImage,
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
import { getFoodDetail, getFoodSearchBlob } from "./src/data/foodDetails";
import { searchFoods } from "./src/services/foodFinder";
import { suggestedCalorieTarget, summaryFromMeals } from "./src/lib/calculations";
import { EstimateResult, Meal, MealItem, MealType } from "./src/types";

WebBrowser.maybeCompleteAuthSession();

type Screen = "onboarding" | "dashboard" | "manual" | "foodFinder" | "foodSuggestions" | "foodDetail" | "camera" | "review" | "settings";
type ThemeMode = "light" | "dark";
type OnboardingStep = 0 | 1 | 2 | 3;
type AccentPresetId = "blue" | "emerald" | "violet" | "rose" | "orange";
type CuisineRegionId = "global" | "northAmerican" | "mediterranean" | "southAsian" | "eastAsian" | "latinAmerican" | "middleEastern";
type BiologicalSex = "man" | "woman";
type DetailBackScreen = "foodFinder" | "foodSuggestions";
type DetailContent = {
  title: string;
  subtitle: string;
  description: string;
  photoUrl: string;
  sourceLabel: string;
};
const AUTH_DISABLED = true;

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
const accentPresets: Record<AccentPresetId, { label: string; light: string; dark: string }> = {
  blue: { label: "Blue", light: "#2563eb", dark: "#3b82f6" },
  emerald: { label: "Emerald", light: "#059669", dark: "#10b981" },
  violet: { label: "Violet", light: "#7c3aed", dark: "#8b5cf6" },
  rose: { label: "Rose", light: "#e11d48", dark: "#f43f5e" },
  orange: { label: "Orange", light: "#ea580c", dark: "#fb923c" }
};
const accentOrder: AccentPresetId[] = ["blue", "emerald", "violet", "rose", "orange"];
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
const cuisineDetails: Record<CuisineRegionId, { title: string; description: string; photoUrl: string; sourceLabel: string }> = {
  global: {
    title: "Global Mix",
    description:
      "A balanced set of globally popular meals and staples. This includes lean proteins, rice bowls, soups, and wraps to keep variety high while making calorie tracking easier.",
    photoUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  },
  northAmerican: {
    title: "North American",
    description:
      "Common comfort and fast-casual foods such as burgers, sandwiches, pancakes, and mac and cheese. Useful for users frequently eating in North American-style restaurants.",
    photoUrl: "https://images.unsplash.com/photo-1561758033-7e924f619b47?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  },
  mediterranean: {
    title: "Mediterranean",
    description:
      "Cuisine focused on olive oil, vegetables, legumes, fish, grilled meats, and salads. Often nutrient-dense with heart-healthy fats and fiber-rich ingredients.",
    photoUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  },
  southAsian: {
    title: "South Asian",
    description:
      "Flavorful dishes like biryani, curries, lentils, and spice-forward chicken preparations. Great for suggesting familiar options while keeping macro visibility clear.",
    photoUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  },
  eastAsian: {
    title: "East Asian",
    description:
      "Includes sushi, ramen, stir-fries, rice bowls, and noodle-based meals. This section prioritizes popular dishes with diverse protein and carb profiles.",
    photoUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  },
  latinAmerican: {
    title: "Latin American",
    description:
      "Features tacos, burritos, quesadillas, beans, and rice combinations. Helpful for users who frequently log meals from Latin American food spots.",
    photoUrl: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  },
  middleEastern: {
    title: "Middle Eastern",
    description:
      "Highlights shawarma, kebab, hummus, pita, and salad-heavy combinations. This cuisine often provides protein-rich meals with strong herb and spice profiles.",
    photoUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=1200&q=80",
    sourceLabel: "Photo: Unsplash (real photography)"
  }
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
  fullWidth
}: {
  title: string;
  onPress: () => void;
  color?: string;
  fullWidth?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.primaryBtn, { backgroundColor: color ?? "#2563eb" }, fullWidth ? styles.primaryBtnFull : null]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.primaryBtnText}>{title}</Text>
  </TouchableOpacity>
);

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

const parseOAuthTokens = (callbackUrl: string) => {
  const [beforeHash, hashPart] = callbackUrl.split("#");
  const queryPart = beforeHash.includes("?") ? beforeHash.split("?")[1] : "";
  const hashParams = new URLSearchParams(hashPart ?? "");
  const queryParams = new URLSearchParams(queryPart);

  const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");
  return { accessToken, refreshToken };
};

const parseOAuthCode = (callbackUrl: string) => {
  const queryPart = callbackUrl.includes("?") ? callbackUrl.split("?")[1].split("#")[0] : "";
  const queryParams = new URLSearchParams(queryPart);
  return queryParams.get("code");
};

const makeOAuthRedirectUri = () =>
  AuthSession.makeRedirectUri({
    path: "auth"
  });

// #region agent log
const debugAuthLog = (
  runId: string,
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) => {
  const payload = {
    sessionId: "cb1042",
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };
  fetch("http://127.0.0.1:7674/ingest/91667c52-214f-4910-9e0b-879c9d1cae4d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "cb1042" },
    body: JSON.stringify(payload)
  }).catch(() => {});
  console.log("[AUTH_DEBUG_CB1042]", JSON.stringify(payload));
};
// #endregion

const palettes = {
  light: {
    background: "#f8fafc",
    cardBackground: "#ffffff",
    text: "#111827",
    mutedText: "#6b7280",
    border: "#d1d5db",
    inputBackground: "#ffffff",
    primary: "#2563eb",
    danger: "#dc2626",
    success: "#065f46"
  },
  dark: {
    background: "#0f172a",
    cardBackground: "#111827",
    text: "#f9fafb",
    mutedText: "#9ca3af",
    border: "#334155",
    inputBackground: "#1f2937",
    primary: "#3b82f6",
    danger: "#f87171",
    success: "#34d399"
  }
} as const;

export default function App() {
  const systemTheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(systemTheme === "dark" ? "dark" : "light");
  const [accentId, setAccentId] = useState<AccentPresetId>("blue");
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>("onboarding");
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
  const [surveyGoals, setSurveyGoals] = useState<string[]>([]);
  const [surveyHabits, setSurveyHabits] = useState<string[]>([]);
  const [mealPlanFrequency, setMealPlanFrequency] = useState("Occasionally");
  const [selectedCuisineRegion, setSelectedCuisineRegion] = useState<CuisineRegionId>(inferCuisineRegion);
  const [detailBackScreen, setDetailBackScreen] = useState<DetailBackScreen>("foodFinder");
  const [detailContent, setDetailContent] = useState<DetailContent | null>(null);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodResults, setFoodResults] = useState<FoodRecord[]>([]);
  const [foodSource, setFoodSource] = useState<"cloud" | "local">("local");
  const [foodLoading, setFoodLoading] = useState(false);

  const accent = accentPresets[accentId];
  const theme = useMemo(
    () => ({
      ...palettes[themeMode],
      primary: themeMode === "dark" ? accent.dark : accent.light
    }),
    [themeMode, accent.dark, accent.light]
  );
  const summary = useMemo(() => summaryFromMeals(meals, targetCalories), [meals, targetCalories]);
  const caloriesProgress = summary.targetCalories > 0 ? Math.min(summary.consumedCalories / summary.targetCalories, 1) : 0;
  const caloriesProgressWidth: `${number}%` = `${Math.round(caloriesProgress * 100)}%`;
  const recentMeals = meals.slice(0, 3);
  const mealsLogged = meals.length;
  const avgMealCalories = mealsLogged ? Math.round(summary.consumedCalories / mealsLogged) : 0;
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const toggleTheme = () => setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  const bmiValue = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const meters = h / 100;
    return Number((w / (meters * meters)).toFixed(1));
  }, [heightCm, weightKg]);
  const bmiLabel = useMemo(() => {
    if (!bmiValue) return "Unavailable";
    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Healthy";
    if (bmiValue < 30) return "Overweight";
    return "Obese";
  }, [bmiValue]);
  const suggestedRegionalFoods = useMemo(() => {
    const keywords = cuisineRegionPresets[selectedCuisineRegion].keywords;
    const matched = FOOD_DATABASE.filter((food) => keywords.some((keyword) => food.name.toLowerCase().includes(keyword.toLowerCase())));
    const unique = Array.from(new Map(matched.map((food) => [food.name, food])).values());
    if (unique.length > 0) return unique.slice(0, 20);
    return FOOD_DATABASE.filter((food) => food.category === "Prepared").slice(0, 20);
  }, [selectedCuisineRegion]);
  const searchableFoodResults = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    const merged = Array.from(new Map([...foodResults, ...FOOD_DATABASE].map((food) => [food.name, food])).values());
    if (!q) return merged.slice(0, 120);

    const numericQuery = Number(q);
    const hasNumericQuery = !Number.isNaN(numericQuery);
    const scored = merged
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
      .slice(0, 120)
      .map((item) => item.food);
    return scored;
  }, [foodResults, foodSearch]);

  useEffect(() => {
    getSession()
      .then((existingSession) => {
        // #region agent log
        debugAuthLog("run-1", "H1-H5", "App.tsx:getSession.then", "initial_session_read", {
          hasSession: Boolean(existingSession),
          hasUser: Boolean(existingSession?.user?.id)
        });
        // #endregion
        setSession(existingSession);
      })
      .catch(() => {
        // #region agent log
        debugAuthLog("run-1", "H4-H5", "App.tsx:getSession.catch", "initial_session_error", {
          hasSession: false
        });
        // #endregion
        setSession(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const {
      data: { subscription }
    } = authClient.auth.onAuthStateChange((event, nextSession) => {
      // #region agent log
      debugAuthLog("run-1", "H2-H5", "App.tsx:onAuthStateChange", "auth_state_event", {
        event,
        hasNextSession: Boolean(nextSession),
        hasNextUser: Boolean(nextSession?.user?.id)
      });
      // #endregion
      if (nextSession) {
        setSession(nextSession);
        setOnboardingStep(0);
        setScreen("onboarding");
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
    if (!session) return;
    listMealsForToday()
      .then((savedMeals) => setMeals(savedMeals))
      .catch(() => {
        // Allow app to continue in local-only mode if backend is unavailable.
      });
  }, [session]);

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
      // #region agent log
      debugAuthLog("run-1", "H1", "App.tsx:handleEmailAuth.start", "email_auth_start", {
        mode: authMode,
        emailValid: emailLooksValid,
        passwordLen: password.length
      });
      // #endregion
      if (authMode === "signup") {
        const { data, error } = await signUpWithEmail(email.trim(), password);
        if (error) throw error;
        // #region agent log
        debugAuthLog("run-1", "H1-H2", "App.tsx:handleEmailAuth.signup", "signup_result", {
          hasSession: Boolean(data.session),
          hasUser: Boolean(data.user?.id)
        });
        // #endregion
        if (data.session) {
          setSession(data.session);
          setAuthInfo("Account created and signed in.");
          setScreen("onboarding");
        } else {
          // Common when email confirmation is enabled in Supabase.
          setAuthInfo("Account created. Check your email to confirm, then log in.");
          setAuthMode("login");
        }
      } else {
        const { data, error } = await signInWithEmail(email.trim(), password);
        if (error) throw error;
        // #region agent log
        debugAuthLog("run-1", "H1-H2", "App.tsx:handleEmailAuth.login", "login_result", {
          hasSession: Boolean(data.session),
          hasUser: Boolean(data.user?.id)
        });
        // #endregion
        if (data.session) {
          setSession(data.session);
          setScreen("onboarding");
        } else {
          setAuthError("Login did not return an active session. Please try again.");
        }
      }
    } catch (error) {
      // #region agent log
      debugAuthLog("run-1", "H1-H4", "App.tsx:handleEmailAuth.catch", "email_auth_error", {
        errorType: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      // #endregion
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
      // #region agent log
      debugAuthLog("run-1", "H3-H4", "App.tsx:handleOAuth.result", "oauth_browser_result", {
        provider,
        resultType: result.type,
        hasResultUrl: Boolean((result as { url?: string }).url),
        resultUrlHost: (result as { url?: string }).url?.split("/")[2] ?? ""
      });
      // #endregion
      if (result.type !== "success") return;
      if (result.url.includes("localhost:3000")) {
        throw new Error(
          "OAuth redirected to localhost. In Supabase Auth URL Configuration, add redirect URLs for both caloriecounter://* and exp://* then retry."
        );
      }

      const code = parseOAuthCode(result.url);
      if (code) {
        const { data: exchangeData, error: exchangeError } = await authClient.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        // #region agent log
        debugAuthLog("run-1", "H3-H4", "App.tsx:handleOAuth.exchange", "oauth_code_exchange", {
          usedCodeFlow: true,
          hasSession: Boolean(exchangeData.session),
          hasUser: Boolean(exchangeData.session?.user?.id)
        });
        // #endregion
        if (!exchangeData.session) {
          throw new Error("OAuth code exchange did not return a session.");
        }
      } else {
        const { accessToken, refreshToken } = parseOAuthTokens(result.url);
        if (!accessToken || !refreshToken) {
          throw new Error("OAuth callback missing access token and code.");
        }
        const { error: setSessionError } = await authClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (setSessionError) throw setSessionError;
        // #region agent log
        debugAuthLog("run-1", "H3-H4", "App.tsx:handleOAuth.token", "oauth_token_set_session", {
          usedCodeFlow: false,
          hadAccessToken: Boolean(accessToken),
          hadRefreshToken: Boolean(refreshToken)
        });
        // #endregion
      }
      const { data: sessionData } = await authClient.auth.getSession();
      // #region agent log
      debugAuthLog("run-1", "H2-H4-H5", "App.tsx:handleOAuth.getSession", "oauth_post_session_read", {
        hasSession: Boolean(sessionData.session),
        hasUser: Boolean(sessionData.session?.user?.id)
      });
      // #endregion
      if (sessionData.session) {
        setSession(sessionData.session);
        setScreen("onboarding");
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
    setScreen("onboarding");
  };

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const addFoodToMeal = (food: FoodRecord) => {
    const newItem: MealItem = {
      id: createId(),
      name: food.name,
      quantity: 100,
      unit: "g",
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g
    };
    setMealItems((prev) => [...prev, newItem]);
    setScreen("manual");
  };

  const openFoodDetail = (food: FoodRecord, backScreen: DetailBackScreen) => {
    const detail = getFoodDetail(food);
    setDetailBackScreen(backScreen);
    setDetailContent({
      title: food.name,
      subtitle: `${food.category} • ${food.calories} kcal per 100g`,
      description: detail.description,
      photoUrl: detail.photoUrl,
      sourceLabel: detail.sourceLabel
    });
    setScreen("foodDetail");
  };

  const openCuisineDetail = (regionId: CuisineRegionId) => {
    const info = cuisineDetails[regionId];
    setDetailBackScreen("foodSuggestions");
    setDetailContent({
      title: info.title,
      subtitle: "Regional cuisine overview",
      description: info.description,
      photoUrl: info.photoUrl,
      sourceLabel: info.sourceLabel
    });
    setScreen("foodDetail");
  };

  const renderMealForm = (source: Meal["source"], requestId?: string) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text style={[styles.subtitle, { color: theme.text }]}>Meal type</Text>
      <View style={styles.row}>
        {mealTypes.map((type) => (
          <TouchableOpacity key={type} style={[styles.tag, { borderColor: theme.border }]} onPress={() => setMealType(type)}>
            <Text style={mealType === type ? [styles.tagText, { color: theme.primary, fontWeight: "700" }] : [styles.tagText, { color: theme.text }]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mealItems.map((item) => (
        <View key={item.id} style={[styles.itemCard, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Food item name"
            placeholderTextColor={theme.mutedText}
            value={item.name}
            onChangeText={(text) => updateItem(item.id, "name", text)}
          />
          <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Calories</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Calories (kcal)"
            placeholderTextColor={theme.mutedText}
            keyboardType="numeric"
            value={displayNumber(item.calories)}
            onChangeText={(text) => updateItem(item.id, "calories", text)}
          />
          <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Protein</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Protein (g)"
            placeholderTextColor={theme.mutedText}
            keyboardType="numeric"
            value={displayNumber(item.protein_g)}
            onChangeText={(text) => updateItem(item.id, "protein_g", text)}
          />
          <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Carbs</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Carbs (g)"
            placeholderTextColor={theme.mutedText}
            keyboardType="numeric"
            value={displayNumber(item.carbs_g)}
            onChangeText={(text) => updateItem(item.id, "carbs_g", text)}
          />
          <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Fat</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Fat (g)"
            placeholderTextColor={theme.mutedText}
            keyboardType="numeric"
            value={displayNumber(item.fat_g)}
            onChangeText={(text) => updateItem(item.id, "fat_g", text)}
          />
        </View>
      ))}

      <PrimaryButton title="Add item" onPress={() => setMealItems((prev) => [...prev, makeItem()])} color={theme.primary} />
      <View style={styles.spacer} />
      <PrimaryButton title="Save meal" onPress={() => saveCurrentMeal(source, requestId)} color={theme.primary} />
    </View>
  );

  const toggleGoalSelection = (goal: string) => {
    setSurveyGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= 3) return prev;
      return [...prev, goal];
    });
  };

  const toggleHabitSelection = (habit: string) => {
    setSurveyHabits((prev) => (prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]));
  };

  const finishOnboarding = async () => {
    if (session?.user?.id) {
      await upsertProfile({
        id: session.user.id,
        age: Number(age),
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        goal_type: goalType,
        daily_calorie_target: targetCalories
      });
    }
    await trackEvent("onboarding_completed", {
      targetCalories,
      goalType,
      sex: biologicalSex,
      surveyGoals,
      surveyHabits,
      mealPlanFrequency,
      accent: accentId
    });
    setScreen("dashboard");
  };

  if (authLoading && !AUTH_DISABLED) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.subtitle, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  if (!session && !AUTH_DISABLED) {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.authContainer}>
        <Text style={[styles.title, { color: theme.text }]}>Calorie Counter</Text>
        <Text style={[styles.authSubtext, { color: theme.mutedText }]}>
          Track calories from meals faster with photos and quick corrections.
        </Text>

        <View style={[styles.authCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={[styles.authSwitcher, { borderColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.switchBtn,
                { backgroundColor: theme.inputBackground },
                authMode === "login" && { backgroundColor: theme.primary }
              ]}
              onPress={() => setAuthMode("login")}
            >
              <Text style={authMode === "login" ? styles.switchTextActive : [styles.switchText, { color: theme.text }]}>
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.switchBtn,
                { backgroundColor: theme.inputBackground },
                authMode === "signup" && { backgroundColor: theme.primary }
              ]}
              onPress={() => setAuthMode("signup")}
            >
              <Text style={authMode === "signup" ? styles.switchTextActive : [styles.switchText, { color: theme.text }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Email"
            placeholderTextColor={theme.mutedText}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Password"
            placeholderTextColor={theme.mutedText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {authMode === "signup" ? <Text style={[styles.helperText, { color: theme.mutedText }]}>Use 8+ characters for password.</Text> : null}
          {authError ? <Text style={[styles.errorText, { color: theme.danger }]}>{authError}</Text> : null}
          {authInfo ? <Text style={[styles.infoText, { color: theme.success }]}>{authInfo}</Text> : null}
          <PrimaryButton
            title={authBusy ? "Please wait..." : authMode === "signup" ? "Create account" : "Continue"}
            onPress={handleEmailAuth}
            color={theme.primary}
          />
          {authMode === "login" ? (
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={[styles.linkText, { color: theme.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.mutedText }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <PrimaryButton title="Continue with Google" onPress={() => handleOAuth("google")} color={theme.primary} />
          <PrimaryButton title="Continue with Facebook" onPress={() => handleOAuth("facebook")} color={theme.primary} />
        </View>
      </ScrollView>
    );
  }

  if (screen === "onboarding") {
    const onboardingProgressWidth: `${number}%` = `${((onboardingStep + 1) / 4) * 100}%`;
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
        <Text style={[styles.subtitle, { color: theme.text, textAlign: "center" }]}>Goals Setup</Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.primary, width: onboardingProgressWidth }]} />
        </View>

        {onboardingStep === 0 && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Let's start with your goals.</Text>
            <Text style={[styles.helperText, { color: theme.mutedText }]}>Select up to three that matter most to you.</Text>
            {onboardingGoalOptions.map((goal) => {
              const selected = surveyGoals.includes(goal);
              return (
                <TouchableOpacity
                  key={goal}
                  style={[styles.surveyOption, { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                  onPress={() => toggleGoalSelection(goal)}
                >
                  <Text style={[styles.recentMealTitle, { color: theme.text }]}>{goal}</Text>
                  <View style={[styles.selectionBox, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : "transparent" }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {onboardingStep === 1 && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Which healthy habits are most important?</Text>
            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Recommended for you</Text>
            <View style={styles.row}>
              {recommendedHabitOptions.map((habit) => {
                const selected = surveyHabits.includes(habit);
                return (
                  <TouchableOpacity
                    key={habit}
                    style={[styles.tag, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? `${theme.primary}22` : theme.inputBackground }]}
                    onPress={() => toggleHabitSelection(habit)}
                  >
                    <Text style={[styles.tagText, { color: selected ? theme.primary : theme.text, fontWeight: selected ? "700" : "500" }]}>{habit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>More healthy habits</Text>
            <View style={styles.row}>
              {habitOptions.map((habit) => {
                const selected = surveyHabits.includes(habit);
                return (
                  <TouchableOpacity
                    key={habit}
                    style={[styles.tag, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? `${theme.primary}22` : theme.inputBackground }]}
                    onPress={() => toggleHabitSelection(habit)}
                  >
                    <Text style={[styles.tagText, { color: selected ? theme.primary : theme.text, fontWeight: selected ? "700" : "500" }]}>{habit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {onboardingStep === 2 && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>How often do you plan your meals in advance?</Text>
            {mealPlanFrequencyOptions.map((option) => {
              const selected = option === mealPlanFrequency;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.surveyOption, { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                  onPress={() => setMealPlanFrequency(option)}
                >
                  <Text style={[styles.recentMealTitle, { color: theme.text }]}>{option}</Text>
                  <View style={[styles.radioCircle, { borderColor: selected ? theme.primary : theme.border }]}>
                    {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {onboardingStep === 3 && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>A few more details</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              placeholderTextColor={theme.mutedText}
              placeholder="Age"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              placeholderTextColor={theme.mutedText}
              placeholder="Height cm"
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              placeholderTextColor={theme.mutedText}
              placeholder="Weight kg"
              keyboardType="numeric"
              value={weightKg}
              onChangeText={setWeightKg}
            />
            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Sex (for calorie/BMI estimate)</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.tag,
                  { borderColor: biologicalSex === "man" ? theme.primary : theme.border, backgroundColor: theme.inputBackground }
                ]}
                onPress={() => setBiologicalSex("man")}
              >
                <Text style={[styles.tagText, { color: biologicalSex === "man" ? theme.primary : theme.text, fontWeight: biologicalSex === "man" ? "700" : "500" }]}>
                  Man
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tag,
                  { borderColor: biologicalSex === "woman" ? theme.primary : theme.border, backgroundColor: theme.inputBackground }
                ]}
                onPress={() => setBiologicalSex("woman")}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: biologicalSex === "woman" ? theme.primary : theme.text, fontWeight: biologicalSex === "woman" ? "700" : "500" }
                  ]}
                >
                  Woman
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              {(["lose", "maintain", "gain"] as const).map((goal) => (
                <TouchableOpacity key={goal} style={[styles.tag, { borderColor: theme.border }]} onPress={() => setGoalType(goal)}>
                  <Text style={goalType === goal ? [styles.tagText, { color: theme.primary, fontWeight: "700" }] : [styles.tagText, { color: theme.text }]}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              title="Suggest target"
              color={theme.primary}
              onPress={() => {
                const suggested = suggestedCalorieTarget({
                  age: Number(age),
                  heightCm: Number(heightCm),
                  weightKg: Number(weightKg),
                  goalType,
                  sex: biologicalSex ?? undefined
                });
                setTargetCalories(suggested);
              }}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              placeholderTextColor={theme.mutedText}
              placeholder="Daily calorie target"
              keyboardType="numeric"
              value={String(targetCalories)}
              onChangeText={(v) => setTargetCalories(Number(v || 0))}
            />
            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Choose your app color theme</Text>
            <View style={styles.row}>
              {accentOrder.map((id) => {
                const preset = accentPresets[id];
                const isSelected = id === accentId;
                const preview = themeMode === "dark" ? preset.dark : preset.light;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.colorOption, { borderColor: isSelected ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                    onPress={() => setAccentId(id)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: preview }]} />
                    <Text style={[styles.helperText, { color: theme.text, fontWeight: isSelected ? "700" : "500" }]}>{preset.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.rowBetween}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
            onPress={() => setOnboardingStep((prev) => Math.max(0, prev - 1) as OnboardingStep)}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>
          <PrimaryButton
            title={onboardingStep === 3 ? "Finish onboarding" : "Next"}
            color={theme.primary}
            onPress={() => {
              if (onboardingStep === 3) {
                void finishOnboarding();
                return;
              }
              setOnboardingStep((prev) => Math.min(3, prev + 1) as OnboardingStep);
            }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.appShell, { backgroundColor: theme.background }]}>
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.container, { paddingBottom: 96 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Calorie Counter</Text>
        <View style={styles.row}>
          <PrimaryButton title="Dashboard" onPress={() => setScreen("dashboard")} color={theme.primary} />
          <PrimaryButton title="Manual log" onPress={() => setScreen("manual")} color={theme.primary} />
          <PrimaryButton title="Food finder" onPress={() => setScreen("foodFinder")} color={theme.primary} />
          <PrimaryButton title="Food suggestions" onPress={() => setScreen("foodSuggestions")} color={theme.primary} />
          <PrimaryButton title="Camera" onPress={openPhotoPicker} color={theme.primary} />
          {!AUTH_DISABLED ? <PrimaryButton title="Sign out" onPress={handleSignOut} color={theme.primary} /> : null}
        </View>

      {screen === "dashboard" && (
        <View style={styles.dashboardStack}>
          <View style={[styles.heroCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.heroTitle, { color: theme.text }]}>Welcome back</Text>
                <Text style={[styles.heroSubtitle, { color: theme.mutedText }]}>Let's hit your goal today.</Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: `${theme.primary}22` }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>{Math.round(caloriesProgress * 100)}% done</Text>
              </View>
            </View>

            <View style={styles.heroGrid}>
              <View style={styles.heroMetricBlock}>
                <Text style={[styles.metricBig, { color: theme.text }]}>{summary.remainingCalories}</Text>
                <Text style={[styles.metricLabel, { color: theme.mutedText }]}>Remaining kcal</Text>
              </View>
              <View style={styles.heroRightMetrics}>
                <Text style={[styles.metricRow, { color: theme.text }]}>Goal: {summary.targetCalories}</Text>
                <Text style={[styles.metricRow, { color: theme.text }]}>Food: {summary.consumedCalories}</Text>
                <Text style={[styles.metricRow, { color: theme.text }]}>Meals: {mealsLogged}</Text>
              </View>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.primary, width: caloriesProgressWidth }]} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.statTitle, { color: theme.mutedText }]}>Protein</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{summary.protein_g} g</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.statTitle, { color: theme.mutedText }]}>Carbs</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{summary.carbs_g} g</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.statTitle, { color: theme.mutedText }]}>Fat</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{summary.fat_g} g</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.subtitle, { color: theme.text }]}>Recent meals</Text>
              <Text style={[styles.helperText, { color: theme.mutedText }]}>Avg {avgMealCalories || 0} kcal</Text>
            </View>
            {recentMeals.length === 0 ? <Text style={{ color: theme.mutedText }}>No meals saved yet.</Text> : null}
            {recentMeals.map((meal) => (
              <View key={meal.id} style={styles.recentMealRow}>
                <View style={styles.recentMealTextWrap}>
                  <Text style={[styles.recentMealTitle, { color: theme.text }]}>
                    {meal.mealType[0].toUpperCase() + meal.mealType.slice(1)} • {meal.source}
                  </Text>
                  <Text style={[styles.recentMealSub, { color: theme.mutedText }]}>
                    {meal.items.length} item(s)
                  </Text>
                </View>
                <View style={styles.recentMealRight}>
                  <Text style={[styles.recentMealKcal, { color: theme.text }]}>
                    {meal.items.reduce((sum, i) => sum + i.calories, 0)} kcal
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (!AUTH_DISABLED) {
                          await deleteMealById(meal.id);
                        }
                        setMeals((prev) => prev.filter((m) => m.id !== meal.id));
                      } catch {
                        Alert.alert("Could not delete meal.");
                      }
                    }}
                  >
                    <Text style={[styles.linkText, { color: theme.primary }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {screen === "manual" && renderMealForm("manual")}

      {screen === "foodFinder" && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>Food Finder</Text>
          <Text style={[styles.helperText, { color: theme.mutedText }]}>
            Search our built-in database and add foods with auto macros.
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Search meals, foods, macros, descriptions"
            placeholderTextColor={theme.mutedText}
            value={foodSearch}
            onChangeText={setFoodSearch}
          />
          <Text style={[styles.helperText, { color: theme.mutedText }]}>
            Source: {foodSource === "cloud" ? "Cloud database" : "Local fallback database"}
          </Text>
          <Text style={[styles.helperText, { color: theme.mutedText }]}>
            Search supports food name, cuisine keywords, description text, and macro numbers.
          </Text>
          <View style={styles.spacer} />
          {foodLoading ? <Text style={{ color: theme.mutedText }}>Searching...</Text> : null}
          {!foodLoading && searchableFoodResults.length === 0 ? <Text style={{ color: theme.mutedText }}>No foods found.</Text> : null}
          {searchableFoodResults.map((food) => (
            <View key={`${food.category}-${food.name}`} style={[styles.foodRow, { borderColor: theme.border }]}>
              <TouchableOpacity style={styles.foodRowLeft} onPress={() => openFoodDetail(food, "foodFinder")}>
                <Image source={{ uri: getFoodDetail(food).photoUrl }} style={styles.foodThumb} />
                <Text style={[styles.recentMealTitle, { color: theme.text }]}>{food.name}</Text>
                <Text style={[styles.recentMealSub, { color: theme.mutedText }]}>
                  {food.category} • {food.calories} kcal • P {food.protein_g}g • C {food.carbs_g}g • F {food.fat_g}g
                </Text>
                <Text numberOfLines={2} style={[styles.helperText, { color: theme.mutedText }]}>
                  {getFoodDetail(food).description}
                </Text>
                <Text style={[styles.linkText, { color: theme.primary, fontSize: 12 }]}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addFoodBtn, { backgroundColor: theme.primary }]} onPress={() => addFoodToMeal(food)}>
                <Text style={styles.addFoodBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {screen === "foodSuggestions" && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>Food Suggestions</Text>
          <Text style={[styles.helperText, { color: theme.mutedText }]}>
            Region-based cuisine ideas. Pick your region and quickly add foods to your meal log.
          </Text>
          <View style={styles.row}>
            {cuisineRegionOrder.map((regionId) => {
              const selected = selectedCuisineRegion === regionId;
              return (
                <TouchableOpacity
                  key={regionId}
                  style={[styles.tag, { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                  onPress={() => {
                    setSelectedCuisineRegion(regionId);
                    openCuisineDetail(regionId);
                  }}
                >
                  <Text style={[styles.tagText, { color: selected ? theme.primary : theme.text, fontWeight: selected ? "700" : "500" }]}>
                    {cuisineRegionPresets[regionId].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.spacer} />
          {suggestedRegionalFoods.map((food) => (
            <View key={`region-${food.category}-${food.name}`} style={[styles.foodRow, { borderColor: theme.border }]}>
              <TouchableOpacity style={styles.foodRowLeft} onPress={() => openFoodDetail(food, "foodSuggestions")}>
                <Text style={[styles.recentMealTitle, { color: theme.text }]}>{food.name}</Text>
                <Text style={[styles.recentMealSub, { color: theme.mutedText }]}>
                  {food.category} • {food.calories} kcal • P {food.protein_g}g • C {food.carbs_g}g • F {food.fat_g}g
                </Text>
                <Text style={[styles.linkText, { color: theme.primary, fontSize: 12 }]}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addFoodBtn, { backgroundColor: theme.primary }]} onPress={() => addFoodToMeal(food)}>
                <Text style={styles.addFoodBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {screen === "foodDetail" && detailContent && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>{detailContent.title}</Text>
          <Text style={[styles.helperText, { color: theme.mutedText }]}>{detailContent.subtitle}</Text>
          <Image source={{ uri: detailContent.photoUrl }} style={styles.detailImage} />
          <Text style={[styles.helperText, { color: theme.mutedText }]}>{detailContent.sourceLabel}</Text>
          <Text style={[styles.recentMealSub, { color: theme.text, lineHeight: 20 }]}>{detailContent.description}</Text>
          <PrimaryButton
            title="Back"
            color={theme.primary}
            onPress={() => {
              setScreen(detailBackScreen);
            }}
          />
        </View>
      )}

      {screen === "camera" && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>Camera Photo</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.image} /> : <Text style={{ color: theme.mutedText }}>No photo selected.</Text>}
          <PrimaryButton title="Estimate calories" onPress={requestEstimate} color={theme.primary} />
        </View>
      )}

        {screen === "settings" && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Settings</Text>

            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Theme mode</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.tag, { borderColor: themeMode === "light" ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                onPress={() => setThemeMode("light")}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: themeMode === "light" ? theme.primary : theme.text, fontWeight: themeMode === "light" ? "700" : "500" }
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tag, { borderColor: themeMode === "dark" ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                onPress={() => setThemeMode("dark")}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: themeMode === "dark" ? theme.primary : theme.text, fontWeight: themeMode === "dark" ? "700" : "500" }
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Accent color</Text>
            <Text style={[styles.helperText, { color: theme.mutedText }]}>Changes icon/button color theme in the app.</Text>
            <View style={styles.row}>
              {accentOrder.map((id) => {
                const preset = accentPresets[id];
                const selected = id === accentId;
                const preview = themeMode === "dark" ? preset.dark : preset.light;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.colorOption, { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.inputBackground }]}
                    onPress={() => setAccentId(id)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: preview }]} />
                    <Text style={[styles.helperText, { color: theme.text, fontWeight: selected ? "700" : "500" }]}>{preset.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.card, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Text style={[styles.subtitle, { color: theme.text }]}>BMI calculator</Text>
              <Text style={[styles.helperText, { color: theme.mutedText }]}>
                Enter body data to estimate BMI and a calorie target suggestion.
              </Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.tag, { borderColor: biologicalSex === "man" ? theme.primary : theme.border, backgroundColor: theme.cardBackground }]}
                  onPress={() => setBiologicalSex("man")}
                >
                  <Text style={[styles.tagText, { color: biologicalSex === "man" ? theme.primary : theme.text, fontWeight: biologicalSex === "man" ? "700" : "500" }]}>
                    Man
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tag, { borderColor: biologicalSex === "woman" ? theme.primary : theme.border, backgroundColor: theme.cardBackground }]}
                  onPress={() => setBiologicalSex("woman")}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: biologicalSex === "woman" ? theme.primary : theme.text, fontWeight: biologicalSex === "woman" ? "700" : "500" }
                    ]}
                  >
                    Woman
                  </Text>
                </TouchableOpacity>
              </View>
              {biologicalSex ? null : (
                <Text style={[styles.helperText, { color: theme.mutedText }]}>
                  Optional: choose sex for more accurate calorie estimation.
                </Text>
              )}
              <View style={styles.row}>
                <View style={styles.metricPill}>
                  <Text style={[styles.helperText, { color: theme.mutedText }]}>BMI</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>{bmiValue ?? "--"}</Text>
                </View>
                <View style={styles.metricPill}>
                  <Text style={[styles.helperText, { color: theme.mutedText }]}>Status</Text>
                  <Text style={[styles.recentMealTitle, { color: theme.text }]}>{bmiLabel}</Text>
                </View>
              </View>
              <PrimaryButton
                title="Recalculate suggested calories"
                color={theme.primary}
                onPress={() => {
                  const suggested = suggestedCalorieTarget({
                    age: Number(age),
                    heightCm: Number(heightCm),
                    weightKg: Number(weightKg),
                    goalType,
                    sex: biologicalSex ?? undefined
                  });
                  setTargetCalories(suggested);
                }}
              />
            </View>
          </View>
        )}

        {screen === "review" && (
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Review Estimate</Text>
            <Text style={{ color: theme.text }}>Confidence: {estimate?.confidence ?? 0}</Text>
            {(estimate?.confidence ?? 0) < 0.7 ? (
              <Text style={styles.warning}>Low confidence: review is required before saving.</Text>
            ) : null}
            {renderMealForm("camera", estimate?.requestId)}
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        style={[styles.settingsFab, { backgroundColor: theme.primary, borderColor: theme.border }]}
        onPress={() => setScreen("settings")}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-sharp" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
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
  container: {
    padding: 16,
    gap: 12
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
    borderRadius: 14,
    padding: 14,
    gap: 10
  },
  authSubtext: {
    color: "#555"
  },
  dashboardStack: {
    gap: 12
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
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
    height: 10,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
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
    borderColor: "#94a3b8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2
  },
  recentMealRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
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
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
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
    borderRadius: 10,
    padding: 12,
    gap: 8
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start"
  },
  primaryBtnFull: {
    alignSelf: "stretch",
    alignItems: "center"
  },
  settingsFab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3
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
