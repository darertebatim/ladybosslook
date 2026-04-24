import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing categories to avoid duplicates
    const { data: existingCategories } = await supabase
      .from('routine_categories')
      .select('name, slug');

    const existingNames = existingCategories?.map(c => c.name.toLowerCase()) || [];
    const existingSlugs = existingCategories?.map(c => c.slug) || [];

    const prompt = `You are creating routine categories for a women's personal development and empowerment app (similar to Me+ or Fabulous app).

Existing categories (DO NOT duplicate these): ${existingNames.join(', ')}

Generate 6 NEW unique routine categories that are different from the existing ones. Focus on women's wellness, personal growth, career, relationships, and self-care.

Return ONLY valid JSON array with each category having:
- name: Category name (2-3 words, inspiring)
- slug: URL-friendly lowercase with hyphens
- icon: One of (Sun, Moon, Heart, Brain, Dumbbell, Briefcase, Coffee, Book, Star, Sparkles, Zap, Target, Clock, Calendar, CheckCircle, Award, Flame, Leaf, Music, Smile, Eye, Shield, Crown, Gem, Flower2, TreeDeciduous)
- color: Hex color that feels feminine and inspiring (pastels or warm tones)

Example format:
[
  {"name": "Creative Flow", "slug": "creative-flow", "icon": "Sparkles", "color": "#E9D5FF"},
  {"name": "Financial Wellness", "slug": "financial-wellness", "icon": "Gem", "color": "#D1FAE5"}
]`;

    console.log('Generating routine categories');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
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
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const categories = JSON.parse(jsonMatch[0]);
    console.log('Generated categories:', categories.length);

    // Get max display order
    const { data: existing } = await supabase
      .from('routine_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    
    let nextOrder = (existing?.[0]?.display_order || 0) + 1;

    // Filter out any that might still have duplicate slugs
    const newCategories = categories.filter((cat: any) => 
      !existingSlugs.includes(cat.slug) && 
      !existingNames.includes(cat.name.toLowerCase())
    );

    if (newCategories.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new unique categories to add', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert categories
    const categoriesToInsert = newCategories.map((cat: any, index: number) => ({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      display_order: nextOrder + index,
      is_active: true,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('routine_categories')
      .insert(categoriesToInsert)
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories: inserted,
        count: inserted?.length || 0,
        message: `Added ${inserted?.length || 0} new categories`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating categories:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate categories' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
