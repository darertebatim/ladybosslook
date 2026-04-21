
ALTER TABLE public.program_catalog
  ADD COLUMN IF NOT EXISTS android_product_id TEXT,
  ADD COLUMN IF NOT EXISTS annual_android_product_id TEXT;

UPDATE public.program_catalog
SET 
  android_product_id = 'com.ladybosslook.simoraplus:comladybosslooksimoraplusmonthly',
  annual_android_product_id = 'com.ladybosslook.simoraplus:comladybosslooksimoraplusannually'
WHERE slug = 'simora-plus';
