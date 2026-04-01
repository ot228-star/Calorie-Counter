import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DetectedItem = {
  name: string;
  quantity: number;
  unit: "g" | "ml" | "cup" | "piece" | "tbsp";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const fallbackEstimate = (mealType: string): DetectedItem[] => {
  if (mealType === "breakfast") {
    return [{ name: "eggs", quantity: 2, unit: "piece", calories: 150, protein_g: 12, carbs_g: 1, fat_g: 10 }];
  }
  return [{ name: "rice", quantity: 1, unit: "cup", calories: 205, protein_g: 4, carbs_g: 45, fat_g: 0.4 }];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const body = await req.json();
    const { imageUrl, mealType, eatenAt } = body;

    if (!imageUrl || !mealType || !eatenAt) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Placeholder estimate behavior for MVP. Replace with provider call when keys are configured.
    const detectedItems: DetectedItem[] = fallbackEstimate(mealType);
    const totals = detectedItems.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein_g += item.protein_g;
        acc.carbs_g += item.carbs_g;
        acc.fat_g += item.fat_g;
        return acc;
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    const confidence = 0.65;
    const warnings = confidence < 0.7 ? ["low_confidence_portion"] : [];

    const insert = await supabase
      .from("estimation_requests")
      .insert({
        image_path: imageUrl,
        provider: Deno.env.get("AI_PROVIDER_BASE_URL") ? "external" : "fallback",
        status: "queued",
        raw_response: { detectedItems, totals, warnings },
        confidence
      })
      .select("id")
      .single();

    if (insert.error) throw insert.error;

    return new Response(
      JSON.stringify({
        requestId: insert.data.id,
        confidence,
        warnings,
        detectedItems: detectedItems.map((item) => ({
          id: crypto.randomUUID(),
          ...item,
          estimation_confidence: confidence
        })),
        totals
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
