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

    // --- Admin auth check ---
    {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const _supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const _anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const _serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const _authClient = (await import('https://esm.sh/@supabase/supabase-js@2')).createClient(
        _supabaseUrl, _anonKey,
        { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
      );
      const { data: { user: _user }, error: _authErr } = await _authClient.auth.getUser();
      if (_authErr || !_user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const _adminClient = (await import('https://esm.sh/@supabase/supabase-js@2')).createClient(_supabaseUrl, _serviceKey);
      const { data: _roleData } = await _adminClient
        .from('user_roles').select('role').eq('user_id', _user.id).eq('role', 'admin').maybeSingle();
      if (!_roleData) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    // --- End admin auth check ---
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

    const prompt = `Write a short description for "${playlistName}" (${categoryContext}).

${currentDescription ? `Current text to improve: "${currentDescription}"` : ''}

STRICT RULES:
- Maximum 40 words total
- 1-2 short sentences only
- Be specific about what they'll hear or experience
- Use simple, everyday language
- Speak directly to the listener ("you")

FORBIDDEN PHRASES (never use these):
- "fuel your ambition", "quiet the noise", "step into your day"
- "reclaim your power", "own your power", "find your flow"
- "unlock", "journey", "transform", "curation", "dedicated space"
- "resilient version of yourself", "what you're capable of"

GOOD EXAMPLE:
"Quick morning affirmations to start your day with confidence. Just 5 minutes to feel ready for anything."

BAD EXAMPLE (too wordy, too abstract):
"Own your power and find your flow with a curation designed to fuel your ambition and quiet the noise..."

Return ONLY the description, nothing else.`;

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
