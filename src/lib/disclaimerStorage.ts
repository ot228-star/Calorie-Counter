import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@cc_health_disclaimer_accepted_v1";

export async function hasAcceptedHealthDisclaimer(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function setHealthDisclaimerAccepted(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}
