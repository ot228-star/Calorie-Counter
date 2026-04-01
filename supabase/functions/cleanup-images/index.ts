import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const retentionDays = Number(Deno.env.get("IMAGE_RETENTION_DAYS") ?? "7");
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const oldRows = await supabase.from("estimation_requests").select("id,image_path").lt("created_at", cutoff);
    if (oldRows.error) throw oldRows.error;

    const paths = oldRows.data.map((row) => row.image_path).filter(Boolean);
    if (paths.length) {
      await supabase.storage.from("meal-images").remove(paths);
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
