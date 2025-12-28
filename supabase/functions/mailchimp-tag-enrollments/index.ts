import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to compute MD5 hash using Deno's crypto module
async function md5(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.toLowerCase());
  const hash = await crypto.subtle.digest("MD5", data);
  return encodeHex(new Uint8Array(hash));
}

interface RequestBody {
  tag_type: 'paid_customer' | 'free_customer';
  preview_only?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { tag_type, preview_only = false } = body;

    if (!tag_type || !['paid_customer', 'free_customer'].includes(tag_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tag_type. Must be "paid_customer" or "free_customer"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[mailchimp-tag-enrollments] Processing ${tag_type}, preview_only: ${preview_only}`);

    // Get all active enrollments with their program info
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        user_id,
        program_slug,
        status
      `)
      .eq('status', 'active');

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      throw enrollError;
    }

    // Get program catalog to check prices
    const { data: programs, error: programError } = await supabase
      .from('program_catalog')
      .select('slug, price_amount, is_free_on_ios, title');

    if (programError) {
      console.error('Error fetching programs:', programError);
      throw programError;
    }

    // Create a map of program slugs to their pricing info
    const programMap = new Map(programs?.map(p => [p.slug, p]) || []);

    // Filter enrollments based on tag_type
    const userIds = new Set<string>();
    
    for (const enrollment of enrollments || []) {
      const program = programMap.get(enrollment.program_slug);
      if (!program) continue;

      const isPaid = program.price_amount > 0 && !program.is_free_on_ios;
      const isFree = program.price_amount === 0 || program.is_free_on_ios;

      if (tag_type === 'paid_customer' && isPaid) {
        userIds.add(enrollment.user_id);
      } else if (tag_type === 'free_customer' && isFree) {
        userIds.add(enrollment.user_id);
      }
    }

    console.log(`[mailchimp-tag-enrollments] Found ${userIds.size} users for ${tag_type}`);

    // Get emails for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', Array.from(userIds));

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    const emails = profiles?.map(p => p.email).filter(Boolean) || [];

    console.log(`[mailchimp-tag-enrollments] Found ${emails.length} emails`);

    // If preview only, return the list
    if (preview_only) {
      return new Response(
        JSON.stringify({
          success: true,
          preview: true,
          tag: tag_type,
          count: emails.length,
          emails: emails
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply tags in Mailchimp
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
    const mailchimpListId = Deno.env.get('MAILCHIMP_LIST_ID');

    if (!mailchimpApiKey || !mailchimpListId) {
      return new Response(
        JSON.stringify({ error: 'Mailchimp configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dc = mailchimpApiKey.split('-')[1];
    const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
    const authString = btoa(`anystring:${mailchimpApiKey}`);

    let tagged = 0;
    let alreadyTagged = 0;
    let notFound = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const subscriberHash = await md5(email);
        
        // Check if member exists
        const memberResponse = await fetch(
          `${baseUrl}/lists/${mailchimpListId}/members/${subscriberHash}`,
          {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (memberResponse.status === 404) {
          notFound++;
          continue;
        }

        if (!memberResponse.ok) {
          failed++;
          continue;
        }

        const member = await memberResponse.json();
        const existingTags = member.tags?.map((t: { name: string }) => t.name) || [];

        // Check if already has the tag
        if (existingTags.includes(tag_type)) {
          alreadyTagged++;
          continue;
        }

        // Add the tag
        const tagResponse = await fetch(
          `${baseUrl}/lists/${mailchimpListId}/members/${subscriberHash}/tags`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tags: [{ name: tag_type, status: 'active' }]
            }),
          }
        );

        if (tagResponse.ok || tagResponse.status === 204) {
          tagged++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Error processing ${email}:`, err);
        failed++;
      }
    }

    console.log(`[mailchimp-tag-enrollments] Results: tagged=${tagged}, alreadyTagged=${alreadyTagged}, notFound=${notFound}, failed=${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        tag: tag_type,
        results: {
          tagged,
          already_tagged: alreadyTagged,
          not_found: notFound,
          failed,
          total: emails.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[mailchimp-tag-enrollments] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
