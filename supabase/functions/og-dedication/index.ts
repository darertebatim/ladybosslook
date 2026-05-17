// OG image generator for Care Package landing pages.
// Returns a 1200x630 SVG (rendered as image/svg+xml — universally readable
// by WhatsApp, iMessage, Slack, Twitter, etc., without external deps).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  } as Record<string, string>)[c]);
}

function svg(senderName: string, momentTitle: string, emoji: string): string {
  const name = escapeXml(senderName).slice(0, 24);
  const title = escapeXml(momentTitle).slice(0, 60);
  const e = escapeXml(emoji || '💝');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE0CC"/>
      <stop offset="55%" stop-color="#E8D5FF"/>
      <stop offset="100%" stop-color="#CFF1E2"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.85" cy="0.15" r="0.5">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.1" cy="0.9" r="0.5">
      <stop offset="0%" stop-color="#FF8FA3" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FF8FA3" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <g transform="translate(600, 200)" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text font-size="40" font-weight="600" fill="#1a1a1a" opacity="0.65" letter-spacing="3">A CARE PACKAGE</text>
  </g>
  <g transform="translate(600, 320)" text-anchor="middle">
    <text font-size="170">${e}</text>
  </g>
  <g transform="translate(600, 440)" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text font-size="56" font-weight="800" fill="#0a0a0a">${name} dedicated this to you</text>
  </g>
  <g transform="translate(600, 510)" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text font-size="38" font-weight="500" fill="#1a1a1a" opacity="0.75">${title}</text>
  </g>
  <g transform="translate(600, 590)" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text font-size="24" font-weight="600" fill="#1a1a1a" opacity="0.5" letter-spacing="4">RILO</text>
  </g>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') ?? url.pathname.split('/').pop();
    if (!token || token.length < 8) {
      return new Response('Missing token', { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.rpc('get_dedication_by_token', { t: token });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;

    const senderName = row?.sender_first_name || 'Someone';
    const momentTitle = row?.moment_title || 'A moment for you';
    const emoji = row?.moment_emoji || '💝';

    const body = svg(senderName, momentTitle, emoji);

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (e) {
    console.error('[og-dedication]', e);
    const fallback = svg('Someone', 'A moment for you', '💝');
    return new Response(fallback, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
});