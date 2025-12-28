import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_TYPES = {
  first_session: {
    name: "First Session Welcome",
    prompt: "Write a warm welcome email for the first session of the course. Include excitement, what to expect, and how to join."
  },
  session_reminder: {
    name: "Session Reminder",
    prompt: "Write a friendly reminder email about an upcoming session. Include the date, time, and meeting link."
  },
  class_link: {
    name: "Class Link Announcement",
    prompt: "Write an email announcing the class meeting link. Make it clear and easy to find the link."
  },
  homework: {
    name: "Homework Assignment",
    prompt: "Write an email about a homework assignment. Be encouraging and clear about what needs to be done."
  },
  last_session: {
    name: "Last Session Wrap-up",
    prompt: "Write a celebratory email for the last session. Express gratitude, summarize achievements, and provide next steps."
  },
  custom_reminder: {
    name: "Custom Reminder",
    prompt: "Write a reminder email based on the provided context."
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { round_id, email_type, custom_context } = await req.json();

    if (!round_id || !email_type) {
      return new Response(
        JSON.stringify({ error: 'round_id and email_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch round details
    const { data: round, error: roundError } = await supabase
      .from('program_rounds')
      .select(`
        round_name,
        round_number,
        program_slug,
        start_date,
        end_date,
        first_session_date,
        google_meet_link,
        google_drive_link,
        whatsapp_support_number,
        important_message
      `)
      .eq('id', round_id)
      .single();

    if (roundError || !round) {
      console.error('[GENERATE-EMAIL] Round not found:', roundError);
      return new Response(
        JSON.stringify({ error: 'Round not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch program details
    const { data: program } = await supabase
      .from('program_catalog')
      .select('title, description')
      .eq('slug', round.program_slug)
      .single();

    const emailTypeConfig = EMAIL_TYPES[email_type as keyof typeof EMAIL_TYPES];
    if (!emailTypeConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid email type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI
    const context = `
Program: ${program?.title || round.program_slug}
Program Description: ${program?.description || 'N/A'}
Round: ${round.round_name} (Round ${round.round_number})
Start Date: ${round.start_date}
End Date: ${round.end_date || 'N/A'}
First Session Date: ${round.first_session_date || 'N/A'}
Google Meet Link: ${round.google_meet_link || 'Will be provided'}
Google Drive Link: ${round.google_drive_link || 'N/A'}
WhatsApp Support: ${round.whatsapp_support_number || 'N/A'}
Important Notes: ${round.important_message || 'None'}
${custom_context ? `Additional Context: ${custom_context}` : ''}
    `.trim();

    const systemPrompt = `You are an expert email copywriter for an educational coaching business. 
You write warm, professional, and encouraging emails for course participants.
The business owner is named Razie and she runs coaching programs for women.

IMPORTANT RULES:
1. Generate BOTH English and Farsi (Persian) versions
2. The Farsi version should be culturally appropriate and natural, not a direct translation
3. Keep emails concise but warm and engaging
4. Include all relevant links and dates when provided
5. Use a friendly, supportive tone

Respond in this exact JSON format:
{
  "english": {
    "subject": "Email subject line in English",
    "body": "Full email body in English with proper formatting"
  },
  "farsi": {
    "subject": "موضوع ایمیل به فارسی",
    "body": "متن کامل ایمیل به فارسی با فرمت مناسب"
  }
}`;

    const userPrompt = `${emailTypeConfig.prompt}

CONTEXT:
${context}

Generate both English and Farsi versions of this email. Remember to include the meeting link if provided.`;

    console.log('[GENERATE-EMAIL] Calling AI with context:', { email_type, round_id, program: program?.title });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[GENERATE-EMAIL] AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('[GENERATE-EMAIL] AI response received');

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[GENERATE-EMAIL] Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_type: emailTypeConfig.name,
        round_name: round.round_name,
        program_title: program?.title || round.program_slug,
        content: parsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GENERATE-EMAIL] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
