import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const date = new URL(req.url).searchParams.get("date");
    if (!date) {
      return new Response(JSON.stringify({ error: "date is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;

    const [profileResult, mealsResult] = await Promise.all([
      supabase.from("profiles").select("daily_calorie_target").single(),
      supabase
        .from("meals")
        .select("total_calories,total_protein_g,total_carbs_g,total_fat_g")
        .gte("eaten_at", start)
        .lte("eaten_at", end)
    ]);

    if (profileResult.error) throw profileResult.error;
    if (mealsResult.error) throw mealsResult.error;

    const consumed = mealsResult.data.reduce(
      (acc, meal) => {
        acc.calories += meal.total_calories ?? 0;
        acc.protein_g += Number(meal.total_protein_g ?? 0);
        acc.carbs_g += Number(meal.total_carbs_g ?? 0);
        acc.fat_g += Number(meal.total_fat_g ?? 0);
        return acc;
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    const target = profileResult.data.daily_calorie_target ?? 2200;
    return new Response(
      JSON.stringify({
        date,
        target_calories: target,
        consumed_calories: consumed.calories,
        remaining_calories: Math.max(target - consumed.calories, 0),
        macros: {
          protein_g: Number(consumed.protein_g.toFixed(1)),
          carbs_g: Number(consumed.carbs_g.toFixed(1)),
          fat_g: Number(consumed.fat_g.toFixed(1))
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
