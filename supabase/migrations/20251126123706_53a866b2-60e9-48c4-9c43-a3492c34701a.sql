-- Add quote/pricing fields to orders table for admin review workflow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS quoted_price numeric(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quote_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quote_approved_at timestamp with time zone DEFAULT NULL;

-- Update order status enum to include pending_quote status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_quote' BEFORE 'queued';