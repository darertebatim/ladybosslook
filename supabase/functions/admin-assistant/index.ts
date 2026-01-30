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

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
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

    // Fetch context from database
    const context = await fetchContext(supabase, currentPage);
    
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context, currentPage);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        tools: getToolDefinitions(currentPage),
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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

async function fetchContext(supabase: any, currentPage?: string) {
  const context: Record<string, any> = {};

  // Always fetch basic stats
  const [
    { count: totalUsers },
    { count: activeEnrollments },
    { data: recentRounds },
    { data: feedChannels },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("course_enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("program_rounds").select("id, round_name, program_slug, status, start_date").in("status", ["active", "upcoming"]).order("start_date").limit(10),
    supabase.from("feed_channels").select("id, name, slug, type, program_slug").eq("is_archived", false).order("sort_order").limit(20),
  ]);

  context.stats = {
    totalUsers: totalUsers || 0,
    activeEnrollments: activeEnrollments || 0,
  };
  context.activeRounds = recentRounds || [];
  context.feedChannels = feedChannels || [];

  // Fetch page-specific context
  if (currentPage === "routines") {
    const { data: routineCategories } = await supabase
      .from("routine_categories")
      .select("id, name, slug, emoji")
      .eq("is_active", true)
      .order("sort_order");
    context.routineCategories = routineCategories || [];

    const { data: routinePlans } = await supabase
      .from("routine_plans")
      .select("id, name, description, category_id")
      .eq("is_published", true)
      .limit(10);
    context.recentRoutines = routinePlans || [];
  }

  if (currentPage === "communications" || currentPage === "community") {
    const { data: recentPosts } = await supabase
      .from("feed_posts")
      .select("id, title, content, post_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    context.recentPosts = recentPosts || [];
  }

  if (currentPage === "programs") {
    const { data: programs } = await supabase
      .from("program_catalog")
      .select("slug, title, type")
      .eq("is_active", true)
      .limit(20);
    context.programs = programs || [];
  }

  return context;
}

function buildSystemPrompt(context: Record<string, any>, currentPage?: string): string {
  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });

  let prompt = `You are Razie's AI Admin Assistant for the Ladyboss platform. You help with content creation, routine management, and platform administration.

Today is ${today}.

## Platform Stats
- Total Users: ${context.stats?.totalUsers || 0}
- Active Enrollments: ${context.stats?.activeEnrollments || 0}

## Active Program Rounds
${context.activeRounds?.map((r: any) => `- ${r.round_name} (${r.program_slug}) - Status: ${r.status}`).join("\n") || "None"}

## Feed Channels
${context.feedChannels?.map((c: any) => `- ${c.name} (${c.slug}) - Type: ${c.type}`).join("\n") || "None"}
`;

  if (currentPage === "routines" && context.routineCategories) {
    prompt += `
## Routine Categories
${context.routineCategories.map((c: any) => `- ${c.emoji || "📌"} ${c.name} (${c.slug})`).join("\n")}
`;
  }

  if ((currentPage === "communications" || currentPage === "community") && context.recentPosts) {
    prompt += `
## Recent Posts
${context.recentPosts.map((p: any) => `- [${p.post_type}] ${p.title || p.content.substring(0, 50)}...`).join("\n")}
`;
  }

  if (currentPage === "programs" && context.programs) {
    prompt += `
## Active Programs
${context.programs.map((p: any) => `- ${p.title} (${p.slug}) - ${p.type}`).join("\n")}
`;
  }

  prompt += `
## Your Capabilities
1. **Content Creation**: Draft bilingual (English/Farsi) announcements, push notifications, feed posts, and promo copy
2. **Routine & Task Suggestions**: Create wellness routines, task templates, and daily plans
3. **Data Analysis**: Summarize engagement, enrollment trends, and user activity
4. **Form Filling**: When asked to create content, use the appropriate tool to return structured data that can fill forms

## Guidelines
- Be concise and actionable
- For bilingual content, provide English first, then Farsi (فارسی)
- Match the warm, empowering tone of the Ladyboss brand
- When creating content for forms, ALWAYS use the appropriate tool to return structured data
- Current admin page: ${currentPage || "unknown"}

## Tool Usage
When the user asks you to create or draft content (broadcasts, posts, routines, etc.), you MUST use the appropriate tool to return structured JSON data. This allows the user to click "Apply" to fill the form automatically.
`;

  return prompt;
}

function getToolDefinitions(currentPage?: string) {
  const tools: any[] = [
    {
      type: "function",
      function: {
        name: "create_broadcast_content",
        description: "Generate structured content for a broadcast message that can be applied to the broadcast form",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Broadcast title" },
            content: { type: "string", description: "Main message content" },
            targetType: { type: "string", enum: ["all", "course", "round"], description: "Target audience type" },
            targetCourse: { type: "string", description: "Program slug if targeting a specific course" },
            sendEmail: { type: "boolean", description: "Whether to send as email" },
            sendPush: { type: "boolean", description: "Whether to send as push notification" },
          },
          required: ["title", "content"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_feed_post_content",
        description: "Generate structured content for a feed post that can be applied to the post form",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "Feed channel ID to post to" },
            postType: { type: "string", enum: ["announcement", "drip_unlock", "session_reminder", "media", "discussion"], description: "Type of post" },
            title: { type: "string", description: "Post title (optional)" },
            content: { type: "string", description: "Main post content" },
            isPinned: { type: "boolean", description: "Whether to pin the post" },
            sendPush: { type: "boolean", description: "Whether to send push notification" },
          },
          required: ["content", "postType"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_push_notification_content",
        description: "Generate structured content for a push notification",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Notification title (max 50 chars)" },
            body: { type: "string", description: "Notification body (max 100 chars)" },
            targetType: { type: "string", enum: ["all", "course", "round"], description: "Target audience" },
            targetCourse: { type: "string", description: "Program slug if targeting specific course" },
          },
          required: ["title", "body"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_routine_plan",
        description: "Generate a structured routine plan with sections and tasks",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Routine plan name" },
            description: { type: "string", description: "Brief description" },
            categorySlug: { type: "string", description: "Category slug (e.g., morning, wellness, productivity)" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        duration: { type: "number", description: "Duration in minutes" },
                        icon: { type: "string", description: "Emoji icon" },
                        linkType: { type: "string", enum: ["none", "water", "breathing", "journal", "audio"], description: "Link to app feature" },
                      },
                      required: ["title"],
                    },
                  },
                },
                required: ["title", "tasks"],
              },
            },
          },
          required: ["name", "sections"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "suggest_task_templates",
        description: "Suggest task templates for routines",
        parameters: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  defaultDuration: { type: "number", description: "Duration in minutes" },
                  icon: { type: "string", description: "Emoji icon" },
                  category: { type: "string", description: "Task category" },
                },
                required: ["title", "defaultDuration"],
              },
            },
          },
          required: ["suggestions"],
        },
      },
    },
  ];

  return tools;
}
