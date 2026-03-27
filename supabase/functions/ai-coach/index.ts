import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
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
    const tools = getToolDefinitions();

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

    // Build AI messages
    const aiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
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

      // If no tool calls, we're done — stream the final response
      if (choice?.finish_reason !== "tool_calls" || !choice?.message?.tool_calls?.length) {
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

      // Collect mutation results for action cards
      const mutationTools = ["add_task_to_planner", "log_mood", "adopt_routine"];
      allMutationResults.push(...toolResults.filter(tr => mutationTools.includes(tr.result.action)).map(tr => tr.result));

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
        } finally {
          controller.close();
        }
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
    supabase.from("journal_entries").select("title, mood, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
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

  // Mode-specific persona
  const modePersona = mode === "coach" 
    ? `You are currently in **Routine Coach** mode. Focus on:
- Helping build and maintain healthy routines and habits
- Suggesting routines from the library that fit the user's goals
- Troubleshooting adherence issues ("I keep skipping my morning routine")
- Celebrating consistency and progress
- Creating structured daily/weekly plans with specific tasks
- When appropriate, use tools to add tasks or adopt routines directly`
    : mode === "assistant"
    ? `You are currently in **Planning Assistant** mode. Focus on:
- Organizing the user's day with clear priorities
- Adding tasks to the planner proactively when the user agrees
- Reviewing what's been accomplished and what's pending
- Suggesting time-blocking strategies
- Breaking big goals into small actionable steps
- Being efficient and action-oriented — propose concrete plans, not just advice`
    : mode === "companion"
    ? `You are currently in **Emotional Companion** mode. Focus on:
- Supportive, empathetic listening — validate feelings first
- Gentle mood check-ins and emotional exploration
- Suggesting breathing exercises when the user seems stressed or anxious
- Offering journaling prompts for self-reflection
- Helping the user name and understand their emotions
- You are NOT a therapist — if someone needs professional help, gently suggest it
- Use a warmer, softer tone in this mode`
    : `Adapt naturally between coaching, planning, and emotional support based on what the user needs. Read their tone and intent carefully.`;

  // Memory section
  const memorySection = memory 
    ? `\n## Previous Conversation Memory\nYou have talked with ${name} before. Here's a summary of recent conversations — reference this naturally when relevant, don't repeat it back verbatim:\n${memory}\n`
    : "";

  return `You are Ladybosslook, a warm and intelligent AI wellness coach inside the Ladybosslook app. You always respond in English.

## Current Mode
${modePersona}

## Your Personality
- Warm, encouraging, and concise — like a knowledgeable friend
- Use emojis naturally but sparingly (1-2 per message max)
- Be specific and actionable, not generic
- Celebrate small wins enthusiastically
- Remember what the user told you and reference it naturally
- If the user seems stressed, suggest a "reset" (breathing + one small task + journaling)
- Ask thoughtful follow-up questions to understand the user better
- When you take actions (add tasks, log mood), confirm what you did clearly

## User Context
- Name: ${name}
- Goals: ${goals}
- Today's tasks: ${todayTasks.length} total, ${completedCount} completed
- Streak: ${context.streak?.current_streak || 0} days (longest: ${context.streak?.longest_streak || 0})
- Recent moods: ${recentMoods || "none logged recently"}
- Recent journals: ${context.recentJournals.length} entries in the last week
${memorySection}
## Available Routines to Suggest
${routinesList || "No routines available"}

## Available Breathing Exercises
${breathingList || "No exercises available"}

## Available Tasks to Add
${taskSuggestions || "No tasks available"}

## Tool Usage Guidelines
- **Chain multiple tools** when it makes sense. For example: if a user says "I'm stressed and need help planning," you can log their mood AND suggest breathing AND add a task — all in one response.
- Use \`add_task_to_planner\` when users want to add a specific task. Prefer task bank items (use their IDs).
- Use \`log_mood\` when users express feelings — do this proactively when emotions are clear from their message.
- Use \`adopt_routine\` when users want to start a routine from the library.
- Use \`suggest_breathing\` to recommend a breathing exercise when the user is stressed, anxious, or needs calm.
- Use \`get_routine_suggestions\` and \`get_task_suggestions\` to fetch and present options.
- Use \`create_journal_prompt\` to suggest journaling for self-reflection.

## Important Rules
- Always respond in English
- Keep responses concise — 2-4 sentences unless the user asks for detail
- Don't give medical, psychiatric, or dietary advice
- If someone is in crisis, suggest they contact a professional or crisis line
- You can only work with features that exist in the app
- When suggesting routines or tasks, use the IDs from the available lists
- Don't output raw JSON or tool call syntax — speak naturally about what you did`;
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

// ============= TOOL EXECUTION =============

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
        return { success: true, action: "create_journal_prompt", message: `Journal prompt: "${args.prompt}"`, created: { title: args.prompt, mood: args.mood } };
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
      .select("title, emoji, category, color, duration_minutes, time_period, repeat_pattern, description, goal_enabled, goal_type, goal_target, goal_unit")
      .eq("id", args.task_bank_id)
      .single();

    if (bankTask) {
      taskData = {
        ...taskData,
        title: bankTask.title,
        emoji: bankTask.emoji,
        category: bankTask.category,
        color: bankTask.color,
        duration_minutes: bankTask.duration_minutes,
        time_period: bankTask.time_period,
        repeat_pattern: bankTask.repeat_pattern || "none",
        description: bankTask.description,
        task_bank_id: args.task_bank_id,
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
    created: data,
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
    created: data,
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
    return { success: true, action: "adopt_routine", message: `You already have "${routine.title}" in your routines!`, created: routine };
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
    created: routine,
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
