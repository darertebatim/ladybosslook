ALTER TABLE public.routines_bank 
  ADD COLUMN linked_program_slug text;
  
ALTER TABLE public.routines_bank
  ADD CONSTRAINT routines_bank_linked_program_slug_fkey 
  FOREIGN KEY (linked_program_slug) REFERENCES public.program_catalog(slug) ON DELETE SET NULL;