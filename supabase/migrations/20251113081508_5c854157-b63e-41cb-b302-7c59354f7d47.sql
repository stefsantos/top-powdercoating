-- Create enums for order status and priority
CREATE TYPE public.order_status AS ENUM (
  'received',
  'in_preparation',
  'coating_in_progress',
  'quality_check',
  'ready_for_pickup',
  'completed',
  'cancelled'
);

CREATE TYPE public.order_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE public.finish_type AS ENUM (
  'matte',
  'glossy',
  'satin'
);

CREATE TYPE public.texture_type AS ENUM (
  'smooth',
  'textured',
  'hammered'
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  dimensions TEXT,
  additional_notes TEXT,
  status public.order_status NOT NULL DEFAULT 'received',
  priority public.order_priority NOT NULL DEFAULT 'medium',
  submitted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create order customizations table
CREATE TABLE public.order_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  finish public.finish_type NOT NULL,
  texture public.texture_type NOT NULL,
  color TEXT NOT NULL,
  custom_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create order files table
CREATE TABLE public.order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create order status history table
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order_customizations
CREATE POLICY "Users can view customizations for their orders"
  ON public.order_customizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_customizations.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create customizations for their orders"
  ON public.order_customizations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_customizations.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all customizations"
  ON public.order_customizations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order_files
CREATE POLICY "Users can view files for their orders"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files for their orders"
  ON public.order_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all files"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order_status_history
CREATE POLICY "Users can view status history for their orders"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all status history"
  ON public.order_status_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create status history"
  ON public.order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = new_number) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_order_status_changes
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();