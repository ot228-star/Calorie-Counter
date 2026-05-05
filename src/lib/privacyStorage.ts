import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIVACY_LOCK_KEY = "@cc_privacy_biometric_lock_enabled";

export async function loadPrivacyLockEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(PRIVACY_LOCK_KEY)) === "1";
}

export async function setPrivacyLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(PRIVACY_LOCK_KEY, "1");
    return;
  }
  await AsyncStorage.removeItem(PRIVACY_LOCK_KEY);
}

