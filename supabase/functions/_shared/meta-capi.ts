// Server-side Meta Conversions API sender (shared by create-payment and stripe-webhook).
const PIXEL_ID = '755747250681175';
const API_VERSION = 'v21.0';

async function sha256(v: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface MetaEventInput {
  eventName: 'Purchase' | 'InitiateCheckout';
  eventId: string;
  eventTime?: number; // unix seconds
  sourceUrl?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  value?: number;
  currency?: string;
  contentName?: string | null;
  contentId?: string | null;
}

export async function sendMetaEvent(e: MetaEventInput): Promise<void> {
  const token = Deno.env.get('META_CAPI_ACCESS_TOKEN');
  if (!token) { console.log('[META-CAPI] token missing, skipped', e.eventName); return; }
  try {
    const user_data: Record<string, unknown> = {};
    if (e.userAgent) user_data.client_user_agent = e.userAgent;
    if (e.ip) user_data.client_ip_address = e.ip;
    if (e.email) user_data.em = [await sha256(e.email.trim().toLowerCase())];
    if (e.phone) {
      const digits = e.phone.replace(/\D/g, '');
      if (digits) user_data.ph = [await sha256(digits)];
    }
    if (e.externalId) user_data.external_id = [await sha256(e.externalId)];

    const custom_data: Record<string, unknown> = {};
    if (typeof e.value === 'number') custom_data.value = e.value;
    if (e.currency) custom_data.currency = e.currency.toUpperCase();
    if (e.contentName) custom_data.content_name = e.contentName;
    if (e.contentId) { custom_data.content_ids = [e.contentId]; custom_data.content_type = 'product'; }

    const payload = {
      data: [{
        event_name: e.eventName,
        event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: 'website',
        event_source_url: e.sourceUrl || 'https://ladybosslook.com',
        user_data,
        custom_data,
      }],
      partner_agent: 'lovable',
    };
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    );
    const out = await res.json().catch(() => ({}));
    if (!res.ok) console.error('[META-CAPI]', e.eventName, 'error', JSON.stringify(out));
    else console.log('[META-CAPI]', e.eventName, 'sent', e.eventId);
  } catch (err) {
    console.error('[META-CAPI] exception', err instanceof Error ? err.message : String(err));
  }
}
