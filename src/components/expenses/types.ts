export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  title: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  vendor_name: string;
  vendor_contact: string;
  receipt_number: string;
  tax_amount: number;
  is_tax_deductible: boolean;
  status: string;
  notes: string;
  created_at: string;
  expense_categories?: {
    name: string;
    color: string;
  } | null;
}

export interface RecurringExpense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  payment_method: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  is_active: boolean;
  auto_create: boolean;
  notes: string | null;
  created_at: string;
  expense_categories?: {
    name: string;
    color: string;
  } | null;
}
