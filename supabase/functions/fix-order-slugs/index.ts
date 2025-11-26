import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fix the two orders with wrong program_slug
    const { data, error } = await supabase
      .from('orders')
      .update({ program_slug: 'courageous-character-course' })
      .in('id', [
        '17e55413-2ab8-4694-b7ab-2f32015b2a6a', // nazanin126@yahoo.com
        'f194bbc5-8b13-446d-b51d-655fefe33cd3'  // kianooshq@yahoo.com
      ])
      .select();

    if (error) throw error;

    console.log('✓ Fixed program_slug for 2 orders:', data);

    return new Response(
      JSON.stringify({ success: true, fixed: data.length, orders: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
