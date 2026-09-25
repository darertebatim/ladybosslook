UPDATE public.form_submissions
SET meta = COALESCE(meta, '{}'::jsonb) || '{"time_change_notice": true}'::jsonb
WHERE round_id = '075ae680-522d-48e0-88a3-59969428a21c'
  AND (
    city ILIKE '%vancouver%' OR city ILIKE '%vancover%' OR city ILIKE '%coquitlam%'
    OR city ILIKE '%burnaby%' OR city ILIKE '%surrey%' OR city ILIKE '%victoria%'
    OR city ILIKE '%los angeles%' OR city ILIKE '%san jose%' OR city ILIKE '%irvine%'
    OR city ILIKE '%laguna%' OR city ILIKE '%mission viejo%' OR city ILIKE '%tujunga%'
    OR city ILIKE '%reseda%' OR city ILIKE '%glendale%' OR city ILIKE '%seattle%'
    OR city ILIKE '%portland%' OR city ILIKE '%salt lake%' OR city ILIKE '%san francisco%'
    OR city ILIKE '%san diego%' OR city ILIKE '%california%' OR city ILIKE '%regina%'
    OR city ILIKE '%calgary%' OR city ILIKE '%edmonton%' OR city ILIKE '%spokane%'
    OR city ILIKE '%scottsdale%' OR city ILIKE '%cypress%' OR city ILIKE 'sj'
    OR btrim(city) = '' OR city ILIKE 'canada'
  );