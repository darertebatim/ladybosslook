import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EXISTING-PROFILES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    logStep('Admin verified, starting profile creation');

    // Get all orders without user_id
    const { data: ordersWithoutUsers, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: true });

    if (ordersError) {
      throw ordersError;
    }

    logStep('Found orders without user accounts', { count: ordersWithoutUsers?.length || 0 });

    if (!ordersWithoutUsers || ordersWithoutUsers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No orders found without user accounts',
        created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Group orders by email to avoid duplicate accounts
    const ordersByEmail = new Map<string, any[]>();
    for (const order of ordersWithoutUsers) {
      const email = order.email.toLowerCase().trim();
      if (!ordersByEmail.has(email)) {
        ordersByEmail.set(email, []);
      }
      ordersByEmail.get(email)!.push(order);
    }

    logStep('Grouped orders by email', { uniqueEmails: ordersByEmail.size });

    const results = {
      created: 0,
      existing: 0,
      errors: [] as any[],
    };

    // Process each unique email
    for (const [email, orders] of ordersByEmail) {
      try {
        logStep('Processing email', { email, orderCount: orders.length });

        // Check if user already exists
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email?.toLowerCase() === email);

        let userId: string;

        if (existingUser) {
          logStep('User already exists', { email, userId: existingUser.id });
          userId = existingUser.id;
          results.existing++;
        } else {
          // Create new user account with email as password
          const firstOrder = orders[0];
          
          const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
            email: email,
            password: email,
            email_confirm: true,
            user_metadata: {
              full_name: firstOrder.name,
              phone: firstOrder.phone,
              city: ''
            }
          });

          if (signUpError || !newUser.user) {
            logStep('Error creating user', { email, error: signUpError });
            results.errors.push({ email, error: signUpError?.message });
            continue;
          }

          userId = newUser.user.id;
          results.created++;
          logStep('Created new user account', { email, userId });
        }

        // Update all orders for this email with the user_id
        const orderIds = orders.map(o => o.id);
        const { error: updateError } = await supabase
          .from('orders')
          .update({ user_id: userId })
          .in('id', orderIds);

        if (updateError) {
          logStep('Error updating orders', { email, error: updateError });
          results.errors.push({ email, error: updateError.message });
        } else {
          logStep('Updated orders with user_id', { email, orderCount: orders.length });
        }

      } catch (error: any) {
        logStep('Error processing email', { email, error: error.message });
        results.errors.push({ email, error: error.message });
      }
    }

    logStep('Profile creation completed', results);

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${results.created} new accounts, found ${results.existing} existing accounts`,
      details: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-existing-profiles', { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
