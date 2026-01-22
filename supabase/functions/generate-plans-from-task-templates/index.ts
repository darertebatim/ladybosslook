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

    // Fetch all active categories
    const { data: categories, error: catError } = await supabase
      .from("routine_categories")
      .select("id, name, slug, icon, color")
      .eq("is_active", true)
      .order("display_order");

    if (catError) throw catError;

    if (!categories?.length) {
      return new Response(
        JSON.stringify({ error: "No active categories found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active task templates
    const { data: templates, error: templatesError } = await supabase
      .from("task_templates")
      .select("*")
      .eq("is_active", true);

    if (templatesError) throw templatesError;

    if (!templates?.length) {
      return new Response(
        JSON.stringify({ error: "No active task templates found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group templates by category
    const templatesByCategory: Record<string, typeof templates> = {};
    const uncategorized: typeof templates = [];
    
    for (const template of templates) {
      const cat = template.category?.toLowerCase() || '';
      if (cat) {
        if (!templatesByCategory[cat]) {
          templatesByCategory[cat] = [];
        }
        templatesByCategory[cat].push(template);
      } else {
        uncategorized.push(template);
      }
    }

    // Get existing plan titles to avoid duplicates
    const { data: existingPlans } = await supabase
      .from("routine_plans")
      .select("title");
    
    const existingTitles = new Set(existingPlans?.map(p => p.title.toLowerCase()) || []);

    // Get current max display_order
    const { data: maxOrderData } = await supabase
      .from("routine_plans")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    let currentOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

    // Emoji to Lucide icon mapping
    const emojiToIcon: Record<string, string> = {
      '☀️': 'Sun', '🌙': 'Moon', '❤️': 'Heart', '🧠': 'Brain', '💪': 'Dumbbell',
      '💼': 'Briefcase', '☕': 'Coffee', '📚': 'Book', '⭐': 'Star', '✨': 'Sparkles',
      '⚡': 'Zap', '🎯': 'Target', '⏰': 'Clock', '📅': 'Calendar', '✅': 'CheckCircle',
      '🏆': 'Award', '🔥': 'Flame', '🍃': 'Leaf', '💨': 'Wind', '👁️': 'Eye',
      '😊': 'Smile', '🎵': 'Music', '🛏️': 'Bed', '💧': 'Droplet', '🍎': 'Apple',
      '📝': 'FileText', '🏃': 'Activity', '🧘': 'Heart', '💭': 'MessageCircle',
    };

    // Color mapping
    const colorMap: Record<string, string> = {
      'yellow': 'yellow', 'pink': 'pink', 'blue': 'blue',
      'purple': 'purple', 'green': 'green', 'orange': 'orange',
      'lavender': 'purple', 'mint': 'green', 'peach': 'orange', 'sky': 'blue',
    };

    let createdCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
      // Find templates matching this category
      const catSlug = category.slug.toLowerCase();
      const catName = category.name.toLowerCase();
      
      let matchingTemplates = templatesByCategory[catSlug] || templatesByCategory[catName] || [];
      
      // If no direct match, try partial matching
      if (!matchingTemplates.length) {
        for (const [key, temps] of Object.entries(templatesByCategory)) {
          if (key.includes(catSlug) || catSlug.includes(key) || 
              key.includes(catName) || catName.includes(key)) {
            matchingTemplates = temps;
            break;
          }
        }
      }

      // If still no match, use some uncategorized templates
      if (!matchingTemplates.length && uncategorized.length) {
        matchingTemplates = uncategorized.slice(0, 4);
      }

      // Skip if no templates for this category
      if (!matchingTemplates.length) {
        console.log(`No templates found for category: ${category.name}`);
        skippedCount++;
        continue;
      }

      // Generate plan title
      const planTitle = `${category.name} Routine`;
      
      // Skip if plan with this title already exists
      if (existingTitles.has(planTitle.toLowerCase())) {
        console.log(`Plan already exists: ${planTitle}`);
        skippedCount++;
        continue;
      }

      // Select 3-5 tasks for the routine
      const selectedTemplates = matchingTemplates.slice(0, Math.min(5, matchingTemplates.length));
      
      // Calculate total duration
      const totalMinutes = selectedTemplates.reduce((sum, t) => {
        // Estimate duration from suggested_time or default to 5 mins
        const time = t.suggested_time;
        if (time) {
          const match = time.match(/(\d+)/);
          return sum + (match ? parseInt(match[1]) : 5);
        }
        return sum + 5;
      }, 0);

      // Create the routine plan
      const { data: newPlan, error: planError } = await supabase
        .from("routine_plans")
        .insert({
          title: planTitle,
          subtitle: `A curated ${category.name.toLowerCase()} routine`,
          description: `Start your ${category.name.toLowerCase()} journey with these hand-picked tasks.`,
          icon: category.icon || 'Star',
          color: colorMap[category.color] || 'purple',
          estimated_minutes: totalMinutes || 15,
          points: Math.max(5, Math.round(totalMinutes / 2)),
          is_pro_routine: false,
          is_featured: false,
          is_popular: false,
          is_active: true,
          display_order: currentOrder++,
          category_id: category.id
        })
        .select("id")
        .single();

      if (planError) {
        console.error(`Failed to create plan for ${category.name}:`, planError);
        continue;
      }

      // Create tasks from templates
      let taskOrder = 1;
      for (const template of selectedTemplates) {
        // Parse duration from suggested_time
        let durationMinutes = 5;
        if (template.suggested_time) {
          const match = template.suggested_time.match(/(\d+)/);
          if (match) durationMinutes = parseInt(match[1]);
        }

        const icon = emojiToIcon[template.emoji] || 'CheckCircle';

        const { error: taskError } = await supabase
          .from("routine_plan_tasks")
          .insert({
            plan_id: newPlan.id,
            title: template.title,
            icon: icon,
            duration_minutes: durationMinutes,
            task_order: taskOrder++,
            is_active: true
          });

        if (taskError) {
          console.error(`Failed to create task for template ${template.id}:`, taskError);
        }
      }

      createdCount++;
      existingTitles.add(planTitle.toLowerCase());
      console.log(`Created plan: ${planTitle} with ${selectedTemplates.length} tasks`);
    }

    return new Response(
      JSON.stringify({
        message: `Created ${createdCount} plans, skipped ${skippedCount}`,
        createdCount,
        skippedCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating plans from templates:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate plans" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
