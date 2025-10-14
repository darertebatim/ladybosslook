import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const adminEmail = 'darertebatim@gmail.com';
    const adminPassword = adminEmail;

    console.log('Setting up admin account...');

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

    let userId: string;

    if (existingUser) {
      console.log('User already exists', existingUser.id);
      userId = existingUser.id;
      
      // Update password to email
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword
      });
      
      if (updateError) {
        console.error('Error updating password:', updateError);
      }
    } else {
      // Create admin user
      console.log('Creating new admin user');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin'
        }
      });

      if (createError || !newUser.user) {
        throw new Error(`Failed to create admin user: ${createError?.message}`);
      }

      userId = newUser.user.id;
      console.log('Admin user created', userId);
    }

    // Check if admin role exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update to admin if not already
      if (existingRole.role !== 'admin') {
        const { error: updateRoleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', userId);

        if (updateRoleError) throw updateRoleError;
        console.log('Updated existing role to admin');
      } else {
        console.log('User already has admin role');
      }
    } else {
      // Insert admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (roleError) throw roleError;
      console.log('Admin role assigned');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin account setup complete',
      email: adminEmail,
      userId: userId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('ERROR in setup-admin', errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
