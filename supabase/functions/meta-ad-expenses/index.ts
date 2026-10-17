import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { CampaignExpense, totalSpend, validDateRange } from './report.ts';

const ACCOUNT_ID = '3293309414152068';
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/meta_ads/v26.0';
const cache = new Map<string, { expires: number; data: unknown }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return json({ error: 'Please sign in to view expenses.' }, 401);
    const { data: allowed, error: permissionError } = await db.rpc('can_access_admin_page', {
      _user_id: auth.user.id, _page_slug: 'payments',
    });
    if (permissionError || !allowed) return json({ error: 'You do not have access to payments.' }, 403);

    const { since, until } = await req.json();
    if (!validDateRange(since, until)) return json({ error: 'Choose a valid start and end date.' }, 400);
    const key = `${since}|${until}`;
    const saved = cache.get(key);
    if (saved && saved.expires > Date.now()) return json(saved.data);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const connectionKey = Deno.env.get('META_ADS_API_KEY');
    if (!apiKey || !connectionKey) return json({ error: 'The Meta ads connection is not available. Check the connection in Lovable.' }, 503);
    const headers = { Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': connectionKey };
    async function read(path: string, params: Record<string, string>) {
      const url = new URL(`${GATEWAY_URL}/${path}`);
      for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
      const res = await fetch(url, { headers });
      const text = await res.text();
      if (!res.ok) {
        console.error('Meta expenses request failed', res.status, text);
        let message = text;
        try { const body = JSON.parse(text); message = body.error?.error_user_msg ?? body.error?.message ?? body.message ?? text; } catch { /* Preserve provider response. */ }
        throw { status: res.status, message, details: text };
      }
      return JSON.parse(text);
    }

    const account = await read(`act_${ACCOUNT_ID}`, { fields: 'id,name,currency,timezone_name' });
    const campaigns: CampaignExpense[] = [];
    let after: string | undefined;
    do {
      const page = await read(`act_${ACCOUNT_ID}/insights`, {
        fields: 'campaign_id,campaign_name,spend,date_start,date_stop', level: 'campaign',
        time_range: JSON.stringify({ since, until }), limit: '500', ...(after ? { after } : {}),
      });
      campaigns.push(...(page.data ?? []));
      const next = page.paging?.next ? page.paging?.cursors?.after : undefined;
      if (page.paging?.next && (!next || next === after)) throw new Error('The expense report is incomplete. Please try a shorter date range.');
      after = next;
    } while (after);
    campaigns.sort((a, b) => Number(b.spend) - Number(a.spend));
    const data = { account, campaigns, total: totalSpend(campaigns), since, until, fetchedAt: new Date().toISOString() };
    for (const [cacheKey, entry] of cache) if (entry.expires <= Date.now()) cache.delete(cacheKey);
    cache.set(key, { expires: Date.now() + 15 * 60 * 1000, data });
    return json(data);
  } catch (error) {
    const failure = error as { status?: number; message?: string; details?: string };
    return json({ error: failure.message ?? 'Unable to load ad expenses.', status: failure.status, details: failure.details }, failure.status ?? 500);
  }
});