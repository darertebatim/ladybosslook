// Extracts structured tasks from a free-form weekly plan using Lovable AI Gateway.
// Input: { text: string, today: string (YYYY-MM-DD in user TZ), timezone?: string }
// Output: { tasks: Array<{ title, emoji, kind, date?, time?, duration_minutes?, recurrence? }> }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are a calendar/task extractor for a self-care planner app called Rilo.
The user will type a free-form description of their plans for this week.
Your job: split it into concrete, atomic tasks the user can put on a planner.

RULES:
- Output 1–8 tasks. Never more than 8.
- Each task title is 1–4 words, Title Case, no trailing punctuation.
- Pick a single relevant emoji (no flags, no skin-tone).
- Classify each task as one of:
  * "event"  — a one-time scheduled thing with a date and (usually) a time. Examples: "meeting tomorrow at 6", "dentist Friday".
  * "recurring" — happens repeatedly (daily / weekdays / weekly). Examples: "every morning pick up baby", "go to gym".
  * "todo" — anything else, no specific schedule. Examples: "buy groceries", "eat healthy".
- Resolve relative dates ("tomorrow", "Friday", "next Monday") using TODAY (provided) and the user's timezone.
- Times: convert to 24-hour HH:MM. If user says "around 6" with no AM/PM context, prefer the most likely (evening for meetings, morning for routines).
- Duration defaults: meetings 60, gym 60, pick up / drop off 30, otherwise omit.
- For "recurring", set recurrence to one of: "daily", "weekdays", "weekly".
- Never invent tasks the user did not mention.`;

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