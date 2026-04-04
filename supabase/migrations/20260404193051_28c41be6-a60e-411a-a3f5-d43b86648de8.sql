UPDATE admin_documents 
SET extracted_text = (
  SELECT string_agg(
    COALESCE('### ' || heading || E'\n\n', '') || body || COALESCE(E'\n\n> "' || quote || '"', ''),
    E'\n\n'
    ORDER BY rc.sort_order, rs.sort_order
  )
  FROM reading_sections rs
  JOIN reading_content rc ON rc.id = rs.content_id
  WHERE rc.id IN (
    'faaa7617-880e-4f19-824b-321c5a46bd3e',
    'a0c0a99b-0299-4cfd-8f41-af3c2d2f7da3',
    'b1d2e3f4-5678-4901-abcd-ef1234567890',
    'c2e3f4a5-6789-4012-bcde-f12345678901',
    'd3f4a5b6-7890-4123-cdef-123456789012',
    'e4f5a6b7-c8d9-4e0f-a1b2-c3d4e5f6a7b8'
  )
)
WHERE id = '4a78192e-7833-4dc2-8d5b-6e0e856d8f31';