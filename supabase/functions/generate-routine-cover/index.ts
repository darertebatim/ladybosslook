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

const categoryVisualDNA: Record<string, { heroScenes: string[]; floatingIconSets: string[]; colors: string[]; moods: string[] }> = {
  morning: {
    heroScenes: [
      'gentle woman stretching with eyes closed in soft morning light, warm sunrise backdrop, peaceful expression',
      'woman sitting by a window with warm morning tea, sunlight streaming in, content peaceful smile',
      'woman doing a gentle morning yoga pose on a soft mat, golden sunrise glow behind her',
      'woman opening curtains to a bright sunrise, arms outstretched, joyful morning energy',
    ],
    floatingIconSets: [
      'floating icons: glowing sun, coffee cup, water glass, small pink flower, alarm clock',
      'floating icons: sunrise rays, herbal tea mug, journal book, sparkle stars, fresh flower',
      'floating icons: golden sun, yoga mat rolled up, water bottle, small bird, gentle leaf swirl',
      'floating icons: morning dew drops, warm cup, open window, small cloud, sunrise gradient orb',
    ],
    colors: [
      'warm sunrise gradient, soft peach, golden yellow, cream white, blush pink',
      'amber sunrise, soft tangerine, cream, warm gold, rose blush',
      'coral sunrise, soft peachy orange, warm cream, golden glow, light blush',
    ],
    moods: [
      'calm morning energy, fresh start, uplifting daily ritual',
      'gentle awakening, warm sunrise feeling, hopeful new day',
      'energizing soft morning, joyful beginning, peaceful intention-setting',
    ]
  },
  evening: {
    heroScenes: [
      'woman in peaceful relaxation, wrapped in soft blanket, moon glow through window',
      'woman sitting in a cozy corner with a warm drink, soft lamp light, calm evening atmosphere',
      'woman doing a gentle evening stretch, moon visible through soft curtains',
      'woman writing in a journal by candlelight, soft twilight outside, peaceful expression',
    ],
    floatingIconSets: [
      'floating icons: crescent moon, small twinkling stars, candle flame, cozy journal, warm cup',
      'floating icons: half moon, soft stars, glowing candle, lavender sprig, cozy blanket fold',
      'floating icons: moon and stars, warm light bulb, open book, heart, soft sparkle',
    ],
    colors: [
      'soft lavender, dusty rose, muted indigo, warm blush, gentle purple',
      'twilight purple, soft rose, warm mauve, cream white, midnight blue',
      'dusky lavender, rose gold, soft violet, warm cream, gentle indigo',
    ],
    moods: [
      'winding down energy, peaceful reflection, calming night ritual',
      'gentle evening unwinding, soft tranquility, restorative calm',
      'quiet evening peace, reflective mood, gentle self-care before sleep',
    ]
  },
  sleep: {
    heroScenes: [
      'woman resting peacefully with gentle smile, soft moon glow, dreamy clouds surrounding her',
      'woman cozy in soft bed, stars visible through window, deeply relaxed expression',
      'woman drifting into gentle sleep, surrounded by soft glowing stars and moon',
    ],
    floatingIconSets: [
      'floating icons: crescent moon, small stars, fluffy cloud, soft pillow, small ZZZ dreamscape',
      'floating icons: moon glow, twinkling constellation, soft cloud, lavender flower, sleepy star',
      'floating icons: half moon, star cluster, cozy pillow, dream cloud, soft glow orb',
    ],
    colors: [
      'deep soft lavender, midnight blue, silver shimmer, pastel purple, dreamy blue',
      'navy twilight, soft lilac, silver, lavender mist, deep rose',
      'indigo night, gentle violet, star silver, warm cream, soft lavender',
    ],
    moods: [
      'deeply calming, restorative, peaceful sleep energy',
      'dreamy serenity, gentle rest, calming stillness',
      'soft nighttime peace, soothing and restful, deeply relaxing',
    ]
  },
  mind: {
    heroScenes: [
      'gentle woman journaling in a peaceful corner, soft glowing heart above her head, calm expression',
      'woman in meditation with a soft smile, gentle light radiating from her center, peaceful pose',
      'woman sitting thoughtfully with a warm cup, small glowing ideas floating around her',
      'woman reading a book with soft fairy lights around her, calm intellectual energy',
    ],
    floatingIconSets: [
      'floating icons: open journal, pen, glowing heart, small star, soft thought bubble',
      'floating icons: brain with soft glow, heart, pen, tiny lightbulb, star sparkle',
      'floating icons: open book, meditation lotus, heart glow, small cloud, gentle sparkle',
      'floating icons: journal, pen, glowing mind orb, small heart, twinkling star',
    ],
    colors: [
      'lavender, soft lilac, warm blush pink, gentle purple accents, cream',
      'soft violet, rose quartz, pale lavender, cream, gentle purple shimmer',
      'periwinkle blue, soft lavender, blush, warm cream, lilac',
    ],
    moods: [
      'inner reflection, emotional wellness, calm journaling energy',
      'mindful clarity, peaceful introspection, gentle mental wellness',
      'thoughtful self-discovery, calm awareness, gentle intellectual exploration',
    ]
  },
  body: {
    heroScenes: [
      'gentle confident woman in a soft yoga or wellness pose, sunrise backdrop, serene expression',
      'woman doing a graceful stretch, soft pink morning light, empowered yet gentle energy',
      'woman in a fluid movement pose, nature background, soft strength and grace',
    ],
    floatingIconSets: [
      'floating icons: water bottle, fresh apple, small sun, movement swirl, green leaf',
      'floating icons: yoga mat, glowing heart, water drop, small flower, gentle leaf',
      'floating icons: movement trail, water bottle, sunrise, small star, soft glow',
    ],
    colors: [
      'warm sunrise gradient, soft peach, golden yellow, pastel coral, warm cream',
      'soft coral, warm tangerine, cream, gentle rose, sunrise gold',
      'pastel coral, warm peach, soft amber, blush, cream white',
    ],
    moods: [
      'soft active energy, morning vitality, feminine strength',
      'gentle body awareness, graceful movement, joyful wellness',
      'flowing strength, soft empowerment, body appreciation',
    ]
  },
  growth: {
    heroScenes: [
      'woman looking upward with calm confidence, soft light rays emerging above, empowered expression',
      'woman reaching toward glowing stars with a joyful smile, uplifting magical atmosphere',
      'woman standing in a field of soft light with hands on heart, growth and gratitude pose',
      'woman opening a glowing book, soft light emanating, learning and discovery energy',
    ],
    floatingIconSets: [
      'floating icons: small glowing star, upward arrow, soft sparkles, open book, tiny delicate crown',
      'floating icons: stars, ascending sparkle trail, open book, heart, tiny golden crown',
      'floating icons: glowing star cluster, upward soft arrow, journal, small crown, light orb',
    ],
    colors: [
      'soft blue, warm lavender, gentle purple, light gold accents, pastel sky',
      'sky blue, soft violet, warm cream, gold shimmer, gentle periwinkle',
      'pastel sky, lavender, gold accents, rose blush, gentle turquoise',
    ],
    moods: [
      'empowering growth energy, subtle magic, uplifting potential',
      'hopeful forward movement, gentle ambition, magical possibility',
      'steady self-improvement, warm encouragement, soft empowerment',
    ]
  },
  fitness: {
    heroScenes: [
      'woman in a soft confident wellness pose with gentle smile, feminine strength — not aggressive fitness',
      'woman joyfully doing a light workout, pastel background, happy empowered energy',
      'woman lifting small weights with a bright smile, cheerful soft setting, feminine strength',
    ],
    floatingIconSets: [
      'floating icons: small dumbbell, glowing heart, water bottle, yoga mat, small star',
      'floating icons: soft dumbbell, sneaker, water bottle, heart, movement sparkle',
      'floating icons: small kettlebell, star, water drop, heart glow, soft motion trail',
    ],
    colors: [
      'soft coral, warm peach, light blush, gentle orange gradient, cream',
      'warm rose, soft peach, coral, cream, gentle amber',
      'blush coral, warm tangerine, soft rose, cream white, gentle glow',
    ],
    moods: [
      'empowering feminine strength, soft active energy, joyful movement',
      'celebratory fitness energy, happy movement, gentle power',
      'soft athletic joy, empowered wellness, feminine confidence in motion',
    ]
  },
  nutrition: {
    heroScenes: [
      'woman joyfully enjoying a colorful healthy meal, soft warm kitchen or garden backdrop',
      'woman holding a vibrant salad bowl with a happy smile, fresh natural setting',
      'woman preparing colorful healthy food, warm kitchen light, peaceful nourishing energy',
    ],
    floatingIconSets: [
      'floating icons: fresh apple, colorful salad bowl, water bottle, small heart, green leaf',
      'floating icons: avocado, water glass, colorful fruit, small flower, green leaf',
      'floating icons: fresh vegetables, water bottle, glowing heart, small sun, leaf',
    ],
    colors: [
      'fresh sage green, soft yellow, warm cream, pastel pink accents, light coral',
      'mint green, soft yellow, warm cream, coral, sage',
      'fresh lime green, lemon yellow, cream, soft coral, natural green',
    ],
    moods: [
      'nourishing energy, vibrant health, joyful self-care',
      'fresh and energizing, abundant nourishment, happy healthy glow',
      'wholesome vitality, colorful joy, nourishing wellness',
    ]
  },
  cleaning: {
    heroScenes: [
      'woman in a bright organized peaceful home, soft natural light, calm satisfied expression',
      'woman arranging flowers in a clean bright room, serene tidy environment, gentle smile',
      'woman enjoying a clean organized space, soft sunlight, feeling of peace and order',
    ],
    floatingIconSets: [
      'floating icons: small broom, sparkling star, pink flower, neatly stacked items, soft clean glow',
      'floating icons: small plant, clean sparkle, gentle broom, star, organized stack',
      'floating icons: sparkle clean icon, small flower, gentle broom, star cluster, tidy symbol',
    ],
    colors: [
      'fresh white, soft sage green, warm cream, light airy blue, blush pink',
      'clean white, mint green, soft sky blue, warm cream, gentle blush',
      'pure white, sage, airy blue, cream, soft green',
    ],
    moods: [
      'clean organized energy, fresh home, calm productivity',
      'peaceful order, fresh clean feeling, gentle satisfaction of tidiness',
      'serene organization, airy freshness, calm productive energy',
    ]
  },
  self_care: {
    heroScenes: [
      'woman in a relaxing self-care moment, bath or skincare ritual, soft glow surrounding her',
      'woman applying skincare with a peaceful smile, soft glowing bathroom, luxurious self-love energy',
      'woman wrapped in a soft robe with a face mask, spa-like setting, gentle self-love atmosphere',
    ],
    floatingIconSets: [
      'floating icons: rose petal, soft flower, heart, sparkle drops, small mirror',
      'floating icons: rose, pearl drop, small mirror, heart, sparkle glow',
      'floating icons: flower petal, heart sparkle, dewdrop, small rose, soft glow orb',
    ],
    colors: [
      'blush pink, soft peach, cream, warm rose, gentle lavender',
      'rose blush, cream white, soft pink, warm peach, gentle mauve',
      'pastel pink, warm cream, soft blush, rose, gentle lilac',
    ],
    moods: [
      'nurturing self-love, soft luxurious energy, gentle self-compassion',
      'tender self-care, gentle pampering, warm self-appreciation',
      'indulgent kindness to self, soft luxury, gentle loving energy',
    ]
  }
};

const defaultDNA = {
  heroScenes: [
    'gentle confident woman in a peaceful wellness moment, soft warm environment, calm empowered expression',
    'woman in a serene natural setting, soft light around her, peaceful joyful expression',
    'woman with hands over heart, soft glowing environment, warm gentle energy',
    'woman sitting peacefully with eyes closed, soft sparkles around her, inner peace energy',
  ],
  floatingIconSets: [
    'floating icons: glowing heart, small star, soft sparkle, green leaf, soft glow orb',
    'floating icons: heart, star, flower, sparkle, soft cloud',
    'floating icons: glowing orb, small flower, star, heart, gentle leaf',
  ],
  colors: [
    'lavender, pastel pink, soft blue, warm sunrise gradients, gentle purple, cream white',
    'blush pink, soft lavender, warm cream, gentle violet, rose',
    'soft purple, rose, cream, lavender, gentle peach',
  ],
  moods: [
    'safe, soft, powerful — emotional wellness meets feminine strength',
    'gentle empowerment, warm wellness energy, feminine inner strength',
    'nurturing self-growth, soft positive energy, feminine wellness',
  ]
};

function getCategoryDNA(categoryName: string, title: string) {
  const search = (categoryName + ' ' + title).toLowerCase();
  
  if (search.includes('morning') || search.includes('wake') || search.includes('sunrise') || search.includes('dawn') || search.includes('rise')) return categoryVisualDNA.morning;
  if (search.includes('sleep') || search.includes('night') || search.includes('bedtime') || search.includes('insomnia')) return categoryVisualDNA.sleep;
  if (search.includes('evening') || search.includes('wind down') || search.includes('dusk') || search.includes('twilight') || search.includes('end of the day')) return categoryVisualDNA.evening;
  if (search.includes('mind') || search.includes('journal') || search.includes('meditat') || search.includes('mental') || search.includes('brain') || search.includes('thought') || search.includes('calm')) return categoryVisualDNA.mind;
  if (search.includes('fitness') || search.includes('workout') || search.includes('exercise') || search.includes('gym') || search.includes('strength') || search.includes('ladyboss')) return categoryVisualDNA.fitness;
  if (search.includes('grow') || search.includes('goal') || search.includes('learn') || search.includes('produc') || search.includes('success') || search.includes('adhd') || search.includes('anxiety')) return categoryVisualDNA.growth;
  if (search.includes('food') || search.includes('nutrit') || search.includes('eat') || search.includes('meal') || search.includes('diet') || search.includes('healthy eating')) return categoryVisualDNA.nutrition;
  if (search.includes('clean') || search.includes('organiz') || search.includes('home') || search.includes('tidy') || search.includes('house')) return categoryVisualDNA.cleaning;
  if (search.includes('self care') || search.includes('selfcare') || search.includes('skin') || search.includes('beauty') || search.includes('spa') || search.includes('self-kind') || search.includes('gratitude')) return categoryVisualDNA.self_care;
  if (search.includes('body') || search.includes('movement') || search.includes('stretch') || search.includes('yoga') || search.includes('pilates') || search.includes('fit')) return categoryVisualDNA.body;
  
  return defaultDNA;
}

// Pick a random item from an array
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build a dynamic prompt using the ritual's actual actions and visual DNA
function buildSimoraPrompt(
  title: string,
  subtitle: string,
  description: string,
  categoryName: string,
  actionTitles: string[]
): string {
  const dna = getCategoryDNA(categoryName, title);
  
  // Pick random variants for creativity
  const heroScene = pickRandom(dna.heroScenes);
  const mood = pickRandom(dna.moods);
  const colorPalette = pickRandom(dna.colors);

  // Build dynamic floating icons from real actions — use the icons that represent the actual ritual tasks
  let floatingIconsSection: string;
  if (actionTitles.length > 0) {
    const iconHints = actionTitles.slice(0, 5).map(a => {
      const lower = a.toLowerCase();
      if (lower.includes('water') || lower.includes('hydrat') || lower.includes('drink')) return 'water glass or bottle';
      if (lower.includes('journal') || lower.includes('write') || lower.includes('note')) return 'open journal with pen';
      if (lower.includes('stretch') || lower.includes('yoga') || lower.includes('pilates')) return 'yoga mat or stretching symbol';
      if (lower.includes('meditat') || lower.includes('breath') || lower.includes('mindful')) return 'soft breathing circle or lotus';
      if (lower.includes('read') || lower.includes('book') || lower.includes('page')) return 'open book';
      if (lower.includes('walk') || lower.includes('steps') || lower.includes('outside')) return 'small shoe or footsteps';
      if (lower.includes('mood') || lower.includes('emotion') || lower.includes('feel')) return 'glowing heart face or emoji symbol';
      if (lower.includes('gratitude') || lower.includes('grateful') || lower.includes('thankful')) return 'small heart with sparkle';
      if (lower.includes('affirm') || lower.includes('mantra')) return 'glowing soft star or speech bubble';
      if (lower.includes('declutter') || lower.includes('clean') || lower.includes('tidy')) return 'small broom or tidy sparkle';
      if (lower.includes('sleep') || lower.includes('rest') || lower.includes('nap')) return 'crescent moon';
      if (lower.includes('coffee') || lower.includes('tea') || lower.includes('morning')) return 'warm cup with steam';
      if (lower.includes('workout') || lower.includes('exercise') || lower.includes('gym')) return 'small soft dumbbell';
      if (lower.includes('food') || lower.includes('eat') || lower.includes('meal') || lower.includes('nutrit')) return 'colorful food bowl';
      if (lower.includes('sun') || lower.includes('morning') || lower.includes('rise')) return 'glowing sun rays';
      if (lower.includes('skin') || lower.includes('beauty') || lower.includes('self care')) return 'small rose or sparkle drops';
      if (lower.includes('energy') || lower.includes('focus') || lower.includes('reset')) return 'glowing energy orb or lightning bolt (soft)';
      return 'soft glowing sparkle';
    });
    floatingIconsSection = `Floating icons representing the ritual's actual actions: ${iconHints.join(', ')}`;
  } else {
    floatingIconsSection = pickRandom(dna.floatingIconSets);
  }

  // Random composition variation for uniqueness
  const compositions = [
    'Centered hero character as main focal point, icons floating in a gentle arc above',
    'Character slightly left of center, icons floating on the right side in a cascade',
    'Centered scene with icons orbiting naturally in a circular arrangement',
    'Character in the lower two-thirds, icons floating above and around like a halo',
    'Full scene composition with character centered, icons spread diagonally',
  ];
  const composition = pickRandom(compositions);

  // Random style variation seed for uniqueness
  const styleVariations = [
    'illustrated with soft watercolor washes and gentle ink outlines',
    'illustrated in a clean vector-art style with soft glowing accents',
    'illustrated with pastel gouache texture, soft and dreamy quality',
    'illustrated in a modern flat-art style with soft gradient overlays and glow effects',
    'illustrated with gentle digital painting style, soft light and shadow',
  ];
  const styleVariation = pickRandom(styleVariations);

  return `Square mobile app cover illustration for a wellness app called Simora.
Unique seed variation: ${Math.random().toString(36).substring(7)}

RITUAL: "${title}"${subtitle ? `\nSUBTITLE: "${subtitle}"` : ''}
RITUAL ACTIONS: ${actionTitles.length > 0 ? actionTitles.slice(0, 5).join(', ') : 'general wellness actions'}

STYLE (CRITICAL — follow exactly):
Soft pastel digital illustration, ${styleVariation}.
Feminine self-care aesthetic.
Calming and uplifting mood.
Clean modern wellness design.
Soft glow, sparkles, dreamy quality.
Think: Finch app + Fabulous app + Calm app — but MORE feminine, more emotionally warm and empowering.

MAIN SCENE (CENTER HERO):
${heroScene}

FLOATING ICONS (representing this ritual's actual actions):
${floatingIconsSection}
These small delicate icons float gently around the main character and SYMBOLIZE what the ritual is about.

CHARACTER DIRECTION (VERY IMPORTANT):
- Gentle smiling woman, calm confident pose
- Wellness lifestyle illustration style
- Soft athletic or casual cozy outfit appropriate to the ritual
- Warm expression, soft body language
- Empowering feminine energy — safe, strong, and soft
- NOT aggressive fitness energy
- NOT cold or corporate

COLORS & BACKGROUND:
${colorPalette}
Dreamy pastel sky, soft sparkles, light nature elements.
Minimal but warm and inviting environment.
Smooth gradients, soft edges, premium glow.

MOOD & FEELING:
${mood}
Overall feeling: Safe + Soft + Powerful.
Strength companion app — not a diet app, not a hardcore fitness app.
Emotional wellness meets feminine self-improvement.

COMPOSITION:
${composition}
Balanced clean layout with breathing room.
High-end premium wellness app aesthetic — like a magazine cover for inner strength.

ABSOLUTELY FORBIDDEN:
- NO text, words, letters, numbers, or typography of any kind
- NO strong neon colors or dark aggressive contrast
- NO aggressive or masculine fitness energy
- NO cluttered busy composition
- NO generic clichés: no lotus flowers, no yin-yang, no chakras
- NO dark moods or negative energy`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { planId, planTitle, planSubtitle, planDescription, categoryName } = await req.json();

    if (!planId) throw new Error('Plan ID is required');

    // ✅ DYNAMICALLY FETCH real actions from the database
    const { data: actions } = await supabase
      .from('routines_bank_tasks')
      .select('title, emoji')
      .eq('routine_id', planId)
      .order('task_order', { ascending: true })
      .limit(10);

    const actionTitles = (actions || []).map((a: { title: string }) => a.title);
    
    console.log(`Generating cover for: "${planTitle}" | Category: ${categoryName} | Actions: [${actionTitles.join(', ')}]`);

    const prompt = buildSimoraPrompt(
      planTitle || 'Wellness Ritual',
      planSubtitle || '',
      planDescription || '',
      categoryName || '',
      actionTitles
    );

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
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image was generated');
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `routine-${planId}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('routine-covers')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('routine-covers')
      .getPublicUrl(fileName);

    console.log('Simora cover generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({ success: true, coverUrl: publicUrl, message: 'Cover generated successfully' }),
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
