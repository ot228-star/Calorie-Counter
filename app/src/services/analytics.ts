type AnalyticsEventName =
  | "onboarding_completed"
  | "manual_meal_saved"
  | "camera_estimate_requested"
  | "estimate_received"
  | "estimate_edited"
  | "meal_saved";

const supabaseUrl = (globalThis as any).process?.env?.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = (globalThis as any).process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const trackEvent = async (eventName: AnalyticsEventName, props: Record<string, unknown> = {}) => {
  const body = {
    eventName,
    timestamp: new Date().toISOString(),
    props
  };

  try {
    await fetch(`${supabaseUrl}/functions/v1/analytics-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(body)
    });
  } catch {
    // Analytics should never block UX.
  }
};
