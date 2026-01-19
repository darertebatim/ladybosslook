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

    // Get the generation type from request body
    const { type = "general" } = await req.json().catch(() => ({}));

    // Fetch existing templates to avoid duplicates
    const { data: existingTemplates } = await supabase
      .from("routine_task_templates")
      .select("title, pro_link_type, pro_link_value");

    const existingTitles = existingTemplates?.map(t => t.title.toLowerCase()) || [];

    let prompt = "";
    let playlists: any[] = [];
    let channels: any[] = [];

    if (type === "playlist") {
      // Fetch all playlists for playlist-specific generation
      const { data: playlistData } = await supabase
        .from("audio_playlists")
        .select("id, name, category, description")
        .eq("is_hidden", false)
        .order("sort_order");
      
      playlists = playlistData || [];

      const playlistContext = playlists.map(p => 
        `- "${p.name}" (${p.category || 'general'}) - ID: ${p.id}${p.description ? ` - ${p.description}` : ''}`
      ).join('\n');

      prompt = `You are creating Pro Task templates for a women's personal development app called LadyBoss Academy. 

Your task: Create ONE Pro Task template for EACH playlist below. Every single playlist should have a corresponding task template.

Available playlists (create a task for EACH one):
${playlistContext}

Existing template titles to AVOID duplicating: ${existingTitles.join(', ') || 'none'}

For each playlist, create an engaging task template that:
1. Has a creative, action-oriented title (not just the playlist name)
2. Uses an appropriate icon based on the playlist category
3. Has a brief, motivating description
4. Sets an appropriate duration (5-30 min based on content type)
5. Assigns a relevant category

Available icons: Sun, Moon, Heart, Star, Music, BookOpen, Mic, Dumbbell, Brain, Coffee, Sparkles, Flame, Target, Zap, Clock, Calendar, MessageCircle, Users, Lightbulb, Compass, Headphones

Categories: Morning, Evening, Wellness, Growth, Fitness, Mindset, Learning

Return ONLY a valid JSON array:
[
  {
    "title": "Creative task title",
    "description": "Motivating description",
    "duration_minutes": 15,
    "icon": "Music",
    "category": "Morning",
    "pro_link_type": "playlist",
    "pro_link_value": "playlist-uuid",
    "linked_playlist_id": "playlist-uuid"
  }
]`;
    } else if (type === "journal") {
      prompt = `You are creating Journal Pro Task templates for a women's personal development app called LadyBoss Academy.

Your task: Create 10-15 diverse journal writing task templates that encourage self-reflection, growth, and mindfulness.

Existing template titles to AVOID duplicating: ${existingTitles.join(', ') || 'none'}

Create varied journal prompts covering:
- Morning intentions and goal setting
- Gratitude practices
- Evening reflection
- Self-discovery and values
- Overcoming challenges
- Celebrating wins
- Emotional processing
- Future visualization
- Relationship reflection
- Career/business insights
- Self-care check-ins
- Mindset shifts

Each template should have:
1. An inspiring, specific title
2. A brief description explaining what to write about
3. Appropriate duration (5-15 min)
4. A fitting icon
5. A relevant category

Available icons: Sun, Moon, Heart, Star, BookOpen, Brain, Coffee, Sparkles, Flame, Target, Lightbulb, Compass, Feather, PenLine, Edit3

Categories: Morning, Evening, Wellness, Growth, Mindset, Reflection

IMPORTANT: All templates must have pro_link_type: "journal" and pro_link_value: null, linked_playlist_id: null

Return ONLY a valid JSON array:
[
  {
    "title": "Morning Intentions",
    "description": "Set your top 3 intentions for today",
    "duration_minutes": 5,
    "icon": "Sun",
    "category": "Morning",
    "pro_link_type": "journal",
    "pro_link_value": null,
    "linked_playlist_id": null
  }
]`;
    } else {
      // General generation (original behavior)
      const { data: playlistData } = await supabase
        .from("audio_playlists")
        .select("id, name, category, description")
        .eq("is_hidden", false)
        .order("sort_order");
      
      const { data: channelData } = await supabase
        .from("feed_channels")
        .select("id, slug, name, type")
        .eq("is_archived", false);

      playlists = playlistData || [];
      channels = channelData || [];

      const playlistContext = playlists.map(p => 
        `- "${p.name}" (${p.category || 'general'}) - ID: ${p.id}${p.description ? ` - ${p.description}` : ''}`
      ).join('\n') || 'No playlists available';

      const channelContext = channels.map(c => 
        `- "${c.name}" (slug: ${c.slug}, type: ${c.type}) - ID: ${c.id}`
      ).join('\n') || 'No channels available';

      prompt = `You are creating Pro Task templates for a women's personal development app called LadyBoss Academy.

Available pro_link_types:
- "playlist": Links to audio content. REQUIRES linked_playlist_id.
- "journal": Opens journal editor. No value needed.
- "channel": Links to community feed. Use channel slug as pro_link_value.
- "planner": Opens planner view. No value needed.
- "inspire": Opens routine browser. No value needed.

Available playlists:
${playlistContext}

Available channels:
${channelContext}

Existing titles to AVOID: ${existingTitles.join(', ') || 'none'}

Generate 8-10 varied Pro Task templates across different link types.

Available icons: Sun, Moon, Heart, Star, Music, BookOpen, Mic, Dumbbell, Brain, Coffee, Sparkles, Flame, Target, Zap, Clock, Calendar, MessageCircle, Users, Lightbulb, Compass

Categories: Morning, Evening, Wellness, Growth, Community, Planning

Return ONLY a valid JSON array:
[
  {
    "title": "Task title",
    "description": "Brief description",
    "duration_minutes": 10,
    "icon": "Sun",
    "category": "Morning",
    "pro_link_type": "playlist",
    "pro_link_value": "uuid-here",
    "linked_playlist_id": "uuid-here"
  }
]`;
    }

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
        if (!t.title || !t.pro_link_type) return false;
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

    const { data: inserted, error: insertError } = await supabase
      .from("routine_task_templates")
      .insert(validTemplates)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert templates: ${insertError.message}`);
    }

    const typeLabel = type === "playlist" ? "Playlist" : type === "journal" ? "Journal" : "";
    return new Response(JSON.stringify({ 
      success: true,
      count: inserted?.length || 0,
      message: `Successfully created ${inserted?.length || 0} new ${typeLabel} Pro Task templates!`,
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
