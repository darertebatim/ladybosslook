
-- Shuffle colors for all active tasks in selfcare categories
-- Uses round-robin distribution of 7 colors within each category
WITH color_palette AS (
  SELECT unnest(ARRAY['pink', 'peach', 'yellow', 'lime', 'sky', 'mint', 'lavender']) AS color,
         generate_series(0, 6) AS idx
),
numbered_tasks AS (
  SELECT 
    id,
    category,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY sort_order, title) - 1 AS rn
  FROM admin_task_bank
  WHERE is_active = true
    AND category IN (
      'calm','connection','Exercise','gratitude','LovedOnes','movement','nutrition',
      'Pets-Focus','Presence','productivity','self-kindness','sleep','wellness',
      'hygiene','Hygiene','easy-win','Easy Win','general','endoftheday','Evening',
      'MorningRoutines','HealthHub','HealthyLifeStyle','FitandFabulous',
      'FamilyParenting','Empowered','MoneyMindset','CeoWellness','adhdanxiety',
      'build-a-new-life','CleaningPlans','Health-Focus','Morning-Focus','Evening-Focus'
    )
)
UPDATE admin_task_bank t
SET color = cp.color
FROM numbered_tasks nt
JOIN color_palette cp ON cp.idx = (nt.rn % 7)
WHERE t.id = nt.id;
