-- Enhanced Layby System Migration
-- Add new features for payment schedules, notifications, interest calculations, and advanced management

-- Add new columns to layby_orders for enhanced functionality
ALTER TABLE public.layby_orders 
ADD COLUMN IF NOT EXISTS payment_schedule_type TEXT DEFAULT 'custom' CHECK (payment_schedule_type IN ('custom', 'weekly', 'bi_weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS interest_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS restocking_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS inventory_reserved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent'));

-- Create layby_payment_schedules table for structured payment plans
CREATE TABLE IF NOT EXISTS public.layby_payment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layby_order_id UUID NOT NULL REFERENCES public.layby_orders(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'skipped')),
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create layby_notifications table for tracking communications
CREATE TABLE IF NOT EXISTS public.layby_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layby_order_id UUID NOT NULL REFERENCES public.layby_orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('payment_reminder', 'overdue_notice', 'completion_notice', 'cancellation_notice', 'custom')),
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create layby_history table for audit trail
CREATE TABLE IF NOT EXISTS public.layby_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layby_order_id UUID NOT NULL REFERENCES public.layby_orders(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'payment_made', 'status_changed', 'completed', 'cancelled', 'reminder_sent', 'interest_applied')),
  action_description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  amount_involved DECIMAL(10,2),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create layby_settings table for store-specific configurations
CREATE TABLE IF NOT EXISTS public.layby_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  default_interest_rate DECIMAL(5,4) DEFAULT 0.0000,
  overdue_grace_period_days INTEGER DEFAULT 7,
  automatic_reminders_enabled BOOLEAN DEFAULT true,
  reminder_frequency_days INTEGER DEFAULT 7,
  max_reminder_count INTEGER DEFAULT 3,
  default_cancellation_fee_percent DECIMAL(5,2) DEFAULT 0.00,
  inventory_reservation_enabled BOOLEAN DEFAULT true,
  require_deposit_percent DECIMAL(5,2) DEFAULT 20.00,
  max_layby_duration_days INTEGER DEFAULT 90,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_layby_orders_status ON public.layby_orders(status);
CREATE INDEX IF NOT EXISTS idx_layby_orders_due_date ON public.layby_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_layby_orders_store_status ON public.layby_orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_layby_payment_schedules_due_date ON public.layby_payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_layby_payment_schedules_status ON public.layby_payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_layby_notifications_status ON public.layby_notifications(status);
CREATE INDEX IF NOT EXISTS idx_layby_history_layby_order ON public.layby_history(layby_order_id);

-- Create function to automatically update layby status based on due dates
CREATE OR REPLACE FUNCTION public.update_overdue_layby_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update layby orders to overdue status
  UPDATE public.layby_orders 
  SET status = 'overdue',
      updated_at = now()
  WHERE status = 'active' 
    AND due_date < CURRENT_DATE 
    AND balance_remaining > 0;
    
  -- Update payment schedule items to overdue
  UPDATE public.layby_payment_schedules
  SET status = 'overdue',
      updated_at = now()
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE
    AND amount_paid < amount_due;
END;
$$;

-- Create function to calculate interest for overdue layby orders
CREATE OR REPLACE FUNCTION public.calculate_layby_interest(_layby_order_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _interest_amount DECIMAL(10,2) := 0.00;
  _balance DECIMAL(10,2);
  _interest_rate DECIMAL(5,4);
  _days_overdue INTEGER;
  _due_date DATE;
BEGIN
  -- Get layby order details
  SELECT balance_remaining, interest_rate, due_date
  INTO _balance, _interest_rate, _due_date
  FROM public.layby_orders
  WHERE id = _layby_order_id;

  -- Calculate days overdue
  _days_overdue := GREATEST(0, CURRENT_DATE - _due_date);

  -- Calculate interest (simple daily interest)
  IF _days_overdue > 0 AND _interest_rate > 0 THEN
    _interest_amount := _balance * _interest_rate * _days_overdue / 365;
  END IF;

  RETURN _interest_amount;
END;
$$;

-- Create function to generate payment schedule
CREATE OR REPLACE FUNCTION public.generate_payment_schedule(
  _layby_order_id UUID,
  _schedule_type TEXT,
  _start_date DATE,
  _total_amount DECIMAL(10,2),
  _deposit_amount DECIMAL(10,2)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _remaining_amount DECIMAL(10,2);
  _payment_amount DECIMAL(10,2);
  _payment_count INTEGER;
  _interval_days INTEGER;
  _current_date DATE;
  _payment_number INTEGER := 1;
BEGIN
  _remaining_amount := _total_amount - _deposit_amount;

  -- Determine payment schedule parameters
  CASE _schedule_type
    WHEN 'weekly' THEN
      _interval_days := 7;
      _payment_count := 4; -- 4 weekly payments
    WHEN 'bi_weekly' THEN
      _interval_days := 14;
      _payment_count := 4; -- 4 bi-weekly payments
    WHEN 'monthly' THEN
      _interval_days := 30;
      _payment_count := 3; -- 3 monthly payments
    ELSE
      RETURN; -- Custom schedules handled separately
  END CASE;

  _payment_amount := _remaining_amount / _payment_count;
  _current_date := _start_date;

  -- Generate payment schedule entries
  FOR i IN 1.._payment_count LOOP
    _current_date := _start_date + (_interval_days * i);

    -- Adjust last payment for any rounding differences
    IF i = _payment_count THEN
      _payment_amount := _remaining_amount - (_payment_amount * (_payment_count - 1));
    END IF;

    INSERT INTO public.layby_payment_schedules (
      layby_order_id,
      payment_number,
      due_date,
      amount_due
    ) VALUES (
      _layby_order_id,
      i,
      _current_date,
      _payment_amount
    );
  END LOOP;
END;
$$;

-- Create function to process layby payment
CREATE OR REPLACE FUNCTION public.process_layby_payment(
  _layby_order_id UUID,
  _payment_amount DECIMAL(10,2),
  _payment_method TEXT,
  _payment_reference TEXT,
  _notes TEXT,
  _processed_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _payment_id UUID;
  _new_balance DECIMAL(10,2);
  _current_balance DECIMAL(10,2);
  _store_id UUID;
  _transaction_number TEXT;
  _layby_number TEXT;
  _customer_name TEXT;
BEGIN
  -- Get current layby details
  SELECT balance_remaining, store_id, layby_number, customer_name
  INTO _current_balance, _store_id, _layby_number, _customer_name
  FROM public.layby_orders
  WHERE id = _layby_order_id;

  _new_balance := _current_balance - _payment_amount;

  -- Create payment record
  INSERT INTO public.layby_payments (
    layby_order_id,
    amount,
    payment_method,
    payment_reference,
    notes,
    processed_by
  ) VALUES (
    _layby_order_id,
    _payment_amount,
    _payment_method,
    _payment_reference,
    _notes,
    _processed_by
  ) RETURNING id INTO _payment_id;

  -- Update layby balance
  UPDATE public.layby_orders
  SET balance_remaining = _new_balance,
      updated_at = now()
  WHERE id = _layby_order_id;

  -- Generate transaction number and create transaction record
  SELECT generate_transaction_number(_store_id) INTO _transaction_number;

  INSERT INTO public.transactions (
    store_id,
    transaction_number,
    transaction_type,
    amount,
    payment_method,
    reference_id,
    reference_type,
    customer_name,
    description,
    notes,
    processed_by
  ) VALUES (
    _store_id,
    _transaction_number,
    'layby_payment',
    _payment_amount,
    _payment_method,
    _layby_order_id,
    'layby_order',
    _customer_name,
    'Payment for layby ' || _layby_number,
    _notes,
    _processed_by
  );

  -- Add to history
  INSERT INTO public.layby_history (
    layby_order_id,
    action_type,
    action_description,
    amount_involved,
    performed_by,
    notes
  ) VALUES (
    _layby_order_id,
    'payment_made',
    'Payment of $' || _payment_amount || ' processed',
    _payment_amount,
    _processed_by,
    _notes
  );

  -- Update payment schedule if applicable
  UPDATE public.layby_payment_schedules
  SET amount_paid = amount_paid + _payment_amount,
      status = CASE
        WHEN amount_paid + _payment_amount >= amount_due THEN 'paid'
        ELSE status
      END,
      updated_at = now()
  WHERE layby_order_id = _layby_order_id
    AND status IN ('pending', 'overdue')
    AND amount_paid < amount_due
  ORDER BY due_date
  LIMIT 1;

  RETURN _payment_id;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.layby_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layby_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layby_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layby_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for layby_payment_schedules
CREATE POLICY "Store access for layby_payment_schedules" ON public.layby_payment_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.layby_orders lo
      WHERE lo.id = layby_payment_schedules.layby_order_id
        AND public.user_can_access_store(lo.store_id)
    )
  );

-- Create RLS policies for layby_notifications
CREATE POLICY "Store access for layby_notifications" ON public.layby_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.layby_orders lo
      WHERE lo.id = layby_notifications.layby_order_id
        AND public.user_can_access_store(lo.store_id)
    )
  );

-- Create RLS policies for layby_history
CREATE POLICY "Store access for layby_history" ON public.layby_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.layby_orders lo
      WHERE lo.id = layby_history.layby_order_id
        AND public.user_can_access_store(lo.store_id)
    )
  );

-- Create RLS policies for layby_settings
CREATE POLICY "Store access for layby_settings" ON public.layby_settings
  FOR ALL USING (public.user_can_access_store(store_id));

-- Create function to initialize default layby settings for new stores
CREATE OR REPLACE FUNCTION public.initialize_layby_settings(_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.layby_settings (store_id)
  VALUES (_store_id)
  ON CONFLICT (store_id) DO NOTHING;
END;
$$;

-- Create function to generate layby number
CREATE OR REPLACE FUNCTION public.generate_layby_number(_store_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _count INTEGER;
  _year TEXT;
  _layby_number TEXT;
BEGIN
  _year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Get count of layby orders for this store this year
  SELECT COUNT(*) + 1
  INTO _count
  FROM public.layby_orders
  WHERE store_id = _store_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  _layby_number := 'LAY-' || _year || '-' || LPAD(_count::TEXT, 4, '0');

  RETURN _layby_number;
END;
$$;
