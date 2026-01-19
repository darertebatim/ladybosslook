import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active Pro Task Templates
    const { data: templates, error: templatesError } = await supabase
      .from("routine_task_templates")
      .select("*")
      .eq("is_active", true);

    if (templatesError) throw templatesError;

    if (!templates?.length) {
      return new Response(
        JSON.stringify({ error: "No active Pro Task Templates found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing pro routines to check for duplicates by title
    const { data: existingRoutines, error: routinesError } = await supabase
      .from("routine_plans")
      .select("title")
      .eq("is_pro_routine", true);

    if (routinesError) throw routinesError;

    const existingTitles = new Set(existingRoutines?.map(r => r.title.toLowerCase()) || []);

    // Fetch categories for assignment
    const { data: categories } = await supabase
      .from("routine_categories")
      .select("id, slug")
      .eq("is_active", true);

    const categoryMap: Record<string, string> = {};
    categories?.forEach(c => {
      categoryMap[c.slug.toLowerCase()] = c.id;
    });

    // Color mapping based on pro_link_type
    const colorByType: Record<string, string> = {
      playlist: "purple",
      journal: "blue",
      channel: "green",
      planner: "orange",
      inspire: "yellow",
      program: "pink",
      route: "blue"
    };

    let createdCount = 0;
    let skippedCount = 0;

    // Get current max display_order
    const { data: maxOrderData } = await supabase
      .from("routine_plans")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    let currentOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

    for (const template of templates) {
      // Skip if routine with same title already exists
      if (existingTitles.has(template.title.toLowerCase())) {
        skippedCount++;
        continue;
      }

      // Determine category based on template category
      let categoryId = null;
      if (template.category) {
        const categorySlug = template.category.toLowerCase().replace(/\s+/g, "-");
        categoryId = categoryMap[categorySlug] || null;
      }

      // Create routine plan
      const { data: newPlan, error: planError } = await supabase
        .from("routine_plans")
        .insert({
          title: template.title,
          subtitle: template.description || null,
          description: template.description || null,
          icon: template.icon,
          color: colorByType[template.pro_link_type] || "purple",
          estimated_minutes: template.duration_minutes,
          points: Math.max(5, Math.round(template.duration_minutes / 2)),
          is_pro_routine: true,
          is_featured: false,
          is_popular: false,
          is_active: true,
          display_order: currentOrder++,
          category_id: categoryId
        })
        .select("id")
        .single();

      if (planError) {
        console.error(`Failed to create plan for template ${template.id}:`, planError);
        continue;
      }

      // Create single task for the routine
      const { error: taskError } = await supabase
        .from("routine_plan_tasks")
        .insert({
          plan_id: newPlan.id,
          title: template.title,
          icon: template.icon,
          duration_minutes: template.duration_minutes,
          task_order: 1,
          is_active: true,
          pro_link_type: template.pro_link_type,
          pro_link_value: template.pro_link_value,
          linked_playlist_id: template.linked_playlist_id
        });

      if (taskError) {
        console.error(`Failed to create task for plan ${newPlan.id}:`, taskError);
        // Delete the plan if task creation failed
        await supabase.from("routine_plans").delete().eq("id", newPlan.id);
        continue;
      }

      createdCount++;
      existingTitles.add(template.title.toLowerCase());
    }

    return new Response(
      JSON.stringify({
        message: `Created ${createdCount} Pro Routines, skipped ${skippedCount} (already exist)`,
        createdCount,
        skippedCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating pro routines:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate pro routines" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
