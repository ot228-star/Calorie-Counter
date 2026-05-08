import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Permanently deletes the calling user's account and all owned data.
 *
 * Required for Apple App Review (Guideline 5.1.1(v)) and Google Play account
 * deletion policy. Must be invoked with the user's JWT in the Authorization
 * header and uses the service role key to perform the auth deletion.
 *
 * Deploy: `supabase functions deploy delete-account --no-verify-jwt`
 * Set secret: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "Function is misconfigured (missing env)." });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(401, { error: "Missing bearer token." });
  }

  // Verify the caller using their JWT
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) {
    return json(401, { error: "Invalid session." });
  }
  const userId = userRes.user.id;

  // Privileged client for cascading deletes + auth deletion
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Best-effort cleanup of user-owned rows. `on delete cascade` should handle most,
    // but we do an explicit pass to be defensive.
    const tables = [
      "estimation_requests",
      "meals",
      "analytics_events",
    ];
    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    }
    // profiles row is keyed by id, not user_id
    const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
    if (profileError) throw profileError;

    // Best-effort: remove user-uploaded images if a `meal-images` bucket exists.
    try {
      const list = await admin.storage.from("meal-images").list(userId, { limit: 1000 });
      const paths = list.data?.map((f) => `${userId}/${f.name}`) ?? [];
      if (paths.length > 0) {
        await admin.storage.from("meal-images").remove(paths);
      }
    } catch (_) {
      // bucket may not exist; ignore
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      return json(500, { error: `Auth deletion failed: ${delErr.message}` });
    }

    return json(200, { ok: true, deletedUserId: userId });
  } catch (error) {
    return json(500, { error: String(error) });
  }
});
