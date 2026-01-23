import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskTemplate {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category: string | null;
  suggested_time: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

// Emoji to Lucide icon mapping
const emojiToIcon: Record<string, string> = {
  '☀️': 'Sun', '🌙': 'Moon', '❤️': 'Heart', '🧠': 'Brain', '💪': 'Dumbbell',
  '💼': 'Briefcase', '☕': 'Coffee', '📚': 'Book', '⭐': 'Star', '✨': 'Sparkles',
  '⚡': 'Zap', '🎯': 'Target', '⏰': 'Clock', '📅': 'Calendar', '✅': 'CheckCircle',
  '🏆': 'Award', '🔥': 'Flame', '🍃': 'Leaf', '💨': 'Wind', '👁️': 'Eye',
  '😊': 'Smile', '🎵': 'Music', '🛏️': 'Bed', '💧': 'Droplet', '🍎': 'Apple',
  '📝': 'FileText', '🏃': 'Activity', '🧘': 'Heart', '💭': 'MessageCircle',
  '🌿': 'Leaf', '🌸': 'Flower', '🧴': 'Sparkles', '💅': 'Sparkles', '🪷': 'Flower2',
  '🕯️': 'Flame', '🛁': 'Droplet', '💆': 'Heart', '🌊': 'Waves', '🎧': 'Headphones',
};

async function generatePlanWithAI(
  category: Category,
  tasks: TaskTemplate[],
  apiKey: string
): Promise<{
  title: string;
  subtitle: string;
  description: string;
  sections: { title: string; content: string }[];
} | null> {
  const taskList = tasks.map(t => `- ${t.emoji} ${t.title}`).join('\n');

  const prompt = `Create a compelling routine plan for the "${category.name}" category.

The routine includes these tasks:
${taskList}

Generate ONLY valid JSON (no markdown, no explanation) with:
{
  "title": "A catchy, inspiring title (5-8 words max, not generic)",
  "subtitle": "One punchy phrase about the benefit (under 10 words)",
  "description": "2-3 short sentences about why this routine matters. Be specific and warm, not corporate.",
  "sections": [
    {"title": "Why This Works", "content": "1-2 sentences explaining the science or psychology behind it"},
    {"title": "Best Time", "content": "When to do this routine for best results"},
    {"title": "Pro Tip", "content": "One actionable tip to get the most out of it"}
  ]
}

RULES:
- Be warm and encouraging, speak to "you"
- NO clichés like "unlock your potential", "transform your life", "journey"
- Keep it simple and real
- Title should feel fresh, not generic`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('AI error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI generation failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the categoryId from request body
    const { categoryId } = await req.json();
    
    if (!categoryId) {
      return new Response(
        JSON.stringify({ error: "categoryId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the selected category
    const { data: category, error: catError } = await supabase
      .from("routine_categories")
      .select("id, name, slug, icon, color")
      .eq("id", categoryId)
      .eq("is_active", true)
      .single();

    if (catError || !category) {
      return new Response(
        JSON.stringify({ error: "Category not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    const templatesByCategory: Record<string, TaskTemplate[]> = {};
    const uncategorized: TaskTemplate[] = [];

    for (const template of templates) {
      const cat = template.category?.toLowerCase().trim() || '';
      if (cat) {
        if (!templatesByCategory[cat]) {
          templatesByCategory[cat] = [];
        }
        templatesByCategory[cat].push(template);
      } else {
        uncategorized.push(template);
      }
    }

    // Find templates for this category
    const catSlug = category.slug.toLowerCase();
    const catName = category.name.toLowerCase();

    let matchingTemplates = templatesByCategory[catSlug] || templatesByCategory[catName] || [];

    // Try partial matching
    if (!matchingTemplates.length) {
      for (const [key, temps] of Object.entries(templatesByCategory)) {
        if (key.includes(catSlug) || catSlug.includes(key) ||
            key.includes(catName) || catName.includes(key)) {
          matchingTemplates = temps;
          break;
        }
      }
    }

    // Use uncategorized if nothing found
    if (!matchingTemplates.length && uncategorized.length) {
      matchingTemplates = uncategorized.slice(0, 5);
    }

    if (!matchingTemplates.length) {
      return new Response(
        JSON.stringify({ error: `No task templates found for category: ${category.name}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select 3-5 tasks
    const selectedTasks = matchingTemplates.slice(0, Math.min(5, matchingTemplates.length));

    // Generate plan content with AI
    console.log(`Generating AI content for: ${category.name}`);
    const aiContent = await generatePlanWithAI(category, selectedTasks, LOVABLE_API_KEY);

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: "AI generation failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max display_order
    const { data: maxOrderData } = await supabase
      .from("routine_plans")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const currentOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

    // Calculate total duration
    const totalMinutes = selectedTasks.reduce((sum, t) => {
      if (t.suggested_time) {
        const match = t.suggested_time.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 5);
      }
      return sum + 5;
    }, 0);

    // Create routine plan
    const { data: newPlan, error: planError } = await supabase
      .from("routine_plans")
      .insert({
        title: aiContent.title,
        subtitle: aiContent.subtitle,
        description: aiContent.description,
        icon: category.icon || 'Star',
        color: category.color || 'purple',
        estimated_minutes: totalMinutes || 15,
        points: Math.max(5, Math.round(totalMinutes / 2)),
        is_pro_routine: false,
        is_featured: false,
        is_popular: false,
        is_active: true,
        display_order: currentOrder,
        category_id: category.id
      })
      .select("id")
      .single();

    if (planError) {
      console.error('Plan creation failed:', planError);
      throw planError;
    }

    // Create sections
    if (aiContent.sections?.length) {
      const sectionsToInsert = aiContent.sections.map((section, index) => ({
        plan_id: newPlan.id,
        title: section.title,
        content: section.content,
        section_order: index + 1,
        is_active: true,
      }));

      const { error: sectionsError } = await supabase
        .from("routine_plan_sections")
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error('Sections error:', sectionsError);
      }
    }

    // Create tasks from templates
    let taskOrder = 1;
    for (const template of selectedTasks) {
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
        console.error(`Task error for ${template.title}:`, taskError);
      }
    }

    console.log(`Created: ${aiContent.title} with ${selectedTasks.length} tasks and ${aiContent.sections?.length || 0} sections`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created "${aiContent.title}" with ${selectedTasks.length} tasks and ${aiContent.sections?.length || 0} sections`,
        plan: newPlan
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
