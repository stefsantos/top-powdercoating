-- Update the trigger function to automatically set progress based on status
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Log the status change
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
    
    -- Automatically set progress based on status
    CASE NEW.status
      WHEN 'pending_quote' THEN NEW.progress := 0;
      WHEN 'queued' THEN NEW.progress := 10;
      WHEN 'sand-blasting' THEN NEW.progress := 25;
      WHEN 'coating' THEN NEW.progress := 50;
      WHEN 'curing' THEN NEW.progress := 70;
      WHEN 'quality-check' THEN NEW.progress := 85;
      WHEN 'completed' THEN NEW.progress := 100;
      -- For 'delayed' status, keep the current progress unchanged
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$function$;