
-- Fix Ritual 1 (Happiness Hormones) - "Watch a comedy movie" should be monthly on 15th
UPDATE routines_bank_tasks SET monthly_day = 15 
WHERE routine_id = 'a1b2c3d4-1111-4000-8000-000000000001' AND title = 'Watch a comedy movie';

-- Fix Ritual 2 (Garden Glow-Up) - Monthly tasks
UPDATE routines_bank_tasks SET monthly_day = 3 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Clean fences';
UPDATE routines_bank_tasks SET monthly_day = 10 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Maintain pools or garden ponds';
UPDATE routines_bank_tasks SET monthly_day = 17 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Mow the lawn';
UPDATE routines_bank_tasks SET monthly_day = 24 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Trim bushes and shrubs';
UPDATE routines_bank_tasks SET monthly_day = 5 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Turn soil';
UPDATE routines_bank_tasks SET monthly_day = 15 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Fertilize plants and lawn';
UPDATE routines_bank_tasks SET monthly_day = 20 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Select and introduce new plants';
UPDATE routines_bank_tasks SET monthly_day = 28 
WHERE routine_id = 'b1000001-0002-4000-8000-000000000002' AND title = 'Conduct pest control';

-- Fix Ritual 3 (4+8 Household) - Monthly/Quarterly tasks
UPDATE routines_bank_tasks SET monthly_day = 7 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Clean Shower/Bath';
UPDATE routines_bank_tasks SET monthly_day = 14 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Clean Inside Refrigerator and Microwave';
UPDATE routines_bank_tasks SET monthly_day = 21 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Deep Clean Furniture';
UPDATE routines_bank_tasks SET monthly_day = 28 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Tidy Up Garage';
UPDATE routines_bank_tasks SET monthly_day = 5 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Clean Windows and Curtains';
UPDATE routines_bank_tasks SET monthly_day = 10 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Clean Baseboards and Doors';
UPDATE routines_bank_tasks SET monthly_day = 15 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Clean Air Filters';
UPDATE routines_bank_tasks SET monthly_day = 20 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Organize Closets';
UPDATE routines_bank_tasks SET monthly_day = 25 
WHERE routine_id = 'b1000001-0003-4000-8000-000000000003' AND title = 'Tidy Up Yard';

-- Fix Ritual 4 (Clean Room) - Monthly tasks
UPDATE routines_bank_tasks SET monthly_day = 7 
WHERE routine_id = 'b1000001-0004-4000-8000-000000000004' AND title = 'Clean fan';
UPDATE routines_bank_tasks SET monthly_day = 10 
WHERE routine_id = 'b1000001-0004-4000-8000-000000000004' AND title = 'Clean my car';
UPDATE routines_bank_tasks SET monthly_day = 15 
WHERE routine_id = 'b1000001-0004-4000-8000-000000000004' AND title = 'Clean the refrigerator' AND routine_id = 'b1000001-0004-4000-8000-000000000004';
UPDATE routines_bank_tasks SET monthly_day = 16 
WHERE routine_id = 'b1000001-0004-4000-8000-000000000004' AND title = 'Clean TV';
UPDATE routines_bank_tasks SET monthly_day = 20 
WHERE routine_id = 'b1000001-0004-4000-8000-000000000004' AND title = 'Wash the garage';

-- Fix Ritual 5 (Kitchen Clean) - Monthly tasks
UPDATE routines_bank_tasks SET monthly_day = 24 
WHERE routine_id = 'b1000001-0005-4000-8000-000000000005' AND title = 'Clean the refrigerator';
UPDATE routines_bank_tasks SET monthly_day = 28 
WHERE routine_id = 'b1000001-0005-4000-8000-000000000005' AND title = 'Clean and dry the dishwasher';
