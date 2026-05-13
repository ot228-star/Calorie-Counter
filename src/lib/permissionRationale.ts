import raw from "./permissionRationale.json";

export type PermissionRationale = typeof raw;

export const permissionRationale: PermissionRationale = raw;

export type PermissionExplainItem = { id: string; title: string; body: string };

export const permissionExplainItems: PermissionExplainItem[] = [
  { id: "camera", title: "Camera", body: permissionRationale.camera },
  { id: "photoLibrary", title: "Photo library", body: permissionRationale.photoLibrary },
  { id: "notifications", title: "Notifications", body: permissionRationale.notifications },
  { id: "biometrics", title: "Face ID / Touch ID", body: permissionRationale.biometrics },
  { id: "appTracking", title: "Ads & measurement", body: permissionRationale.appTracking },
  { id: "internet", title: "Network", body: permissionRationale.internet },
  { id: "vibrate", title: "Vibration", body: permissionRationale.vibrate },
  { id: "adIdAndroid", title: "Advertising ID (Android)", body: permissionRationale.adIdAndroid }
];
