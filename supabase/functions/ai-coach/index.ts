import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string | any[];
  tool_calls?: any[];
  tool_call_id?: string;
  image?: string; // base64 data URL from client
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

    const { messages, mode, conversationSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch user context + past conversation memory
    const context = await fetchUserContext(supabase, user.id);
    
    // Load past conversation memory if not provided
    let memory = conversationSummary || "";
    if (!memory) {
      const { data: convo } = await supabase
        .from("ai_coach_conversations")
        .select("messages")
        .eq("user_id", user.id)
        .single();
      if (convo?.messages && Array.isArray(convo.messages) && convo.messages.length > 0) {
        // Summarize last 20 messages for context
        const recentHistory = convo.messages.slice(-20);
        memory = recentHistory.map((m: any) => `${m.role}: ${m.content?.slice(0, 200)}`).join("\n");
      }
    }
    
    const systemPrompt = buildSystemPrompt(context, mode, memory);
    const tools = getToolsForMode(mode);

    // ALL tools are direct-execution
    const directExecutionTools = [
      "add_task_to_planner",
      "log_mood",
      "adopt_routine",
      "suggest_breathing",
      "create_journal_prompt",
      "get_routine_suggestions",
      "get_task_suggestions",
    ];

    // Build AI messages — convert image messages to multimodal format
    const aiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => {
        if (m.image && m.role === "user") {
          // Convert to multimodal content array for Gemini
          const parts: any[] = [];
          if (m.content) {
            parts.push({ type: "text", text: m.content });
          }
          // Extract mime type and base64 from data URL
          const match = m.image.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (match) {
            parts.push({
              type: "image_url",
              image_url: { url: m.image },
            });
          }
          return { role: "user", content: parts };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    // Multi-turn tool chaining loop (up to 3 rounds)
    let currentMessages = [...aiMessages];
    const allMutationResults: any[] = [];
    const MAX_TOOL_ROUNDS = 3;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const callResponse = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: currentMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!callResponse.ok) return handleAIError(callResponse);

      const callResult = await callResponse.json();
      const choice = callResult.choices?.[0];

      console.log(`[ai-coach] Round ${round}: finish_reason=${choice?.finish_reason}, tool_calls=${JSON.stringify(choice?.message?.tool_calls?.length || 0)}`);

      // If no tool calls, we're done — stream the final response
      // Check both finish_reason variants AND presence of tool_calls array
      const hasToolCalls = choice?.message?.tool_calls && choice.message.tool_calls.length > 0;
      if (!hasToolCalls) {
        console.log("[ai-coach] No tool calls detected, proceeding to stream");
        break;
      }

      // Execute all tool calls in this round
      const toolCalls = choice.message.tool_calls;
      const toolResults: { tool_call_id: string; result: any }[] = [];

      for (const tc of toolCalls) {
        const fnName = tc.function?.name;
        let args: any;
        try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { args = {}; }
        const result = await executeToolAction(supabase, user.id, fnName, args);
        toolResults.push({ tool_call_id: tc.id, result });
      }

      // Collect ALL tool results for action cards (not just mutations)
      allMutationResults.push(...toolResults.map(tr => tr.result));
      console.log(`[ai-coach] Round ${round}: executed ${toolResults.length} tools:`, toolResults.map(tr => tr.result.action));

      // Add tool call + results to conversation for next round
      currentMessages = [
        ...currentMessages,
        choice.message,
        ...toolResults.map((tr: any) => ({
          role: "tool" as const,
          content: JSON.stringify(tr.result),
          tool_call_id: tr.tool_call_id,
        })),
      ];
    }

    // Final streaming response (with or without prior tool context)
    const finalResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: currentMessages,
        stream: true,
      }),
    });

    if (!finalResponse.ok) return handleAIError(finalResponse);

    // Generate follow-up suggestions (non-blocking)
    const followUpPromise = generateFollowUps(LOVABLE_API_KEY, currentMessages, mode);

    const combinedStream = new ReadableStream({
      async start(controller) {
        if (allMutationResults.length > 0) {
          const actionEvent = `data: ${JSON.stringify({ action_results: allMutationResults })}\n\n`;
          controller.enqueue(new TextEncoder().encode(actionEvent));
        }
        const reader = finalResponse.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (e) {
          console.error("Stream read error:", e);
        }

        // Append follow-up suggestions after stream ends
        try {
          const followUps = await followUpPromise;
          if (followUps.length > 0) {
            const followUpEvent = `data: ${JSON.stringify({ suggested_followups: followUps })}\n\n`;
            controller.enqueue(new TextEncoder().encode(followUpEvent));
          }
        } catch (e) {
          console.error("Follow-up generation error:", e);
        }

        controller.close();
      },
    });

    return new Response(combinedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============= ERROR HANDLING =============

function handleAIError(response: Response) {
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (response.status === 402) {
    return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
      status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "AI gateway error" }), {
    status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============= CONTEXT FETCHING =============

async function fetchUserContext(supabase: any, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const [profileRes, tasksRes, completionsRes, emotionsRes, journalRes, streakRes, routinesRes, breathingRes, taskBankRes] = await Promise.all([
    supabase.from("profiles").select("full_name, goals, preferred_language, gender, date_of_birth, occupation").eq("id", userId).single(),
    supabase.from("user_tasks").select("id, title, emoji, scheduled_date, is_active, repeat_pattern, pro_link_type").eq("user_id", userId).eq("is_active", true).limit(30),
    supabase.from("task_completions").select("task_id, completed_date").eq("user_id", userId).eq("completed_date", today),
    supabase.from("emotion_logs").select("emotion, valence, category, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("free_form_reflections").select("title, mood, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("user_streaks").select("current_streak, longest_streak").eq("user_id", userId).single(),
    supabase.from("routines_bank").select("id, title, emoji, category, subtitle").eq("is_active", true).order("sort_order").limit(50),
    supabase.from("breathing_exercises").select("id, name, emoji, category, description").eq("is_active", true).limit(20),
    supabase.from("admin_task_bank").select("id, title, emoji, category, description, duration_minutes, time_period").eq("is_active", true).order("sort_order").limit(50),
  ]);

  return {
    profile: profileRes.data,
    tasks: tasksRes.data || [],
    todayCompletions: completionsRes.data || [],
    recentEmotions: emotionsRes.data || [],
    recentJournals: journalRes.data || [],
    streak: streakRes.data,
    availableRoutines: routinesRes.data || [],
    availableBreathing: breathingRes.data || [],
    availableTasks: taskBankRes.data || [],
  };
}

// ============= SYSTEM PROMPT =============

function buildSystemPrompt(context: any, mode?: string, memory?: string) {
  const name = context.profile?.full_name?.split(" ")[0] || "there";
  const goals = context.profile?.goals?.join(", ") || "not specified";

  const completedIds = new Set(context.todayCompletions.map((c: any) => c.task_id));
  const todayTasks = context.tasks.filter((t: any) => {
    const isToday = t.scheduled_date === new Date().toISOString().split("T")[0];
    const isRepeating = t.repeat_pattern && t.repeat_pattern !== "none";
    return isToday || isRepeating;
  });
  const completedCount = todayTasks.filter((t: any) => completedIds.has(t.id)).length;

  const recentMoods = context.recentEmotions.slice(0, 5).map((e: any) =>
    `${e.emotion} (${e.valence})`
  ).join(", ");

  const routinesList = context.availableRoutines.slice(0, 20).map((r: any) =>
    `- ${r.emoji} ${r.title} (${r.category}) [id: ${r.id}]`
  ).join("\n");

  const breathingList = context.availableBreathing.slice(0, 10).map((b: any) =>
    `- ${b.emoji} ${b.name} (${b.category}) [id: ${b.id}]`
  ).join("\n");

  const taskSuggestions = context.availableTasks.slice(0, 20).map((t: any) =>
    `- ${t.emoji} ${t.title} (${t.category}${t.time_period ? `, ${t.time_period}` : ""}) [id: ${t.id}]`
  ).join("\n");

  // Mode-specific persona — each mode is genuinely different
  const modePersona = mode === "coach" 
    ? `You are currently in **Routine Coach** mode. You are a direct, motivating personal trainer for life habits.

PERSONALITY: High-energy, structured, accountability-focused. Like a personal trainer who genuinely cares.
TONE: "Let's do this!" energy. Use action verbs. Be direct but warm. Push the user forward.

YOUR JOB:
- Build and maintain healthy routines and habits
- Suggest routines from the library — but always ASK before adding
- Use \`get_routine_suggestions\` and \`get_task_suggestions\` to browse options (read-only is fine without asking)
- Create structured daily/weekly plans with specific tasks — propose them first, add after user confirms
- Troubleshoot habit adherence ("Why do you keep skipping?")
- Celebrate consistency and streaks enthusiastically
- Hold the user accountable — if they're slacking, call it out kindly

DO NOT:
- Do lengthy emotional exploration — if user is emotional, acknowledge briefly then say "Want to switch to Companion mode for that?"
- Be passive or vague — always end with a concrete next step or action

FOLLOW-UP STYLE: Action-biased. "Want me to add that to your planner?", "Ready to adopt this routine?", "What time works for this?"`
    : mode === "assistant"
    ? `You are currently in **Planning Assistant** mode. You are an efficient, organized smart secretary.

PERSONALITY: No-nonsense, structured, efficient. Like the best executive assistant who anticipates needs.
TONE: Brief, bullet-pointed, organized. Minimal small talk. Get to the point fast.

YOUR JOB:
- Organize the user's day with clear priorities
- Use \`get_task_suggestions\` to present organized options — propose a plan, then execute only after user confirms
- Review what's been accomplished vs what's pending
- Suggest time-blocking strategies
- Break big goals into small actionable steps
- Prioritize ruthlessly — help the user say no to low-priority items

DO NOT:
- Do emotional coaching — if user is emotional, say "Sounds like you could use Companion mode for that"
- Be chatty or give long motivational speeches
- Suggest breathing exercises or journaling (that's Companion's job)

FOLLOW-UP STYLE: Planning-biased. "What else for today?", "Want me to prioritize your list?", "Any deadlines I should know about?"`
    : mode === "companion"
    ? `You are currently in **Emotional Companion** mode. You are a warm, empathetic close friend.

PERSONALITY: Gentle, validating, caring. Like a best friend who always listens without judgment.
TONE: Soft, warm, uses more emojis (2-3 per message). Ask "how does that make you feel?" naturally.

YOUR JOB:
- Listen first, validate feelings before offering solutions
- Ask if the user wants to log their mood when you detect emotions — don't auto-log
- Suggest breathing exercises via \`suggest_breathing\` when user seems stressed — but ask first
- Offer journaling prompts via \`create_journal_prompt\` for self-reflection — but ask first
- Help the user name and understand their emotions
- Check in on their emotional patterns over time

DO NOT:
- Add tasks or adopt routines — if user asks for that, say "Let's switch to Coach or Assistant mode for that!"
- Be pushy or action-oriented — this is a safe space for feelings
- Give medical, psychiatric, or dietary advice
- If someone is in crisis, gently suggest they contact a professional or crisis line

FOLLOW-UP STYLE: Feelings-biased. "Want to talk more about that?", "How about journaling on this?", "Need a breathing exercise to reset?"`
    : `Adapt naturally between coaching, planning, and emotional support based on what the user needs. Read their tone and intent carefully.`;

  // Mode-specific tool guidelines
  const toolGuidelines = mode === "coach"
    ? `## Tool Usage (Coach Mode)
- Use \`get_routine_suggestions\` and \`get_task_suggestions\` freely — these are read-only lookups
- ONLY call \`add_task_to_planner\` or \`adopt_routine\` AFTER the user explicitly confirms
- You can suggest tasks and routines, but always propose first and wait for a "yes"`
    : mode === "assistant"
    ? `## Tool Usage (Assistant Mode)
- Use \`get_task_suggestions\` and \`get_routine_suggestions\` freely — these are read-only lookups
- ONLY call \`add_task_to_planner\` or \`adopt_routine\` AFTER the user explicitly confirms
- Propose a plan first, then execute after user says yes
- Do NOT use \`log_mood\`, \`suggest_breathing\`, or \`create_journal_prompt\` — redirect to Companion mode`
    : mode === "companion"
    ? `## Tool Usage (Companion Mode)
- ONLY call \`log_mood\`, \`suggest_breathing\`, or \`create_journal_prompt\` AFTER the user explicitly confirms
- Ask "Would you like me to log your mood?" — don't just do it
- Do NOT use \`add_task_to_planner\`, \`adopt_routine\`, \`get_routine_suggestions\`, or \`get_task_suggestions\` — redirect to Coach/Assistant mode`
    : `## Tool Usage\n- Use all tools as appropriate based on the user's needs. Always ask before executing write actions.`;

  const taskList = todayTasks.map((t: any) =>
    `${t.emoji} ${t.title} [${completedIds.has(t.id) ? 'DONE' : 'PENDING'}]`
  ).join(", ");

  return `You are Ladybosslook, a warm and intelligent AI wellness coach inside the Ladybosslook app. You always respond in English.

## ⚠️ GOLDEN RULE: NEVER Auto-Execute Actions
- NEVER call add_task_to_planner, adopt_routine, log_mood, or create_journal_prompt without EXPLICIT user confirmation.
- Instead, PROPOSE the action in your message text (e.g., "Would you like me to add 'Morning stretch' to your planner?")
- Only call the tool AFTER the user says yes, confirms, or explicitly asks you to do it.
- Words like "suggest", "recommend", "what do you think" are NOT confirmation — the user must say "yes", "add it", "do it", "go ahead", etc.
- The ONLY tools you can call without asking are get_routine_suggestions and get_task_suggestions (read-only lookups).

## Current Mode
${modePersona}

## Your Core Personality
- Warm, encouraging, and concise — like a knowledgeable friend
- Be specific and actionable, not generic
- Celebrate small wins enthusiastically
- Remember what the user told you and reference it naturally
- When you take actions (add tasks, log mood), confirm what you did clearly

## User Context
- Name: ${name}
- Goals: ${goals}
- Today's tasks: ${todayTasks.length} total, ${completedCount} completed, ${todayTasks.length - completedCount} remaining
- Task list: ${taskList || "No tasks today"}
- Streak: ${context.streak?.current_streak || 0} days (longest: ${context.streak?.longest_streak || 0})
- Recent moods: ${recentMoods || "none logged recently"}
- Recent journals: ${context.recentJournals.length} entries in the last week

## Available Routines to Suggest
${routinesList || "No routines available"}

## Available Breathing Exercises
${breathingList || "No exercises available"}

## Available Tasks to Add
${taskSuggestions || "No tasks available"}

${toolGuidelines}

## Important Rules
- Always respond in English
- Keep responses concise — 2-4 sentences unless the user asks for detail
- Don't give medical, psychiatric, or dietary advice
- If someone is in crisis, suggest they contact a professional or crisis line
- When suggesting routines or tasks, use the IDs from the available lists
- Don't output raw JSON or tool call syntax — speak naturally about what you did
- When discussing task counts, ONLY reference the actual numbers from User Context above. Never invent or estimate task counts.
- When you say "I added X to your planner," it must correspond to actual tool calls you made. Do not claim actions you didn't take.

## Response Focus
- Address ONE topic or suggestion per message. Do not pile multiple suggestions together.
- If you have multiple ideas, present the most relevant one first. Let follow-up chips handle the rest.
- Keep responses to 2-4 sentences maximum unless the user explicitly asks for detail.
- Never combine a task suggestion + routine suggestion + breathing suggestion in one response.

## Image Understanding
- When a user sends an image, analyze it carefully
- If it's a handwritten note, list, or plan: extract the items and ASK if the user wants you to add them as tasks
- If it's a journal entry or reflection: ASK if the user wants to save it as a reflection
- If it's a screenshot from another app (productivity, calendar): extract relevant tasks/plans and ASK if they want to import them
- If it's a mood board or emotional content: acknowledge what you see and ASK if they want to log their mood
- Always confirm what you extracted before taking action`;
}

// ============= TOOL DEFINITIONS =============

function getToolDefinitions() {
  return [
    {
      type: "function",
      function: {
        name: "add_task_to_planner",
        description: "Add a task to the user's daily planner. Use task bank IDs when available, or create a custom task.",
        parameters: {
          type: "object",
          properties: {
            task_bank_id: { type: "string", description: "ID from admin_task_bank to adopt (preferred)" },
            title: { type: "string", description: "Custom task title if not from bank" },
            emoji: { type: "string", description: "Emoji for custom task" },
            scheduled_date: { type: "string", description: "Date in YYYY-MM-DD format. Defaults to today." },
          },
          required: ["title"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "log_mood",
        description: "Log the user's current mood/emotion.",
        parameters: {
          type: "object",
          properties: {
            emotion: { type: "string", description: "The emotion name (e.g., 'happy', 'anxious', 'calm')" },
            valence: { type: "string", enum: ["positive", "negative", "neutral"], description: "Emotional valence" },
            category: { type: "string", description: "Category like 'joy', 'sadness', 'anger', 'fear', 'surprise'" },
          },
          required: ["emotion", "valence", "category"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "adopt_routine",
        description: "Adopt a routine from the routines library for the user.",
        parameters: {
          type: "object",
          properties: {
            routine_id: { type: "string", description: "UUID of the routine from routines_bank" },
          },
          required: ["routine_id"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "suggest_breathing",
        description: "Suggest a breathing exercise to the user. Returns exercise details for display.",
        parameters: {
          type: "object",
          properties: {
            exercise_id: { type: "string", description: "UUID of the breathing exercise" },
            reason: { type: "string", description: "Brief reason for suggesting this exercise" },
          },
          required: ["exercise_id"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_journal_prompt",
        description: "Create a journaling prompt for the user.",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "The journaling prompt/question" },
            mood: { type: "string", description: "Suggested mood tag" },
          },
          required: ["prompt"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_routine_suggestions",
        description: "Get routine suggestions filtered by category. Returns routines for the user to choose from.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "Category to filter by (optional)" },
            limit: { type: "number", description: "Max results (default 5)" },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_task_suggestions",
        description: "Get task suggestions from the task bank. Returns tasks for the user to choose from.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "Category to filter by (optional)" },
            time_period: { type: "string", description: "Time period filter: morning, afternoon, evening (optional)" },
            limit: { type: "number", description: "Max results (default 5)" },
          },
          additionalProperties: false,
        },
      },
    },
  ];
}


// ============= MODE-FILTERED TOOLS =============

const MODE_TOOLS: Record<string, string[]> = {
  coach: ["add_task_to_planner", "log_mood", "adopt_routine", "suggest_breathing", "create_journal_prompt", "get_routine_suggestions", "get_task_suggestions"],
  assistant: ["add_task_to_planner", "get_task_suggestions", "get_routine_suggestions", "adopt_routine"],
  companion: ["log_mood", "suggest_breathing", "create_journal_prompt"],
};

function getToolsForMode(mode?: string) {
  const allTools = getToolDefinitions();
  const allowed = MODE_TOOLS[mode || "coach"];
  if (!allowed) return allTools;
  return allTools.filter((t: any) => allowed.includes(t.function.name));
}

async function executeToolAction(supabase: any, userId: string, fnName: string, args: any) {
  try {
    switch (fnName) {
      case "add_task_to_planner":
        return await addTaskToPlanner(supabase, userId, args);
      case "log_mood":
        return await logMood(supabase, userId, args);
      case "adopt_routine":
        return await adoptRoutine(supabase, userId, args);
      case "suggest_breathing":
        return await suggestBreathing(supabase, args);
      case "create_journal_prompt":
        return {
          success: true,
          action: "create_journal_prompt",
          message: `Journal prompt: "${args.prompt}"`,
          created: {
            title: args.prompt,
            mood: args.mood,
            cta: "Start Writing",
            deepLink: `/app/reflections/free-form?prompt=${encodeURIComponent(args.prompt || "")}${args.mood ? `&mood=${encodeURIComponent(args.mood)}` : ""}`,
          },
        };
      case "get_routine_suggestions":
        return await getRoutineSuggestions(supabase, args);
      case "get_task_suggestions":
        return await getTaskSuggestions(supabase, args);
      default:
        return { success: false, error: `Unknown tool: ${fnName}` };
    }
  } catch (e) {
    console.error(`Tool error (${fnName}):`, e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function addTaskToPlanner(supabase: any, userId: string, args: any) {
  const today = new Date().toISOString().split("T")[0];
  const scheduledDate = args.scheduled_date || today;

  let taskData: any = {
    user_id: userId,
    title: args.title,
    emoji: args.emoji || "✅",
    scheduled_date: scheduledDate,
    is_active: true,
    repeat_pattern: "none",
    order_index: 0,
  };

  // If task_bank_id provided, look up details from bank
  if (args.task_bank_id) {
    const { data: bankTask } = await supabase
      .from("admin_task_bank")
      .select("title, emoji, color, duration_minutes, time_period, repeat_pattern, description, goal_enabled, goal_type, goal_target, goal_unit")
      .eq("id", args.task_bank_id)
      .single();

    if (bankTask) {
      taskData = {
        ...taskData,
        title: bankTask.title,
        emoji: bankTask.emoji,
        color: bankTask.color,
        duration_minutes: bankTask.duration_minutes,
        time_period: bankTask.time_period,
        repeat_pattern: bankTask.repeat_pattern || "none",
        description: bankTask.description,
        // task_bank_id column doesn't exist in user_tasks, skip it
        goal_enabled: bankTask.goal_enabled,
        goal_type: bankTask.goal_type,
        goal_target: bankTask.goal_target,
        goal_unit: bankTask.goal_unit,
      };
    }
  }

  const { data, error } = await supabase
    .from("user_tasks")
    .insert(taskData)
    .select("id, title, emoji, scheduled_date")
    .single();

  if (error) {
    return { success: false, error: error.message, action: "add_task_to_planner" };
  }

  return {
    success: true,
    action: "add_task_to_planner",
    message: `Added "${data.title}" to your planner for ${data.scheduled_date}`,
    created: {
      ...data,
      cta: "Open Task",
      deepLink: `/app/home/edit/${data.id}`,
    },
  };
}

async function logMood(supabase: any, userId: string, args: any) {
  const { data, error } = await supabase
    .from("emotion_logs")
    .insert({
      user_id: userId,
      emotion: args.emotion,
      valence: args.valence,
      category: args.category,
    })
    .select("id, emotion, valence")
    .single();

  if (error) {
    return { success: false, error: error.message, action: "log_mood" };
  }

  return {
    success: true,
    action: "log_mood",
    message: `Logged your mood: ${args.emotion}`,
    created: {
      ...data,
      cta: "Open Mood History",
      deepLink: "/app/emotion/history",
    },
  };
}

async function adoptRoutine(supabase: any, userId: string, args: any) {
  // Check if routine exists
  const { data: routine } = await supabase
    .from("routines_bank")
    .select("id, title, emoji")
    .eq("id", args.routine_id)
    .single();

  if (!routine) {
    return { success: false, error: "Routine not found", action: "adopt_routine" };
  }

  // Check if already adopted
  const { data: existing } = await supabase
    .from("user_adopted_routines")
    .select("id")
    .eq("user_id", userId)
    .eq("routine_id", args.routine_id)
    .limit(1);

  if (existing?.length) {
    return {
      success: true,
      action: "adopt_routine",
      message: `You already have "${routine.title}" in your routines!`,
      created: {
        ...routine,
        cta: "Open Routine",
        deepLink: `/app/routines/${routine.id}`,
      },
    };
  }

  const { error } = await supabase
    .from("user_adopted_routines")
    .insert({ user_id: userId, routine_id: args.routine_id });

  if (error) {
    return { success: false, error: error.message, action: "adopt_routine" };
  }

  return {
    success: true,
    action: "adopt_routine",
    message: `Added "${routine.title}" to your routines!`,
    created: {
      ...routine,
      cta: "Open Routine",
      deepLink: `/app/routines/${routine.id}`,
    },
  };
}

async function suggestBreathing(supabase: any, args: any) {
  const { data } = await supabase
    .from("breathing_exercises")
    .select("id, name, emoji, category, description, inhale_seconds, exhale_seconds")
    .eq("id", args.exercise_id)
    .single();

  if (!data) {
    return { success: false, error: "Exercise not found", action: "suggest_breathing" };
  }

  return {
    success: true,
    action: "suggest_breathing",
    message: `Suggested breathing exercise: ${data.emoji} ${data.name}`,
    created: { ...data, reason: args.reason, deepLink: `/app/breathe?exercise=${data.id}` },
  };
}

async function getRoutineSuggestions(supabase: any, args: any) {
  let query = supabase
    .from("routines_bank")
    .select("id, title, emoji, category, subtitle")
    .eq("is_active", true)
    .order("sort_order")
    .limit(args.limit || 5);

  if (args.category) {
    query = query.eq("category", args.category);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message, action: "get_routine_suggestions" };

  return {
    success: true,
    action: "get_routine_suggestions",
    message: `Found ${data?.length || 0} routines`,
    created: { routines: data },
  };
}

async function getTaskSuggestions(supabase: any, args: any) {
  let query = supabase
    .from("admin_task_bank")
    .select("id, title, emoji, category, description, duration_minutes, time_period")
    .eq("is_active", true)
    .order("sort_order")
    .limit(args.limit || 5);

  if (args.category) query = query.eq("category", args.category);
  if (args.time_period) query = query.eq("time_period", args.time_period);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message, action: "get_task_suggestions" };

  return {
    success: true,
    action: "get_task_suggestions",
    message: `Found ${data?.length || 0} task suggestions`,
    created: { tasks: data },
  };
}

// ============= FOLLOW-UP SUGGESTIONS =============

async function generateFollowUps(apiKey: string, messages: Message[], mode?: string): Promise<string[]> {
  try {
    const followUpPrompt = `Based on this conversation, suggest 1-2 short follow-up actions the user might want to take next. 
Return ONLY a JSON array of 1-2 strings, each 3-6 words. Do NOT repeat anything already discussed. Make them feel like natural next steps.
Consider the current mode: ${mode || 'coach'}. Keep suggestions focused and contextually relevant.`;

    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          ...messages.slice(-6),
          { role: "user", content: followUpPrompt },
        ],
      }),
    });

    if (!resp.ok) return [];
    const result = await resp.json();
    const content = result.choices?.[0]?.message?.content || "";
    
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed)) return parsed.slice(0, 3).map((s: any) => String(s));
    return [];
  } catch {
    return [];
  }
}
