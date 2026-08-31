import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PIXEL_ID = '755747250681175';
const API_VERSION = 'v21.0';

async function sha256(value: string) {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const token = Deno.env.get('META_CAPI_ACCESS_TOKEN');
    if (!token) return json({ error: 'META_CAPI_ACCESS_TOKEN not configured' }, 500);

    const body = await req.json().catch(() => null);
    if (!body || typeof body.eventName !== 'string' || body.eventName.length > 64) {
      return json({ error: 'eventName is required' }, 400);
    }

    const {
      eventName,
      eventId,
      email,
      phone,
      firstName,
      eventSourceUrl,
      fbp,
      fbc,
      customData,
      testEventCode,
    } = body as Record<string, any>;

    const userData: Record<string, unknown> = {};
    if (typeof email === 'string' && email.includes('@')) userData.em = [await sha256(email)];
    if (typeof phone === 'string' && phone.trim()) {
      userData.ph = [await sha256(phone.replace(/[^0-9]/g, ''))];
    }
    if (typeof firstName === 'string' && firstName.trim()) userData.fn = [await sha256(firstName)];
    if (typeof fbp === 'string' && fbp) userData.fbp = fbp;
    if (typeof fbc === 'string' && fbc) userData.fbc = fbc;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (ip) userData.client_ip_address = ip;
    const ua = req.headers.get('user-agent');
    if (ua) userData.client_user_agent = ua;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: typeof eventId === 'string' ? eventId : undefined,
          event_source_url: typeof eventSourceUrl === 'string' ? eventSourceUrl : undefined,
          action_source: 'website',
          user_data: userData,
          custom_data: customData && typeof customData === 'object' ? customData : undefined,
        },
      ],
    };
    if (typeof testEventCode === 'string' && testEventCode) payload.test_event_code = testEventCode;

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const result = await res.json();
    if (!res.ok) {
      console.error('[META-CAPI] error', JSON.stringify(result));
      return json({ error: 'meta_error', details: result }, 502);
    }
    console.log('[META-CAPI] sent', eventName, JSON.stringify(result));
    return json({ ok: true, result });
  } catch (e) {
    console.error('[META-CAPI] exception', e instanceof Error ? e.message : String(e));
    return json({ error: 'unexpected_error' }, 500);
  }
});
