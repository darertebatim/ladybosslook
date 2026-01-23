-- Insert business-work task templates into the correct table (task_templates)
INSERT INTO public.task_templates (title, emoji, color, category, description, repeat_pattern, is_active, is_popular, display_order) VALUES
('Weekly Goal Review', '🎯', 'yellow', 'business-work', 'Reflect on your weekly goals and track your progress', 'weekly', true, true, 200),
('Plan Tomorrow''s Top 3', '📝', 'lavender', 'business-work', 'Identify your 3 most important tasks for tomorrow', 'daily', true, true, 201),
('LinkedIn Profile Update', '👥', 'blue', 'business-work', 'Refresh your LinkedIn profile and expand your network', 'weekly', true, false, 202),
('Inbox Zero Session', '📧', 'mint', 'business-work', 'Clear your inbox and respond to important messages', 'daily', true, false, 203),
('Business Idea Brainstorm', '💡', 'yellow', 'business-work', 'Capture new business ideas and opportunities', 'weekly', true, true, 204),
('Check Financial Dashboard', '💰', 'green', 'business-work', 'Review your revenue, expenses, and cash flow', 'weekly', true, false, 205),
('Network Outreach', '💬', 'pink', 'business-work', 'Reach out to a contact and nurture your relationships', 'weekly', true, false, 206),
('Track Weekly Revenue', '📈', 'green', 'business-work', 'Log your weekly sales and revenue numbers', 'weekly', true, false, 207),
('Celebrate a Win', '✨', 'pink', 'business-work', 'Acknowledge and celebrate your recent accomplishments', 'weekly', true, true, 208),
('Set Monthly Milestones', '🚀', 'purple', 'business-work', 'Define clear milestones for the month ahead', 'none', true, false, 209),
('Content Planning Session', '📅', 'lavender', 'business-work', 'Plan your social media and content strategy', 'weekly', true, false, 210),
('Organize Digital Files', '📁', 'blue', 'business-work', 'Declutter and organize your digital workspace', 'weekly', true, false, 211),
('Learn Something New', '📚', 'purple', 'business-work', 'Dedicate time to learning a new skill or concept', 'weekly', true, true, 212),
('Client Follow-Up', '📞', 'mint', 'business-work', 'Check in with clients and maintain relationships', 'weekly', true, false, 213);