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

    // Try to find existing user by email
    // We'll attempt to list users with email filter to be more efficient
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    let existingAuthUser = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // If not found in the limited list, try to create user and handle duplicate error
    if (!existingAuthUser) {
      console.log(`Attempting to create or find user: ${email}`);
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: email,
        user_metadata: {
          full_name: fullName || ''
        }
      });

      if (userError) {
        // Check if error is because user already exists
        if (userError.message.includes('already been registered')) {
          console.log(`User already exists, looking up by email: ${email}`);
          // User exists but wasn't in our initial list - need to find them
          // List more users or search through pages
          let page = 1;
          let found = false;
          const perPage = 1000;
          
          while (!found && page <= 10) { // Limit to 10 pages max (10,000 users)
            const { data: { users: pageUsers } } = await supabase.auth.admin.listUsers({
              page,
              perPage
            });
            
            existingAuthUser = pageUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (existingAuthUser) {
              found = true;
              userId = existingAuthUser.id;
              console.log(`Found existing user on page ${page}: ${userId}`);
            } else if (pageUsers.length < perPage) {
              // No more users to check
              break;
            }
            page++;
          }
          
          if (!found) {
            return new Response(
              JSON.stringify({ error: `User exists but could not be found: ${email}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }
          
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
          // Different error - return it
          console.error('Error creating user:', userError);
          return new Response(
            JSON.stringify({ error: `Failed to create user: ${userError.message}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
      } else if (userData.user) {
        // User created successfully
        userId = userData.user.id;
        console.log(`User created successfully: ${userId} with email as password`);
        
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
      } else {
        return new Response(
          JSON.stringify({ error: 'User creation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else {
      // User found in initial list
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

    // Apply Mailchimp tags based on program type
    let mailchimpTagged = false;
    let mailchimpError: string | null = null;
    
    if (programSlug) {
      try {
        // Fetch program details to determine if paid or free
        const { data: program } = await supabase
          .from('program_catalog')
          .select('price_amount, is_free_on_ios, mailchimp_tags')
          .eq('slug', programSlug)
          .single();

        if (program) {
          const isPaid = program.price_amount > 0 && !program.is_free_on_ios;
          const baseTag = isPaid ? 'paid_customer' : 'free_customer';
          
          // Combine base tag with program-specific tags
          const programTags = Array.isArray(program.mailchimp_tags) ? program.mailchimp_tags : [];
          const allTags = [baseTag, ...programTags.filter((t: string) => t !== baseTag)];
          
          console.log(`Applying Mailchimp tags for ${email}: ${allTags.join(', ')}`);
          
          // Call Mailchimp API to add tags
          const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY');
          const MAILCHIMP_SERVER_PREFIX = Deno.env.get('MAILCHIMP_SERVER_PREFIX') || 'us8';
          const MAILCHIMP_LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID');
          
          if (MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID) {
            // Create MD5 hash of lowercase email for Mailchimp subscriber ID
            const encoder = new TextEncoder();
            const data = encoder.encode(email.toLowerCase());
            const hashBuffer = await crypto.subtle.digest('MD5', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const subscriberHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`;
            
            const tagPayload = {
              tags: allTags.map((tag: string) => ({ name: tag, status: 'active' }))
            };
            
            const mailchimpResponse = await fetch(mailchimpUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(tagPayload)
            });
            
            if (mailchimpResponse.ok) {
              mailchimpTagged = true;
              console.log(`Mailchimp tags applied successfully for ${email}`);
            } else {
              const errorText = await mailchimpResponse.text();
              mailchimpError = `Mailchimp error: ${mailchimpResponse.status} - ${errorText}`;
              console.error(mailchimpError);
            }
          } else {
            mailchimpError = 'Mailchimp credentials not configured';
            console.warn(mailchimpError);
          }
        }
      } catch (tagError: any) {
        mailchimpError = `Failed to apply Mailchimp tags: ${tagError.message}`;
        console.error(mailchimpError);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'User created and enrolled successfully',
        userId,
        enrollmentId: enrollment.id,
        email,
        courseName,
        mailchimpTagged,
        mailchimpError
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
