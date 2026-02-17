import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface RequestBody {
  messages: Message[];
  currentPage?: string;
}

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

async function resolveRitualId(supabase: any, idOrTitle: string): Promise<{ id: string; title: string } | null> {
  if (isValidUUID(idOrTitle)) {
    const { data } = await supabase.from("routines_bank").select("id, title").eq("id", idOrTitle).single();
    return data;
  }
  // Fallback: search by title (case-insensitive)
  const { data } = await supabase.from("routines_bank").select("id, title").ilike("title", idOrTitle).limit(1).single();
  return data;
}

async function resolveActionId(supabase: any, idOrTitle: string): Promise<{ id: string; title: string } | null> {
  if (isValidUUID(idOrTitle)) {
    const { data } = await supabase.from("admin_task_bank").select("id, title").eq("id", idOrTitle).single();
    return data;
  }
  const { data } = await supabase.from("admin_task_bank").select("id, title").ilike("title", idOrTitle).limit(1).single();
  return data;
}

async function resolveBreathingId(supabase: any, idOrName: string): Promise<{ id: string; name: string } | null> {
  if (isValidUUID(idOrName)) {
    const { data } = await supabase.from("breathing_exercises").select("id, name").eq("id", idOrName).single();
    return data;
  }
  const { data } = await supabase.from("breathing_exercises").select("id, name").ilike("name", idOrName).limit(1).single();
  return data;
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

    // Determine which tools can execute directly vs which are form-fill only
    const directExecutionTools = [
      "create_action_in_bank",
      "create_ritual_in_bank",
      "create_breathing_exercise",
      "update_action_in_bank",
      "update_ritual_in_bank",
      "update_breathing_exercise",
      "add_subtasks_to_action",
      "delete_subtask",
      "delete_action_from_bank",
      "delete_ritual_from_bank",
      "delete_breathing_exercise",
      "add_tasks_to_ritual",
      "delete_ritual_task",
      "generate_ritual_cover",
    ];

    const allTools = getToolDefinitions(currentPage);

    // First AI call
    const aiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const firstResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: allTools,
        tool_choice: "auto",
      }),
    });

    if (!firstResponse.ok) {
      return handleAIError(firstResponse);
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    // If the AI wants to call a direct-execution tool, execute it and get a follow-up response
    if (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls?.length) {
      const toolCalls = choice.message.tool_calls;
      const hasDirectTool = toolCalls.some((tc: any) => directExecutionTools.includes(tc.function?.name));

      if (hasDirectTool) {
        // Execute tools and collect results
        const toolResults: { tool_call_id: string; result: any }[] = [];
        
        for (const tc of toolCalls) {
          const fnName = tc.function?.name;
          let args: any;
          try {
            args = JSON.parse(tc.function?.arguments || "{}");
          } catch {
            args = {};
          }

          if (directExecutionTools.includes(fnName)) {
            const result = await executeToolAction(supabase, fnName, args);
            toolResults.push({ tool_call_id: tc.id, result });
          } else {
            toolResults.push({ tool_call_id: tc.id, result: { success: true, message: "Form content generated" } });
          }
        }

        // Build messages for follow-up including tool results
        const followUpMessages: Message[] = [
          ...aiMessages,
          choice.message,
          ...toolResults.map(tr => ({
            role: "tool" as const,
            content: JSON.stringify(tr.result),
            tool_call_id: tr.tool_call_id,
          })),
        ];

        // Second AI call to get natural language confirmation (streaming)
        const secondResponse = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: followUpMessages,
            stream: true,
          }),
        });

        if (!secondResponse.ok) {
          return handleAIError(secondResponse);
        }

        // Prepend a custom SSE event with action results before streaming the AI response
        const actionData = toolResults.map(tr => tr.result);
        const actionEvent = `data: ${JSON.stringify({ action_results: actionData })}\n\n`;
        const actionEncoder = new TextEncoder();
        const actionChunk = actionEncoder.encode(actionEvent);

        // Create a combined stream
        const combinedStream = new ReadableStream({
          async start(controller) {
            // Send action results first
            controller.enqueue(actionChunk);

            // Then pipe the AI stream
            const reader = secondResponse.body!.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
            } finally {
              controller.close();
            }
          }
        });

        return new Response(combinedStream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    // No direct-execution tools called — stream normally
    const streamResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
        tools: allTools,
        tool_choice: "auto",
      }),
    });

    if (!streamResponse.ok) {
      return handleAIError(streamResponse);
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

async function handleAIError(response: Response) {
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

// ============= TOOL EXECUTION =============

async function executeToolAction(supabase: any, fnName: string, args: any): Promise<any> {
  try {
    switch (fnName) {
      case "create_action_in_bank":
        return await createActionInBank(supabase, args);
      case "create_ritual_in_bank":
        return await createRitualInBank(supabase, args);
      case "create_breathing_exercise":
        return await createBreathingExercise(supabase, args);
      case "update_action_in_bank":
        return await updateActionInBank(supabase, args);
      case "update_ritual_in_bank":
        return await updateRitualInBank(supabase, args);
      case "update_breathing_exercise":
        return await updateBreathingExercise(supabase, args);
      case "add_subtasks_to_action":
        return await addSubtasksToAction(supabase, args);
      case "delete_subtask":
        return await deleteSubtask(supabase, args);
      case "delete_action_from_bank":
        return await deleteActionFromBank(supabase, args);
      case "delete_ritual_from_bank":
        return await deleteRitualFromBank(supabase, args);
      case "delete_breathing_exercise":
        return await deleteBreathingExerciseAction(supabase, args);
      case "add_tasks_to_ritual":
        return await addTasksToRitual(supabase, args);
      case "delete_ritual_task":
        return await deleteRitualTask(supabase, args);
      case "generate_ritual_cover":
        return await generateRitualCover(supabase, args);
      default:
        return { success: false, error: `Unknown tool: ${fnName}` };
    }
  } catch (e) {
    console.error(`Tool execution error (${fnName}):`, e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function createActionInBank(supabase: any, args: any) {
  const { data, error } = await supabase.from("admin_task_bank").insert({
    title: args.title,
    emoji: args.emoji || "✨",
    category: args.category || "general",
    color: args.color || "#8B5CF6",
    description: args.description || null,
    duration_minutes: args.duration_minutes || null,
    time_period: args.time_period || null,
    repeat_pattern: args.repeat_pattern || "daily",
    is_active: true,
    is_popular: args.is_popular || false,
    tag: args.tag || null,
  }).select("id, title, emoji, category").single();

  if (error) {
    console.error("Insert action error:", error);
    return { success: false, error: error.message, action: "create_action_in_bank" };
  }

  return {
    success: true,
    action: "create_action_in_bank",
    message: `Created action "${data.title}" in ${data.category} category`,
    created: data,
  };
}

async function createRitualInBank(supabase: any, args: any) {
  const { data: ritual, error: ritualError } = await supabase.from("routines_bank").insert({
    title: args.title,
    subtitle: args.subtitle || null,
    description: args.description || null,
    category: args.category || "general",
    emoji: args.emoji || "🌟",
    color: args.color || "#8B5CF6",
    schedule_type: args.schedule_type || "daily",
    is_active: true,
    is_popular: args.is_popular || false,
  }).select("id, title, emoji, category").single();

  if (ritualError) {
    console.error("Insert ritual error:", ritualError);
    return { success: false, error: ritualError.message, action: "create_ritual_in_bank" };
  }

  const sectionMap: Record<string, string> = {};
  if (args.sections?.length) {
    for (let i = 0; i < args.sections.length; i++) {
      const sec = args.sections[i];
      const { data: sectionData, error: secError } = await supabase.from("routines_bank_sections").insert({
        routine_id: ritual.id,
        title: sec.title,
        section_order: i,
        is_active: true,
      }).select("id").single();

      if (!secError && sectionData) {
        sectionMap[sec.title] = sectionData.id;
      }
    }
  }

  let taskCount = 0;
  if (args.tasks?.length) {
    for (let i = 0; i < args.tasks.length; i++) {
      const task = args.tasks[i];
      const sectionId = task.section_title ? sectionMap[task.section_title] : null;
      
      const { error: taskError } = await supabase.from("routines_bank_tasks").insert({
        routine_id: ritual.id,
        section_id: sectionId || null,
        section_title: task.section_title || null,
        title: task.title,
        emoji: task.emoji || "✅",
        duration_minutes: task.duration_minutes || null,
        task_order: i,
        drip_day: task.drip_day || null,
        schedule_days: task.schedule_days || null,
      });

      if (!taskError) taskCount++;
    }
  }

  return {
    success: true,
    action: "create_ritual_in_bank",
    message: `Created ritual "${ritual.title}" with ${Object.keys(sectionMap).length} sections and ${taskCount} tasks`,
    created: { ...ritual, sectionCount: Object.keys(sectionMap).length, taskCount },
  };
}

async function createBreathingExercise(supabase: any, args: any) {
  const { data, error } = await supabase.from("breathing_exercises").insert({
    name: args.name,
    description: args.description || null,
    category: args.category || "relaxation",
    emoji: args.emoji || "🌬️",
    inhale_seconds: args.inhale_seconds || 4,
    inhale_hold_seconds: args.inhale_hold_seconds || 0,
    exhale_seconds: args.exhale_seconds || 4,
    exhale_hold_seconds: args.exhale_hold_seconds || 0,
    inhale_method: args.inhale_method || "nose",
    exhale_method: args.exhale_method || "mouth",
    is_active: true,
    is_premium: args.is_premium || false,
  }).select("id, name, emoji, category").single();

  if (error) {
    console.error("Insert breathing error:", error);
    return { success: false, error: error.message, action: "create_breathing_exercise" };
  }

  return {
    success: true,
    action: "create_breathing_exercise",
    message: `Created breathing exercise "${data.name}"`,
    created: data,
  };
}

// ============= UPDATE FUNCTIONS =============

async function updateActionInBank(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing action ID", action: "update_action_in_bank" };
  }

  const resolved = await resolveActionId(supabase, args.id);
  if (!resolved) {
    return { success: false, error: `Action not found: "${args.id}". Use the exact UUID from context.`, action: "update_action_in_bank" };
  }

  const updates: Record<string, any> = {};
  if (args.title !== undefined) updates.title = args.title;
  if (args.emoji !== undefined) updates.emoji = args.emoji;
  if (args.category !== undefined) updates.category = args.category;
  if (args.color !== undefined) updates.color = args.color;
  if (args.description !== undefined) updates.description = args.description;
  if (args.duration_minutes !== undefined) updates.duration_minutes = args.duration_minutes;
  if (args.time_period !== undefined) updates.time_period = args.time_period;
  if (args.repeat_pattern !== undefined) updates.repeat_pattern = args.repeat_pattern;
  if (args.tag !== undefined) updates.tag = args.tag;
  if (args.is_popular !== undefined) updates.is_popular = args.is_popular;
  if (args.is_active !== undefined) updates.is_active = args.is_active;

  const { data, error } = await supabase.from("admin_task_bank")
    .update(updates)
    .eq("id", resolved.id)
    .select("id, title, emoji, category")
    .single();

  if (error) {
    console.error("Update action error:", error);
    return { success: false, error: error.message, action: "update_action_in_bank" };
  }

  return {
    success: true,
    action: "update_action_in_bank",
    message: `Updated action "${data.title}"`,
    created: data,
  };
}

async function updateRitualInBank(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing ritual ID", action: "update_ritual_in_bank" };
  }

  const resolved = await resolveRitualId(supabase, args.id);
  if (!resolved) {
    return { success: false, error: `Ritual not found: "${args.id}". Use the exact UUID from context.`, action: "update_ritual_in_bank" };
  }

  const updates: Record<string, any> = {};
  if (args.title !== undefined) updates.title = args.title;
  if (args.subtitle !== undefined) updates.subtitle = args.subtitle;
  if (args.description !== undefined) updates.description = args.description;
  if (args.category !== undefined) updates.category = args.category;
  if (args.emoji !== undefined) updates.emoji = args.emoji;
  if (args.color !== undefined) updates.color = args.color;
  if (args.schedule_type !== undefined) updates.schedule_type = args.schedule_type;
  if (args.is_popular !== undefined) updates.is_popular = args.is_popular;
  if (args.is_active !== undefined) updates.is_active = args.is_active;

  const { data, error } = await supabase.from("routines_bank")
    .update(updates)
    .eq("id", resolved.id)
    .select("id, title, emoji, category, color")
    .single();

  if (error) {
    console.error("Update ritual error:", error);
    return { success: false, error: error.message, action: "update_ritual_in_bank" };
  }

  return {
    success: true,
    action: "update_ritual_in_bank",
    message: `Updated ritual "${data.title}" — color is now ${data.color}`,
    created: data,
  };
}

async function updateBreathingExercise(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing exercise ID", action: "update_breathing_exercise" };
  }

  const resolved = await resolveBreathingId(supabase, args.id);
  if (!resolved) {
    return { success: false, error: `Breathing exercise not found: "${args.id}". Use the exact UUID from context.`, action: "update_breathing_exercise" };
  }

  const updates: Record<string, any> = {};
  if (args.name !== undefined) updates.name = args.name;
  if (args.description !== undefined) updates.description = args.description;
  if (args.category !== undefined) updates.category = args.category;
  if (args.emoji !== undefined) updates.emoji = args.emoji;
  if (args.inhale_seconds !== undefined) updates.inhale_seconds = args.inhale_seconds;
  if (args.inhale_hold_seconds !== undefined) updates.inhale_hold_seconds = args.inhale_hold_seconds;
  if (args.exhale_seconds !== undefined) updates.exhale_seconds = args.exhale_seconds;
  if (args.exhale_hold_seconds !== undefined) updates.exhale_hold_seconds = args.exhale_hold_seconds;
  if (args.inhale_method !== undefined) updates.inhale_method = args.inhale_method;
  if (args.exhale_method !== undefined) updates.exhale_method = args.exhale_method;
  if (args.is_premium !== undefined) updates.is_premium = args.is_premium;
  if (args.is_active !== undefined) updates.is_active = args.is_active;

  const { data, error } = await supabase.from("breathing_exercises")
    .update(updates)
    .eq("id", resolved.id)
    .select("id, name, emoji, category")
    .single();

  if (error) {
    console.error("Update breathing error:", error);
    return { success: false, error: error.message, action: "update_breathing_exercise" };
  }

  return {
    success: true,
    action: "update_breathing_exercise",
    message: `Updated breathing exercise "${data.name}"`,
    created: data,
  };
}

// ============= SUBTASK FUNCTIONS =============

async function addSubtasksToAction(supabase: any, args: any) {
  if (!args.task_id) {
    return { success: false, error: "Missing task_id (action ID)", action: "add_subtasks_to_action" };
  }
  if (!args.subtasks?.length) {
    return { success: false, error: "No subtasks provided", action: "add_subtasks_to_action" };
  }

  const { data: existing } = await supabase.from("admin_task_bank_subtasks")
    .select("order_index")
    .eq("task_id", args.task_id)
    .order("order_index", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  const inserted = [];
  for (const sub of args.subtasks) {
    const { data, error } = await supabase.from("admin_task_bank_subtasks").insert({
      task_id: args.task_id,
      title: sub.title,
      order_index: nextOrder++,
    }).select("id, title, order_index").single();

    if (!error && data) inserted.push(data);
  }

  return {
    success: true,
    action: "add_subtasks_to_action",
    message: `Added ${inserted.length} subtask(s) to action`,
    created: inserted,
  };
}

async function deleteSubtask(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing subtask ID", action: "delete_subtask" };
  }

  const { error } = await supabase.from("admin_task_bank_subtasks")
    .delete()
    .eq("id", args.id);

  if (error) {
    return { success: false, error: error.message, action: "delete_subtask" };
  }

  return {
    success: true,
    action: "delete_subtask",
    message: `Deleted subtask`,
  };
}

// ============= DELETE FUNCTIONS =============

async function deleteActionFromBank(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing action ID", action: "delete_action_from_bank" };
  }

  const resolved = await resolveActionId(supabase, args.id);
  if (!resolved) {
    return { success: false, error: `Action not found: "${args.id}". Make sure to use the exact UUID from context.`, action: "delete_action_from_bank" };
  }

  // Delete subtasks first
  await supabase.from("admin_task_bank_subtasks")
    .delete()
    .eq("task_id", resolved.id);

  // Delete the action
  const { error } = await supabase.from("admin_task_bank")
    .delete()
    .eq("id", resolved.id);

  if (error) {
    console.error("Delete action error:", error);
    return { success: false, error: error.message, action: "delete_action_from_bank" };
  }

  return {
    success: true,
    action: "delete_action_from_bank",
    message: `Deleted action "${resolved.title}"`,
  };
}

async function deleteRitualFromBank(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing ritual ID", action: "delete_ritual_from_bank" };
  }

  const resolved = await resolveRitualId(supabase, args.id);
  if (!resolved) {
    return { success: false, error: `Ritual not found: "${args.id}". Make sure to use the exact UUID from context.`, action: "delete_ritual_from_bank" };
  }

  // Delete tasks, sections, then the ritual
  await supabase.from("routines_bank_tasks")
    .delete()
    .eq("routine_id", resolved.id);

  await supabase.from("routines_bank_sections")
    .delete()
    .eq("routine_id", resolved.id);

  const { error } = await supabase.from("routines_bank")
    .delete()
    .eq("id", resolved.id);

  if (error) {
    console.error("Delete ritual error:", error);
    return { success: false, error: error.message, action: "delete_ritual_from_bank" };
  }

  return {
    success: true,
    action: "delete_ritual_from_bank",
    message: `Deleted ritual "${resolved.title}" and all its tasks/sections`,
  };
}

async function deleteBreathingExerciseAction(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing exercise ID", action: "delete_breathing_exercise" };
  }

  const resolved = await resolveBreathingId(supabase, args.id);
  if (!resolved) {
    return { success: false, error: `Breathing exercise not found: "${args.id}". Make sure to use the exact UUID from context.`, action: "delete_breathing_exercise" };
  }

  const { error } = await supabase.from("breathing_exercises")
    .delete()
    .eq("id", resolved.id);

  if (error) {
    console.error("Delete breathing error:", error);
    return { success: false, error: error.message, action: "delete_breathing_exercise" };
  }

  return {
    success: true,
    action: "delete_breathing_exercise",
    message: `Deleted breathing exercise "${resolved.name}"`,
  };
}

// ============= RITUAL TASK MANAGEMENT =============

async function addTasksToRitual(supabase: any, args: any) {
  if (!args.ritual_id) {
    return { success: false, error: "Missing ritual_id", action: "add_tasks_to_ritual" };
  }
  if (!args.tasks?.length) {
    return { success: false, error: "No tasks provided", action: "add_tasks_to_ritual" };
  }

  const resolved = await resolveRitualId(supabase, args.ritual_id);
  if (!resolved) {
    return { success: false, error: `Ritual not found: "${args.ritual_id}". Use the exact UUID from context.`, action: "add_tasks_to_ritual" };
  }
  const ritualId = resolved.id;

  // Get current max task_order
  const { data: existing } = await supabase.from("routines_bank_tasks")
    .select("task_order")
    .eq("routine_id", ritualId)
    .order("task_order", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.task_order ?? -1) + 1;

  const inserted = [];
  for (const task of args.tasks) {
    const { data, error } = await supabase.from("routines_bank_tasks").insert({
      routine_id: ritualId,
      section_id: task.section_id || null,
      section_title: task.section_title || null,
      title: task.title,
      emoji: task.emoji || "✅",
      duration_minutes: task.duration_minutes || null,
      task_order: nextOrder++,
      drip_day: task.drip_day || null,
      schedule_days: task.schedule_days || null,
    }).select("id, title, emoji, task_order").single();

    if (!error && data) inserted.push(data);
  }

  return {
    success: true,
    action: "add_tasks_to_ritual",
    message: `Added ${inserted.length} task(s) to ritual`,
    created: inserted,
  };
}

async function deleteRitualTask(supabase: any, args: any) {
  if (!args.id) {
    return { success: false, error: "Missing task ID", action: "delete_ritual_task" };
  }

  const { data: task } = await supabase.from("routines_bank_tasks")
    .select("title")
    .eq("id", args.id)
    .single();

  const { error } = await supabase.from("routines_bank_tasks")
    .delete()
    .eq("id", args.id);

  if (error) {
    return { success: false, error: error.message, action: "delete_ritual_task" };
  }

  return {
    success: true,
    action: "delete_ritual_task",
    message: `Deleted task "${task?.title || args.id}" from ritual`,
  };
}

// ============= COVER GENERATION =============

async function generateRitualCover(supabase: any, args: any) {
  if (!args.ritual_id) {
    return { success: false, error: "Missing ritual_id", action: "generate_ritual_cover" };
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return { success: false, error: "LOVABLE_API_KEY not configured", action: "generate_ritual_cover" };
  }

  const resolved = await resolveRitualId(supabase, args.ritual_id);
  if (!resolved) {
    return { success: false, error: `Ritual not found: "${args.ritual_id}". Use the exact UUID from context.`, action: "generate_ritual_cover" };
  }

  // Fetch the ritual details
  const { data: ritual, error: fetchError } = await supabase.from("routines_bank")
    .select("id, title, subtitle, description, category, emoji")
    .eq("id", resolved.id)
    .single();

  if (fetchError || !ritual) {
    return { success: false, error: "Ritual not found", action: "generate_ritual_cover" };
  }

  // Fetch ritual tasks for icon context
  const { data: tasks } = await supabase.from("routines_bank_tasks")
    .select("title, emoji")
    .eq("routine_id", resolved.id)
    .order("task_order")
    .limit(6);

  const taskIcons = (tasks || []).map((t: any) => t.title).join(", ");

  // Build Simora-style prompt using the user's design guide
  const customDesc = args.description || "";
  const prompt = `Square mobile app cover illustration for a wellness app called Simora.

Style: soft pastel digital illustration, feminine self-care aesthetic,
calming and uplifting mood, clean modern wellness design,
gentle feminine wellness style, friendly digital illustration,
soft glow and sparkles, modern wellness illustration, minimal but expressive objects.

Main scene:
${customDesc || `A cover representing "${ritual.title}"${ritual.description ? ` — ${ritual.description}` : ""}`}

Floating around:
${taskIcons ? `Soft illustrated icons representing: ${taskIcons}` : "Small floating hearts, stars, and gentle sparkle elements"}

Character direction (if applicable):
gentle confident woman, positive energy, soft athletic outfit,
calm confidence, empowering feminine energy, warm expression.

Background:
dreamy pastel gradient sky (lavender, pastel pink, soft blue, warm sunrise gradients),
soft sparkles, light nature elements, minimal but warm environment,
gentle purple accents, soft glow lighting.

Composition:
centered hero element, balanced clean layout,
designed as a mobile app ritual cover.
The background gradient MUST extend to all edges — NO white borders or padding.

ABSOLUTELY NO text, words, letters, or typography of any kind.
Clean cover illustration only.`;

  console.log(`[generate_ritual_cover] Generating for ritual: ${ritual.title}`);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI image generation error:", response.status, errText);
      if (response.status === 429) {
        return { success: false, error: "Rate limit exceeded. Try again in a moment.", action: "generate_ritual_cover" };
      }
      if (response.status === 402) {
        return { success: false, error: "AI credits exhausted.", action: "generate_ritual_cover" };
      }
      return { success: false, error: `AI error: ${response.status}`, action: "generate_ritual_cover" };
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response");
      return { success: false, error: "No image was generated", action: "generate_ritual_cover" };
    }

    // Upload to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `ritual-${resolved.id}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("routine-covers")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}`, action: "generate_ritual_cover" };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("routine-covers")
      .getPublicUrl(fileName);

    // Update the ritual with the cover URL
    const { error: updateError } = await supabase.from("routines_bank")
      .update({ cover_image_url: publicUrl })
      .eq("id", resolved.id);

    if (updateError) {
      console.error("Update ritual cover error:", updateError);
      return { success: false, error: `Cover uploaded but failed to update ritual: ${updateError.message}`, action: "generate_ritual_cover" };
    }

    console.log(`[generate_ritual_cover] Cover generated and saved: ${publicUrl}`);

    return {
      success: true,
      action: "generate_ritual_cover",
      message: `Generated and applied Simora-style cover for "${ritual.title}"`,
      created: { title: ritual.title, emoji: ritual.emoji, coverUrl: publicUrl },
    };
  } catch (e) {
    console.error("Cover generation error:", e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", action: "generate_ritual_cover" };
  }
}

// ============= CONTEXT =============

async function fetchContext(supabase: any, currentPage?: string) {
  const context: Record<string, any> = {};

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

  // Fetch tools-page-specific context
  if (currentPage === "tools") {
    const [
      { data: categories },
      { data: recentActions },
      { data: recentRituals },
      { data: breathingExercises },
      { data: actionSubtasks },
      { data: ritualTasks },
      { data: ritualSections },
    ] = await Promise.all([
      supabase.from("routine_categories").select("id, name, slug, icon").eq("is_active", true).order("display_order"),
      supabase.from("admin_task_bank").select("id, title, emoji, category, color, description, time_period").eq("is_active", true).order("sort_order").limit(20),
      supabase.from("routines_bank").select("id, title, emoji, category, color, description").eq("is_active", true).order("sort_order").limit(50),
      supabase.from("breathing_exercises").select("id, name, emoji, category, description").eq("is_active", true).order("sort_order").limit(10),
      supabase.from("admin_task_bank_subtasks").select("id, task_id, title, order_index").order("order_index").limit(200),
      supabase.from("routines_bank_tasks").select("id, routine_id, title, emoji, duration_minutes, task_order, section_id, section_title").order("task_order").limit(200),
    ]);

    context.categories = categories || [];
    context.existingActions = recentActions || [];
    context.existingRituals = recentRituals || [];
    context.breathingExercises = breathingExercises || [];
    context.actionSubtasks = actionSubtasks || [];
    context.ritualTasks = ritualTasks || [];
  }

  if (currentPage === "routines") {
    const { data: routineCategories } = await supabase
      .from("routine_categories").select("id, name, slug, emoji: icon").eq("is_active", true).order("display_order");
    context.routineCategories = routineCategories || [];

    const { data: routinePlans } = await supabase
      .from("routine_plans").select("id, name, description, category_id").eq("is_published", true).limit(10);
    context.recentRoutines = routinePlans || [];
  }

  if (currentPage === "communications" || currentPage === "community") {
    const { data: recentPosts } = await supabase
      .from("feed_posts").select("id, title, content, post_type, created_at").order("created_at", { ascending: false }).limit(5);
    context.recentPosts = recentPosts || [];
  }

  if (currentPage === "programs") {
    const { data: programs } = await supabase
      .from("program_catalog").select("slug, title, type").eq("is_active", true).limit(20);
    context.programs = programs || [];
  }

  return context;
}

// ============= SYSTEM PROMPT =============

function buildSystemPrompt(context: Record<string, any>, currentPage?: string): string {
  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  });

  let prompt = `You are Razie's AI Admin Assistant for the Ladyboss / Simora platform. You're smart, proactive, and action-oriented.

Today is ${today}.

## Platform Stats
- Total Users: ${context.stats?.totalUsers || 0}
- Active Enrollments: ${context.stats?.activeEnrollments || 0}

## Active Program Rounds
${context.activeRounds?.map((r: any) => `- ${r.round_name} (${r.program_slug}) - Status: ${r.status}, Starts: ${r.start_date}`).join("\n") || "None"}

## Feed Channels Available
${context.feedChannels?.map((c: any) => `- "${c.name}" (ID: ${c.id}, slug: ${c.slug})`).join("\n") || "None"}
`;

  if (currentPage === "tools") {
    prompt += `
## Current Page: TOOLS (Actions Bank, Rituals Bank, Breathing Exercises)

You can DIRECTLY CREATE, UPDATE, and DELETE items in the database. When the user asks you to do something, USE THE TOOLS to do it immediately.

### Available Categories
${context.categories?.map((c: any) => `- ${c.icon || "📌"} ${c.name} (slug: "${c.slug}")`).join("\n") || "None"}

### Existing Actions (${context.existingActions?.length || 0} active)
${context.existingActions?.slice(0, 20).map((a: any) => {
  const subs = (context.actionSubtasks || []).filter((s: any) => s.task_id === a.id);
  const subText = subs.length ? ` | Subtasks: ${subs.map((s: any) => `"${s.title}" (ID:${s.id})`).join(', ')}` : '';
  return `- ID: "${a.id}" | ${a.emoji} ${a.title} [${a.category}] color:${a.color || 'none'} ${a.time_period ? `time:${a.time_period}` : ''}${subText}`;
}).join("\n") || "None"}

### Existing Rituals (${context.existingRituals?.length || 0} active)
${context.existingRituals?.map((r: any) => {
  const tasks = (context.ritualTasks || []).filter((t: any) => t.routine_id === r.id);
  const taskText = tasks.length ? `\n    Tasks: ${tasks.map((t: any) => `"${t.emoji || '✅'} ${t.title}" (ID:${t.id})`).join(', ')}` : '';
  return `- ID: "${r.id}" | ${r.emoji || "🌟"} ${r.title} [${r.category}] color:${r.color || 'none'} desc:${r.description ? `"${r.description.substring(0, 100)}..."` : 'none'}${taskText}`;
}).join("\n") || "None"}

### Existing Breathing Exercises (${context.breathingExercises?.length || 0} active)
${context.breathingExercises?.map((b: any) => `- ID: "${b.id}" | ${b.emoji || "🌬️"} ${b.name} [${b.category}]`).join("\n") || "None"}

### What You Can Do (DIRECT DATABASE ACTIONS):
- "Create a morning meditation action" → create_action_in_bank
- "Add 5 self-care actions" → call create_action_in_bank multiple times
- "Create a morning ritual with tasks" → create_ritual_in_bank
- "Add a 4-7-8 breathing exercise" → create_breathing_exercise
- "Change the category of X" → update_action_in_bank / update_ritual_in_bank
- "Rename X to Y" → use the update tool with the item's ID
- "Deactivate X" → update tool with is_active: false
- "Add subtasks to action X" → add_subtasks_to_action
- "Remove subtask Y" → delete_subtask
- **"Delete action X"** → delete_action_from_bank (deletes the action and its subtasks)
- **"Delete ritual X"** → delete_ritual_from_bank (deletes the ritual, its tasks)
- **"Delete breathing exercise X"** → delete_breathing_exercise
- **"Add tasks to ritual X"** → add_tasks_to_ritual (adds new tasks to an existing ritual)
- **"Remove task Y from ritual"** → delete_ritual_task (removes a specific task from a ritual)
- **"Generate a cover for ritual X"** → generate_ritual_cover (generates a Simora-style pastel cover image using AI and uploads it)

### SUBTASKS EXPLAINED:
- **Subtasks** are smaller steps/checklist items that belong to an ACTION (admin_task_bank item).
- Each action can have multiple subtasks (e.g., "Workout" → subtasks: "20 leg rises", "10 heel touches", "1 min plank").
- Use add_subtasks_to_action to add them, delete_subtask to remove one.

### RITUAL DESCRIPTION (BLOG-STYLE RICH TEXT):
- The ritual "description" field supports **rich HTML content** (like a blog post).
- When the user provides a long description, multiple paragraphs, or detailed content → put ALL of it into the "description" field.
- Use HTML formatting: <h2>, <h3> for headings, <p> for paragraphs, <ul>/<ol> for lists, <strong>, <em> for emphasis.
- Structure the content like a blog article with headings and paragraphs (e.g., "Why This Ritual?", "What You'll Need", "How It Works").
- Do NOT truncate or shorten the user's content. Put the FULL text into description.
- Do NOT use sections (routines_bank_sections). All content goes in the description field.

### RITUAL TASKS EXPLAINED:
- **Ritual tasks** are the individual activities within a RITUAL (routines_bank item).
- Each ritual can have multiple tasks grouped by sections.
- The existing tasks for each ritual are listed above in the "Existing Rituals" section.
- Use add_tasks_to_ritual to add new tasks, delete_ritual_task to remove one.

### IMPORTANT RULES:
1. When user says "create", "add", "make" → USE the create tool to create it directly in the database
2. When user says "change", "update", "edit", "move", "rename", "modify" → USE the update tool with the existing item's ID from the context above. NEVER create a duplicate.
3. Don't just describe what you'd create — ACTUALLY create/update it
4. Pick appropriate emojis, categories, and colors
5. Use existing categories from the list above (use the slug)
6. For rituals, include tasks with relevant emojis and durations
7. After creating/updating/deleting, confirm what was done with details
8. To find the correct item ID for updates, match by title from the existing items lists above
9. When asked to CHANGE a COLOR: you MUST pick a DIFFERENT hex color than the current one shown in context. Do NOT re-use the same color. Choose a visually distinct new color.
10. If the user says "change color" without specifying which color, pick a beautiful new color that fits the item's theme.
11. When user mentions "subtasks", "steps", "checklist items" for an ACTION → use add_subtasks_to_action tool. Match the action by title to find its ID.
12. When user asks to remove/delete a subtask → use delete_subtask with the subtask's ID from context.
13. When user says "delete", "remove" an action/ritual/exercise → use the appropriate delete tool. Always confirm what was deleted.
14. When user asks to add tasks to an existing ritual → use add_tasks_to_ritual. Match the ritual by title to find its ID.
15. When user asks to remove a task from a ritual → use delete_ritual_task with the task's ID from context.
16. When user says "generate cover", "create cover image", "make a cover" for a ritual → use generate_ritual_cover.
17. **DESCRIPTION IS RICH TEXT (BLOG POST)**: When the user provides a long description, multiple paragraphs, or detailed content for a ritual:
    - Put ALL content into the ritual's "description" field using HTML formatting.
    - Use <h2>/<h3> for section headings, <p> for paragraphs, <ul>/<ol> for lists, <strong>/<em> for emphasis.
    - NEVER truncate or summarize — include the FULL user-provided text.
    - Structure it like a blog post with clear headings and paragraphs.
    - Do NOT create sections in routines_bank_sections. Everything goes in description.
`;
  } else if (currentPage === "routines") {
    prompt += `
## Current Page: ROUTINES
You're on the Routines management page. Here you can:
1. Create routine plans with sections and tasks
2. Suggest task templates for users

### Available Routine Categories
${context.routineCategories?.map((c: any) => `- ${c.emoji || "📌"} ${c.name} (slug: "${c.slug}")`).join("\n") || "None"}

### Recent Routine Plans
${context.recentRoutines?.map((r: any) => `- "${r.name}": ${r.description || "No description"}`).join("\n") || "None"}
`;
  } else if (currentPage === "communications") {
    prompt += `
## Current Page: COMMUNICATIONS
You're on the Communications page. Use create_broadcast_content and create_push_notification_content tools.

### What You Can Do Here
- "Write a broadcast about tomorrow's session" → Use create_broadcast_content tool
- "Push notification for new audio" → Use create_push_notification_content tool
`;
  } else if (currentPage === "community") {
    prompt += `
## Current Page: COMMUNITY
You're on the Community/Feed page. Use create_feed_post_content tool.

### Recent Posts
${context.recentPosts?.map((p: any) => `- [${p.post_type}] ${p.title || p.content?.substring(0, 50)}...`).join("\n") || "None"}
`;
  } else if (currentPage === "programs") {
    prompt += `
## Current Page: PROGRAMS
### Active Programs
${context.programs?.map((p: any) => `- ${p.title} (${p.slug}) - ${p.type}`).join("\n") || "None"}
`;
  }

  prompt += `
## CRITICAL INSTRUCTIONS
- When on the Tools page and user asks to CREATE something, ALWAYS use the direct-action create tools
- When user asks to CHANGE, EDIT, UPDATE, MOVE, or RENAME something, ALWAYS use the UPDATE tools with the item's ID from the context. NEVER create a duplicate.
- When user asks to DELETE or REMOVE something, use the appropriate DELETE tool with the item's ID from context.
- The IDs listed in "Existing Actions/Rituals/Exercises" above are real database IDs — use them for updates and deletes
- Use appropriate emojis for each item
- Match Ladyboss brand: warm, empowering, wellness-focused
- For bilingual: English first, then Farsi if requested
- After creating/updating/deleting items, summarize what was done clearly
- If creating multiple items, call the tool multiple times
`;

  return prompt;
}

// ============= TOOL DEFINITIONS =============

function getToolDefinitions(currentPage?: string) {
  const tools: any[] = [];

  // Tools page: direct-execution tools
  if (currentPage === "tools") {
    tools.push(
      {
        type: "function",
        function: {
          name: "create_action_in_bank",
          description: "Create a new action directly in the Actions Bank database. This IMMEDIATELY creates the action.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Action title (e.g., '10-min meditation')" },
              emoji: { type: "string", description: "Single emoji for the action (e.g., '🧘')" },
              category: { type: "string", description: "Category slug from available categories (e.g., 'morning', 'wellness')" },
              color: { type: "string", description: "Hex color (e.g., '#8B5CF6')" },
              description: { type: "string", description: "Brief description of the action" },
              duration_minutes: { type: "number", description: "Duration in minutes" },
              time_period: { type: "string", enum: ["morning", "afternoon", "evening", "anytime"], description: "Best time of day" },
              repeat_pattern: { type: "string", enum: ["daily", "weekly", "custom"], description: "Repeat schedule" },
              tag: { type: "string", description: "Optional tag like 'wellness', 'fitness'" },
              is_popular: { type: "boolean", description: "Mark as popular/featured" },
            },
            required: ["title", "emoji", "category"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_ritual_in_bank",
          description: "Create a complete ritual in the Rituals Bank with optional sections and tasks. This IMMEDIATELY creates it in the database.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Ritual title" },
              subtitle: { type: "string", description: "Short subtitle" },
              description: { type: "string", description: "Rich HTML description of the ritual (blog-post style). Use HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>. Put ALL content here, structured with headings and paragraphs. Do NOT truncate." },
              category: { type: "string", description: "Category slug" },
              emoji: { type: "string", description: "Single emoji" },
              color: { type: "string", description: "Hex color" },
              schedule_type: { type: "string", enum: ["daily", "weekly", "custom"], description: "Schedule type" },
              is_popular: { type: "boolean", description: "Mark as popular" },
              sections: {
                type: "array",
                description: "Ritual sections (optional groupings)",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                  },
                  required: ["title"],
                },
              },
              tasks: {
                type: "array",
                description: "Tasks/actions within the ritual",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Task title" },
                    emoji: { type: "string", description: "Task emoji" },
                    duration_minutes: { type: "number", description: "Duration in minutes" },
                    section_title: { type: "string", description: "Which section this task belongs to (must match a section title)" },
                    drip_day: { type: "number", description: "Day number for drip scheduling" },
                    schedule_days: { type: "array", items: { type: "number" }, description: "Days of week (0=Sun)" },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["title", "emoji", "category"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_breathing_exercise",
          description: "Create a new breathing exercise. This IMMEDIATELY creates it in the database.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Exercise name (e.g., '4-7-8 Calm Breath')" },
              description: { type: "string", description: "Brief description" },
              category: { type: "string", enum: ["relaxation", "energy", "focus", "sleep"], description: "Exercise category" },
              emoji: { type: "string", description: "Single emoji" },
              inhale_seconds: { type: "number", description: "Inhale duration in seconds" },
              inhale_hold_seconds: { type: "number", description: "Hold after inhale in seconds" },
              exhale_seconds: { type: "number", description: "Exhale duration in seconds" },
              exhale_hold_seconds: { type: "number", description: "Hold after exhale in seconds" },
              inhale_method: { type: "string", enum: ["nose", "mouth"], description: "Inhale through nose or mouth" },
              exhale_method: { type: "string", enum: ["nose", "mouth"], description: "Exhale through nose or mouth" },
              is_premium: { type: "boolean", description: "Whether this is a premium exercise" },
            },
            required: ["name"],
          },
        },
      },
    );

    // Update tools
    tools.push(
      {
        type: "function",
        function: {
          name: "update_action_in_bank",
          description: "Update an EXISTING action in the Actions Bank. Use this when the user wants to change, edit, move category, rename, or modify an action. Do NOT create a new one.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the existing action to update (from context)" },
              title: { type: "string", description: "New title" },
              emoji: { type: "string", description: "New emoji" },
              category: { type: "string", description: "New category slug" },
              color: { type: "string", description: "New hex color" },
              description: { type: "string", description: "New description" },
              duration_minutes: { type: "number", description: "New duration" },
              time_period: { type: "string", enum: ["morning", "afternoon", "evening", "anytime"] },
              repeat_pattern: { type: "string", enum: ["daily", "weekly", "custom"] },
              tag: { type: "string", description: "New tag" },
              is_popular: { type: "boolean" },
              is_active: { type: "boolean", description: "Set false to deactivate" },
            },
            required: ["id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "update_ritual_in_bank",
          description: "Update an EXISTING ritual in the Rituals Bank. Use this when the user wants to change, edit, move category, rename, or modify a ritual. Do NOT create a new one.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the existing ritual to update (from context)" },
              title: { type: "string", description: "New title" },
              subtitle: { type: "string" },
              description: { type: "string" },
              category: { type: "string", description: "New category slug" },
              emoji: { type: "string" },
              color: { type: "string" },
              schedule_type: { type: "string", enum: ["daily", "weekly", "custom"] },
              is_popular: { type: "boolean" },
              is_active: { type: "boolean", description: "Set false to deactivate" },
            },
            required: ["id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "update_breathing_exercise",
          description: "Update an EXISTING breathing exercise. Use this when the user wants to change, edit, or modify an exercise. Do NOT create a new one.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the existing exercise to update (from context)" },
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string", enum: ["relaxation", "energy", "focus", "sleep"] },
              emoji: { type: "string" },
              inhale_seconds: { type: "number" },
              inhale_hold_seconds: { type: "number" },
              exhale_seconds: { type: "number" },
              exhale_hold_seconds: { type: "number" },
              inhale_method: { type: "string", enum: ["nose", "mouth"] },
              exhale_method: { type: "string", enum: ["nose", "mouth"] },
              is_premium: { type: "boolean" },
              is_active: { type: "boolean" },
            },
            required: ["id"],
          },
        },
      },
    );

    // Subtask tools
    tools.push(
      {
        type: "function",
        function: {
          name: "add_subtasks_to_action",
          description: "Add subtasks (checklist steps) to an existing action in the Actions Bank.",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The ID of the action to add subtasks to" },
              subtasks: {
                type: "array",
                description: "Array of subtasks to add",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Subtask title" },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["task_id", "subtasks"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_subtask",
          description: "Delete a specific subtask from an action. Use the subtask's ID from context.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The subtask ID to delete" },
            },
            required: ["id"],
          },
        },
      },
    );

    // Delete tools
    tools.push(
      {
        type: "function",
        function: {
          name: "delete_action_from_bank",
          description: "Permanently DELETE an action from the Actions Bank and all its subtasks. Use when user says 'delete', 'remove' an action.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the action to delete (from context)" },
            },
            required: ["id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_ritual_from_bank",
          description: "Permanently DELETE a ritual from the Rituals Bank including all its tasks and sections. Use when user says 'delete', 'remove' a ritual.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the ritual to delete (from context)" },
            },
            required: ["id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_breathing_exercise",
          description: "Permanently DELETE a breathing exercise. Use when user says 'delete', 'remove' a breathing exercise.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the exercise to delete (from context)" },
            },
            required: ["id"],
          },
        },
      },
    );

    // Ritual task management tools
    tools.push(
      {
        type: "function",
        function: {
          name: "add_tasks_to_ritual",
          description: "Add new tasks to an EXISTING ritual in the Rituals Bank. Use when user wants to add more tasks/activities to a ritual that already exists.",
          parameters: {
            type: "object",
            properties: {
              ritual_id: { type: "string", description: "The ID of the ritual to add tasks to (from context)" },
              tasks: {
                type: "array",
                description: "Tasks to add to the ritual",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Task title" },
                    emoji: { type: "string", description: "Task emoji" },
                    duration_minutes: { type: "number", description: "Duration in minutes" },
                    section_id: { type: "string", description: "Section ID if adding to a specific section" },
                    section_title: { type: "string", description: "Section title for reference" },
                    drip_day: { type: "number", description: "Day number for drip scheduling" },
                    schedule_days: { type: "array", items: { type: "number" }, description: "Days of week (0=Sun)" },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["ritual_id", "tasks"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "delete_ritual_task",
          description: "Delete a specific task from a ritual. Use the task's ID from context.",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The task ID to delete (from context)" },
            },
            required: ["id"],
          },
        },
      },
    );

    // Cover generation tool
    tools.push({
      type: "function",
      function: {
        name: "generate_ritual_cover",
        description: "Generate a beautiful Simora-style pastel cover image for a ritual using AI. The image is automatically uploaded and applied to the ritual. Use when user asks to create/generate a cover for a ritual.",
        parameters: {
          type: "object",
          properties: {
            ritual_id: { type: "string", description: "The ID of the ritual to generate a cover for (from context)" },
            description: { type: "string", description: "Optional custom description to guide the image generation (e.g., 'woman meditating at sunrise with floating hearts')" },
          },
          required: ["ritual_id"],
        },
      },
    });

  }

  // Existing form-fill tools for other pages
  tools.push(
    {
      type: "function",
      function: {
        name: "create_broadcast_content",
        description: "Generate structured content for a broadcast message",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            targetType: { type: "string", enum: ["all", "course", "round"] },
            targetCourse: { type: "string" },
            sendEmail: { type: "boolean" },
            sendPush: { type: "boolean" },
          },
          required: ["title", "content"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_feed_post_content",
        description: "Generate structured content for a feed post",
        parameters: {
          type: "object",
          properties: {
            channelId: { type: "string" },
            postType: { type: "string", enum: ["announcement", "drip_unlock", "session_reminder", "media", "discussion"] },
            title: { type: "string" },
            content: { type: "string" },
            isPinned: { type: "boolean" },
            sendPush: { type: "boolean" },
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
            title: { type: "string" },
            body: { type: "string" },
            targetType: { type: "string", enum: ["all", "course", "round"] },
            targetCourse: { type: "string" },
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
            name: { type: "string" },
            description: { type: "string" },
            categorySlug: { type: "string" },
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
                        duration: { type: "number" },
                        icon: { type: "string" },
                        linkType: { type: "string", enum: ["none", "water", "breathing", "journal", "audio"] },
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
                  defaultDuration: { type: "number" },
                  icon: { type: "string" },
                  category: { type: "string" },
                },
                required: ["title", "defaultDuration"],
              },
            },
          },
          required: ["suggestions"],
        },
      },
    },
  );

  return tools;
}
