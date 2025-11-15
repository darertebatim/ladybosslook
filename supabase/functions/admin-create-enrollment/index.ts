import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrollmentRequest {
  email: string;
  courseName: string;
  programSlug?: string;
  roundId?: string;
  fullName?: string;
}

// Generate cryptographically secure random password
const generateSecurePassword = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, courseName, programSlug, roundId, fullName }: EnrollmentRequest = await req.json();

    if (!email || !courseName) {
      return new Response(
        JSON.stringify({ error: 'Email and course name are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`Admin ${user.id} creating enrollment for ${email} in ${courseName}`);

    let userId: string;

    // First check if auth user exists (this is the source of truth)
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingAuthUser) {
      // Auth user exists - use their ID
      console.log(`Auth user exists: ${existingAuthUser.id}`);
      userId = existingAuthUser.id;
      
      // Check if profile exists for this user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (!existingProfile) {
        // Create missing profile
        console.log(`Creating missing profile for auth user ${userId}`);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            full_name: fullName || null
          });

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Error creating profile:', profileError);
        }
      }
    } else {
      // No auth user exists - create new user
      console.log(`Creating new user: ${email}`);
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: generateSecurePassword(),
        user_metadata: {
          full_name: fullName || ''
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${userError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!userData.user) {
        return new Response(
          JSON.stringify({ error: 'User creation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      userId = userData.user.id;
      console.log(`User created successfully: ${userId} with secure random password`);
      
      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || null
        });

      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Error creating profile:', profileError);
      }
      
      // Send password reset email so user can set their own password
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });

      if (resetError) {
        console.error('Error sending password reset email:', resetError);
      } else {
        console.log('Password reset email sent to:', email);
      }
    }
    }

    // Check if enrollment already exists
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_name', courseName)
      .single();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ 
          message: 'User already enrolled in this course',
          userId,
          enrollmentId: existingEnrollment.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create enrollment
    const enrollmentData: any = {
      user_id: userId,
      course_name: courseName,
      status: 'active'
    };

    if (programSlug) {
      enrollmentData.program_slug = programSlug;
    }

    if (roundId) {
      enrollmentData.round_id = roundId;
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      return new Response(
        JSON.stringify({ error: `Failed to create enrollment: ${enrollmentError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Enrollment created successfully: ${enrollment.id}`);

    return new Response(
      JSON.stringify({
        message: 'User created and enrolled successfully',
        userId,
        enrollmentId: enrollment.id,
        email,
        courseName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in admin-create-enrollment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
