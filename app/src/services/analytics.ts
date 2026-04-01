import { getSupabaseConfig } from "../lib/env";

type AnalyticsEventName =
  | "onboarding_completed"
  | "manual_meal_saved"
  | "camera_estimate_requested"
  | "estimate_received"
  | "estimate_edited"
  | "meal_saved";

export const trackEvent = async (eventName: AnalyticsEventName, props: Record<string, unknown> = {}) => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return;

  const body = {
    eventName,
    timestamp: new Date().toISOString(),
    props,
  };

  try {
    await fetch(`${url.replace(/\/$/, "")}/functions/v1/analytics-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Analytics should never block UX.
  }
};
