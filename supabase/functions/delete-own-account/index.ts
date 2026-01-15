import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's JWT to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('[delete-own-account] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`[delete-own-account] User ${userId} requested account deletion`);

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables (in order to respect foreign keys)
    const tablesToClean = [
      // Chat data
      { table: 'chat_messages', column: 'sender_id' },
      { table: 'chat_conversations', column: 'user_id' },
      // Feed data
      { table: 'feed_reactions', column: 'user_id' },
      { table: 'feed_comments', column: 'user_id' },
      { table: 'feed_post_reads', column: 'user_id' },
      // Audio data
      { table: 'audio_bookmarks', column: 'user_id' },
      { table: 'audio_progress', column: 'user_id' },
      // Journal data
      { table: 'journal_entries', column: 'user_id' },
      { table: 'journal_reminder_settings', column: 'user_id' },
      // Course data
      { table: 'course_enrollments', column: 'user_id' },
      { table: 'user_celebrated_rounds', column: 'user_id' },
      { table: 'user_content_views', column: 'user_id' },
      // Wallet data
      { table: 'credit_transactions', column: 'user_id' },
      { table: 'user_wallets', column: 'user_id' },
      // Push notifications
      { table: 'push_subscriptions', column: 'user_id' },
      // App installations
      { table: 'app_installations', column: 'user_id' },
      // User roles and permissions
      { table: 'user_admin_permissions', column: 'user_id' },
      { table: 'user_roles', column: 'user_id' },
      // Profile (last before auth deletion)
      { table: 'profiles', column: 'id' },
    ];

    // Delete from each table
    for (const { table, column } of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId);
      
      if (error) {
        console.warn(`[delete-own-account] Error deleting from ${table}:`, error.message);
        // Continue with other deletions
      } else {
        console.log(`[delete-own-account] Deleted user data from ${table}`);
      }
    }

    // Log the security event before deleting the auth user
    await supabaseAdmin.rpc('log_security_event', {
      p_action: 'user_self_deleted',
      p_details: { user_id: userId, email: user.email },
      p_user_id: userId,
    });

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[delete-own-account] Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-own-account] Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-own-account] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
