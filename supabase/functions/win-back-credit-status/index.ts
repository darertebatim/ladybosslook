import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getWinBackRows } from '../_shared/win-back-credit.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Returns the signed-in user's Win-Back credit rows across all merged accounts.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user } } = await anon.auth.getUser(token);
    if (!user) return json({ rows: [] }, 401);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    return json({ rows: await getWinBackRows(admin, user.id) });
  } catch (e) {
    return json({ rows: [], error: String(e) }, 500);
  }
});
