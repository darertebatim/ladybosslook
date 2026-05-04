// Transcribes a short audio clip to text using the Lovable AI Gateway (Gemini).
// Input: { audio: string (base64, no data: prefix), mimeType?: string, language?: string }
// Output: { text: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType, language } = await req.json();
    if (!audio || typeof audio !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing audio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mt = mimeType || 'audio/webm';
    // Gemini accepts audio via inline data URL in image_url-style content parts
    // through the Lovable AI Gateway's OpenAI-compat endpoint.
    const dataUrl = `data:${mt};base64,${audio}`;

    const langHint = language ? ` The speaker is likely speaking ${language}.` : '';
    const systemPrompt = `You are a precise speech-to-text transcriber. Transcribe the audio verbatim.${langHint} Only output the transcript text, no commentary, no quotes, no formatting.`;

    const body = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Transcribe this audio.' },
            { type: 'input_audio', input_audio: { data: audio, format: mt.includes('mp4') ? 'mp4' : mt.includes('wav') ? 'wav' : 'webm' } },
          ],
        },
      ],
    };

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[transcribe-audio] gateway error', resp.status, errText);
      // Fallback: try image_url style with data URL (Gemini accepts it for audio too)
      const fallbackBody = {
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Transcribe this audio verbatim. Output only the transcript.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      };
      const resp2 = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackBody),
      });
      if (!resp2.ok) {
        const e2 = await resp2.text();
        console.error('[transcribe-audio] fallback failed', resp2.status, e2);
        return new Response(JSON.stringify({ error: 'Transcription failed', detail: e2 }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const data2 = await resp2.json();
      const text2 = data2?.choices?.[0]?.message?.content?.toString().trim() || '';
      return new Response(JSON.stringify({ text: text2 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.toString().trim() || '';
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[transcribe-audio] error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});