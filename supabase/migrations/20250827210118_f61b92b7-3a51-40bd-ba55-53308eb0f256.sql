-- Create a table to store form submissions as backup
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  mailchimp_success BOOLEAN DEFAULT false,
  mailchimp_error TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address INET
);

-- Enable Row Level Security
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to insert (since it's a public form)
CREATE POLICY "Anyone can submit forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create a policy to allow only authenticated users to view submissions (for admin purposes)
CREATE POLICY "Only authenticated users can view submissions" 
ON public.form_submissions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX idx_form_submissions_email ON public.form_submissions(email);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);
CREATE INDEX idx_form_submissions_source ON public.form_submissions(source);