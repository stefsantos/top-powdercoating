-- Create a function to notify users when order status changes
CREATE OR REPLACE FUNCTION public.notify_user_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_user_id UUID;
  order_number TEXT;
  status_label TEXT;
  notification_subject TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger on status change
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    order_user_id := NEW.user_id;
    order_number := NEW.order_number;
    
    -- Map status to readable label
    CASE NEW.status
      WHEN 'pending_quote' THEN status_label := 'Pending Quote';
      WHEN 'queued' THEN status_label := 'Queued';
      WHEN 'sand-blasting' THEN status_label := 'Sand Blasting';
      WHEN 'coating' THEN status_label := 'Coating';
      WHEN 'curing' THEN status_label := 'Curing';
      WHEN 'quality-check' THEN status_label := 'Quality Check';
      WHEN 'completed' THEN status_label := 'Completed';
      WHEN 'delayed' THEN status_label := 'Delayed';
      ELSE status_label := NEW.status;
    END CASE;
    
    -- Set notification content based on status
    IF NEW.status = 'completed' THEN
      notification_subject := 'Order Completed! 🎉';
      notification_message := 'Great news! Your order ' || order_number || ' has been completed and is ready for pickup/delivery.';
    ELSIF NEW.status = 'delayed' THEN
      notification_subject := 'Order Delayed';
      notification_message := 'We apologize, but your order ' || order_number || ' has been delayed. We will update you as soon as possible.';
    ELSIF NEW.status = 'pending_quote' THEN
      notification_subject := 'Quote Pending';
      notification_message := 'Your order ' || order_number || ' is awaiting a quote. You will be notified once it is ready.';
    ELSE
      notification_subject := 'Order Status Updated';
      notification_message := 'Your order ' || order_number || ' status has been updated to: ' || status_label;
    END IF;
    
    -- Insert notification into messages table
    INSERT INTO public.messages (user_id, order_id, subject, message, priority, is_read)
    VALUES (
      order_user_id,
      NEW.id,
      notification_subject,
      notification_message,
      CASE WHEN NEW.status IN ('completed', 'delayed') THEN 'high' ELSE 'medium' END,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for status change notifications
DROP TRIGGER IF EXISTS notify_on_order_status_change ON public.orders;
CREATE TRIGGER notify_on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_status_change();