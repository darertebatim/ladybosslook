import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category-based visual style mapping for routine covers
const categoryStyles: Record<string, { theme: string; elements: string; colors: string }> = {
  morning: {
    theme: 'Fresh sunrise and new beginnings aesthetic',
    elements: 'Golden sunrise through window, steaming coffee cup, soft morning light, cozy bedroom scene, stretching silhouette, fresh flowers',
    colors: 'Warm gold, soft peach, cream white, gentle orange, light coral'
  },
  evening: {
    theme: 'Calm twilight and wind-down aesthetic',
    elements: 'Soft candlelight, cozy blanket, moon through window, warm bath setting, book and tea, dimmed ambient lighting',
    colors: 'Deep indigo, soft lavender, warm amber, dusty rose, midnight blue'
  },
  wellness: {
    theme: 'Holistic health and self-care aesthetic',
    elements: 'Spa setting with natural elements, essential oils, eucalyptus sprigs, smooth stones, soft towels, botanical touches',
    colors: 'Sage green, soft white, natural beige, blush pink, seafoam'
  },
  mindfulness: {
    theme: 'Zen meditation and inner peace aesthetic',
    elements: 'Zen garden with raked sand, lotus flower, still water reflection, incense smoke wisps, meditation cushion, nature harmony',
    colors: 'Soft sage, pale lavender, cream, muted gold, peaceful blue'
  },
  productivity: {
    theme: 'Focused work and achievement aesthetic',
    elements: 'Clean minimalist desk, natural light workspace, organized notebook, modern architecture, focused energy, clean lines',
    colors: 'Crisp white, forest green, warm wood tones, navy blue, soft gray'
  },
  fitness: {
    theme: 'Dynamic energy and movement aesthetic',
    elements: 'Athletic silhouette in motion, dynamic light trails, abstract energy flow, powerful stance, nature workout setting',
    colors: 'Vibrant coral, electric teal, energetic orange, bold magenta, deep purple'
  },
  self_care: {
    theme: 'Nurturing self-love and relaxation aesthetic',
    elements: 'Luxurious skincare products, soft robe and slippers, fresh roses, gentle bubble bath, facial mask moment',
    colors: 'Blush pink, cream, soft gold, lavender, warm white'
  },
  creativity: {
    theme: 'Artistic inspiration and expression aesthetic',
    elements: 'Artist palette and brushes, colorful paint splashes, open sketchbook, creative mess, golden hour light',
    colors: 'Vibrant yellow, coral, turquoise, warm orange, bright purple'
  },
  sleep: {
    theme: 'Peaceful rest and dream aesthetic',
    elements: 'Soft clouds, starry night sky, cozy bed linens, moonlight glow, dreamy atmosphere, floating feathers',
    colors: 'Deep midnight blue, soft silver, lavender, dusty purple, gentle white'
  },
  gratitude: {
    theme: 'Warmth and appreciation aesthetic',
    elements: 'Golden light rays, heart shapes in nature, warm embrace silhouette, autumn leaves, sunset glow',
    colors: 'Warm gold, burnt orange, rich amber, soft rose, cream'
  }
};

const defaultStyle = {
  theme: 'Modern wellness and personal growth aesthetic',
  elements: 'Abstract flowing shapes, elegant curves, botanical touches, soft natural light, premium minimalist design',
  colors: 'Rich jewel tones, warm amber, soft rose, sage green, elegant gold'
};

function getCategoryStyle(categoryName: string): typeof defaultStyle {
  const lowerName = categoryName.toLowerCase();
  
  // Try direct match first
  if (categoryStyles[lowerName]) {
    return categoryStyles[lowerName];
  }
  
  // Try partial matches
  for (const [key, style] of Object.entries(categoryStyles)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return style;
    }
  }
  
  return defaultStyle;
}

function buildRoutinePrompt(title: string, subtitle: string, description: string, categoryName: string): string {
  const style = getCategoryStyle(categoryName);
  const cleanDescription = description ? description.replace(/<[^>]*>/g, '').substring(0, 150) : '';
  
  return `Create a professional, high-quality routine cover image.

ROUTINE: "${title}"
${subtitle ? `TAGLINE: "${subtitle}"` : ''}
${cleanDescription ? `ABOUT: ${cleanDescription}` : ''}
${categoryName ? `CATEGORY: ${categoryName}` : ''}

VISUAL THEME: ${style.theme}

SCENE ELEMENTS (choose 2-3 that best fit):
${style.elements}

COLOR PALETTE:
${style.colors}

CRITICAL REQUIREMENTS:
- Do NOT include any text, titles, words, or typography
- Square format (1:1 aspect ratio)
- Professional quality, premium aesthetic
- NOT generic stock photo look
- Evoke aspiration and empowerment
- Photographic or artistic quality
- Rich, intentional composition

Create a unique, beautiful cover that captures the essence of this routine.`;
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

    const prompt = buildRoutinePrompt(
      planTitle || 'Wellness Routine',
      planSubtitle || '',
      planDescription || '',
      categoryName || ''
    );

    console.log('Generating routine cover for:', planTitle, planId);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
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
    console.log('AI response received');

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image was generated');
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to blob
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

    // Update the plan with the new cover
    const { error: updateError } = await supabase
      .from('routine_plans')
      .update({ cover_image_url: publicUrl })
      .eq('id', planId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log('Routine cover uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: publicUrl,
        message: 'Routine cover generated successfully' 
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
