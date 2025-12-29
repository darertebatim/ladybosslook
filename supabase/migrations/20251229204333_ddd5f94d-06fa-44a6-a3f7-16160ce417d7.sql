-- Update RLS policies to allow staff with 'support' page access

-- 1. chat_conversations: Allow support staff to view and update
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
CREATE POLICY "Admins and support staff can view all conversations" 
ON public.chat_conversations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text));

DROP POLICY IF EXISTS "Admins can update all conversations" ON public.chat_conversations;
CREATE POLICY "Admins and support staff can update all conversations" 
ON public.chat_conversations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text));

-- 2. chat_messages: Allow support staff to view and send messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
CREATE POLICY "Admins and support staff can view all messages" 
ON public.chat_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text));

DROP POLICY IF EXISTS "Admins can insert messages" ON public.chat_messages;
CREATE POLICY "Admins and support staff can insert messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text)) AND (sender_type = 'admin'::text));

-- 3. profiles: Allow support staff to view user profiles (for context)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and support staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text));

-- 4. course_enrollments: Allow support staff to view enrollments (for context)
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins and support staff can view all enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text));

-- 5. orders: Allow support staff to view orders (for customer context)
DROP POLICY IF EXISTS "Users can view only their authenticated orders" ON public.orders;
CREATE POLICY "Users and support staff can view orders" 
ON public.orders 
FOR SELECT 
USING (((user_id IS NOT NULL) AND (user_id = auth.uid())) OR has_role(auth.uid(), 'admin'::app_role) OR can_access_admin_page(auth.uid(), 'support'::text));