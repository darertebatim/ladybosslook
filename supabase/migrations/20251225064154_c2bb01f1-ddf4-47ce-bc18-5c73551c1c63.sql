-- Add customizable support link fields to program_rounds
ALTER TABLE public.program_rounds 
ADD COLUMN support_link_url text,
ADD COLUMN support_link_label text DEFAULT 'Contact Support';

-- Migrate existing whatsapp numbers to support links (if any have telegram format, keep them)
UPDATE public.program_rounds 
SET support_link_url = 'https://t.me/ladybosslook',
    support_link_label = 'Contact Telegram Support'
WHERE whatsapp_support_number IS NOT NULL;