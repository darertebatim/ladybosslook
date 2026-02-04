-- Allow all authenticated users to read routines bank and related tables
-- These are public discovery content that all users should be able to browse

-- Routines Bank - users can read active routines
CREATE POLICY "Anyone can read active routines"
ON public.routines_bank
FOR SELECT
USING (is_active = true);

-- Routines Bank Sections - users can read active sections
CREATE POLICY "Anyone can read active routine sections"
ON public.routines_bank_sections
FOR SELECT
USING (is_active = true);

-- Routines Bank Tasks - users can read all tasks (linked to routines)
CREATE POLICY "Anyone can read routine tasks"
ON public.routines_bank_tasks
FOR SELECT
USING (true);

-- Admin Task Bank - users can read active task templates
CREATE POLICY "Anyone can read active task templates"
ON public.admin_task_bank
FOR SELECT
USING (is_active = true);