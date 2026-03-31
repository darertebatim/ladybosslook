import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  currentPage?: string;
}

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, currentPage }: RequestBody = await req.json();
    const context = await fetchContext(supabase, currentPage);
    const systemPrompt = buildSystemPrompt(context, currentPage);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const streamResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      if (streamResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (streamResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await streamResponse.text();
      console.error("AI gateway error:", streamResponse.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("admin-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============= CONTEXT =============

async function fetchContext(supabase: any, currentPage?: string) {
  const context: Record<string, any> = {};

  const [
    { count: totalUsers },
    { count: activeEnrollments },
    { data: recentRounds },
    { data: feedChannels },
    { data: programs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("course_enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("program_rounds").select("id, round_name, program_slug, status, start_date").in("status", ["active", "upcoming"]).order("start_date").limit(10),
    supabase.from("feed_channels").select("id, name, slug, type, program_slug").eq("is_archived", false).order("sort_order").limit(20),
    supabase.from("program_catalog").select("slug, title, type").eq("is_active", true).limit(30),
  ]);

  context.stats = {
    totalUsers: totalUsers || 0,
    activeEnrollments: activeEnrollments || 0,
  };
  context.activeRounds = recentRounds || [];
  context.feedChannels = feedChannels || [];
  context.programs = programs || [];

  // Fetch tools context for deeper knowledge
  const [
    { data: categories },
    { data: taskCount },
    { data: routineCount },
    { data: breathingExercises },
    { data: recentActions },
    { data: recentRoutines },
  ] = await Promise.all([
    supabase.from("routine_categories").select("name, slug, icon").eq("is_active", true).order("display_order"),
    supabase.from("admin_task_bank").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("routines_bank").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("breathing_exercises").select("name, category, emoji").eq("is_active", true).order("sort_order"),
    supabase.from("admin_task_bank").select("title, emoji, category").eq("is_active", true).order("sort_order").limit(30),
    supabase.from("routines_bank").select("title, emoji, category").eq("is_active", true).order("sort_order").limit(30),
  ]);

  context.categories = categories || [];
  context.taskCount = taskCount || 0;
  context.routineCount = routineCount || 0;
  context.breathingExercises = breathingExercises || [];
  context.sampleTasks = recentActions || [];
  context.sampleRoutines = recentRoutines || [];

  return context;
}

// ============= SYSTEM PROMPT =============

function buildSystemPrompt(context: Record<string, any>, currentPage?: string): string {
  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  });

  return `You are Razie's knowledgeable AI assistant for the Ladyboss / Ladybosslook platform. You know every detail about this app and can have deep, helpful conversations about the platform, its features, strategy, content ideas, and more.

Today is ${today}. Current admin page: ${currentPage || "overview"}.

## Your Role
You are a conversational partner who deeply understands the Ladybosslook platform. You can:
- Discuss strategy, content ideas, and feature planning
- Help brainstorm announcements, push notifications, social posts
- Advise on routine/task design and wellness content
- Answer questions about the platform's data and structure
- Help draft text content (announcements, descriptions, emails)
- Provide insights based on platform stats and data
- Discuss user engagement strategies

You do NOT execute database actions or create/modify content directly. You provide ideas, drafts, and advice that the admin can then implement manually.

## Platform Knowledge

### Stats
- Total Users: ${context.stats?.totalUsers || 0}
- Active Enrollments: ${context.stats?.activeEnrollments || 0}
- Active Tasks in Bank: ${context.taskCount || 0}
- Active Routines in Bank: ${context.routineCount || 0}

### Active Program Rounds
${context.activeRounds?.map((r: any) => `- ${r.round_name} (${r.program_slug}) — ${r.status}, starts ${r.start_date}`).join("\n") || "None"}

### Programs
${context.programs?.map((p: any) => `- ${p.title} (${p.slug}) — ${p.type}`).join("\n") || "None"}

### Feed Channels
${context.feedChannels?.map((c: any) => `- "${c.name}" (${c.slug}, type: ${c.type})`).join("\n") || "None"}

### Task Categories
${context.categories?.map((c: any) => `- ${c.icon || "📌"} ${c.name} (${c.slug})`).join("\n") || "None"}

### Sample Tasks (${context.taskCount} total)
${context.sampleTasks?.slice(0, 15).map((a: any) => `- ${a.emoji} ${a.title} [${a.category}]`).join("\n") || "None"}

### Sample Routines (${context.routineCount} total)
${context.sampleRoutines?.slice(0, 15).map((r: any) => `- ${r.emoji || "🌟"} ${r.title} [${r.category}]`).join("\n") || "None"}

### Breathing Exercises
${context.breathingExercises?.map((b: any) => `- ${b.emoji || "🌬️"} ${b.name} [${b.category}]`).join("\n") || "None"}

## App Features You Know About
- **Home/Planner**: Daily task planner with customizable tasks, goals, subtasks, pro-links
- **Tools Hub**: Self-Care Habits (task bank), Routines, Reflections Journal, Breathe, Timer, Mood, Emotions, Projects, Water, Period, Fasting
- **My Shortcuts**: Up to 4 pinnable quick-access buttons on the dashboard
- **Routines**: Template-based routines users can adopt and play through
- **Projects**: Scratchpad for organizing tasks into project-based sections with drag-and-drop reordering
- **Audio Player**: Course-supplement audios, playlists with drip scheduling
- **Video Player**: Workout and educational videos
- **Feed/Channels**: Community chat channels per program/round
- **Support Chat**: Private messaging with admin ("Mary")
- **AI Coach**: Context-aware AI chat with planning and emotional support
- **Programs**: Academy courses with rounds, enrollments, and progress tracking
- **Breathing Exercises**: Guided breathing with customizable patterns
- **Mood & Emotions**: Daily mood logging and emotion tracking
- **Period Tracker**: Cycle tracking with predictions
- **Fasting Timer**: Intermittent fasting protocols
- **Water Tracker**: Daily hydration goals
- **Reflections**: Guided prompts and free-form journaling
- **Push Notifications**: Scheduled and event-driven notifications
- **Banners**: Promotional and informational banners on home/explore pages

## Brand Voice
Ladybosslook is warm, empowering, and wellness-focused. Content should feel personal, encouraging, and feminine. Use emojis naturally. Support both English and Farsi/bilingual content when relevant.

## Guidelines
- Be conversational and helpful, like a knowledgeable team member
- Provide concrete suggestions with examples
- When drafting content, format it ready to copy-paste
- Use markdown formatting for clarity
- If asked about data you don't have, say so honestly
- Be proactive with ideas and improvements`;
}
