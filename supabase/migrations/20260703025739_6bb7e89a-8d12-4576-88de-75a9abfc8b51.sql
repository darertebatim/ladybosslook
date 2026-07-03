INSERT INTO public.aperture_tools (slug, label, category, categories, is_active, sort_order)
VALUES ('lovable', 'Lovable', 'Website & Domain', ARRAY['Website & Domain'], true, 0)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  categories = EXCLUDED.categories,
  is_active = true;