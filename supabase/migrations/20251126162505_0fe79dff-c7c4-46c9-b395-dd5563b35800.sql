-- Allow clients to update their own orders for quote approval
CREATE POLICY "Users can approve quotes on their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending_quote')
WITH CHECK (auth.uid() = user_id AND status = 'queued' AND quote_approved = true);