
-- 1) Restrict permissive public-read RLS policies to authenticated users only

-- media_categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.media_categories;
CREATE POLICY "Categories are readable by authenticated users"
  ON public.media_categories FOR SELECT TO authenticated USING (true);

-- routine_plan_tasks
DROP POLICY IF EXISTS "Anyone can read active tasks" ON public.routine_plan_tasks;
CREATE POLICY "Authenticated users can read active tasks"
  ON public.routine_plan_tasks FOR SELECT TO authenticated USING (is_active = true);

-- routines_bank_tasks
DROP POLICY IF EXISTS "Anyone can read routine tasks" ON public.routines_bank_tasks;
CREATE POLICY "Authenticated users can read routine tasks"
  ON public.routines_bank_tasks FOR SELECT TO authenticated USING (true);

-- routines_bank
DROP POLICY IF EXISTS "Anyone can read active routines" ON public.routines_bank;
CREATE POLICY "Authenticated users can read active routines"
  ON public.routines_bank FOR SELECT TO authenticated USING (is_active = true);

-- breathing_exercises
DROP POLICY IF EXISTS "Anyone can view active breathing exercises" ON public.breathing_exercises;
CREATE POLICY "Authenticated users can view active breathing exercises"
  ON public.breathing_exercises FOR SELECT TO authenticated
  USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- admin_task_bank
DROP POLICY IF EXISTS "Anyone can read active task templates" ON public.admin_task_bank;
CREATE POLICY "Authenticated users can read active task templates"
  ON public.admin_task_bank FOR SELECT TO authenticated USING (is_active = true);

-- app_settings
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

-- content_hosts
DROP POLICY IF EXISTS "content_hosts_public_read" ON public.content_hosts;
CREATE POLICY "content_hosts_authenticated_read"
  ON public.content_hosts FOR SELECT TO authenticated USING (true);

-- reading_content
DROP POLICY IF EXISTS "Anyone can read published content" ON public.reading_content;
CREATE POLICY "Authenticated users can read published content"
  ON public.reading_content FOR SELECT TO authenticated USING (is_published = true);

-- reading_sections
DROP POLICY IF EXISTS "Anyone can read sections of published content" ON public.reading_sections;
CREATE POLICY "Authenticated users can read sections of published content"
  ON public.reading_sections FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reading_content rc
    WHERE rc.id = reading_sections.content_id AND rc.is_published = true
  ));

-- 2) Storage: documents bucket — restrict writes to user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can upload to own documents folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update files in own documents folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete files in own documents folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3) Storage: feed-attachments bucket — restrict writes to user's own folder
DROP POLICY IF EXISTS "Allow authenticated uploads to feed-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from feed-attachments" ON storage.objects;

CREATE POLICY "Users can upload to own feed-attachments folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feed-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete files in own feed-attachments folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'feed-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
