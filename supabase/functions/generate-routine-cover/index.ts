import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// SIMORA VISUAL DNA SYSTEM
// Soft + Safe + Powerful — Feminine Wellness Illustration Style
// ============================================================

const categoryVisualDNA: Record<string, { heroScene: string; floatingIcons: string; colors: string; mood: string }> = {
  morning: {
    heroScene: 'gentle woman stretching with eyes closed in soft morning light, warm sunrise backdrop, peaceful expression',
    floatingIcons: 'floating icons: glowing sun, coffee cup, water glass, small pink flower, alarm clock',
    colors: 'warm sunrise gradient, soft peach, golden yellow, cream white, blush pink',
    mood: 'calm morning energy, fresh start, uplifting daily ritual'
  },
  evening: {
    heroScene: 'woman in peaceful relaxation, wrapped in soft blanket, moon glow through window',
    floatingIcons: 'floating icons: crescent moon, small twinkling stars, candle flame, cozy journal, warm cup',
    colors: 'soft lavender, dusty rose, muted indigo, warm blush, gentle purple',
    mood: 'winding down energy, peaceful reflection, calming night ritual'
  },
  sleep: {
    heroScene: 'woman resting peacefully with gentle smile, soft moon glow, dreamy clouds surrounding her',
    floatingIcons: 'floating icons: crescent moon, small stars, fluffy cloud, soft pillow, small ZZZ',
    colors: 'deep soft lavender, midnight blue, silver shimmer, pastel purple, dreamy blue',
    mood: 'deeply calming, restorative, peaceful sleep energy'
  },
  mind: {
    heroScene: 'gentle woman journaling in a peaceful corner, soft glowing heart above her head, calm expression',
    floatingIcons: 'floating icons: open journal, pen, glowing heart, small star, soft thought bubble',
    colors: 'lavender, soft lilac, warm blush pink, gentle purple accents, cream',
    mood: 'inner reflection, emotional wellness, calm journaling energy'
  },
  body: {
    heroScene: 'gentle confident woman in a soft yoga or wellness pose, sunrise backdrop, serene expression',
    floatingIcons: 'floating icons: water bottle, fresh apple, small sun, movement swirl, green leaf',
    colors: 'warm sunrise gradient, soft peach, golden yellow, pastel coral, warm cream',
    mood: 'soft active energy, morning vitality, feminine strength'
  },
  growth: {
    heroScene: 'woman looking upward with calm confidence, soft light rays emerging above, empowered expression',
    floatingIcons: 'floating icons: small glowing star, upward arrow, soft sparkles, open book, tiny delicate crown',
    colors: 'soft blue, warm lavender, gentle purple, light gold accents, pastel sky',
    mood: 'empowering growth energy, subtle magic, uplifting potential'
  },
  fitness: {
    heroScene: 'woman in a soft confident wellness pose with gentle smile, feminine strength — not aggressive fitness',
    floatingIcons: 'floating icons: small dumbbell, glowing heart, water bottle, yoga mat, small star',
    colors: 'soft coral, warm peach, light blush, gentle orange gradient, cream',
    mood: 'empowering feminine strength, soft active energy, joyful movement'
  },
  nutrition: {
    heroScene: 'woman joyfully enjoying a colorful healthy meal, soft warm kitchen or garden backdrop',
    floatingIcons: 'floating icons: fresh apple, colorful salad bowl, water bottle, small heart, green leaf',
    colors: 'fresh sage green, soft yellow, warm cream, pastel pink accents, light coral',
    mood: 'nourishing energy, vibrant health, joyful self-care'
  },
  cleaning: {
    heroScene: 'woman in a bright organized peaceful home, soft natural light, calm satisfied expression',
    floatingIcons: 'floating icons: small broom, sparkling star, pink flower, neatly stacked items, soft clean glow',
    colors: 'fresh white, soft sage green, warm cream, light airy blue, blush pink',
    mood: 'clean organized energy, fresh home, calm productivity'
  },
  self_care: {
    heroScene: 'woman in a relaxing self-care moment, bath or skincare ritual, soft glow surrounding her',
    floatingIcons: 'floating icons: rose petal, soft flower, heart, sparkle drops, small mirror',
    colors: 'blush pink, soft peach, cream, warm rose, gentle lavender',
    mood: 'nurturing self-love, soft luxurious energy, gentle self-compassion'
  }
};

const defaultDNA = {
  heroScene: 'gentle confident woman in a peaceful wellness moment, soft warm environment, calm empowered expression',
  floatingIcons: 'floating icons: glowing heart, small star, soft sparkle, green leaf, soft glow orb',
  colors: 'lavender, pastel pink, soft blue, warm sunrise gradients, gentle purple, cream white',
  mood: 'safe, soft, powerful — emotional wellness meets feminine strength'
};

function getCategoryDNA(categoryName: string, title: string): typeof defaultDNA {
  const search = (categoryName + ' ' + title).toLowerCase();
  
  if (search.includes('morning') || search.includes('wake') || search.includes('sunrise') || search.includes('dawn')) return categoryVisualDNA.morning;
  if (search.includes('sleep') || search.includes('night') || search.includes('bedtime') || search.includes('insomnia')) return categoryVisualDNA.sleep;
  if (search.includes('evening') || search.includes('wind down') || search.includes('dusk') || search.includes('twilight')) return categoryVisualDNA.evening;
  if (search.includes('mind') || search.includes('journal') || search.includes('meditat') || search.includes('mental') || search.includes('brain') || search.includes('thought')) return categoryVisualDNA.mind;
  if (search.includes('fitness') || search.includes('workout') || search.includes('exercise') || search.includes('gym') || search.includes('strength')) return categoryVisualDNA.fitness;
  if (search.includes('grow') || search.includes('goal') || search.includes('learn') || search.includes('produc') || search.includes('success')) return categoryVisualDNA.growth;
  if (search.includes('food') || search.includes('nutrit') || search.includes('eat') || search.includes('meal') || search.includes('diet') || search.includes('healthy eating')) return categoryVisualDNA.nutrition;
  if (search.includes('clean') || search.includes('organiz') || search.includes('home') || search.includes('tidy') || search.includes('house')) return categoryVisualDNA.cleaning;
  if (search.includes('self care') || search.includes('selfcare') || search.includes('skin') || search.includes('beauty') || search.includes('spa')) return categoryVisualDNA.self_care;
  if (search.includes('body') || search.includes('movement') || search.includes('stretch') || search.includes('yoga') || search.includes('pilates')) return categoryVisualDNA.body;
  
  return defaultDNA;
}

function buildSimoraPrompt(title: string, subtitle: string, description: string, categoryName: string): string {
  const dna = getCategoryDNA(categoryName, title);
  
  return `Square mobile app cover illustration for a wellness app called Simora.

RITUAL NAME: "${title}"${subtitle ? `\nSUBTITLE: "${subtitle}"` : ''}

STYLE (CRITICAL — follow exactly):
Soft pastel digital illustration.
Feminine self-care aesthetic.
Calming and uplifting mood.
Clean modern wellness design.
Friendly digital illustration with soft glow and sparkles.
Think: Finch app + Fabulous app + Calm app — but MORE feminine, more emotionally warm and empowering.

MAIN SCENE (CENTER HERO):
${dna.heroScene}

FLOATING ICONS AROUND CENTER:
${dna.floatingIcons}
These small icons represent the ritual's actions and float gently around the main character.

CHARACTER DIRECTION (VERY IMPORTANT):
- Gentle smiling woman, calm confident pose
- Wellness lifestyle illustration style
- Soft athletic or casual cozy outfit
- Warm expression, soft body language
- Empowering feminine energy
- NOT aggressive fitness energy
- NOT cold or corporate
- She feels: safe, strong, and soft

COLORS & BACKGROUND:
${dna.colors}
Dreamy pastel sky, soft sparkles, light nature elements.
Minimal but warm and inviting environment.
Smooth gradients, soft edges, premium glow.

MOOD & FEELING:
${dna.mood}
Overall feeling: Safe + Soft + Powerful.
This is a strength companion app — not a diet app, not a hardcore fitness app.
Emotional wellness meets feminine self-improvement.

COMPOSITION (LAYOUT):
- Centered hero character or scene as main focal point
- Small floating icons orbiting naturally around the center
- Balanced clean layout with breathing room
- Designed as a square mobile app ritual cover
- High-end premium wellness app aesthetic — like a magazine cover for inner strength

ABSOLUTELY FORBIDDEN — DO NOT INCLUDE:
- NO text, words, letters, numbers, or typography of any kind (zero text in image)
- NO strong neon colors or dark aggressive contrast
- NO aggressive or masculine fitness energy
- NO cluttered busy composition
- NO generic cliché wellness imagery (no lotus flowers, no yin-yang, no chakras)
- NO dark moods or negative energy`;
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

    const prompt = buildSimoraPrompt(
      planTitle || 'Wellness Ritual',
      planSubtitle || '',
      planDescription || '',
      categoryName || ''
    );

    console.log('Generating Simora-style cover for:', planTitle);
    console.log('Category DNA matched for:', categoryName);

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

    console.log('Simora cover generated successfully:', publicUrl);

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
