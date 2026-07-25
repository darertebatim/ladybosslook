import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: any) => {
  console.log(`[ENROLL-FREE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

async function enrollFreeProgram(supabase: any, userId: string, program: any, userEmail: string, userName: string) {
  // Auto-enroll round if configured
  const { data: autoEnrollRule } = await supabase
    .from('program_auto_enrollment')
    .select('round_id')
    .eq('program_slug', program.slug)
    .maybeSingle();

  // Skip if already enrolled
  const { data: existing } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('program_slug', program.slug)
    .maybeSingle();

  if (!existing) {
    const enrollmentData: any = {
      user_id: userId,
      course_name: program.title,
      program_slug: program.slug,
      status: 'active',
    };
    if (autoEnrollRule?.round_id) enrollmentData.round_id = autoEnrollRule.round_id;

    const { error: enrollErr } = await supabase.from('course_enrollments').insert(enrollmentData);
    if (enrollErr) log('enrollment error', { slug: program.slug, error: enrollErr.message });
    else log('enrolled', { slug: program.slug });
  } else {
    log('already enrolled', { slug: program.slug });
  }

  // Record a $0 order for history/receipts
  await supabase.from('orders').insert({
    email: userEmail,
    name: userName,
    amount: 0,
    currency: 'usd',
    status: 'paid',
    product_name: program.title,
    program_slug: program.slug,
    payment_type: 'free',
  });

  // Remove from cart if present
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('program_slug', program.slug);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs.filter((s: any) => typeof s === 'string') : [];

    let targetSlugs: string[] = slugs;
    if (targetSlugs.length === 0) {
      // Default: enroll all free items in the user's cart
      const { data: cart } = await supabase
        .from('cart_items')
        .select('program_slug, price_amount')
        .eq('user_id', user.id);
      targetSlugs = (cart || []).filter((c: any) => c.price_amount === 0).map((c: any) => c.program_slug);
    }

    if (targetSlugs.length === 0) {
      return new Response(JSON.stringify({ enrolled: [], skipped: [], message: 'No free programs to enroll' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate: only enroll programs that are actually free & active
    const { data: programs, error: progErr } = await supabase
      .from('program_catalog')
      .select('slug, title, price_amount, payment_type, is_active')
      .in('slug', targetSlugs);

    if (progErr) throw progErr;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const userEmail = user.email || 'unknown@example.com';
    const userName = profile?.full_name || user.user_metadata?.full_name || 'Customer';

    const enrolled: string[] = [];
    const skipped: string[] = [];

    for (const prog of (programs || [])) {
      const isFree = prog.price_amount === 0 || prog.payment_type === 'free';
      if (!prog.is_active || !isFree) {
        skipped.push(prog.slug);
        continue;
      }
      await enrollFreeProgram(supabase, user.id, prog, userEmail, userName);
      enrolled.push(prog.slug);
    }

    log('done', { enrolled, skipped });

    return new Response(JSON.stringify({ enrolled, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log('ERROR', { message: error?.message });
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});