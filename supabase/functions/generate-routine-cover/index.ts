import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Creative visual concepts for routine covers - artistic and unique
const categoryStyles: Record<string, { concept: string; mood: string; technique: string }> = {
  morning: {
    concept: 'Golden hour magic - woman silhouette stretching at window with dramatic sunbeams, or hands wrapped around steaming ceramic mug with light dancing on the surface',
    mood: 'Hopeful awakening, fresh starts, quiet power before the world wakes',
    technique: 'Cinematic lighting with lens flare, shallow depth of field, warm film grain'
  },
  evening: {
    concept: 'Intimate twilight moments - soft candlelit scene with silk textures, or moonlight streaming through sheer curtains onto rumpled bedding',
    mood: 'Sanctuary, unwinding, sacred pause from the chaos',
    technique: 'Chiaroscuro lighting, rich shadows, moody color grading like a Sofia Coppola film'
  },
  wellness: {
    concept: 'Elevated self-care editorial - artful arrangement of natural textures (marble, eucalyptus, linen), or close-up of water droplets on skin catching light',
    mood: 'Luxurious slowness, intentional living, treating yourself as worthy',
    technique: 'Clean editorial photography, negative space, soft natural light'
  },
  mindfulness: {
    concept: 'Abstract zen - ripples expanding on still water, single lotus floating, or misty mountain peaks emerging from clouds at dawn',
    mood: 'Stillness within chaos, centered calm, expansive awareness',
    technique: 'Minimalist composition, soft focus, muted tones with one accent color'
  },
  productivity: {
    concept: 'Curated workspace poetry - architectural details in warm light, or single hand writing in leather journal with perfect shadows',
    mood: 'Focused ambition, elegant efficiency, quiet determination',
    technique: 'Sharp lines, modern architecture aesthetic, warm wood and brass tones'
  },
  fitness: {
    concept: 'Movement as art - abstract motion blur of a dancing figure, or powerful silhouette mid-leap against dramatic sky',
    mood: 'Fierce energy, liberation through movement, unapologetic strength',
    technique: 'Dynamic angles, motion blur, bold saturated colors, high contrast'
  },
  self_care: {
    concept: 'Intimate beauty rituals - close-up of hands massaging face with golden serum, or rose petals floating in milky bath water',
    mood: 'Radical self-love, tender moments alone, beauty as self-respect',
    technique: 'Soft glow, creamy skin tones, romantic lighting like a perfume ad'
  },
  creativity: {
    concept: 'Creative explosion - paint-stained hands holding fresh artwork, or colorful ink drops blooming in water captured mid-motion',
    mood: 'Uninhibited expression, joyful mess, playing like nobody is watching',
    technique: 'Bold colors, artistic chaos, macro photography, unexpected compositions'
  },
  sleep: {
    concept: 'Dream state visuals - clouds viewed from above at golden hour, or soft billowing white fabric floating in wind',
    mood: 'Deep rest, floating between worlds, surrendering to softness',
    technique: 'Dreamy soft focus, ethereal lighting, lavender and midnight blue palette'
  },
  gratitude: {
    concept: 'Golden abundance - warm light streaming through autumn leaves, or hands cupped open receiving light',
    mood: 'Overflowing appreciation, finding magic in ordinary, heart wide open',
    technique: 'Warm golden hour photography, bokeh, rich amber and honey tones'
  },
  work: {
    concept: 'Power moves - sleek laptop on marble desk with coffee and fresh flowers, or confident woman silhouette in modern glass office',
    mood: 'Boss energy, commanding your space, success on your terms',
    technique: 'Editorial fashion photography style, clean lines, sophisticated neutral palette'
  },
  health: {
    concept: 'Vibrant living - colorful smoothie bowl as art from above, or woman laughing mid-movement in natural light',
    mood: 'Radiant vitality, body as temple, celebrating aliveness',
    technique: 'Bright natural light, fresh colors, lifestyle editorial feel'
  }
};

const defaultStyle = {
  concept: 'Elevated feminine aesthetic - abstract flowing forms in rich colors, botanical shadows on linen, or woman in powerful pose with dramatic lighting',
  mood: 'Aspirational but attainable, elegant self-improvement, quiet confidence',
  technique: 'Fashion editorial meets wellness, premium textures, intentional composition'
};

function getCategoryStyle(categoryName: string): typeof defaultStyle {
  const lowerName = categoryName.toLowerCase();
  
  for (const [key, style] of Object.entries(categoryStyles)) {
    if (lowerName.includes(key) || key.includes(lowerName.split(' ')[0])) {
      return style;
    }
  }
  
  // Try word matching
  const words = lowerName.split(/[\s&]+/);
  for (const word of words) {
    if (categoryStyles[word]) return categoryStyles[word];
  }
  
  return defaultStyle;
}

function buildCreativePrompt(title: string, subtitle: string, description: string, categoryName: string): string {
  const style = getCategoryStyle(categoryName);
  const cleanDesc = description?.replace(/<[^>]*>/g, '').substring(0, 100) || '';
  
  return `Create a stunning, gallery-worthy cover image for a wellness routine.

ROUTINE: "${title}"
${subtitle ? `VIBE: "${subtitle}"` : ''}
${cleanDesc ? `CONTEXT: ${cleanDesc}` : ''}

VISUAL DIRECTION:
${style.concept}

EMOTIONAL TONE:
${style.mood}

PHOTOGRAPHY STYLE:
${style.technique}

ESSENTIAL REQUIREMENTS:
- NO text, words, letters, or typography of any kind
- Square format, perfectly composed
- Premium magazine-quality aesthetic
- Evocative and artistic, NOT generic stock photography
- Should feel like it belongs on a high-end lifestyle brand
- Rich textures and intentional use of light/shadow
- The kind of image that makes someone pause and feel something

AVOID:
- Cheesy wellness clichés (basic yoga poses, obvious meditation imagery)
- Flat or boring compositions
- Overprocessed or artificial looking
- Generic motivational poster vibes
- Clip art or illustration style

This should be the kind of cover that elevates the entire routine. Make it beautiful.`;
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
