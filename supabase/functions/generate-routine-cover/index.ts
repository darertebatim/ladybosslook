import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clean, minimal visual concepts for routine covers
const categoryStyles: Record<string, { concept: string; colors: string }> = {
  morning: {
    concept: 'Soft gradient sky at golden hour, gentle warm light, simple horizon line',
    colors: 'warm peach, soft gold, cream white'
  },
  evening: {
    concept: 'Calm twilight gradient, soft purple to deep blue transition, single moon',
    colors: 'lavender, dusty rose, deep indigo'
  },
  wellness: {
    concept: 'Smooth abstract curves suggesting calm water or gentle waves, soft light',
    colors: 'sage green, soft white, warm beige'
  },
  mindfulness: {
    concept: 'Single zen stone or ripple in still water, vast negative space',
    colors: 'soft gray, pale blue, off-white'
  },
  productivity: {
    concept: 'Clean geometric shapes, simple lines suggesting upward motion',
    colors: 'navy blue, crisp white, subtle gold accent'
  },
  fitness: {
    concept: 'Dynamic single brushstroke or abstract motion arc, energetic but simple',
    colors: 'coral, warm orange, soft cream'
  },
  self_care: {
    concept: 'Soft abstract petals or gentle organic curves, dreamy and light',
    colors: 'blush pink, soft peach, cream'
  },
  creativity: {
    concept: 'Simple color field with one bold accent element, artistic negative space',
    colors: 'terracotta, mustard yellow, off-white'
  },
  sleep: {
    concept: 'Deep gradient fading to darkness, subtle stars, peaceful emptiness',
    colors: 'midnight blue, soft silver, deep purple'
  },
  gratitude: {
    concept: 'Warm light source with soft glow, simple and uplifting',
    colors: 'warm amber, soft gold, cream'
  },
  work: {
    concept: 'Clean minimal lines, subtle grid or structure, professional calm',
    colors: 'charcoal gray, soft white, muted blue'
  },
  health: {
    concept: 'Fresh, airy composition with soft organic shapes suggesting vitality',
    colors: 'fresh green, soft white, warm yellow'
  }
};

const defaultStyle = {
  concept: 'Soft abstract gradient with gentle curves, calming and minimal',
  colors: 'soft purple, warm pink, cream white'
};

function getCategoryStyle(categoryName: string): typeof defaultStyle {
  const lowerName = categoryName.toLowerCase();
  
  for (const [key, style] of Object.entries(categoryStyles)) {
    if (lowerName.includes(key) || key.includes(lowerName.split(' ')[0])) {
      return style;
    }
  }
  
  const words = lowerName.split(/[\s&]+/);
  for (const word of words) {
    if (categoryStyles[word]) return categoryStyles[word];
  }
  
  return defaultStyle;
}

function buildCreativePrompt(title: string, subtitle: string, description: string, categoryName: string): string {
  const style = getCategoryStyle(categoryName);
  
  return `Create a MINIMAL, CLEAN cover image for a wellness app.

THEME: "${title}"

VISUAL DIRECTION:
${style.concept}

COLOR PALETTE:
${style.colors}

STYLE REQUIREMENTS:
- EXTREMELY MINIMAL and CLEAN - lots of empty space
- Soft, calming, premium aesthetic
- Abstract or very simple imagery only
- Maximum 1-2 visual elements
- Smooth gradients and soft edges
- High-end editorial magazine quality
- Square format, perfectly balanced composition
- Think Apple product photography meets meditation app

ABSOLUTELY FORBIDDEN:
- Text, words, letters, typography of any kind
- Busy or crowded compositions
- Fantasy elements, magical effects, sparkles
- Detailed illustrations or complex scenes
- People, faces, hands, or body parts
- Multiple objects or cluttered imagery
- Harsh contrasts or neon colors
- Cliché wellness imagery (lotus, chakras, yin-yang)

Create something that feels like a premium, calming, almost empty visual. Less is more.`;
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

    const { planId, planTitle, planSubtitle, planDescription, categoryName } = await req.json();

    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const prompt = buildCreativePrompt(
      planTitle || 'Wellness Routine',
      planSubtitle || '',
      planDescription || '',
      categoryName || ''
    );

    console.log('Generating creative routine cover for:', planTitle);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
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
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response');
      throw new Error('No image was generated');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `routine-${planId}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('routine-covers')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('routine-covers')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('routine_plans')
      .update({ cover_image_url: publicUrl })
      .eq('id', planId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log('Creative cover generated:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: publicUrl,
        message: 'Cover generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating routine cover:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate routine cover' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
