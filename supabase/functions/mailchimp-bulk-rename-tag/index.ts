import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { old_tag, new_tag } = await req.json();

    if (!old_tag || !new_tag) {
      return new Response(JSON.stringify({ error: 'old_tag and new_tag are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Bulk renaming tag: "${old_tag}" -> "${new_tag}"`);

    // Fetch all programs that have the old_tag
    const { data: programs, error: fetchError } = await supabaseClient
      .from('program_catalog')
      .select('id, slug, title, mailchimp_tags')
      .not('mailchimp_tags', 'is', null);

    if (fetchError) {
      console.error('Error fetching programs:', fetchError);
      throw fetchError;
    }

    let updatedCount = 0;
    const updatedPrograms: string[] = [];

    for (const program of programs || []) {
      const tags = program.mailchimp_tags as string[] || [];
      if (tags.includes(old_tag)) {
        const newTags = tags.map(t => t === old_tag ? new_tag : t);
        
        const { error: updateError } = await supabaseClient
          .from('program_catalog')
          .update({ mailchimp_tags: newTags })
          .eq('id', program.id);

        if (updateError) {
          console.error(`Error updating program ${program.slug}:`, updateError);
        } else {
          updatedCount++;
          updatedPrograms.push(program.title);
        }
      }
    }

    console.log(`Updated ${updatedCount} programs`);

    return new Response(JSON.stringify({ 
      success: true,
      updated_count: updatedCount,
      updated_programs: updatedPrograms
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mailchimp-bulk-rename-tag:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
