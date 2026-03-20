
-- 1. Remove (deactivate) Introduction sections from all focus routines
UPDATE routines_bank_sections
SET is_active = false
WHERE title = 'Introduction'
  AND routine_id IN (SELECT id FROM routines_bank WHERE is_focus = true);

-- 2. Shuffle colors and emojis for focus routines

-- Evening-Focus
UPDATE routines_bank SET emoji = '🌙', color = 'lavender' WHERE id = '27bb5610-d90d-4407-a2a1-4cd55a948e76';
UPDATE routines_bank SET emoji = '🌟', color = 'peach' WHERE id = '13fbdc71-8755-40b8-a446-1197c6c3fd01';
UPDATE routines_bank SET emoji = '📖', color = 'sky' WHERE id = 'b00f6cfa-4cb4-4993-bffb-110bee8de9e9';
UPDATE routines_bank SET emoji = '🫖', color = 'mint' WHERE id = '35462a7a-f0ea-4526-b85c-448bc0f4689c';
UPDATE routines_bank SET emoji = '🛁', color = 'pink' WHERE id = '5de37c51-7a65-4ead-902d-7e8d0ac94daf';

-- Health-Focus
UPDATE routines_bank SET emoji = '🧘', color = 'mint' WHERE id = '0ccef291-d4ec-4453-8d49-f1f0346591cd';
UPDATE routines_bank SET emoji = '💪', color = 'peach' WHERE id = '116cc3f6-b3ea-478b-bc31-c2f7e5eba98b';
UPDATE routines_bank SET emoji = '🧖', color = 'pink' WHERE id = '5e11dffe-4d56-4481-acc6-669d958f0a29';
UPDATE routines_bank SET emoji = '☀️', color = 'yellow' WHERE id = 'ce4ace0f-034a-47a0-b1af-848cadd9d3e3';
UPDATE routines_bank SET emoji = '💜', color = 'lavender' WHERE id = '8f5a137e-0ecc-41a6-83d3-741ec5a5c668';
UPDATE routines_bank SET emoji = '🏃', color = 'sky' WHERE id = '822fb491-3559-4aad-9289-7fdd0c0021ec';
UPDATE routines_bank SET emoji = '🌸', color = 'pink' WHERE id = '9b4f0f6d-38ff-4d5e-bede-f52f576aaede';
UPDATE routines_bank SET emoji = '😴', color = 'lavender' WHERE id = '314ee451-1889-4f3a-a737-6ffa60d7a923';

-- Morning-Focus
UPDATE routines_bank SET emoji = '🍵', color = 'mint' WHERE id = '72217d09-efe1-4930-981c-72846beae83b';
UPDATE routines_bank SET emoji = '⚡', color = 'yellow' WHERE id = 'e96a387c-05fe-4f9b-9511-376e32a59935';

-- Pets-Focus
UPDATE routines_bank SET emoji = '🐱', color = 'peach' WHERE id = 'b9b35fcd-b940-4a08-94e7-4c3de57dc502';
UPDATE routines_bank SET emoji = '🐕', color = 'sky' WHERE id = '78d68eb5-a8fd-4978-a743-da3c1e8c7a6b';

-- Productivity-Focus
UPDATE routines_bank SET emoji = '🚀', color = 'sky' WHERE id = 'dc57a895-1e86-4a9c-b5a5-e6e165be0959';
UPDATE routines_bank SET emoji = '🧹', color = 'mint' WHERE id = '653b740d-0f9f-446a-a2da-a18464804e43';
UPDATE routines_bank SET emoji = '💅', color = 'pink' WHERE id = 'c2c22f56-505e-4efd-b75e-ae152afd0433';
UPDATE routines_bank SET emoji = '🍅', color = 'peach' WHERE id = '5677b899-f59f-4222-a15a-a3ea2207b77d';
UPDATE routines_bank SET emoji = '💻', color = 'lavender' WHERE id = '53bc2b19-bfb2-48b7-81cd-3aff1ac41edf';
UPDATE routines_bank SET emoji = '🏛️', color = 'sky' WHERE id = '30fe97ab-5b03-4ea7-aa8c-ad38befc9cc0';
UPDATE routines_bank SET emoji = '📚', color = 'yellow' WHERE id = '210545ca-7948-4ab5-9cf1-aadf7a0c2889';
UPDATE routines_bank SET emoji = '⏰', color = 'peach' WHERE id = '8ae79fcf-7629-4e3d-a4d9-29bdf6f4f61b';

-- Relationship-Focus
UPDATE routines_bank SET emoji = '👶', color = 'pink' WHERE id = '77d8cc1f-e720-46c8-8003-5140dcb5bb21';
UPDATE routines_bank SET emoji = '🎨', color = 'yellow' WHERE id = '7ca4fc20-1f42-4211-8b6d-8a4bbc2bcfd0';
UPDATE routines_bank SET emoji = '👨‍👩‍👧', color = 'peach' WHERE id = '1c6576be-8b9f-425e-ba2b-dce180de3783';

-- Sos-Focus
UPDATE routines_bank SET emoji = '🫧', color = 'sky' WHERE id = '232cf028-4023-492e-94dd-0ad3da88e06e';
UPDATE routines_bank SET emoji = '🌊', color = 'lavender' WHERE id = 'fbf1eb72-de89-451b-ae2f-6c0ff6bf7ac0';
UPDATE routines_bank SET emoji = '🌈', color = 'mint' WHERE id = 'ba79fb92-1e3d-4b6a-a382-b2235a816ee7';

-- The-Famous-Focus
UPDATE routines_bank SET emoji = '🧬', color = 'sky' WHERE id = '5572e513-3b96-4acd-8b49-f63d0eed9e0a';
UPDATE routines_bank SET emoji = '📦', color = 'peach' WHERE id = 'ba01bafd-d944-4ef3-b467-7411285cbe7e';
UPDATE routines_bank SET emoji = '💎', color = 'pink' WHERE id = 'f2876c6e-f4ce-47ea-bd0c-7e74ef6ba8ab';
UPDATE routines_bank SET emoji = '👑', color = 'lavender' WHERE id = 'de0ad159-8b58-4fa6-9c82-11bb4f78336f';
UPDATE routines_bank SET emoji = '🎯', color = 'mint' WHERE id = '65de090b-3158-4917-97fb-75db0fc9cacc';

-- 3. Shuffle colors on admin_task_bank for tasks linked to focus routines
UPDATE admin_task_bank atb
SET color = CASE (rbt.task_order % 7)
  WHEN 0 THEN 'peach'
  WHEN 1 THEN 'sky'
  WHEN 2 THEN 'pink'
  WHEN 3 THEN 'yellow'
  WHEN 4 THEN 'lavender'
  WHEN 5 THEN 'mint'
  WHEN 6 THEN 'lime'
END
FROM routines_bank_tasks rbt
JOIN routines_bank rb ON rb.id = rbt.routine_id
WHERE rb.is_focus = true
  AND rbt.task_id = atb.id
  AND rbt.task_order IS NOT NULL;
