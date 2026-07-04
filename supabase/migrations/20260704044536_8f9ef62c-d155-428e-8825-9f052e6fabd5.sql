UPDATE public.aperture_tool_card_questions
SET is_active = false
WHERE is_active = true
  AND row_kind = 'question'
  AND (options IS NULL OR jsonb_array_length(options) = 0);