-- Update order_status enum to match XML blueprint
ALTER TYPE order_status RENAME TO order_status_old;

CREATE TYPE order_status AS ENUM (
  'queued',
  'sand-blasting',
  'coating',
  'curing',
  'quality-check',
  'completed',
  'delayed'
);

-- Update orders table to use new enum
ALTER TABLE public.orders 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status USING (
    CASE status::text
      WHEN 'received' THEN 'queued'
      WHEN 'in_preparation' THEN 'sand-blasting'
      WHEN 'coating_in_progress' THEN 'coating'
      WHEN 'quality_check' THEN 'quality-check'
      WHEN 'ready_for_pickup' THEN 'completed'
      WHEN 'completed' THEN 'completed'
      WHEN 'cancelled' THEN 'delayed'
      ELSE 'queued'
    END::order_status
  ),
  ALTER COLUMN status SET DEFAULT 'queued'::order_status;

-- Update order_status_history table
ALTER TABLE public.order_status_history
  ALTER COLUMN status TYPE order_status USING (
    CASE status::text
      WHEN 'received' THEN 'queued'
      WHEN 'in_preparation' THEN 'sand-blasting'
      WHEN 'coating_in_progress' THEN 'coating'
      WHEN 'quality_check' THEN 'quality-check'
      WHEN 'ready_for_pickup' THEN 'completed'
      WHEN 'completed' THEN 'completed'
      WHEN 'cancelled' THEN 'delayed'
      ELSE 'queued'
    END::order_status
  );

DROP TYPE order_status_old;

-- Add progress field to orders table for tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);