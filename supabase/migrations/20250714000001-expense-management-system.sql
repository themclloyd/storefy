-- Expense Management System Migration
-- Create comprehensive expense tracking system for business expenses

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280', -- Default gray color
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, name)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  expense_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'other')),
  vendor_name TEXT,
  vendor_contact TEXT,
  receipt_number TEXT,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  is_tax_deductible BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, expense_number)
);

-- Create expense_attachments table for receipts and documents
CREATE TABLE IF NOT EXISTS public.expense_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_recurring_templates table for recurring expenses
CREATE TABLE IF NOT EXISTS public.expense_recurring_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'other')),
  vendor_name TEXT,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurrence_interval INTEGER DEFAULT 1 CHECK (recurrence_interval > 0),
  next_due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON public.expenses(store_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_categories_store_id ON public.expense_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense_id ON public.expense_attachments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_recurring_templates_store_id ON public.expense_recurring_templates(store_id);

-- Add updated_at trigger for expenses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_recurring_templates_updated_at BEFORE UPDATE ON public.expense_recurring_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_recurring_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expense_categories
CREATE POLICY "Users can view expense categories for their stores" ON public.expense_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_categories.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can insert expense categories for their stores" ON public.expense_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_categories.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

CREATE POLICY "Users can update expense categories for their stores" ON public.expense_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_categories.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

CREATE POLICY "Users can delete expense categories for their stores" ON public.expense_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_categories.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

-- Create RLS policies for expenses
CREATE POLICY "Users can view expenses for their stores" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expenses.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can insert expenses for their stores" ON public.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expenses.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can update expenses for their stores" ON public.expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expenses.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can delete expenses for their stores" ON public.expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expenses.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

-- Create RLS policies for expense_attachments
CREATE POLICY "Users can view expense attachments for their stores" ON public.expense_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.stores s ON s.id = e.store_id
            WHERE e.id = expense_attachments.expense_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can insert expense attachments for their stores" ON public.expense_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.stores s ON s.id = e.store_id
            WHERE e.id = expense_attachments.expense_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can delete expense attachments for their stores" ON public.expense_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.stores s ON s.id = e.store_id
            WHERE e.id = expense_attachments.expense_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

-- Create RLS policies for expense_recurring_templates
CREATE POLICY "Users can view expense recurring templates for their stores" ON public.expense_recurring_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_recurring_templates.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
            ))
        )
    );

CREATE POLICY "Users can insert expense recurring templates for their stores" ON public.expense_recurring_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_recurring_templates.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

CREATE POLICY "Users can update expense recurring templates for their stores" ON public.expense_recurring_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_recurring_templates.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

CREATE POLICY "Users can delete expense recurring templates for their stores" ON public.expense_recurring_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = expense_recurring_templates.store_id
            AND (s.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.store_members sm
                WHERE sm.store_id = s.id AND sm.user_id = auth.uid() AND sm.is_active = true
                AND sm.role IN ('owner', 'manager')
            ))
        )
    );

-- Function to generate expense numbers
CREATE OR REPLACE FUNCTION generate_expense_number(store_id UUID)
RETURNS TEXT AS $$
DECLARE
    expense_count INTEGER;
    expense_number TEXT;
BEGIN
    -- Get the count of expenses for this store
    SELECT COUNT(*) INTO expense_count
    FROM public.expenses
    WHERE expenses.store_id = generate_expense_number.store_id;

    -- Generate expense number in format EXP-YYYYMMDD-XXXX
    expense_number := 'EXP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((expense_count + 1)::TEXT, 4, '0');

    -- Ensure uniqueness
    WHILE EXISTS (
        SELECT 1 FROM public.expenses
        WHERE expenses.store_id = generate_expense_number.store_id
        AND expense_number = expenses.expense_number
    ) LOOP
        expense_count := expense_count + 1;
        expense_number := 'EXP-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((expense_count + 1)::TEXT, 4, '0');
    END LOOP;

    RETURN expense_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default expense categories for a store
CREATE OR REPLACE FUNCTION create_default_expense_categories(store_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.expense_categories (store_id, name, description, color) VALUES
    (store_id, 'Office Supplies', 'Stationery, printing, and office equipment', '#3B82F6'),
    (store_id, 'Utilities', 'Electricity, water, internet, and phone bills', '#EF4444'),
    (store_id, 'Rent & Lease', 'Store rent, equipment leases, and property costs', '#8B5CF6'),
    (store_id, 'Marketing', 'Advertising, promotions, and marketing materials', '#F59E0B'),
    (store_id, 'Travel & Transport', 'Business travel, fuel, and transportation costs', '#10B981'),
    (store_id, 'Professional Services', 'Legal, accounting, and consulting fees', '#6366F1'),
    (store_id, 'Insurance', 'Business insurance premiums and coverage', '#EC4899'),
    (store_id, 'Maintenance & Repairs', 'Equipment maintenance and store repairs', '#84CC16'),
    (store_id, 'Inventory & Stock', 'Product purchases and inventory costs', '#F97316'),
    (store_id, 'Miscellaneous', 'Other business expenses not categorized elsewhere', '#6B7280')
    ON CONFLICT (store_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_expense_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_expense_categories(UUID) TO authenticated;
