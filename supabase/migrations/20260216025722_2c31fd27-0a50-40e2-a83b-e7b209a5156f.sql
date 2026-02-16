-- Drop FK constraint referencing subscription_products since we use App Store product IDs (text strings)
ALTER TABLE public.user_subscriptions DROP CONSTRAINT user_subscriptions_product_id_fkey;

-- Change product_id from uuid to text
ALTER TABLE public.user_subscriptions ALTER COLUMN product_id TYPE text USING product_id::text;