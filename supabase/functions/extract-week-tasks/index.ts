// Extracts structured tasks from a free-form weekly plan using Lovable AI Gateway.
// Input: { text: string, today: string (YYYY-MM-DD in user TZ), timezone?: string }
// Output: { tasks: Array<{ title, emoji, kind, date?, time?, duration_minutes?, recurrence? }> }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are a calendar/task extractor for a self-care planner app called Rilo.
The user types a free-form description of things they want to do this week.
ALWAYS extract at least one task — never return an empty list when the user
text mentions any activity, plan, errand, appointment, or habit.
Always call the emit_tasks function exactly once.

RULES:
- Output between 1 and 8 tasks. If unsure, err on the side of including a task as a "todo".
- Each task title is 1–4 words, Title Case, no trailing punctuation.
- Pick a single relevant emoji (no flags, no skin-tone modifiers).
- Classify each task as one of:
  * "event"     — a one-time scheduled thing with a date and (usually) a time. Examples: "meeting tomorrow at 6", "dentist Friday at 3pm", "project deadline next Monday".
  * "recurring" — happens repeatedly. Examples: "every morning pick up baby", "go to gym", "yoga every Tuesday and Thursday", "read 30 min before bed daily".
  * "todo"      — anything else, no specific schedule. Examples: "buy groceries", "call mom this Sunday" (if no time), "pick up dry cleaning sometime this week".
- Resolve relative dates ("today", "tomorrow", "Friday", "this Sunday", "next Monday") using TODAY (provided) and the user's timezone. "this <weekday>" = the next occurrence in the current week. "next <weekday>" = the one after that.
- Times: convert to 24-hour HH:MM. If user says "around 6" with no AM/PM context, infer from activity (meetings/dinner → 18:00, morning routines → 06:00–08:00).
- Duration defaults (only when not specified): meetings 60, gym/yoga 60, pick up/drop off 30, walk 30, meditate 10, read 30. Otherwise omit duration_minutes.
- recurrence values: "daily", "weekdays" (Mon–Fri only — use this if the user says "not weekends", "weekdays only", or names Mon–Fri), or "weekly" (specific day(s) of the week).
- If the user says something happens twice/three times a day, emit one task per occurrence with appropriate times.
- Never invent activities the user did not mention. But DO split compound sentences into separate tasks (e.g. "go to gym and eat healthy" = 2 tasks).
- If the user's text is empty or has no extractable activity, return a single todo titled with the first few words of their input.`;

const TOOL_SCHEMA = {
  type: 'function',
  function: {
    name: 'emit_tasks',
    description: 'Return the structured list of tasks extracted from the user text.',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          maxItems: 8,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              emoji: { type: 'string' },
              kind: { type: 'string', enum: ['event', 'recurring', 'todo'] },
              date: { type: 'string', description: 'YYYY-MM-DD, only for event' },
              time: { type: 'string', description: 'HH:MM 24h, optional' },
              duration_minutes: { type: 'number' },
              recurrence: { type: 'string', enum: ['daily', 'weekdays', 'weekly'] },
            },
            required: ['title', 'emoji', 'kind'],
            additionalProperties: false,
          },
        },
      },
      required: ['tasks'],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { text, today, timezone } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const userMsg = `TODAY: ${today || new Date().toISOString().slice(0, 10)}
TIMEZONE: ${timezone || 'UTC'}

USER PLANS:
${text.trim()}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.2,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: 'function', function: { name: 'emit_tasks' } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again in a moment.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Add funds in Lovable workspace.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error('AI gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let tasks: any[] = [];
    try {
      const args = call?.function?.arguments;
      const parsed = typeof args === 'string' ? JSON.parse(args) : args;
      tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    } catch (e) {
      console.error('Failed to parse tool_call args', e);
    }

    return new Response(JSON.stringify({ tasks }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('extract-week-tasks error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});