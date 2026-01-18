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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { categoryId, theme } = await req.json();

    // Fetch category info if provided
    let categoryName = 'General';
    if (categoryId) {
      const { data: category } = await supabase
        .from('routine_categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      if (category) categoryName = category.name;
    }

    const prompt = `You are creating a routine plan for a women's personal development app. The theme is: "${theme || categoryName}".

Generate a complete routine plan in JSON format with:
- A catchy title (short, inspiring)
- A subtitle (one phrase describing the benefit)
- A description (2-3 sentences about why this routine helps)
- estimated_minutes (realistic total time, 5-30 minutes)
- points (reward points, 5-20 based on effort)
- icon (one of: Sun, Moon, Heart, Brain, Dumbbell, Briefcase, Coffee, Book, Star, Sparkles, Zap, Target, Clock, Calendar, CheckCircle, Award, Flame, Leaf)
- color (one of: yellow, pink, blue, purple, green, orange)
- 3-5 sections (educational content with title and content explaining WHY each step matters)
- 3-6 tasks (actionable steps with title, duration_minutes 1-10, and icon)

Return ONLY valid JSON in this exact format:
{
  "title": "Morning Energy Boost",
  "subtitle": "Start your day with power",
  "description": "A quick morning routine to energize your body and mind...",
  "estimated_minutes": 15,
  "points": 12,
  "icon": "Sun",
  "color": "yellow",
  "sections": [
    {"title": "Why This Works", "content": "Explanation of the science..."}
  ],
  "tasks": [
    {"title": "Deep breathing", "duration_minutes": 2, "icon": "Wind"}
  ]
}`;

    console.log('Generating routine plan for theme:', theme || categoryName);

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

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const planData = JSON.parse(jsonMatch[0]);
    console.log('Generated plan:', planData.title);

    // Get max display order
    const { data: existingPlans } = await supabase
      .from('routine_plans')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    
    const nextOrder = (existingPlans?.[0]?.display_order || 0) + 1;

    // Insert the plan
    const { data: newPlan, error: planError } = await supabase
      .from('routine_plans')
      .insert({
        title: planData.title,
        subtitle: planData.subtitle,
        description: planData.description,
        estimated_minutes: planData.estimated_minutes,
        points: planData.points,
        icon: planData.icon,
        color: planData.color,
        category_id: categoryId || null,
        display_order: nextOrder,
        is_active: true,
        is_featured: false,
        is_popular: false,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Insert sections
    if (planData.sections?.length) {
      const sectionsToInsert = planData.sections.map((section: any, index: number) => ({
        plan_id: newPlan.id,
        title: section.title,
        content: section.content,
        section_order: index + 1,
        is_active: true,
      }));

      const { error: sectionsError } = await supabase
        .from('routine_plan_sections')
        .insert(sectionsToInsert);

      if (sectionsError) console.error('Error inserting sections:', sectionsError);
    }

    // Insert tasks
    if (planData.tasks?.length) {
      const tasksToInsert = planData.tasks.map((task: any, index: number) => ({
        plan_id: newPlan.id,
        title: task.title,
        duration_minutes: task.duration_minutes,
        icon: task.icon,
        task_order: index + 1,
        is_active: true,
      }));

      const { error: tasksError } = await supabase
        .from('routine_plan_tasks')
        .insert(tasksToInsert);

      if (tasksError) console.error('Error inserting tasks:', tasksError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: newPlan,
        message: `Created "${planData.title}" with ${planData.sections?.length || 0} sections and ${planData.tasks?.length || 0} tasks`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating routine plan:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate routine plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
