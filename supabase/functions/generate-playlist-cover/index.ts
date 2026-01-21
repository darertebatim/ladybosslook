import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category-based visual style mapping for background images (NO TEXT in prompts)
const categoryStyles: Record<string, { theme: string; elements: string; colors: string }> = {
  audiobook: {
    theme: 'Editorial book photography, literary aesthetic, warm and inviting',
    elements: 'Open book with pages gently turning, warm reading lamp glow, cozy library corner, leather textures, vintage bookshelf background, reading glasses, cup of tea, soft bokeh lights',
    colors: 'Warm amber, deep burgundy, cream, rich brown, golden lamplight, soft shadows'
  },
  podcast: {
    theme: 'Modern studio broadcast aesthetic, intimate and professional',
    elements: 'Professional microphone silhouette, subtle sound waves visualization, intimate podcast studio, soft acoustic panels, warm studio lighting, headphones on stand, ambient glow',
    colors: 'Deep navy, soft coral, warm gray, rose gold accents, soft white, moody shadows'
  },
  course_supplement: {
    theme: 'Clean minimalist educational design, professional and inspiring',
    elements: 'Modern architectural interior, structured geometric shapes, professional workspace, notebook and pen, clean desk setup, natural light through large windows, plants, minimalist decor',
    colors: 'Soft sage green, warm white, light wood tones, muted gold accents, soft blush pink'
  },
  meditate: {
    theme: 'Serene nature and zen aesthetic, peaceful and calming',
    elements: 'Calm water reflection at dawn, lotus flower floating on still pond, misty mountain peaks, zen garden with perfectly raked sand, soft morning fog, single candle flame, smooth stones',
    colors: 'Soft lavender, pale blue, sage green, warm sunrise gold, peaceful white, gentle mist'
  },
  workout: {
    theme: 'Dynamic motion and energy, bold and powerful',
    elements: 'Abstract motion blur trails, bold geometric shapes in dynamic movement, energetic brush strokes, athletic silhouette mid-action, dynamic light trails, explosive energy particles',
    colors: 'Electric coral, vibrant magenta, energetic orange, bold teal, powerful purple, high contrast'
  },
  soundscape: {
    theme: 'Immersive atmospheric landscapes, cinematic and enveloping',
    elements: 'Ocean waves at golden hour, deep forest with ethereal light filtering through canopy, starry night sky with aurora, rain on window with city lights beyond, flowing water over rocks, misty valleys',
    colors: 'Deep ocean blue, forest green, twilight purple, earthy brown, sunset orange, atmospheric haze'
  },
  affirmations: {
    theme: 'Ethereal and uplifting spiritual aesthetic, warm and empowering',
    elements: 'Golden light rays breaking through clouds, celestial elements, soft ethereal glow, floating feathers catching light, gentle sun flare, abstract angel wing forms, cosmic dust',
    colors: 'Warm gold, soft peach, celestial white, gentle rose, light champagne, divine glow'
  }
};

const defaultStyle = {
  theme: 'Modern artistic album cover, sophisticated and premium',
  elements: 'Abstract flowing shapes, elegant curves, modern artistic interpretation, sophisticated design elements, soft gradients, artistic textures',
  colors: 'Rich jewel tones, warm amber, soft rose, deep purple, elegant gold accents'
};

// Category-specific typography styles for Canvas rendering
const typographyStyles: Record<string, { 
  fontFamily: string; 
  fontWeight: string;
  textTransform: string;
  letterSpacing: number;
  position: 'center' | 'bottom-left' | 'bottom-center';
  shadowColor: string;
  shadowBlur: number;
  glowColor?: string;
  gradientOverlay: boolean;
}> = {
  audiobook: {
    fontFamily: 'Georgia, serif',
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 2,
    position: 'bottom-center',
    shadowColor: 'rgba(0,0,0,0.7)',
    shadowBlur: 15,
    gradientOverlay: true
  },
  podcast: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: 'bold',
    textTransform: 'none',
    letterSpacing: 1,
    position: 'bottom-left',
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 12,
    gradientOverlay: true
  },
  course_supplement: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 3,
    position: 'bottom-center',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 10,
    gradientOverlay: true
  },
  meditate: {
    fontFamily: 'Georgia, serif',
    fontWeight: 'normal',
    textTransform: 'lowercase',
    letterSpacing: 4,
    position: 'center',
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowBlur: 20,
    glowColor: 'rgba(255,255,255,0.3)',
    gradientOverlay: false
  },
  workout: {
    fontFamily: 'Impact, Helvetica, sans-serif',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 4,
    position: 'bottom-center',
    shadowColor: 'rgba(0,0,0,0.8)',
    shadowBlur: 8,
    gradientOverlay: true
  },
  soundscape: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: '300',
    textTransform: 'lowercase',
    letterSpacing: 6,
    position: 'bottom-left',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 15,
    glowColor: 'rgba(255,255,255,0.2)',
    gradientOverlay: true
  },
  affirmations: {
    fontFamily: 'Georgia, serif',
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 2,
    position: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 20,
    glowColor: 'rgba(255,215,0,0.3)',
    gradientOverlay: false
  }
};

const defaultTypography = {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontWeight: 'normal',
  textTransform: 'none',
  letterSpacing: 2,
  position: 'bottom-center' as const,
  shadowColor: 'rgba(0,0,0,0.6)',
  shadowBlur: 12,
  gradientOverlay: true
};

function buildBackgroundPrompt(playlistName: string, category: string, description: string): string {
  const style = categoryStyles[category] || defaultStyle;
  const cleanDescription = description ? description.replace(/<[^>]*>/g, '').substring(0, 150) : '';
  
  // Build prompt for background ONLY - no text
  return `Create a stunning, professional album cover background image.

THEME: ${style.theme}

VISUAL ELEMENTS (incorporate 2-3 that fit):
${style.elements}

COLOR PALETTE:
${style.colors}

CONTEXT: This is for "${playlistName}"${cleanDescription ? ` - ${cleanDescription}` : ''}

CRITICAL REQUIREMENTS:
- Generate ONLY the visual artwork - DO NOT include any text, words, letters, or typography
- Square format (1:1 aspect ratio)
- Professional album/book cover quality
- Rich, premium, cinematic aesthetic
- NOT a generic stock photo look
- Leave space in the composition for text overlay (especially in lower third)
- The mood should feel aspirational, premium, and emotionally evocative

Create a unique, artistic background that captures the essence of the content.`;
}

// Simple SVG-based text overlay generator
function generateTextOverlaySVG(
  title: string, 
  category: string, 
  width: number, 
  height: number
): string {
  const typo = typographyStyles[category] || defaultTypography;
  
  // Apply text transform
  let displayTitle = title;
  if (typo.textTransform === 'uppercase') {
    displayTitle = title.toUpperCase();
  } else if (typo.textTransform === 'lowercase') {
    displayTitle = title.toLowerCase();
  }
  
  // Calculate font size based on title length
  const maxChars = displayTitle.length;
  let fontSize = Math.min(72, Math.max(32, Math.floor(width / (maxChars * 0.6))));
  
  // If title is very long, make it smaller
  if (maxChars > 25) fontSize = Math.min(fontSize, 42);
  if (maxChars > 35) fontSize = Math.min(fontSize, 36);
  
  // Position calculations
  let textX: number, textY: number, textAnchor: string;
  const padding = 60;
  
  switch (typo.position) {
    case 'bottom-left':
      textX = padding;
      textY = height - padding - 20;
      textAnchor = 'start';
      break;
    case 'center':
      textX = width / 2;
      textY = height / 2;
      textAnchor = 'middle';
      break;
    case 'bottom-center':
    default:
      textX = width / 2;
      textY = height - padding - 20;
      textAnchor = 'middle';
      break;
  }
  
  // Build SVG with gradient overlay and styled text
  const gradientDefs = typo.gradientOverlay ? `
    <defs>
      <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
        <stop offset="50%" style="stop-color:rgba(0,0,0,0.3);stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:rgba(0,0,0,0.7);stop-opacity:0.7" />
      </linearGradient>
    </defs>
    <rect x="0" y="${height * 0.4}" width="${width}" height="${height * 0.6}" fill="url(#textGradient)" />
  ` : '';
  
  // Glow effect filter
  const glowFilter = typo.glowColor ? `
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  ` : '';
  
  const textStyle = `
    font-family: ${typo.fontFamily};
    font-weight: ${typo.fontWeight};
    font-size: ${fontSize}px;
    letter-spacing: ${typo.letterSpacing}px;
    fill: white;
    ${typo.glowColor ? 'filter: url(#glow);' : ''}
  `;
  
  // Shadow text (slightly offset and blurred)
  const shadowText = `
    <text 
      x="${textX + 3}" 
      y="${textY + 3}" 
      text-anchor="${textAnchor}"
      style="font-family: ${typo.fontFamily}; font-weight: ${typo.fontWeight}; font-size: ${fontSize}px; letter-spacing: ${typo.letterSpacing}px; fill: ${typo.shadowColor}; filter: blur(${typo.shadowBlur}px);"
    >${escapeXml(displayTitle)}</text>
  `;
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${gradientDefs}
      ${glowFilter}
      ${shadowText}
      <text 
        x="${textX}" 
        y="${textY}" 
        text-anchor="${textAnchor}"
        style="${textStyle}"
      >${escapeXml(displayTitle)}</text>
    </svg>
  `;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Composite SVG text over base image using a second AI call
async function compositeTextOnImage(
  baseImageBase64: string,
  title: string,
  category: string,
  apiKey: string
): Promise<string> {
  const typo = typographyStyles[category] || defaultTypography;
  
  // Apply text transform
  let displayTitle = title;
  if (typo.textTransform === 'uppercase') {
    displayTitle = title.toUpperCase();
  } else if (typo.textTransform === 'lowercase') {
    displayTitle = title.toLowerCase();
  }
  
  // Position description
  let positionDesc = '';
  switch (typo.position) {
    case 'bottom-left':
      positionDesc = 'positioned in the bottom-left corner with generous padding';
      break;
    case 'center':
      positionDesc = 'centered both horizontally and vertically';
      break;
    case 'bottom-center':
    default:
      positionDesc = 'centered horizontally in the bottom third';
      break;
  }
  
  // Font description
  const fontDesc = typo.fontFamily.includes('Georgia') || typo.fontFamily.includes('serif') 
    ? 'elegant serif font' 
    : typo.fontFamily.includes('Impact') 
      ? 'bold condensed sans-serif font'
      : 'clean modern sans-serif font';
  
  // Effects description
  const effectsDesc = [
    typo.glowColor ? 'subtle outer glow' : '',
    typo.gradientOverlay ? 'with a subtle dark gradient behind the text area for contrast' : '',
    `drop shadow for depth`
  ].filter(Boolean).join(', ');
  
  const textPrompt = `Add professional album cover typography to this image.

TEXT TO ADD: "${displayTitle}"

TYPOGRAPHY REQUIREMENTS:
- Use a ${fontDesc}
- ${typo.fontWeight === 'bold' ? 'Bold weight' : 'Regular weight'}
- ${typo.letterSpacing > 3 ? 'Wide letter spacing for elegance' : 'Normal letter spacing'}
- Text should be ${positionDesc}
- Color: Pure white text
- Effects: ${effectsDesc}
- The text must be crisp, clear, and highly readable
- This should look like a professional Spotify/Apple Music album cover
- DO NOT change the background image at all - only add the text overlay

Make the typography feel premium, intentional, and beautifully designed.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: textPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: baseImageBase64.startsWith('data:') ? baseImageBase64 : `data:image/png;base64,${baseImageBase64}`
              }
            }
          ]
        }
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Text overlay AI error:', response.status, errorText);
    throw new Error(`Failed to add text overlay: ${response.status}`);
  }

  const data = await response.json();
  const compositedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!compositedImage) {
    throw new Error('No composited image returned');
  }
  
  return compositedImage;
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

    const category = playlistCategory || 'course_supplement';
    const title = playlistName || 'Untitled Playlist';

    // Step 1: Generate the background image (no text)
    const backgroundPrompt = buildBackgroundPrompt(title, category, playlistDescription || '');

    console.log('Step 1: Generating background for:', title, '| Category:', category);

    const bgResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: backgroundPrompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!bgResponse.ok) {
      if (bgResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (bgResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await bgResponse.text();
      console.error('Background generation error:', bgResponse.status, errorText);
      throw new Error(`Background generation error: ${bgResponse.status}`);
    }

    const bgData = await bgResponse.json();
    const backgroundImage = bgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!backgroundImage) {
      console.error('No background image in response:', JSON.stringify(bgData));
      throw new Error('No background image was generated');
    }

    console.log('Step 2: Adding professional typography overlay...');

    // Step 2: Composite text on the background
    let finalImage: string;
    try {
      finalImage = await compositeTextOnImage(backgroundImage, title, category, LOVABLE_API_KEY);
      console.log('Typography overlay applied successfully');
    } catch (textError) {
      console.error('Text overlay failed, using background only:', textError);
      // Fallback to background-only if text overlay fails
      finalImage = backgroundImage;
    }

    // Step 3: Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to blob
    const base64Data = finalImage.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `playlist-${playlistId}-${Date.now()}.png`;
    
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

    const { data: { publicUrl } } = supabase.storage
      .from('playlist-covers')
      .getPublicUrl(fileName);

    console.log('Cover uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: publicUrl,
        message: 'Playlist cover generated with professional typography' 
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
