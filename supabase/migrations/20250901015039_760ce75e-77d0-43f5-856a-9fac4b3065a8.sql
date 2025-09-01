-- Create orders table for tracking payments
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  product_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Anyone can create orders (for guest checkout)" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

CREATE POLICY "Only admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orders_updated_at();