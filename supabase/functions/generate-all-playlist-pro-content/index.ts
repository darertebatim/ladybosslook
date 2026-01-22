import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface ProgressUpdate {
  current: number;
  total: number;
  phase: 'tasks' | 'routines';
  currentItem: string;
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

    // Fetch all playlists
    const { data: playlists, error: playlistError } = await supabase
      .from("audio_playlists")
      .select("id, name, description, category")
      .eq("is_hidden", false)
      .order("sort_order");

    if (playlistError) throw playlistError;
    if (!playlists?.length) {
      return new Response(
        JSON.stringify({ error: "No playlists found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing Pro Task templates to avoid duplicates
    const { data: existingTemplates } = await supabase
      .from("routine_task_templates")
      .select("title, linked_playlist_id");

    const existingPlaylistIds = new Set(
      existingTemplates?.filter(t => t.linked_playlist_id).map(t => t.linked_playlist_id) || []
    );

    // Fetch existing Pro Routines to avoid duplicates
    const { data: existingRoutines } = await supabase
      .from("routine_plans")
      .select("title")
      .eq("is_pro_routine", true);

    const existingRoutineTitles = new Set(
      existingRoutines?.map(r => r.title.toLowerCase()) || []
    );

    // Fetch categories for assignment
    const { data: categories } = await supabase
      .from("routine_categories")
      .select("id, slug, name")
      .eq("is_active", true);

    const categoryMap: Record<string, string> = {};
    categories?.forEach(c => {
      categoryMap[c.slug.toLowerCase()] = c.id;
      categoryMap[c.name.toLowerCase()] = c.id;
    });

    // Filter playlists that need Pro Tasks
    const playlistsToProcess = playlists.filter(p => !existingPlaylistIds.has(p.id));

    // Get current max display orders
    const { data: maxTemplateOrder } = await supabase
      .from("routine_task_templates")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const { data: maxRoutineOrder } = await supabase
      .from("routine_plans")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    let templateOrder = (maxTemplateOrder?.[0]?.display_order || 0) + 1;
    let routineOrder = (maxRoutineOrder?.[0]?.display_order || 0) + 1;

    // Icon mapping based on category
    const iconByCategory: Record<string, string> = {
      'meditation': 'Moon',
      'mindset': 'Brain',
      'fitness': 'Dumbbell',
      'business': 'Target',
      'motivation': 'Flame',
      'morning': 'Sun',
      'evening': 'Moon',
      'wellness': 'Heart',
      'growth': 'Sparkles',
      'learning': 'BookOpen',
      'podcast': 'Mic',
      'default': 'Music'
    };

    // Color mapping
    const colorByCategory: Record<string, string> = {
      'meditation': 'purple',
      'mindset': 'blue',
      'fitness': 'green',
      'business': 'orange',
      'motivation': 'yellow',
      'morning': 'yellow',
      'evening': 'purple',
      'wellness': 'pink',
      'growth': 'emerald',
      'default': 'purple'
    };

    const results = {
      tasksCreated: 0,
      tasksSkipped: 0,
      routinesCreated: 0,
      routinesSkipped: 0,
      errors: [] as string[],
    };

    // Process each playlist
    for (const playlist of playlistsToProcess) {
      const categoryLower = (playlist.category || 'default').toLowerCase();
      const icon = iconByCategory[categoryLower] || iconByCategory['default'];
      const color = colorByCategory[categoryLower] || colorByCategory['default'];

      // Determine category ID
      let categoryId = null;
      if (playlist.category) {
        const catSlug = playlist.category.toLowerCase().replace(/\s+/g, "-");
        categoryId = categoryMap[catSlug] || categoryMap[playlist.category.toLowerCase()] || null;
      }

      // Estimate duration based on description or default
      const durationMinutes = playlist.description?.toLowerCase().includes('short') ? 10 :
                              playlist.description?.toLowerCase().includes('quick') ? 5 :
                              playlist.description?.toLowerCase().includes('deep') ? 30 : 15;

      try {
        // Step 1: Create Pro Task Template
        const { data: newTemplate, error: templateError } = await supabase
          .from("routine_task_templates")
          .insert({
            title: playlist.name,
            description: playlist.description || `Listen to ${playlist.name}`,
            duration_minutes: durationMinutes,
            icon: icon,
            category: playlist.category || null,
            pro_link_type: 'playlist',
            pro_link_value: playlist.id,
            linked_playlist_id: playlist.id,
            is_active: true,
            is_popular: false,
            display_order: templateOrder++,
          })
          .select("id")
          .single();

        if (templateError) {
          results.errors.push(`Template for "${playlist.name}": ${templateError.message}`);
          continue;
        }
        results.tasksCreated++;

        // Step 2: Check if routine already exists
        if (existingRoutineTitles.has(playlist.name.toLowerCase())) {
          results.routinesSkipped++;
          continue;
        }

        // Step 3: Generate AI routine description and sections
        let routineDescription = playlist.description || `A focused routine for ${playlist.name}`;
        let sections: Array<{ title: string; description: string }> = [];

        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { 
                  role: "system", 
                  content: "You are a helpful assistant creating routine content for a women's personal development app. Return only valid JSON." 
                },
                { 
                  role: "user", 
                  content: `Create a routine for "${playlist.name}" (${playlist.category || 'general'} category).
${playlist.description ? `Description: ${playlist.description}` : ''}

Generate:
1. A compelling 1-2 sentence routine description
2. 2-3 sections that guide the user through the routine

Return JSON:
{
  "description": "Compelling description here",
  "sections": [
    { "title": "Section 1 Title", "description": "What to do in this section" },
    { "title": "Section 2 Title", "description": "What to do in this section" }
  ]
}`
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                routineDescription = parsed.description || routineDescription;
                sections = parsed.sections || [];
              }
            }
          }
        } catch (aiError) {
          console.error(`AI generation failed for ${playlist.name}:`, aiError);
          // Continue with default values
        }

        // Step 4: Create Pro Routine (routine_plan)
        const { data: newPlan, error: planError } = await supabase
          .from("routine_plans")
          .insert({
            title: playlist.name,
            subtitle: playlist.description || null,
            description: routineDescription,
            icon: icon,
            color: color,
            estimated_minutes: durationMinutes,
            points: Math.max(5, Math.round(durationMinutes / 2)),
            is_pro_routine: true,
            is_featured: false,
            is_popular: false,
            is_active: true,
            display_order: routineOrder++,
            category_id: categoryId,
          })
          .select("id")
          .single();

        if (planError) {
          results.errors.push(`Routine for "${playlist.name}": ${planError.message}`);
          continue;
        }

        // Step 5: Create sections if any
        if (sections.length > 0) {
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            await supabase
              .from("routine_plan_sections")
              .insert({
                plan_id: newPlan.id,
                title: section.title,
                description: section.description,
                section_order: i + 1,
              });
          }
        }

        // Step 6: Create Pro Task for the routine
        const { error: taskError } = await supabase
          .from("routine_plan_tasks")
          .insert({
            plan_id: newPlan.id,
            title: playlist.name,
            icon: icon,
            duration_minutes: durationMinutes,
            task_order: 1,
            is_active: true,
            pro_link_type: 'playlist',
            pro_link_value: playlist.id,
            linked_playlist_id: playlist.id,
            section_id: null,
          });

        if (taskError) {
          results.errors.push(`Task for routine "${playlist.name}": ${taskError.message}`);
          // Don't delete the plan, it's still usable
        }

        results.routinesCreated++;
        existingRoutineTitles.add(playlist.name.toLowerCase());

      } catch (error) {
        results.errors.push(`Processing "${playlist.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Count skipped templates (already had playlist linked)
    results.tasksSkipped = playlists.length - playlistsToProcess.length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${results.tasksCreated} Pro Tasks and ${results.routinesCreated} Pro Routines`,
        ...results,
        totalPlaylists: playlists.length,
        processedPlaylists: playlistsToProcess.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-all-playlist-pro-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
