-- Step 1: Delete "Workshop" enrollments where user already has a "Course" enrollment
DELETE FROM course_enrollments 
WHERE course_name = 'Courageous Character Workshop'
  AND program_slug = 'courageous-character-course'
  AND user_id IN (
    SELECT user_id 
    FROM course_enrollments 
    WHERE course_name = 'Courageous Character Course'
      AND program_slug = 'courageous-character-course'
  );

-- Step 2: Update remaining "Workshop" enrollments to "Course"
UPDATE course_enrollments 
SET course_name = 'Courageous Character Course'
WHERE course_name = 'Courageous Character Workshop'
  AND program_slug = 'courageous-character-course';

-- Step 3: Update the map_course_name_to_slug function to only use one name
CREATE OR REPLACE FUNCTION public.map_course_name_to_slug(course_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN CASE course_name
    WHEN 'IQMoney Course - Income Growth' THEN 'iqmoney-income-growth'
    WHEN 'Money Literacy Course' THEN 'money-literacy-course'
    WHEN 'Ladyboss VIP Club Group Coaching' THEN 'ladyboss-vip-club'
    WHEN 'Empowered Ladyboss Group Coaching' THEN 'empowered-ladyboss-coaching'
    WHEN 'Business Growth Accelerator - 3-Month 1o1 Weekly Session' THEN 'business-growth-accelerator'
    WHEN 'Business Startup Accelerator - 3-Month 1o1 Weekly Session' THEN 'business-startup-accelerator'
    WHEN 'Instagram Fast Growth Course' THEN 'instagram-growth-course'
    WHEN '1-Hour Private Session with Razie' THEN 'private-coaching-session'
    WHEN 'Connection Literacy Course' THEN 'connection-literacy-course'
    WHEN 'Courageous Character Course' THEN 'courageous-character-course'
    WHEN 'Money Literacy Workshop' THEN 'money-literacy-course'
    WHEN 'IQ Money Program' THEN 'iqmoney-income-growth'
    WHEN 'Ladyboss Coaching' THEN 'empowered-ladyboss-coaching'
    WHEN 'Networking Program' THEN 'connection-literacy-course'
    WHEN 'Assertiveness Training' THEN 'courageous-character-course'
    ELSE NULL
  END;
END;
$function$;