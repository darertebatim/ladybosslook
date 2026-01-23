-- Insert business-work task templates
INSERT INTO public.routine_task_templates (title, duration_minutes, icon, pro_link_type, description, category, is_active, display_order, is_popular) VALUES
('Weekly Goal Review', 15, 'Target', 'journal', 'Reflect on your weekly goals and track your progress', 'business-work', true, 100, true),
('Plan Tomorrow''s Top 3', 10, 'ListTodo', 'journal', 'Identify your 3 most important tasks for tomorrow', 'business-work', true, 101, true),
('LinkedIn Profile Update', 20, 'Users', 'planner', 'Refresh your LinkedIn profile and expand your network', 'business-work', true, 102, false),
('Inbox Zero Session', 15, 'Mail', 'planner', 'Clear your inbox and respond to important messages', 'business-work', true, 103, false),
('Business Idea Brainstorm', 20, 'Lightbulb', 'journal', 'Capture new business ideas and opportunities', 'business-work', true, 104, true),
('Check Financial Dashboard', 10, 'DollarSign', 'planner', 'Review your revenue, expenses, and cash flow', 'business-work', true, 105, false),
('Network Outreach', 15, 'MessageCircle', 'planner', 'Reach out to a contact and nurture your relationships', 'business-work', true, 106, false),
('Track Weekly Revenue', 10, 'TrendingUp', 'journal', 'Log your weekly sales and revenue numbers', 'business-work', true, 107, false),
('Celebrate a Win', 5, 'Sparkles', 'journal', 'Acknowledge and celebrate your recent accomplishments', 'business-work', true, 108, true),
('Set Monthly Milestones', 20, 'Flag', 'journal', 'Define clear milestones for the month ahead', 'business-work', true, 109, false),
('Content Planning Session', 25, 'Calendar', 'planner', 'Plan your social media and content strategy', 'business-work', true, 110, false),
('Organize Digital Files', 15, 'FolderOpen', 'planner', 'Declutter and organize your digital workspace', 'business-work', true, 111, false),
('Learn Something New', 20, 'BookOpen', 'planner', 'Dedicate time to learning a new skill or concept', 'business-work', true, 112, true),
('Client Follow-Up', 10, 'Phone', 'planner', 'Check in with clients and maintain relationships', 'business-work', true, 113, false);