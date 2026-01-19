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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch existing templates to avoid duplicates
    const { data: existingTemplates } = await supabase
      .from("routine_task_templates")
      .select("title, pro_link_type, pro_link_value");

    // Fetch playlists for context
    const { data: playlists } = await supabase
      .from("audio_playlists")
      .select("id, name, category, description")
      .eq("is_hidden", false)
      .order("sort_order");

    // Fetch channels for context
    const { data: channels } = await supabase
      .from("feed_channels")
      .select("id, slug, name, type")
      .eq("is_archived", false);

    const existingTitles = existingTemplates?.map(t => t.title.toLowerCase()) || [];

    const playlistContext = playlists?.map(p => 
      `- "${p.name}" (${p.category || 'general'}) - ID: ${p.id}${p.description ? ` - ${p.description}` : ''}`
    ).join('\n') || 'No playlists available';

    const channelContext = channels?.map(c => 
      `- "${c.name}" (slug: ${c.slug}, type: ${c.type}) - ID: ${c.id}`
    ).join('\n') || 'No channels available';

    const prompt = `You are creating Pro Task templates for a women's personal development app called LadyBoss Academy. These templates will be used to quickly add tasks to daily routines.

Available pro_link_types and their purposes:
- "playlist": Links to audio content (meditation, workout, podcast, affirmations). REQUIRES linked_playlist_id from the available playlists.
- "journal": Opens the journal editor for writing/reflection. No value needed.
- "channel": Links to a community feed channel for engagement. Use the channel slug as pro_link_value.
- "planner": Opens the daily/weekly planner view. No value needed.
- "inspire": Opens the routine inspiration browser. No value needed.

Available playlists (use these IDs for playlist type):
${playlistContext}

Available channels (use slug for channel type):
${channelContext}

Existing template titles to AVOID duplicating: ${existingTitles.join(', ') || 'none'}

Generate 8-10 NEW Pro Task templates with variety across different link types. Focus on:
- Morning routines (meditation, affirmations, planning)
- Self-care activities (journaling, reflection)
- Community engagement
- Personal growth

For playlist types, you MUST use real playlist IDs from the list above.
For channel types, use the channel slug as pro_link_value.

Available icons (use exact names): Sun, Moon, Heart, Star, Music, BookOpen, Mic, Dumbbell, Brain, Coffee, Sparkles, Flame, Target, Zap, Clock, Calendar, MessageCircle, Users, Lightbulb, Compass

Return ONLY a valid JSON array with no additional text:
[
  {
    "title": "Task title",
    "description": "Brief description of the task",
    "duration_minutes": 10,
    "icon": "Sun",
    "category": "Morning",
    "pro_link_type": "playlist",
    "pro_link_value": "playlist-uuid-here",
    "linked_playlist_id": "playlist-uuid-here"
  }
]

Categories to use: Morning, Evening, Wellness, Growth, Community, Planning`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates JSON data. Return only valid JSON arrays with no markdown formatting or extra text." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    let templates;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        templates = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(templates) || templates.length === 0) {
      throw new Error("AI did not return a valid array of templates");
    }

    // Validate and filter templates
    const validTemplates = templates
      .filter((t: any) => {
        // Must have required fields
        if (!t.title || !t.pro_link_type) return false;
        // Skip if title already exists
        if (existingTitles.includes(t.title.toLowerCase())) return false;
        // For playlist type, must have valid playlist ID
        if (t.pro_link_type === 'playlist') {
          const playlistExists = playlists?.some(p => p.id === t.linked_playlist_id);
          if (!playlistExists) return false;
        }
        return true;
      })
      .map((t: any, index: number) => ({
        title: t.title,
        description: t.description || null,
        duration_minutes: t.duration_minutes || 10,
        icon: t.icon || 'Star',
        category: t.category || null,
        pro_link_type: t.pro_link_type,
        pro_link_value: t.pro_link_value || null,
        linked_playlist_id: t.pro_link_type === 'playlist' ? t.linked_playlist_id : null,
        is_active: true,
        display_order: (existingTemplates?.length || 0) + index,
      }));

    if (validTemplates.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No new valid templates could be generated. All suggestions either already exist or have invalid references." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the templates
    const { data: inserted, error: insertError } = await supabase
      .from("routine_task_templates")
      .insert(validTemplates)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert templates: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      count: inserted?.length || 0,
      message: `Successfully created ${inserted?.length || 0} new Pro Task templates!`,
      templates: inserted
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating templates:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate templates" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
