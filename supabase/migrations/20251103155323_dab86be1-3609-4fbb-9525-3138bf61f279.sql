-- Make documents bucket public so PDFs can be accessed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE name = 'documents';