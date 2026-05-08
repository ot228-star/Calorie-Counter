import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cleanup-secret"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const cleanupSecret = Deno.env.get("CLEANUP_IMAGES_SECRET") ?? "";
    if (!cleanupSecret) {
      return new Response(JSON.stringify({ error: "Function is misconfigured (missing cleanup secret)." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (req.headers.get("x-cleanup-secret") !== cleanupSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const retentionDays = Number(Deno.env.get("IMAGE_RETENTION_DAYS") ?? "7");
    if (!Number.isFinite(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      return new Response(JSON.stringify({ error: "Invalid IMAGE_RETENTION_DAYS." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Function is misconfigured (missing Supabase env)." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const oldRows = await supabase.from("estimation_requests").select("id,image_path").lt("created_at", cutoff);
    if (oldRows.error) throw oldRows.error;

    const paths = oldRows.data
      .map((row) => row.image_path)
      .filter((path): path is string => Boolean(path) && !path.includes("://"));
    if (paths.length) {
      const remove = await supabase.storage.from("meal-images").remove(paths);
      if (remove.error) throw remove.error;
    }

    return new Response(JSON.stringify({ removed: paths.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
