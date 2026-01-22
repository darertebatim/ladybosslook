import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cinematic fantasy concepts for routine covers - designed art, not photos
const categoryStyles: Record<string, { concept: string; mood: string; technique: string }> = {
  morning: {
    concept: 'A celestial figure awakening amidst swirling cosmic dust and golden nebulae, a radiant sun rising through impossible floating architecture of glass and light',
    mood: 'Transcendent, epic, hopeful, divine awakening',
    technique: 'Cinematic concept art, volumetric god rays, vibrant gold and deep teal palette, Unreal Engine 5 render style'
  },
  evening: {
    concept: 'A mystical twilight realm with floating lanterns and bioluminescent flowers, soft aurora dancing through crystalline structures in an enchanted sanctuary',
    mood: 'Magical sanctuary, dreamlike peace, otherworldly calm',
    technique: 'Fantasy matte painting, soft ethereal glow, deep purple and rose gold palette, Studio Ghibli-inspired lighting'
  },
  wellness: {
    concept: 'An ancient healing temple floating among clouds, with waterfalls of pure light cascading into pools of liquid starlight, sacred geometry patterns glowing softly',
    mood: 'Sacred rejuvenation, timeless wisdom, spiritual luxury',
    technique: 'Surrealist digital illustration, iridescent highlights, soft focus backgrounds, premium art direction'
  },
  mindfulness: {
    concept: 'A serene floating island with a single luminous ancient tree, surrounded by a sea of clouds and perfectly balanced zen stones orbiting in gentle motion',
    mood: 'Mystical peace, ethereal calm, infinite stillness',
    technique: 'Surrealist matte painting, pastel iridescent colors, atmospheric perspective, cinematic depth'
  },
  productivity: {
    concept: 'An intricate clockwork cosmos made of starlight and translucent glass, gears of pure energy turning in perfect harmony within a cathedral of geometric light',
    mood: 'Focused mastery, elegant precision, infinite order',
    technique: 'Detailed 3D concept art, glowing fiber-optic accents, deep indigo and gold palette, premium metallic textures'
  },
  fitness: {
    concept: 'An abstract figure of pure kinetic energy breaking through crystalline barriers, shards of prismatic light and geometric patterns exploding outward in dynamic motion',
    mood: 'Explosive power, unstoppable momentum, fierce transformation',
    technique: 'High-contrast digital illustration, neon energy trails, motion blur effects, bold saturated colors'
  },
  self_care: {
    concept: 'A secret garden of impossible flowers made of soft light and silk, floating crystals reflecting rainbow spectrums, petals drifting in an eternal gentle breeze',
    mood: 'Tender magic, self-love sanctuary, precious solitude',
    technique: 'Romantic fantasy art, dreamy bokeh, rose quartz and champagne palette, soft diffused lighting'
  },
  creativity: {
    concept: 'An explosion of liquid color and light forming abstract constellations, paint becoming galaxies, imagination manifesting as visible aurora of pure possibility',
    mood: 'Uninhibited expression, joyful chaos, creative ecstasy',
    technique: 'Abstract expressionist digital art, vibrant color splashes, dynamic composition, artistic spontaneity'
  },
  sleep: {
    concept: 'A dreamscape of soft clouds forming gentle spirals around a crescent moon, stars dissolving into stardust, the boundary between waking and dreams beautifully blurred',
    mood: 'Deep surrender, floating peace, entering the dream realm',
    technique: 'Ethereal fantasy illustration, ultra-soft focus, midnight blue and silver palette, luminous highlights'
  },
  gratitude: {
    concept: 'Hands cupped open receiving cascading golden light that transforms into butterflies and flower petals, abundance flowing like a visible river of warmth',
    mood: 'Overflowing appreciation, magical abundance, heart expansion',
    technique: 'Warm fantasy art, volumetric golden light, amber and honey tones with soft particle effects'
  },
  work: {
    concept: 'A futuristic command center of flowing holographic interfaces and crystalline data streams, elegant power emanating from a throne of pure focused intention',
    mood: 'Commanding presence, visionary leadership, elegant power',
    technique: 'Sci-fi concept art, sleek holographic elements, sophisticated dark palette with accent lighting'
  },
  health: {
    concept: 'A figure radiating visible life force energy, surrounded by orbiting symbols of vitality - glowing fruits, flowing water, pulsing hearts of pure light',
    mood: 'Radiant vitality, body as temple, celebrating aliveness',
    technique: 'Vibrant fantasy illustration, energy aura effects, fresh greens and warm highlights'
  }
};

const defaultStyle = {
  concept: 'Abstract flowing forms of pure light and color, feminine energy manifesting as visible aurora, sacred geometry softly glowing in an ethereal void',
  mood: 'Aspirational magic, elegant transformation, quiet power',
  technique: 'Cinematic fantasy concept art, premium digital illustration, intentional artistic composition'
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
  
  return `Create a premium, CINEMATIC FANTASY cover for a wellness routine app.

ROUTINE: "${title}"
${subtitle ? `THEME: "${subtitle}"` : ''}
${cleanDesc ? `CONTEXT: ${cleanDesc}` : ''}

VISUAL CONCEPT:
${style.concept}

EMOTIONAL TONE:
${style.mood}

ARTISTIC TECHNIQUE:
${style.technique}

CRITICAL STYLE REQUIREMENTS:
- This is NOT a realistic photograph - it's DESIGNED FANTASY ART
- Cinematic concept art aesthetic, like a movie poster or game art
- Ethereal, magical, otherworldly atmosphere
- Professional graphic design composition with strong focal point
- Rich volumetric lighting and atmospheric depth
- Premium app interface quality - this should feel like $1000 design
- Square format, perfectly composed

ABSOLUTELY NO:
- Text, words, letters, typography, titles, or labels of any kind
- Realistic stock photography
- Generic wellness clichés (yoga poses, meditation silhouettes, hands holding coffee)
- Flat, boring, or corporate looking imagery
- Clip art, cartoons, or simple illustrations
- UI elements or overlays

Create something that looks like it belongs in a premium fantasy art gallery. Make it magical.`;
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
