import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { deleteMealById, estimateMealFromImage, listMealsForToday, logEstimateCorrections, saveMeal } from "./src/services/api";
import { trackEvent } from "./src/services/analytics";
import { suggestedCalorieTarget, summaryFromMeals } from "./src/lib/calculations";
import { EstimateResult, Meal, MealItem, MealType } from "./src/types";

type Screen = "onboarding" | "dashboard" | "manual" | "camera" | "review";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const createId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/** Avoid RN `Button` on Android (TouchableNativeFeedback) — use opacity press target instead. */
const PrimaryButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.primaryBtn} onPress={onPress} activeOpacity={0.7}>
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

export default function App() {
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
  const [goalType, setGoalType] = useState<"lose" | "maintain" | "gain">("maintain");

  const summary = useMemo(() => summaryFromMeals(meals, targetCalories), [meals, targetCalories]);

  useEffect(() => {
    listMealsForToday()
      .then((savedMeals) => setMeals(savedMeals))
      .catch(() => {
        // Allow app to continue in local-only mode if backend is unavailable.
      });
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
      await saveMeal(meal, requestId);
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

  const renderMealForm = (source: Meal["source"], requestId?: string) => (
    <View style={styles.card}>
      <Text style={styles.subtitle}>Meal type</Text>
      <View style={styles.row}>
        {mealTypes.map((type) => (
          <TouchableOpacity key={type} style={styles.tag} onPress={() => setMealType(type)}>
            <Text style={mealType === type ? styles.tagSelected : styles.tagText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mealItems.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <TextInput
            style={styles.input}
            placeholder="Food item name"
            value={item.name}
            onChangeText={(text) => updateItem(item.id, "name", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Calories"
            keyboardType="numeric"
            value={String(item.calories)}
            onChangeText={(text) => updateItem(item.id, "calories", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Protein (g)"
            keyboardType="numeric"
            value={String(item.protein_g)}
            onChangeText={(text) => updateItem(item.id, "protein_g", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Carbs (g)"
            keyboardType="numeric"
            value={String(item.carbs_g)}
            onChangeText={(text) => updateItem(item.id, "carbs_g", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Fat (g)"
            keyboardType="numeric"
            value={String(item.fat_g)}
            onChangeText={(text) => updateItem(item.id, "fat_g", text)}
          />
        </View>
      ))}

      <PrimaryButton title="Add item" onPress={() => setMealItems((prev) => [...prev, makeItem()])} />
      <View style={styles.spacer} />
      <PrimaryButton title="Save meal" onPress={() => saveCurrentMeal(source, requestId)} />
    </View>
  );

  if (screen === "onboarding") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Calorie Counter Setup</Text>
        <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
        <TextInput
          style={styles.input}
          placeholder="Height cm"
          keyboardType="numeric"
          value={heightCm}
          onChangeText={setHeightCm}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight kg"
          keyboardType="numeric"
          value={weightKg}
          onChangeText={setWeightKg}
        />
        <View style={styles.row}>
          {(["lose", "maintain", "gain"] as const).map((goal) => (
            <TouchableOpacity key={goal} style={styles.tag} onPress={() => setGoalType(goal)}>
              <Text style={goalType === goal ? styles.tagSelected : styles.tagText}>{goal}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <PrimaryButton
          title="Suggest target"
          onPress={() => {
            const suggested = suggestedCalorieTarget({
              age: Number(age),
              heightCm: Number(heightCm),
              weightKg: Number(weightKg),
              goalType
            });
            setTargetCalories(suggested);
          }}
        />
        <TextInput
          style={styles.input}
          placeholder="Daily calorie target"
          keyboardType="numeric"
          value={String(targetCalories)}
          onChangeText={(v) => setTargetCalories(Number(v || 0))}
        />
        <PrimaryButton
          title="Finish onboarding"
          onPress={async () => {
            await trackEvent("onboarding_completed", { targetCalories, goalType });
            setScreen("dashboard");
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Calorie Counter</Text>
      <View style={styles.row}>
        <PrimaryButton title="Dashboard" onPress={() => setScreen("dashboard")} />
        <PrimaryButton title="Manual log" onPress={() => setScreen("manual")} />
        <PrimaryButton title="Camera" onPress={openPhotoPicker} />
      </View>

      {screen === "dashboard" && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Today</Text>
          <Text>Target: {summary.targetCalories} kcal</Text>
          <Text>Consumed: {summary.consumedCalories} kcal</Text>
          <Text>Remaining: {summary.remainingCalories} kcal</Text>
          <Text>Protein: {summary.protein_g} g</Text>
          <Text>Carbs: {summary.carbs_g} g</Text>
          <Text>Fat: {summary.fat_g} g</Text>
          <View style={styles.spacer} />
          <Text style={styles.subtitle}>Meals</Text>
          {meals.length === 0 ? <Text>No meals saved yet.</Text> : null}
          {meals.map((meal) => (
            <View key={meal.id} style={styles.row}>
              <Text>
                {meal.mealType} ({meal.source}) - {meal.items.reduce((sum, i) => sum + i.calories, 0)} kcal
              </Text>
              <PrimaryButton
                title="Delete"
                onPress={async () => {
                  try {
                    await deleteMealById(meal.id);
                    setMeals((prev) => prev.filter((m) => m.id !== meal.id));
                  } catch {
                    Alert.alert("Could not delete meal.");
                  }
                }}
              />
            </View>
          ))}
        </View>
      )}

      {screen === "manual" && renderMealForm("manual")}

      {screen === "camera" && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Camera Photo</Text>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.image} /> : <Text>No photo selected.</Text>}
          <PrimaryButton title="Estimate calories" onPress={requestEstimate} />
        </View>
      )}

      {screen === "review" && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Review Estimate</Text>
          <Text>Confidence: {estimate?.confidence ?? 0}</Text>
          {(estimate?.confidence ?? 0) < 0.7 ? (
            <Text style={styles.warning}>Low confidence: review is required before saving.</Text>
          ) : null}
          {renderMealForm("camera", estimate?.requestId)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
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
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start"
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center"
  }
});
