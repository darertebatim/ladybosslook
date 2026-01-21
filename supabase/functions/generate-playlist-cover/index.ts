import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category-based visual style mapping for unique, diverse covers
const categoryStyles: Record<string, { theme: string; elements: string; colors: string }> = {
  audiobook: {
    theme: 'Editorial book photography, literary aesthetic',
    elements: 'Open book with pages gently turning, warm reading lamp glow, cozy library corner, leather textures, vintage bookshelf background, reading glasses, cup of tea',
    colors: 'Warm amber, deep burgundy, cream, rich brown, golden lamplight'
  },
  podcast: {
    theme: 'Modern studio broadcast aesthetic',
    elements: 'Professional microphone silhouette, subtle sound waves, intimate podcast studio, soft acoustic panels, warm studio lighting, headphones',
    colors: 'Deep navy, soft coral, warm gray, rose gold accents, soft white'
  },
  course_supplement: {
    theme: 'Clean minimalist educational design',
    elements: 'Modern architectural interior, structured geometric shapes, professional workspace, notebook and pen, clean desk setup, natural light through windows',
    colors: 'Soft sage green, warm white, light wood tones, muted gold, soft blush'
  },
  course: {
    theme: 'Clean minimalist educational design',
    elements: 'Modern architectural interior, structured geometric shapes, professional workspace, notebook and pen, clean desk setup, natural light through windows',
    colors: 'Soft sage green, warm white, light wood tones, muted gold, soft blush'
  },
  meditate: {
    theme: 'Serene nature and zen aesthetic',
    elements: 'Calm water reflection, lotus flower on still pond, misty mountain peaks at dawn, zen garden with raked sand, soft morning fog, single candle flame',
    colors: 'Soft lavender, pale blue, sage green, warm sunrise gold, peaceful white'
  },
  workout: {
    theme: 'Dynamic motion and energy',
    elements: 'Abstract motion blur, bold geometric shapes in motion, energetic brush strokes, athletic silhouette mid-movement, dynamic light trails',
    colors: 'Electric coral, vibrant magenta, energetic orange, bold teal, powerful purple'
  },
  soundscape: {
    theme: 'Immersive atmospheric landscapes',
    elements: 'Ocean waves at golden hour, deep forest with light filtering through, starry night sky, rain on window, natural textures close-up, flowing water',
    colors: 'Deep ocean blue, forest green, twilight purple, earthy brown, sunset orange'
  },
  affirmations: {
    theme: 'Ethereal and uplifting spiritual',
    elements: 'Golden light rays through clouds, celestial elements, soft ethereal glow, floating feathers, gentle sun flare, abstract angel wing forms',
    colors: 'Warm gold, soft peach, celestial white, gentle rose, light champagne'
  }
};

const defaultStyle = {
  theme: 'Modern artistic album cover',
  elements: 'Abstract flowing shapes, elegant curves, modern artistic interpretation, sophisticated design elements',
  colors: 'Rich jewel tones, warm amber, soft rose, deep purple, elegant gold'
};

function buildCategoryPrompt(playlistName: string, category: string, description: string): string {
  const style = categoryStyles[category] || defaultStyle;
  const cleanDescription = description ? description.replace(/<[^>]*>/g, '').substring(0, 200) : '';
  
  return `Create a professional, high-quality playlist cover image.

CONTEXT: "${playlistName}"
${cleanDescription ? `DESCRIPTION: ${cleanDescription}` : ''}

VISUAL THEME: ${style.theme}

SCENE ELEMENTS (choose 2-3 that fit the context):
${style.elements}

COLOR PALETTE:
${style.colors}

IMPORTANT: Do NOT include any text, titles, or typography on the cover. This should be a pure visual/photographic image only.

TECHNICAL REQUIREMENTS:
- Square format (1:1 aspect ratio)
- Professional album/book cover quality
- Rich, premium aesthetic
- NOT a generic stock photo look
- Evoke sophistication and intentional design
- The overall mood should feel aspirational and empowering
- NO TEXT OR WORDS on the image

Create a unique, artistic cover that stands out and captures the essence of the content.`;
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

    const { playlistName, playlistId, playlistDescription, playlistCategory } = await req.json();

    if (!playlistId) {
      throw new Error('Playlist ID is required');
    }

    // Build the category-specific prompt
    const basePrompt = buildCategoryPrompt(
      playlistName || 'Untitled Playlist',
      playlistCategory || 'course_supplement',
      playlistDescription || ''
    );

    console.log('Generating playlist cover for:', playlistName, playlistId);

    // Call the Lovable AI Gateway to generate the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: basePrompt,
          },
        ],
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

    // Extract the generated image
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

    const fileName = `playlist-${playlistId}-${Date.now()}.png`;
    
    // Upload to playlist-covers bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('playlist-covers')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('playlist-covers')
      .getPublicUrl(fileName);

    console.log('Cover uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: publicUrl,
        message: 'Playlist cover generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating playlist cover:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate playlist cover' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
