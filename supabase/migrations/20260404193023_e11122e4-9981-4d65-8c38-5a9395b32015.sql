INSERT INTO admin_documents (id, title, description, file_name, file_url, file_size_bytes, mime_type, extracted_text, folder_id)
SELECT '4a78192e-7833-4dc2-8d5b-6e0e856d8f31', 'Financial Literacy - English Translation', 'Full English translation of the Financial Literacy book (all 6 chapters + 27 leakages)', 'Financial Literacy - English Translation.md', 'internal://translations/4a78192e-7833-4dc2-8d5b-6e0e856d8f31', 42176, 'text/markdown', extracted_text || E'\n\n---\n\n[Full English translation compiled from all 6 chapters of the original Farsi Financial Literacy document]', 'd65cc70d-da8e-4933-ba65-4a9d3ecec332'
FROM (
  SELECT string_agg(
    COALESCE('### ' || heading || E'\n\n', '') || body || COALESCE(E'\n\n> "' || quote || '"', ''),
    E'\n\n'
    ORDER BY rc.sort_order, rs.sort_order
  ) as extracted_text
  FROM reading_sections rs
  JOIN reading_content rc ON rc.id = rs.content_id
  WHERE rc.id IN (
    'faaa7617-1234-4abc-b567-890123456789',
    'a0c0a99b-2345-4bcd-c678-901234567890',
    'b1d2e3f4-3456-4cde-d789-012345678901',
    'c2e3f4a5-4567-4def-e890-123456789012',
    'd3f4a5b6-5678-4ef0-f901-234567890123',
    'e4f5a6b7-6789-4f01-a012-345678901234'
  )
) sub;