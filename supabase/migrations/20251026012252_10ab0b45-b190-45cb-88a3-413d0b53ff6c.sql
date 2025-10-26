-- Update file size limit for audio_files bucket to 100MB
UPDATE storage.buckets 
SET file_size_limit = 104857600 
WHERE id = 'audio_files';

-- Update file size limit for documents bucket to 100MB
UPDATE storage.buckets 
SET file_size_limit = 104857600 
WHERE id = 'documents';