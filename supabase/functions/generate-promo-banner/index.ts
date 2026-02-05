import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AspectRatio = '3:1' | '16:9' | '1:1';

function getAspectRatioConfig(aspectRatio: AspectRatio) {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080, label: '16:9 aspect ratio (1920x1080 pixels)' };
    case '1:1':
      return { width: 1080, height: 1080, label: '1:1 aspect ratio (1080x1080 pixels)' };
    default:
      return { width: 1200, height: 400, label: '3:1 aspect ratio (1200x400 pixels)' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, subtitle, aspectRatio = '3:1' } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const config = getAspectRatioConfig(aspectRatio as AspectRatio);

    // Build the prompt based on aspect ratio
    const prompt = `Create a beautiful promotional banner image with a ${config.label}.

The banner should feature:
- Title text: "${title}"
${subtitle ? `- Subtitle text: "${subtitle}"` : ''}
- Modern, elegant design with a gradient background
- Professional typography that is easy to read
- Feminine, empowering aesthetic with soft colors (lavender, pink, gold accents)
- Clean layout suitable for a wellness/coaching app
- The text should be clearly visible and centered

Style: Luxury feminine branding, elegant gradient, modern minimalist.
Important: Make the text readable and prominent on the banner.`;

    console.log('Generating promo banner with aspect ratio:', aspectRatio, 'prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated banner image');

    return new Response(
      JSON.stringify({ imageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating banner:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
