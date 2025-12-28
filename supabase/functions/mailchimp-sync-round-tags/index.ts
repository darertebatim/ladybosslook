import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from "node:crypto";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MAILCHIMP-SYNC-ROUND-TAGS] ${step}${detailsStr}`);
};

// Mailchimp subscriber hash: md5(lowercased_email)
function md5(email: string): string {
  return createHash('md5').update(email.trim().toLowerCase()).digest('hex');
}

interface SyncResult {
  total: number;
  tagged: number;
  alreadyTagged: number;
  notFound: number;
  failed: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { round_id } = body;

    if (!round_id) {
      return new Response(
        JSON.stringify({ error: 'round_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Request received", { round_id });

    // Get the round details and its tags
    const { data: round, error: roundError } = await supabaseAdmin
      .from('program_rounds')
      .select('id, round_name, program_slug, mailchimp_tags')
      .eq('id', round_id)
      .single();

    if (roundError || !round) {
      return new Response(
        JSON.stringify({ error: 'Round not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Round found", { round_name: round.round_name, program_slug: round.program_slug });

    // Get the parent program's tags
    const { data: program } = await supabaseAdmin
      .from('program_catalog')
      .select('mailchimp_tags')
      .eq('slug', round.program_slug)
      .single();

    // Combine round tags + program tags (removing duplicates)
    const roundTags = (round.mailchimp_tags as string[] | null) || [];
    const programTags = (program?.mailchimp_tags as string[] | null) || [];
    const allTags = [...new Set([...programTags, ...roundTags])];

    if (allTags.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No tags configured for this round or program',
        results: { total: 0, tagged: 0, alreadyTagged: 0, notFound: 0, failed: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    logStep("Tags to apply", { allTags });

    // Get all active enrollments for this round
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select('user_id')
      .eq('round_id', round_id)
      .eq('status', 'active');

    if (enrollError) {
      throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No enrolled users found for this round',
        results: { total: 0, tagged: 0, alreadyTagged: 0, notFound: 0, failed: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    logStep("Enrollments found", { count: enrollments.length });

    // Get user emails from profiles
    const userIds = enrollments.map(e => e.user_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const emailMap = new Map<string, string>();
    profiles?.forEach(p => emailMap.set(p.id, p.email));

    logStep("Profiles loaded", { count: profiles?.length || 0 });

    // Mailchimp credentials
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
    const mailchimpListId = Deno.env.get('MAILCHIMP_LIST_ID');

    if (!mailchimpApiKey || !mailchimpListId) {
      throw new Error('Mailchimp credentials not configured');
    }

    const datacenter = mailchimpApiKey.split('-')[1];
    const authString = btoa(`anystring:${mailchimpApiKey}`);

    // Process each enrollment
    const results: SyncResult = {
      total: enrollments.length,
      tagged: 0,
      alreadyTagged: 0,
      notFound: 0,
      failed: 0
    };

    for (const enrollment of enrollments) {
      const email = emailMap.get(enrollment.user_id);
      if (!email) {
        results.notFound++;
        logStep("No email for user", { user_id: enrollment.user_id });
        continue;
      }

      try {
        const emailHash = md5(email);
        const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members/${emailHash}`;

        // Check if member exists and get their current tags
        const checkResponse = await fetch(memberUrl, {
          headers: { 'Authorization': `Basic ${authString}` },
        });

        if (!checkResponse.ok) {
          if (checkResponse.status === 404) {
            results.notFound++;
            logStep("Member not in Mailchimp", { email });
            continue;
          }

          const bodyText = await checkResponse.text().catch(() => '');
          throw new Error(`Mailchimp lookup failed: ${checkResponse.status}${bodyText ? ` - ${bodyText}` : ''}`);
        }

        const member = await checkResponse.json();
        const existingTags = new Set(member.tags?.map((t: any) => t.name) || []);

        // Check if all tags are already present
        const tagsToAdd = allTags.filter(tag => !existingTags.has(tag));
        
        if (tagsToAdd.length === 0) {
          results.alreadyTagged++;
          logStep("All tags already present", { email });
          continue;
        }

        // Add the missing tags
        const tagsUrl = `${memberUrl}/tags`;
        const tagResponse = await fetch(tagsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tags: tagsToAdd.map(name => ({ name, status: 'active' }))
          }),
        });

        if (!tagResponse.ok && tagResponse.status !== 204) {
          const errorText = await tagResponse.text();
          logStep("Failed to add tags", { email, error: errorText });
          results.failed++;
          continue;
        }

        results.tagged++;
        logStep("Tags added", { email, tagsAdded: tagsToAdd });

      } catch (error) {
        logStep("Error processing user", { email, error: String(error) });
        results.failed++;
      }
    }

    logStep("Sync complete", results);

    return new Response(JSON.stringify({
      success: true,
      message: `Synced tags for ${round.round_name}`,
      tags_applied: allTags,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
