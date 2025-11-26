-- Function to notify all admin users
CREATE OR REPLACE FUNCTION public.notify_admins(
  _order_id UUID,
  _order_number TEXT,
  _subject TEXT,
  _message TEXT,
  _priority TEXT DEFAULT 'medium'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Loop through all admin users and create a notification for each
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.messages (user_id, order_id, subject, message, priority, is_read)
    VALUES (admin_user_id, _order_id, _subject, _message, _priority, false);
  END LOOP;
END;
$$;

-- Trigger function for new orders
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    NEW.id,
    NEW.order_number,
    'New Order Received',
    'A new order ' || NEW.order_number || ' has been submitted and requires attention.',
    'high'
  );
  RETURN NEW;
END;
$$;

-- Trigger function for quote approval
CREATE OR REPLACE FUNCTION public.notify_admins_on_quote_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when quote_approved changes from false/null to true
  IF (OLD.quote_approved IS DISTINCT FROM NEW.quote_approved) AND NEW.quote_approved = true THEN
    PERFORM public.notify_admins(
      NEW.id,
      NEW.order_number,
      'Quote Approved by Client',
      'The client has approved the quote for order ' || NEW.order_number || '. The order is now queued for production.',
      'high'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new orders
CREATE TRIGGER on_new_order_notify_admins
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_order();

-- Create trigger for quote approval
CREATE TRIGGER on_quote_approval_notify_admins
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_quote_approval();