ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS doors text[] NOT NULL DEFAULT '{}';
UPDATE public.instructors SET doors = ARRAY['business','financial'] WHERE slug = 'ali';
UPDATE public.instructors SET doors = ARRAY['emotion','immigrant','selfcare','productivity','exploring'] WHERE slug = 'razie';