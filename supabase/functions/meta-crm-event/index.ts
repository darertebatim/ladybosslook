// Meta Conversions API — CRM lead-stage events.
// Sends downstream lead stages (attended, purchased, qualified, email engaged)
// to Meta so ad delivery can optimize for real outcomes, not just form fills.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PIXEL_ID = '755747250681175';
const API_VERSION = 'v21.0';
const LEAD_EVENT_SOURCE = 'Ladyboss Academy';
const MAX_BATCH = 200;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const STAGES: Record<string, string> = {
  attended: 'WebinarAttended',
  purchased: 'Enrolled',
  qualified: 'QualifiedLead',
  email_engaged: 'EmailEngaged',
};

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface StageEvent {
  stage: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  refId?: string | null;
  source?: string | null;
  occurredAt?: string | null;
}

async function sendToMeta(token: string, events: StageEvent[], testEventCode?: string) {
  const data = await Promise.all(
    events.map(async (e) => {
      const userData: Record<string, unknown> = {};
      if (e.email && e.email.includes('@')) userData.em = [await sha256(e.email)];
      if (e.phone && e.phone.trim()) {
        const digits = e.phone.replace(/[^0-9]/g, '');
        if (digits) userData.ph = [await sha256(digits)];
      }
      if (e.name && e.name.trim()) userData.fn = [await sha256(e.name.split(' ')[0])];

      return {
        event_name: STAGES[e.stage],
        event_time: Math.floor(
          (e.occurredAt ? new Date(e.occurredAt).getTime() : Date.now()) / 1000,
        ),
        action_source: 'system_generated',
        user_data: userData,
        custom_data: {
          event_source: 'crm',
          lead_event_source: LEAD_EVENT_SOURCE,
          stage: e.stage,
          ...(e.source ? { content_category: e.source } : {}),
        },
      };
    }),
  );

  const payload: Record<string, unknown> = { data };
  if (testEventCode) payload.test_event_code = testEventCode;

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  const result = await res.json();
  return { ok: res.ok, result };
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

    const db = admin();

    // --- auth: admin user OR internal service-role call --------------------
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '').trim();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    let authorized = jwt === serviceKey;

    if (!authorized && jwt) {
      const { data: userRes } = await db.auth.getUser(jwt);
      const uid = userRes?.user?.id;
      if (uid) {
        const { data: isAdmin } = await db.rpc('has_role', { _user_id: uid, _role: 'admin' });
        authorized = !!isAdmin;
      }
    }
    if (!authorized) return json({ error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const mode: string = body?.mode === 'sync' ? 'sync' : 'send';
    const testEventCode: string | undefined =
      typeof body?.testEventCode === 'string' ? body.testEventCode : undefined;

    let queue: StageEvent[] = [];

    if (mode === 'send') {
      const raw = Array.isArray(body?.events) ? body.events : [body];
      queue = raw
        .filter((e: any) => e && typeof e.stage === 'string' && STAGES[e.stage])
        .slice(0, MAX_BATCH)
        .map((e: any) => ({
          stage: e.stage,
          email: e.email ?? null,
          phone: e.phone ?? null,
          name: e.name ?? null,
          refId: e.refId ?? null,
          source: e.source ?? null,
          occurredAt: e.occurredAt ?? null,
        }));
      if (!queue.length) return json({ error: 'no valid events' }, 400);
    } else {
      const since = new Date(Date.now() - NINETY_DAYS_MS).toISOString();

      // Purchases / enrollments
      const { data: orders } = await db
        .from('orders')
        .select('id, email, name, phone, program_slug, created_at, status, refunded')
        .gte('created_at', since)
        .in('status', ['paid', 'completed', 'partially_refunded'])
        .order('created_at', { ascending: false })
        .limit(MAX_BATCH);

      for (const o of orders || []) {
        if (!o.email) continue;
        queue.push({
          stage: 'purchased',
          email: o.email,
          name: o.name,
          phone: o.phone,
          refId: o.id,
          source: o.program_slug,
          occurredAt: o.created_at,
        });
      }

      // Email engagement (opens / clicks on our webinar mails)
      const { data: opens } = await db
        .from('email_delivery_events')
        .select('id, recipient, event_type, occurred_at')
        .in('event_type', ['opened', 'clicked'])
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(MAX_BATCH);

      const seen = new Set<string>();
      for (const e of opens || []) {
        if (!e.recipient || seen.has(e.recipient)) continue;
        seen.add(e.recipient);
        queue.push({
          stage: 'email_engaged',
          email: e.recipient,
          refId: null,
          source: e.event_type,
          occurredAt: e.occurred_at,
        });
      }
    }

    // --- dedupe against what we already sent -------------------------------
    const emails = [...new Set(queue.map((e) => (e.email || '').toLowerCase()).filter(Boolean))];
    const { data: already } = await db
      .from('meta_crm_events')
      .select('stage, email, ref_id')
      .in('email', emails.length ? emails : ['__none__']);

    const sentKeys = new Set(
      (already || []).map(
        (r: any) => `${r.stage}|${(r.email || '').toLowerCase()}|${r.ref_id || ''}`,
      ),
    );

    const fresh = queue.filter(
      (e) => !sentKeys.has(`${e.stage}|${(e.email || '').toLowerCase()}|${e.refId || ''}`),
    );

    if (!fresh.length) return json({ ok: true, sent: 0, skipped: queue.length });

    const { ok, result } = await sendToMeta(token, fresh, testEventCode);
    if (!ok) {
      console.error('[META-CRM] meta error', JSON.stringify(result));
      return json({ error: 'meta_error', details: result }, 502);
    }

    await db.from('meta_crm_events').upsert(
      fresh.map((e) => ({
        stage: e.stage,
        event_name: STAGES[e.stage],
        email: e.email ? e.email.toLowerCase() : null,
        phone: e.phone ?? null,
        name: e.name ?? null,
        ref_id: e.refId ?? null,
        source: e.source ?? null,
        status: 'sent',
        response: result,
        occurred_at: e.occurredAt ?? new Date().toISOString(),
      })),
      { onConflict: 'stage,email,ref_id', ignoreDuplicates: true },
    );

    console.log('[META-CRM] sent', fresh.length, JSON.stringify(result));
    return json({ ok: true, sent: fresh.length, skipped: queue.length - fresh.length, result });
  } catch (e) {
    console.error('[META-CRM] exception', e instanceof Error ? e.message : String(e));
    return json({ error: 'unexpected_error' }, 500);
  }
});
