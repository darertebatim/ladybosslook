import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!adminRole) {
      throw new Error('Admin access required')
    }

    const { primaryUserId, secondaryEmail } = await req.json()

    if (!primaryUserId || !secondaryEmail) {
      throw new Error('primaryUserId and secondaryEmail are required')
    }

    const normalizedEmail = secondaryEmail.toLowerCase().trim()

    // Get primary user info
    const { data: primaryProfile, error: primaryError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', primaryUserId)
      .single()

    if (primaryError || !primaryProfile) {
      throw new Error('Primary user not found')
    }

    // Find secondary user profile (if exists)
    const { data: secondaryProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single()

    let mergedOrders = 0
    let mergedEnrollments = 0

    // Transfer orders from secondary email to primary user
    const { data: ordersToTransfer, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, product_name')
      .ilike('email', normalizedEmail)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
    }

    if (ordersToTransfer && ordersToTransfer.length > 0) {
      // Update orders to point to primary user
      const { error: updateOrdersError } = await supabaseAdmin
        .from('orders')
        .update({ 
          user_id: primaryUserId,
          email: primaryProfile.email // Update email to primary
        })
        .ilike('email', normalizedEmail)

      if (updateOrdersError) {
        console.error('Error updating orders:', updateOrdersError)
        throw new Error(`Failed to transfer orders: ${updateOrdersError.message}`)
      }

      mergedOrders = ordersToTransfer.length
      console.log(`Transferred ${mergedOrders} orders from ${normalizedEmail} to ${primaryProfile.email}`)
    }

    // Transfer enrollments from secondary user to primary user
    if (secondaryProfile) {
      const { data: enrollmentsToTransfer, error: enrollmentsError } = await supabaseAdmin
        .from('course_enrollments')
        .select('id, course_name, program_slug, round_id')
        .eq('user_id', secondaryProfile.id)

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
      }

      if (enrollmentsToTransfer && enrollmentsToTransfer.length > 0) {
        // Check for existing enrollments to avoid duplicates
        const { data: existingEnrollments } = await supabaseAdmin
          .from('course_enrollments')
          .select('program_slug, round_id')
          .eq('user_id', primaryUserId)

        const existingSet = new Set(
          (existingEnrollments || []).map(e => `${e.program_slug}-${e.round_id}`)
        )

        for (const enrollment of enrollmentsToTransfer) {
          const key = `${enrollment.program_slug}-${enrollment.round_id}`
          
          if (!existingSet.has(key)) {
            // Transfer this enrollment
            const { error: updateError } = await supabaseAdmin
              .from('course_enrollments')
              .update({ user_id: primaryUserId })
              .eq('id', enrollment.id)

            if (updateError) {
              console.error(`Error transferring enrollment ${enrollment.id}:`, updateError)
            } else {
              mergedEnrollments++
              console.log(`Transferred enrollment: ${enrollment.course_name}`)
            }
          } else {
            // Delete duplicate enrollment from secondary
            await supabaseAdmin
              .from('course_enrollments')
              .delete()
              .eq('id', enrollment.id)
            console.log(`Skipped duplicate enrollment: ${enrollment.course_name}`)
          }
        }
      }
    }

    // Log the merge action
    console.log(`Account merge completed: ${normalizedEmail} -> ${primaryProfile.email}`)
    console.log(`Orders: ${mergedOrders}, Enrollments: ${mergedEnrollments}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully merged data from ${normalizedEmail}`,
        mergedOrders,
        mergedEnrollments,
        primaryEmail: primaryProfile.email,
        secondaryEmail: normalizedEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Account merge error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
