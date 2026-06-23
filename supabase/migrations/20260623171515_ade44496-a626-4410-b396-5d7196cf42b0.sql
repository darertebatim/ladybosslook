INSERT INTO aperture_onboarding_questions (
  flow,
  step,
  question_key,
  prompt,
  hint,
  input_kind,
  options,
  bucket_slugs,
  bucket_question_keys,
  section,
  sort_order,
  is_active
) VALUES (
  'full',
  9,
  'full_q9c_contact_channel',
  'How do most new customers contact you?',
  null,
  'single_choice',
  '[
    {"label": "Walk in or show up in person", "value": "walk-in"},
    {"label": "Call", "value": "call"},
    {"label": "Text", "value": "text"},
    {"label": "WhatsApp", "value": "whatsapp"},
    {"label": "Instagram DM", "value": "instagram-dm"},
    {"label": "Fill out a form online", "value": "form-online"},
    {"label": "Book online directly", "value": "book-online"}
  ]'::jsonb,
  ARRAY['sales', 'customers'],
  ARRAY[]::text[],
  'customers-sales',
  15,
  true
);