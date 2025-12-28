import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MAILCHIMP-MANAGE-MEMBER] ${step}${detailsStr}`);
};

// MD5 hash for Mailchimp subscriber ID
async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface RequestBody {
  action: 'lookup' | 'add_tags' | 'remove_tags' | 'update_merge_fields';
  email: string;
  tags?: string[];
  merge_fields?: Record<string, string>;
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
    const { action, email, tags, merge_fields } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Request received", { action, email });

    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
    const mailchimpListId = Deno.env.get('MAILCHIMP_LIST_ID');

    if (!mailchimpApiKey || !mailchimpListId) {
      throw new Error('Mailchimp credentials not configured');
    }

    const datacenter = mailchimpApiKey.split('-')[1];
    const emailHash = await md5(email.toLowerCase());
    const memberUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members/${emailHash}`;

    // Handle lookup action
    if (action === 'lookup') {
      const response = await fetch(memberUrl, {
        headers: {
          'Authorization': `Bearer ${mailchimpApiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return new Response(JSON.stringify({
            success: true,
            found: false,
            message: 'Member not found in Mailchimp'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        throw new Error(`Mailchimp API error: ${response.status}`);
      }

      const member = await response.json();
      
      return new Response(JSON.stringify({
        success: true,
        found: true,
        member: {
          email: member.email_address,
          status: member.status,
          tags: member.tags?.map((t: any) => t.name) || [],
          merge_fields: member.merge_fields,
          created: member.timestamp_signup,
          updated: member.last_changed
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle add_tags action
    if (action === 'add_tags') {
      if (!tags || tags.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Tags are required for add_tags action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tagsUrl = `${memberUrl}/tags`;
      const response = await fetch(tagsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailchimpApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: tags.map(name => ({ name, status: 'active' }))
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add tags: ${errorText}`);
      }

      logStep("Tags added", { email, tags });

      return new Response(JSON.stringify({
        success: true,
        message: `Added ${tags.length} tag(s) to ${email}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle remove_tags action
    if (action === 'remove_tags') {
      if (!tags || tags.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Tags are required for remove_tags action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tagsUrl = `${memberUrl}/tags`;
      const response = await fetch(tagsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailchimpApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: tags.map(name => ({ name, status: 'inactive' }))
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove tags: ${errorText}`);
      }

      logStep("Tags removed", { email, tags });

      return new Response(JSON.stringify({
        success: true,
        message: `Removed ${tags.length} tag(s) from ${email}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle update_merge_fields action
    if (action === 'update_merge_fields') {
      if (!merge_fields || Object.keys(merge_fields).length === 0) {
        return new Response(
          JSON.stringify({ error: 'Merge fields are required for update_merge_fields action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(memberUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${mailchimpApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merge_fields
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update merge fields: ${errorText}`);
      }

      logStep("Merge fields updated", { email, merge_fields });

      return new Response(JSON.stringify({
        success: true,
        message: `Updated merge fields for ${email}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
