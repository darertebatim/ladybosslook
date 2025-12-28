import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MAILCHIMP-TAG-BY-PROGRAM] ${step}${detailsStr}`);
};

// MD5 hash for Mailchimp subscriber ID
async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface RequestBody {
  program_slug?: string;
  round_id?: string;
  tags: string[];
  preview_only?: boolean;
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

    const body: RequestBody = await req.json();
    const { program_slug, round_id, tags, preview_only = false } = body;

    if (!tags || tags.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one tag is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Request received", { program_slug, round_id, tags, preview_only });

    // Build query for orders
    let query = supabaseAdmin
      .from('orders')
      .select('email, name')
      .eq('status', 'completed')
      .eq('refunded', false);

    if (program_slug) {
      query = query.eq('program_slug', program_slug);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // If round_id is specified, also get enrollments for that round
    let enrollmentEmails: string[] = [];
    if (round_id) {
      const { data: enrollments, error: enrollError } = await supabaseAdmin
        .from('course_enrollments')
        .select('user_id')
        .eq('round_id', round_id)
        .eq('status', 'active');

      if (!enrollError && enrollments) {
        // Get emails for enrolled users
        const userIds = enrollments.map(e => e.user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .in('id', userIds);
          
          if (profiles) {
            enrollmentEmails = profiles.map(p => p.email.toLowerCase());
          }
        }
      }
    }

    // Combine and deduplicate emails
    const orderEmails = orders?.map(o => o.email.toLowerCase()) || [];
    const allEmails = [...new Set([...orderEmails, ...enrollmentEmails])];

    logStep("Found customers", { count: allEmails.length });

    if (preview_only) {
      return new Response(JSON.stringify({
        success: true,
        preview: true,
        count: allEmails.length,
        emails: allEmails.slice(0, 50), // Show first 50 in preview
        tags
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Apply tags in Mailchimp
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
    const mailchimpListId = Deno.env.get('MAILCHIMP_LIST_ID');

    if (!mailchimpApiKey || !mailchimpListId) {
      throw new Error('Mailchimp credentials not configured');
    }

    const datacenter = mailchimpApiKey.split('-')[1];
    
    const results = {
      tagged: 0,
      already_tagged: 0,
      not_found: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const email of allEmails) {
      try {
        const emailHash = await md5(email);
        const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members/${emailHash}`;

        // Check if member exists
        const memberResponse = await fetch(memberUrl, {
          headers: {
            'Authorization': `Bearer ${mailchimpApiKey}`,
          },
        });

        if (!memberResponse.ok) {
          if (memberResponse.status === 404) {
            results.not_found++;
            continue;
          }
          throw new Error(`Failed to fetch member: ${memberResponse.status}`);
        }

        const member = await memberResponse.json();
        const existingTags = member.tags?.map((t: any) => t.name.toLowerCase()) || [];
        
        // Find tags that need to be added
        const tagsToAdd = tags.filter(t => !existingTags.includes(t.toLowerCase()));

        if (tagsToAdd.length === 0) {
          results.already_tagged++;
          continue;
        }

        // Add tags
        const tagsUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members/${emailHash}/tags`;
        const tagResponse = await fetch(tagsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mailchimpApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tags: tagsToAdd.map(name => ({ name, status: 'active' }))
          }),
        });

        if (tagResponse.ok) {
          results.tagged++;
          logStep(`Tagged ${email}`, { tags: tagsToAdd });
        } else {
          results.failed++;
          results.errors.push(`${email}: ${await tagResponse.text()}`);
        }

      } catch (error) {
        results.failed++;
        results.errors.push(`${email}: ${(error as Error).message}`);
      }
    }

    logStep("Tagging complete", results);

    return new Response(JSON.stringify({
      success: true,
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
