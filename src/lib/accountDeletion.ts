import { getSupabaseConfig } from "./env";

/**
 * Calls the `delete-account` Supabase Edge Function which permanently removes
 * the caller's auth user and all owned data. Must be invoked while a session
 * is active so we have an access token to send.
 */
export async function deleteCurrentAccount(accessToken: string): Promise<void> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url) throw new Error("Supabase is not configured.");
  if (!anonKey) throw new Error("Supabase anon key is not configured.");
  if (!accessToken) throw new Error("You must be signed in to delete your account.");

  const endpoint = `${url.replace(/\/$/, "")}/functions/v1/delete-account`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    let message = `Account deletion failed (${response.status}).`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text) as { error?: string; message?: string };
          if (data?.error) {
            message = data.error;
          } else if (data?.message) {
            message = data.message;
          } else {
            message = text;
          }
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}
