-- Add new PN schedules for the Simora notification strategy
INSERT INTO push_notification_schedules (name, description, function_name, schedule, is_active)
VALUES 
  ('Momentum Celebration', 'Celebrates user consistency at 3, 7, 14, 21, 30 active day milestones', 'send-momentum-celebration', '0 20 * * *', true),
  ('Time Period Reminders', 'Notifies users at the start of morning/afternoon/evening/bedtime periods in their timezone', 'send-time-period-reminders', '0 * * * *', true),
  ('Goal Nudges', 'Time-spaced reminders (9am, 12pm, 3pm, 6pm) for incomplete water & count goals', 'send-goal-nudges', '0 * * * *', true),
  ('Morning Summary', 'Daily overview of actions at 7 AM in user''s local timezone', 'send-task-summary', '0 * * * *', true),
  ('Evening Check-in', 'Reminder at 6 PM if actions remain incomplete', 'send-task-summary', '0 * * * *', true),
  ('Daily Completion', 'Celebrates when user honors 3+ actions in a day', 'send-momentum-celebration', 'trigger', true),
  ('Goal Milestones', 'Celebrates 50% and 100% goal progress', 'send-goal-nudges', 'trigger', true)
ON CONFLICT (function_name) DO NOTHING;
