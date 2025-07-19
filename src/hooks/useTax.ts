import { useState, useEffect, useCallback } from 'react';
import { useCurrentStore } from '@/stores/storeStore';
import { 
  calculateTax, 
  calculateItemsTax, 
  calculateReverseTax,
  getTaxConfig,
  getTaxRatePercentage,
  formatCurrency,
  TaxCalculation,
  TaxConfig
} from '@/lib/taxUtils';

export interface UseTaxReturn {
  taxConfig: TaxConfig | null;
  loading: boolean;
  error: string | null;
  calculateTax: (subtotal: number, customTaxRate?: number) => Promise<TaxCalculation>;
  calculateItemsTax: (items: Array<{ price: number; quantity: number; taxable?: boolean }>, customTaxRate?: number) => Promise<TaxCalculation>;
  calculateReverseTax: (totalWithTax: number, customTaxRate?: number) => Promise<TaxCalculation>;
  formatCurrency: (amount: number) => string;
  getTaxRatePercentage: () => Promise<string>;
  refreshTaxConfig: () => Promise<void>;
}

/**
 * Custom hook for tax calculations and utilities
 */
export const useTax = (): UseTaxReturn => {
  const currentStore = useCurrentStore();
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tax configuration
  const loadTaxConfig = useCallback(async () => {
    if (!currentStore) {
      setTaxConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = await getTaxConfig(currentStore.id);
      setTaxConfig(config);
    } catch (err) {
      setError('Failed to load tax configuration');
      console.error('Error loading tax config:', err);
    } finally {
      setLoading(false);
    }
  }, [currentStore]);

  // Load tax config when store changes
  useEffect(() => {
    loadTaxConfig();
  }, [loadTaxConfig]);

  // Wrapper functions that use current store
  const calculateTaxForStore = useCallback(async (
    subtotal: number, 
    customTaxRate?: number
  ): Promise<TaxCalculation> => {
    if (!currentStore) {
      throw new Error('No store selected');
    }
    return calculateTax(subtotal, currentStore.id, customTaxRate);
  }, [currentStore]);

  const calculateItemsTaxForStore = useCallback(async (
    items: Array<{ price: number; quantity: number; taxable?: boolean }>,
    customTaxRate?: number
  ): Promise<TaxCalculation> => {
    if (!currentStore) {
      throw new Error('No store selected');
    }
    return calculateItemsTax(items, currentStore.id, customTaxRate);
  }, [currentStore]);

  const calculateReverseTaxForStore = useCallback(async (
    totalWithTax: number,
    customTaxRate?: number
  ): Promise<TaxCalculation> => {
    if (!currentStore) {
      throw new Error('No store selected');
    }
    return calculateReverseTax(totalWithTax, currentStore.id, customTaxRate);
  }, [currentStore]);

  const formatCurrencyForStore = useCallback((amount: number): string => {
    const currency = taxConfig?.currency || 'MWK';
    return formatCurrency(amount, currency);
  }, [taxConfig]);

  const getTaxRatePercentageForStore = useCallback(async (): Promise<string> => {
    if (!currentStore) {
      return '0.00%';
    }
    return getTaxRatePercentage(currentStore.id);
  }, [currentStore]);

  const refreshTaxConfig = useCallback(async (): Promise<void> => {
    await loadTaxConfig();
  }, [loadTaxConfig]);

  return {
    taxConfig,
    loading,
    error,
    calculateTax: calculateTaxForStore,
    calculateItemsTax: calculateItemsTaxForStore,
    calculateReverseTax: calculateReverseTaxForStore,
    formatCurrency: formatCurrencyForStore,
    getTaxRatePercentage: getTaxRatePercentageForStore,
    refreshTaxConfig
  };
};

/**
 * Hook for simple tax calculations without store context
 */
export const useSimpleTax = (taxRate: number, currency: string = 'USD') => {
  const calculateSimpleTax = useCallback((subtotal: number): TaxCalculation => {
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      taxRate,
      total,
      formattedSubtotal: formatCurrency(subtotal, currency),
      formattedTaxAmount: formatCurrency(taxAmount, currency),
      formattedTotal: formatCurrency(total, currency)
    };
  }, [taxRate, currency]);

  const formatCurrencySimple = useCallback((amount: number): string => {
    return formatCurrency(amount, currency);
  }, [currency]);

  return {
    calculateTax: calculateSimpleTax,
    formatCurrency: formatCurrencySimple,
    taxRate,
    currency
  };
};
