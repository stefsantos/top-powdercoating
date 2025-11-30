-- Create quote negotiations table to track back-and-forth between admin and client
CREATE TABLE public.quote_negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  quoted_by UUID NOT NULL,
  quoted_price NUMERIC NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, countered
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_negotiations ENABLE ROW LEVEL SECURITY;

-- Admins can view all negotiations
CREATE POLICY "Admins can view all quote negotiations"
ON public.quote_negotiations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create negotiations
CREATE POLICY "Admins can create quote negotiations"
ON public.quote_negotiations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view negotiations for their orders
CREATE POLICY "Users can view quote negotiations for their orders"
ON public.quote_negotiations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = quote_negotiations.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Users can create counter-offers for their orders
CREATE POLICY "Users can create quote negotiations for their orders"
ON public.quote_negotiations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = quote_negotiations.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX idx_quote_negotiations_order_id ON public.quote_negotiations(order_id);
CREATE INDEX idx_quote_negotiations_created_at ON public.quote_negotiations(created_at DESC);