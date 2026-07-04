UPDATE public.aperture_tool_card_questions
SET is_active = false
WHERE row_kind = 'question'
  AND answer_text IS NULL
  AND (question_options IS NULL OR jsonb_array_length(question_options) = 0);