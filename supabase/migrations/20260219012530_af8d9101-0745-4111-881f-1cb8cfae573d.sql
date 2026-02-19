
INSERT INTO breathing_exercises (name, description, category, emoji, inhale_seconds, inhale_hold_seconds, exhale_seconds, exhale_hold_seconds, inhale_method, exhale_method, sort_order, is_active, is_premium)
VALUES
  ('Sleep Breathing', 'Designed to help rest the mind and body by activating the parasympathetic nervous system. Stop if you ever feel overexerted.', 'night', '🌙', 4, 7, 8, 0, 'nose', 'mouth', 4, true, false),
  ('Panic Breathing', 'Brief breath holds on the exhale can quiet the nervous system and restore you to a calm state of mind. This technique reduces the likelihood of hyperventilation during times of panic. Stop if you ever feel overexerted.', 'calm', '😰', 4, 0, 4, 5, 'nose', 'mouth', 5, true, false),
  ('Anxiety Breathing', 'Slowing your breathing rate reduces hypertension, heart rate, blood pressure and oxidative stress. Stop if you ever feel overexerted.', 'calm', '🧘', 4, 2, 6, 0, 'nose', 'mouth', 6, true, false);
