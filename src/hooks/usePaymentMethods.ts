import { useState, useEffect, useCallback } from 'react';
import { useCurrentStore } from '@/stores/storeStore';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  name: string;
  provider: string;
  account_number: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentOption {
  id: string;
  name: string;
  provider?: string;
  account_number?: string;
  type: 'cash' | 'custom';
  is_active: boolean;
}

export function usePaymentMethods() {
  const currentStore = useCurrentStore();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!currentStore) {
      setPaymentMethods([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('payment_methods')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Failed to load payment methods');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [currentStore]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Get all available payment options (cash + custom methods)
  const getPaymentOptions = useCallback((): PaymentOption[] => {
    const options: PaymentOption[] = [
      {
        id: 'cash',
        name: 'Cash',
        type: 'cash',
        is_active: true
      }
    ];

    // Add custom payment methods
    paymentMethods.forEach(method => {
      if (method.is_active) {
        options.push({
          id: method.id,
          name: method.name,
          provider: method.provider,
          account_number: method.account_number,
          type: 'custom',
          is_active: method.is_active
        });
      }
    });

    return options;
  }, [paymentMethods]);

  // Get payment method display name
  const getPaymentMethodDisplay = useCallback((paymentMethodId: string): string => {
    if (paymentMethodId === 'cash') {
      return 'Cash';
    }

    const method = paymentMethods.find(m => m.id === paymentMethodId);
    return method ? method.name : 'Unknown Payment Method';
  }, [paymentMethods]);

  // Get payment method details
  const getPaymentMethodDetails = useCallback((paymentMethodId: string): PaymentOption | null => {
    if (paymentMethodId === 'cash') {
      return {
        id: 'cash',
        name: 'Cash',
        type: 'cash',
        is_active: true
      };
    }

    const method = paymentMethods.find(m => m.id === paymentMethodId);
    if (!method) return null;

    return {
      id: method.id,
      name: method.name,
      provider: method.provider,
      account_number: method.account_number,
      type: 'custom',
      is_active: method.is_active
    };
  }, [paymentMethods]);

  // Check if payment method is valid
  const isValidPaymentMethod = useCallback((paymentMethodId: string): boolean => {
    if (paymentMethodId === 'cash') return true;
    return paymentMethods.some(m => m.id === paymentMethodId && m.is_active);
  }, [paymentMethods]);

  // Format payment method for display with provider info
  const formatPaymentMethodDisplay = useCallback((paymentMethodId: string, includeProvider: boolean = false): string => {
    if (paymentMethodId === 'cash') {
      return 'Cash';
    }

    const method = paymentMethods.find(m => m.id === paymentMethodId);
    if (!method) return 'Unknown Payment Method';

    if (includeProvider && method.provider) {
      return `${method.name} (${method.provider})`;
    }

    return method.name;
  }, [paymentMethods]);

  // Get payment method badge variant for UI
  const getPaymentMethodBadgeVariant = useCallback((paymentMethodId: string): 'default' | 'secondary' | 'outline' => {
    if (paymentMethodId === 'cash') {
      return 'default';
    }
    return 'secondary';
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    getPaymentOptions,
    getPaymentMethodDisplay,
    getPaymentMethodDetails,
    isValidPaymentMethod,
    formatPaymentMethodDisplay,
    getPaymentMethodBadgeVariant
  };
}

// Legacy support for existing components
export function usePaymentMethodBadge() {
  const { getPaymentMethodDisplay, getPaymentMethodBadgeVariant } = usePaymentMethods();

  const getPaymentMethodBadge = useCallback((paymentMethodId: string) => {
    return {
      label: getPaymentMethodDisplay(paymentMethodId),
      variant: getPaymentMethodBadgeVariant(paymentMethodId)
    };
  }, [getPaymentMethodDisplay, getPaymentMethodBadgeVariant]);

  return { getPaymentMethodBadge };
}
