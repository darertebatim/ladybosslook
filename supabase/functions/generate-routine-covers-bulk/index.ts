import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoutinePlan {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
}

async function generateCoverForPlan(
  plan: RoutinePlan,
  supabase: any,
  LOVABLE_API_KEY: string
): Promise<{ planId: string; success: boolean; coverUrl?: string; error?: string }> {
  try {
    const descriptionContext = plan.description 
      ? ` - ${plan.description.replace(/<[^>]*>/g, '').substring(0, 200)}`
      : '';
    
    const subtitleContext = plan.subtitle ? ` (${plan.subtitle})` : '';

    const basePrompt = `Create a stunning, artistic cover image for a routine/habit plan: "${plan.title}"${subtitleContext}${descriptionContext}

This is a self-improvement routine template for women's personal development and empowerment.

Style requirements (CRITICAL - follow these exactly):
- Artistic, painterly style with rich, vibrant colors
- Elegant woman silhouette or abstract feminine form as focal point
- Beautiful gradient background with warm tones (rose gold, coral, magenta, purple, amber, golden hour)
- Modern, premium aesthetic like a high-end wellness app
- Dreamy, aspirational mood with soft lighting effects
- Can include: flowing elements, elegant poses, abstract nature elements, light rays, sunrise/sunset vibes
- Square composition (1:1 aspect ratio, 800x800px)
- No text, no logos, no words
- High contrast with rich saturation
- Evoke feelings of empowerment, calm, and positive transformation
- Similar style to modern wellness/meditation app imagery`;

    console.log('Generating cover for:', plan.title, plan.id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: basePrompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error for plan', plan.id, ':', response.status, errorText);
      
      if (response.status === 429) {
        return { planId: plan.id, success: false, error: 'Rate limit exceeded' };
      }
      if (response.status === 402) {
        return { planId: plan.id, success: false, error: 'AI credits exhausted' };
      }
      return { planId: plan.id, success: false, error: `AI error: ${response.status}` };
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response for plan:', plan.id);
      return { planId: plan.id, success: false, error: 'No image generated' };
    }

    // Convert base64 to blob and upload
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `routine-${plan.id}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('routine-covers')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error for plan:', plan.id, uploadError);
      return { planId: plan.id, success: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('routine-covers')
      .getPublicUrl(fileName);

    // Update the plan with the new cover URL
    const { error: updateError } = await supabase
      .from('routine_plans')
      .update({ cover_image_url: publicUrl })
      .eq('id', plan.id);

    if (updateError) {
      console.error('Update error for plan:', plan.id, updateError);
      return { planId: plan.id, success: false, error: `DB update failed: ${updateError.message}` };
    }

    console.log('Cover generated and saved for:', plan.title, publicUrl);
    return { planId: plan.id, success: true, coverUrl: publicUrl };

  } catch (error) {
    console.error('Error generating cover for plan:', plan.id, error);
    return { planId: plan.id, success: false, error: error.message };
  }
}

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

    const { planIds, onlyMissing = false } = await req.json();

    // Fetch plans to generate covers for
    let query = supabase
      .from('routine_plans')
      .select('id, title, subtitle, description, cover_image_url')
      .eq('is_active', true);

    if (planIds && planIds.length > 0) {
      query = query.in('id', planIds);
    }

    if (onlyMissing) {
      query = query.is('cover_image_url', null);
    }

    const { data: plans, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch plans: ${fetchError.message}`);
    }

    if (!plans || plans.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No plans to process', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${plans.length} plans for cover generation`);

    // Process plans sequentially to avoid rate limits
    const results = [];
    for (const plan of plans) {
      const result = await generateCoverForPlan(plan, supabase, LOVABLE_API_KEY);
      results.push(result);
      
      // Add a small delay between requests to avoid rate limiting
      if (plans.indexOf(plan) < plans.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Bulk generation complete: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${successCount} covers, ${failedCount} failed`,
        results,
        successCount,
        failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulk cover generation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate covers' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
