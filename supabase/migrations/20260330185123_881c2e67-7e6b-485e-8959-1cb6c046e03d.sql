-- Update user_tasks pointing to old (deleted) Calm Breathing exercise ID
-- to the new Calm Breathing exercise ID
UPDATE user_tasks 
SET pro_link_value = '00218ce1-be10-4670-8644-cfdb7fe94c20'
WHERE pro_link_type = 'breathe' 
  AND pro_link_value = 'd5f63835-1fe7-4ae3-b4e2-543b64855a6b';

-- Also fix other orphaned breathe pro_links pointing to deleted exercises
-- c6d8e336 and f768d5f9 and f2df5682 are also deleted - map them to Calm Breathing as fallback
UPDATE user_tasks 
SET pro_link_value = '00218ce1-be10-4670-8644-cfdb7fe94c20'
WHERE pro_link_type = 'breathe' 
  AND pro_link_value IN ('c6d8e336-9f07-4a69-a39e-c50c75fbd7d6', 'f768d5f9-b000-402c-8319-8a1881483384', 'f2df5682-712b-464c-8249-6a937c92f842');