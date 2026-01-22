import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Creative visual concepts for routine covers - designed graphics, not photos
const categoryStyles: Record<string, { concept: string; mood: string; technique: string }> = {
  morning: {
    concept: 'Minimalist vector sunrise with geometric mountains and soft gradient sky, abstract sun rays as clean lines',
    mood: 'Fresh, energetic, optimistic awakening',
    technique: 'Flat design, warm orange-to-gold gradients, bold geometric shapes, high-end editorial illustration'
  },
  evening: {
    concept: 'Layered abstract moonscape with flowing curves and deep indigo-to-purple gradients, stylized stars as geometric dots',
    mood: 'Peaceful unwinding, sanctuary, gentle transition',
    technique: 'Soft gradients, organic flowing shapes, minimalist night palette, dreamy illustration style'
  },
  wellness: {
    concept: 'Organic abstract shapes resembling leaves and water droplets, flowing botanical silhouettes with soft grain texture',
    mood: 'Balanced, holistic, natural harmony',
    technique: 'Modern digital art, soft pastel palette, Japanese-inspired minimalism, ethereal gradients'
  },
  mindfulness: {
    concept: 'Concentric circles expanding like ripples, zen-inspired geometric composition with breathing space',
    mood: 'Centered calm, expansive awareness, stillness',
    technique: 'Swiss design style, muted tones with one accent color, clean minimalist composition'
  },
  productivity: {
    concept: 'Clean isometric 3D shapes suggesting organized workspace, abstract geometric blocks in warm neutrals',
    mood: 'Focused, structured, elegant efficiency',
    technique: 'Soft clay-style 3D render, Bauhaus-inspired layout, warm wood and brass tones'
  },
  fitness: {
    concept: 'Dynamic abstract composition with flowing motion lines and energetic shapes suggesting movement',
    mood: 'Powerful rhythm, liberation, fierce energy',
    technique: 'Bold color blocking, dynamic angles, high-contrast vibrant palette, motion-inspired vectors'
  },
  self_care: {
    concept: 'Soft organic blobs and flowing abstract forms in rosy and cream tones, gentle overlapping shapes',
    mood: 'Tender self-love, nurturing, gentle warmth',
    technique: 'Soft glow gradients, romantic pastel palette, organic fluid shapes, premium app aesthetic'
  },
  creativity: {
    concept: 'Colorful abstract explosion of geometric and organic shapes, playful composition with bold colors',
    mood: 'Uninhibited expression, joyful play, creative freedom',
    technique: 'Bold saturated colors, unexpected compositions, artistic chaos, modern illustration'
  },
  sleep: {
    concept: 'Dreamy abstract clouds and soft flowing forms in lavender and midnight blue, floating geometric shapes',
    mood: 'Deep rest, floating serenity, surrendering to softness',
    technique: 'Ethereal gradients, soft blur effects, calming cool palette, dreamy illustration'
  },
  gratitude: {
    concept: 'Warm abstract forms suggesting golden light and abundance, overlapping organic shapes in honey tones',
    mood: 'Overflowing appreciation, warmth, heart open',
    technique: 'Rich amber gradients, soft bokeh-like circles, warm golden palette'
  },
  work: {
    concept: 'Sophisticated geometric composition with clean lines and professional neutral palette, abstract desk elements',
    mood: 'Boss energy, commanding confidence, refined success',
    technique: 'Editorial fashion illustration style, clean lines, sophisticated monochrome with accent'
  },
  health: {
    concept: 'Vibrant abstract fruits and botanical shapes in fresh colors, energetic organic composition',
    mood: 'Radiant vitality, celebration of aliveness',
    technique: 'Bright fresh colors, playful organic shapes, lifestyle editorial illustration'
  }
};

const defaultStyle = {
  concept: 'Abstract flowing forms with elegant gradients, organic shapes meeting geometric elements in rich colors',
  mood: 'Aspirational, elegant self-improvement, quiet confidence',
  technique: 'Premium app UI aesthetic, soft gradients, minimalist vector art, high-end digital illustration'
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
  
  return `Create a professional graphic design cover for a wellness routine app.

ROUTINE: "${title}"
${subtitle ? `THEME: "${subtitle}"` : ''}
${cleanDesc ? `CONTEXT: ${cleanDesc}` : ''}

VISUAL CONCEPT:
${style.concept}

MOOD:
${style.mood}

DESIGN STYLE:
${style.technique}

CRITICAL REQUIREMENTS:
- This MUST be a designed graphic, NOT a realistic photograph
- NO text, words, letters, or typography of any kind
- NO realistic human faces or body parts
- NO stock photo aesthetics or photographic realism
- Square format, perfectly composed
- Use clean vector-like shapes, gradients, and artistic composition
- Premium app UI aesthetic like Headspace, Calm, or Nike Training Club
- High-end digital illustration quality

DESIGN APPROACH:
- Use abstract shapes, geometric forms, or stylized organic elements
- Apply beautiful color gradients and color blocking
- Create depth through layered shapes and soft shadows
- Think modern mobile app cover art, not photography
- Minimalist but visually striking

AVOID:
- Realistic photography of any kind
- Human figures or faces (even silhouettes unless very abstract)
- Stock photo aesthetic
- Busy or cluttered compositions
- Generic clip art style
- Hyper-realistic rendering

Create a beautiful, modern graphic that would look premium in a wellness app.`;
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
