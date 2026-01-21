import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { playlistName, currentDescription, category } = await req.json();

    if (!playlistName) {
      throw new Error('Playlist name is required');
    }

    const categoryContext = {
      audiobook: 'an audiobook/audio content experience',
      podcast: 'a podcast series',
      course_supplement: 'educational course audio materials',
      meditate: 'a meditation and mindfulness experience',
      workout: 'an energizing workout audio collection',
      soundscape: 'an immersive ambient soundscape',
      affirmations: 'an empowering affirmations collection',
    }[category] || 'audio content';

    const prompt = `You are a professional copywriter for a women's personal development and empowerment brand. 

Write a compelling, engaging description for a playlist called "${playlistName}" which is ${categoryContext}.

${currentDescription ? `Current description to improve:\n"${currentDescription}"` : 'No current description provided - create one from scratch.'}

Requirements:
- Keep it concise (2-4 sentences max)
- Use empowering, warm, and aspirational language
- Speak directly to the listener ("you" language)
- Highlight the transformation or benefit they'll experience
- Make it feel personal and inviting, not corporate
- Do NOT use clichés like "unlock your potential" or "journey to success"
- Write in a conversational, authentic tone

Return ONLY the description text, no quotes, no preamble.`;

    console.log('Improving description for:', playlistName);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const improvedDescription = data.choices?.[0]?.message?.content?.trim();

    if (!improvedDescription) {
      throw new Error('No description was generated');
    }

    console.log('Generated improved description');

    return new Response(
      JSON.stringify({ 
        success: true, 
        description: improvedDescription,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error improving description:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to improve description' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
