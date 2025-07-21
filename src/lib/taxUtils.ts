import { supabase } from '@/integrations/supabase/client';

// Tax calculation interface
export interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  formattedSubtotal: string;
  formattedTaxAmount: string;
  formattedTotal: string;
}

// Tax configuration interface
export interface TaxConfig {
  rate: number; // Decimal format (e.g., 0.0825 for 8.25%)
  currency: string;
  storeId: string;
}

// Cache for tax configuration to avoid repeated database calls
let taxConfigCache: TaxConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get tax configuration from store settings
 */
export const getTaxConfig = async (storeId: string): Promise<TaxConfig> => {
  // Check cache first
  const now = Date.now();
  if (taxConfigCache && taxConfigCache.storeId === storeId && (now - cacheTimestamp) < CACHE_DURATION) {
    return taxConfigCache;
  }

  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('tax_rate, currency')
      .eq('id', storeId)
      .single();

    if (error) throw error;

    const config: TaxConfig = {
      rate: store.tax_rate || 0,
      currency: store.currency || 'MWK',
      storeId
    };

    // Update cache
    taxConfigCache = config;
    cacheTimestamp = now;

    return config;
  } catch (error) {
    console.error('Error fetching tax config:', error);
    // Return default config if fetch fails
    return {
      rate: 0,
      currency: 'MWK',
      storeId
    };
  }
};

/**
 * Calculate tax for a given amount
 */
export const calculateTax = async (
  subtotal: number, 
  storeId: string,
  customTaxRate?: number
): Promise<TaxCalculation> => {
  let taxRate: number;
  let currency: string;

  if (customTaxRate !== undefined) {
    // Use custom tax rate if provided
    taxRate = customTaxRate;
    currency = 'MWK'; // Default currency for custom rates
  } else {
    // Get tax rate from store settings
    const config = await getTaxConfig(storeId);
    taxRate = config.rate;
    currency = config.currency;
  }

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
};

/**
 * Calculate tax for multiple items
 */
export const calculateItemsTax = async (
  items: Array<{ price: number; quantity: number; taxable?: boolean }>,
  storeId: string,
  customTaxRate?: number
): Promise<TaxCalculation> => {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    // Only include taxable items (default to taxable if not specified)
    return sum + (item.taxable !== false ? itemTotal : 0);
  }, 0);

  return calculateTax(subtotal, storeId, customTaxRate);
};

/**
 * Calculate reverse tax (find pre-tax amount from total including tax)
 */
export const calculateReverseTax = async (
  totalWithTax: number,
  storeId: string,
  customTaxRate?: number
): Promise<TaxCalculation> => {
  let taxRate: number;
  let currency: string;

  if (customTaxRate !== undefined) {
    taxRate = customTaxRate;
    currency = 'USD';
  } else {
    const config = await getTaxConfig(storeId);
    taxRate = config.rate;
    currency = config.currency;
  }

  const subtotal = totalWithTax / (1 + taxRate);
  const taxAmount = totalWithTax - subtotal;

  return {
    subtotal,
    taxAmount,
    taxRate,
    total: totalWithTax,
    formattedSubtotal: formatCurrency(subtotal, currency),
    formattedTaxAmount: formatCurrency(taxAmount, currency),
    formattedTotal: formatCurrency(totalWithTax, currency)
  };
};

/**
 * World currencies with symbols and formatting
 */
export const WORLD_CURRENCIES = {
  // Major World Currencies
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CNY: { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },

  // African Currencies
  MWK: { symbol: 'MK', name: 'Malawian Kwacha', decimals: 2 },
  ZAR: { symbol: 'R', name: 'South African Rand', decimals: 2 },
  NGN: { symbol: '₦', name: 'Nigerian Naira', decimals: 2 },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', decimals: 2 },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling', decimals: 0 },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', decimals: 2 },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi', decimals: 2 },
  EGP: { symbol: '£', name: 'Egyptian Pound', decimals: 2 },
  MAD: { symbol: 'DH', name: 'Moroccan Dirham', decimals: 2 },
  ETB: { symbol: 'Br', name: 'Ethiopian Birr', decimals: 2 },

  // North American Currencies
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  MXN: { symbol: '$', name: 'Mexican Peso', decimals: 2 },

  // European Currencies
  CHF: { symbol: 'Fr', name: 'Swiss Franc', decimals: 2 },
  SEK: { symbol: 'kr', name: 'Swedish Krona', decimals: 2 },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', decimals: 2 },
  DKK: { symbol: 'kr', name: 'Danish Krone', decimals: 2 },
  PLN: { symbol: 'zł', name: 'Polish Zloty', decimals: 2 },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', decimals: 2 },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', decimals: 0 },
  RON: { symbol: 'lei', name: 'Romanian Leu', decimals: 2 },

  // Asian Currencies
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  KRW: { symbol: '₩', name: 'South Korean Won', decimals: 0 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
  THB: { symbol: '฿', name: 'Thai Baht', decimals: 2 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 },
  PHP: { symbol: '₱', name: 'Philippine Peso', decimals: 2 },
  VND: { symbol: '₫', name: 'Vietnamese Dong', decimals: 0 },
  PKR: { symbol: '₨', name: 'Pakistani Rupee', decimals: 2 },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', decimals: 2 },
  LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee', decimals: 2 },

  // Oceania Currencies
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 },

  // Middle Eastern Currencies
  AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', decimals: 2 },
  QAR: { symbol: 'ر.ق', name: 'Qatari Riyal', decimals: 2 },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', decimals: 3 },
  BHD: { symbol: 'د.ب', name: 'Bahraini Dinar', decimals: 3 },
  OMR: { symbol: 'ر.ع.', name: 'Omani Rial', decimals: 3 },
  JOD: { symbol: 'د.ا', name: 'Jordanian Dinar', decimals: 3 },
  LBP: { symbol: 'ل.ل', name: 'Lebanese Pound', decimals: 2 },
  ILS: { symbol: '₪', name: 'Israeli Shekel', decimals: 2 },

  // South American Currencies
  BRL: { symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
  ARS: { symbol: '$', name: 'Argentine Peso', decimals: 2 },
  CLP: { symbol: '$', name: 'Chilean Peso', decimals: 0 },
  COP: { symbol: '$', name: 'Colombian Peso', decimals: 2 },
  PEN: { symbol: 'S/', name: 'Peruvian Sol', decimals: 2 },
  UYU: { symbol: '$U', name: 'Uruguayan Peso', decimals: 2 },

  // Other Important Currencies
  RUB: { symbol: '₽', name: 'Russian Ruble', decimals: 2 },
  TRY: { symbol: '₺', name: 'Turkish Lira', decimals: 2 },
  IRR: { symbol: '﷼', name: 'Iranian Rial', decimals: 0 },
  AFN: { symbol: '؋', name: 'Afghan Afghani', decimals: 2 },
} as const;

/**
 * Format number with comma separators
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format currency based on currency code with comma separators
 */
export const formatCurrency = (amount: number, currency: string = 'MWK'): string => {
  const currencyInfo = WORLD_CURRENCIES[currency as keyof typeof WORLD_CURRENCIES];

  if (!currencyInfo) {
    // Fallback for unknown currencies with comma formatting
    const formattedAmount = formatNumber(amount, 2);
    return `${currency} ${formattedAmount}`;
  }

  const { symbol, decimals } = currencyInfo;
  const formattedAmount = formatNumber(amount, decimals);
  return `${symbol}${formattedAmount}`;
};

/**
 * Get tax rate as percentage string
 */
export const getTaxRatePercentage = async (storeId: string): Promise<string> => {
  const config = await getTaxConfig(storeId);
  return `${(config.rate * 100).toFixed(2)}%`;
};

/**
 * Clear tax configuration cache (useful when store settings change)
 */
export const clearTaxCache = (): void => {
  taxConfigCache = null;
  cacheTimestamp = 0;
};

/**
 * Validate tax rate
 */
export const isValidTaxRate = (rate: number): boolean => {
  return !isNaN(rate) && rate >= 0 && rate <= 1; // 0% to 100%
};

/**
 * Convert percentage to decimal
 */
export const percentageToDecimal = (percentage: number): number => {
  return percentage / 100;
};

/**
 * Convert decimal to percentage
 */
export const decimalToPercentage = (decimal: number): number => {
  return decimal * 100;
};
