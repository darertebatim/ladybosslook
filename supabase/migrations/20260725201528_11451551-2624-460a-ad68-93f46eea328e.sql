UPDATE public.program_catalog
SET payment_type = 'free'
WHERE price_amount = 0
  AND payment_type = 'one-time'
  AND slug IN ('elc','rte-eng','goalsettingfa','poolsazi','instagram6traps');