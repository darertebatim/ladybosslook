import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Build context from name, description and category
    const categoryContext = playlistCategory === 'audiobook' 
      ? 'audiobook/audio content' 
      : playlistCategory === 'podcast' 
        ? 'podcast series' 
        : 'course supplement audio';
    
    const descriptionContext = playlistDescription 
      ? ` - ${playlistDescription.replace(/<[^>]*>/g, '').substring(0, 300)}`
      : '';

    // Generate a prompt styled like the existing artistic playlist covers
    // The existing covers have: vibrant colors, artistic/painterly style, elegant woman silhouettes, 
    // gradient backgrounds, modern aesthetic
    const basePrompt = `Create a stunning, artistic album/playlist cover for: "${playlistName}"${descriptionContext}

This is a ${categoryContext} for women's personal development and empowerment.

Style requirements (CRITICAL - follow these exactly):
- Artistic, painterly style with rich, vibrant colors
- Elegant woman silhouette or abstract feminine form as focal point
- Beautiful gradient background with warm tones (rose gold, coral, magenta, purple, amber)
- Modern, premium aesthetic like a high-end music album cover
- Dreamy, aspirational mood with soft lighting effects
- Can include: flowing hair, elegant poses, abstract floral elements, light rays
- Square composition (1:1 aspect ratio, 800x800px)
- No text, no logos, no words
- High contrast with rich saturation
- Evoke feelings of empowerment, beauty, and transformation
- Similar style to modern R&B/Soul album covers with artistic flair`;

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
