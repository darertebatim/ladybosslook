UPDATE public.form_submissions fs
SET join_now_sent_at = l.first_sent,
    join_now_round_id = COALESCE(fs.join_now_round_id, fs.round_id)
FROM (
  SELECT lower(recipient_email) AS em, min(created_at) AS first_sent
  FROM public.email_logs
  WHERE status = 'success' AND created_at >= '2026-08-05 23:00:00+00'
  GROUP BY 1
) l
WHERE lower(fs.email) = l.em
  AND fs.source IN ('sixtraps_registration','presixtraps_interest')
  AND fs.join_now_sent_at IS NULL;