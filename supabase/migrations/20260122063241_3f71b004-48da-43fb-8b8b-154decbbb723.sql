-- Create the Pro category
INSERT INTO public.routine_categories (name, slug, icon, color, display_order, is_active)
VALUES ('Pro', 'pro', 'Crown', 'amber', 0, true)
ON CONFLICT (slug) DO NOTHING;

-- Update all pro routines to use the Pro category
UPDATE public.routine_plans
SET category_id = (SELECT id FROM public.routine_categories WHERE slug = 'pro')
WHERE is_pro_routine = true;

-- Update all pro task templates to use 'Pro' category
UPDATE public.routine_task_templates
SET category = 'Pro'
WHERE linked_playlist_id IS NOT NULL OR pro_link_type IS NOT NULL;