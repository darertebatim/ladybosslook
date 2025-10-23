-- Add WhatsApp support number field to program rounds
ALTER TABLE program_rounds 
ADD COLUMN whatsapp_support_number text;