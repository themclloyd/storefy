-- Subscription System Migration
-- Create comprehensive subscription management system with PayChangu integration

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'USD',
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  
  -- Plan limits
  max_stores INTEGER NOT NULL CHECK (max_stores > 0),
  max_pin_users_per_store INTEGER NOT NULL CHECK (max_pin_users_per_store > 0),
  max_inventory_items_per_store INTEGER NOT NULL CHECK (max_inventory_items_per_store > 0),
  
  -- Plan features
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  
  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  
  -- Billing information
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  -- Payment tracking
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_amount DECIMAL(10,2),
  failed_payment_attempts INTEGER DEFAULT 0,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one active subscription per user
  UNIQUE(user_id) WHERE status = 'active'
);

-- Create subscription_payments table for payment tracking
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  
  -- PayChangu payment details
  paychangu_tx_ref TEXT UNIQUE,
  paychangu_charge_id TEXT,
  checkout_url TEXT,
  
  -- Payment information
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- Payment method details
  payment_method TEXT,
  payment_channel TEXT,
  
  -- Billing period this payment covers
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- PayChangu webhook data
  webhook_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- Create billing_cycles table for tracking billing events
CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  
  -- Cycle information
  cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL CHECK (amount_due > 0),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'processing', 'paid', 'failed', 'cancelled')),
  
  -- Payment tracking
  payment_id UUID REFERENCES public.subscription_payments(id),
  payment_attempted_at TIMESTAMP WITH TIME ZONE,
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription_usage_tracking table for monitoring plan limits
CREATE TABLE IF NOT EXISTS public.subscription_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  
  -- Current usage
  stores_count INTEGER DEFAULT 0,
  total_pin_users INTEGER DEFAULT 0,
  total_inventory_items INTEGER DEFAULT 0,
  
  -- Usage by store (for detailed tracking)
  usage_by_store JSONB DEFAULT '{}',
  
  -- Last updated
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per subscription
  UNIQUE(subscription_id)
);
