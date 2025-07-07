import React from 'react';
import { TaxCalculation } from '@/lib/taxUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TaxDisplayProps {
  calculation: TaxCalculation;
  showBreakdown?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function TaxDisplay({ 
  calculation, 
  showBreakdown = true, 
  variant = 'default',
  className = '' 
}: TaxDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <span className="text-sm text-muted-foreground">
          Tax ({(calculation.taxRate * 100).toFixed(2)}%):
        </span>
        <span className="font-medium">{calculation.formattedTaxAmount}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Tax Calculation</h4>
            <Badge variant="outline">
              {(calculation.taxRate * 100).toFixed(2)}% Tax Rate
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{calculation.formattedSubtotal}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({(calculation.taxRate * 100).toFixed(2)}%):
              </span>
              <span>{calculation.formattedTaxAmount}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{calculation.formattedTotal}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`space-y-2 ${className}`}>
      {showBreakdown && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{calculation.formattedSubtotal}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Tax ({(calculation.taxRate * 100).toFixed(2)}%):
            </span>
            <span>{calculation.formattedTaxAmount}</span>
          </div>
          
          <Separator />
        </>
      )}
      
      <div className="flex justify-between font-semibold">
        <span>Total:</span>
        <span>{calculation.formattedTotal}</span>
      </div>
    </div>
  );
}

interface TaxSummaryProps {
  calculations: TaxCalculation[];
  title?: string;
  className?: string;
}

export function TaxSummary({ calculations, title = "Tax Summary", className = '' }: TaxSummaryProps) {
  const totalSubtotal = calculations.reduce((sum, calc) => sum + calc.subtotal, 0);
  const totalTaxAmount = calculations.reduce((sum, calc) => sum + calc.taxAmount, 0);
  const totalAmount = calculations.reduce((sum, calc) => sum + calc.total, 0);
  
  // Get currency from first calculation (assuming all use same currency)
  const currency = calculations[0]?.formattedTotal.match(/^[^\d]+/)?.[0] || '$';
  
  const formatAmount = (amount: number) => `${currency}${amount.toFixed(2)}`;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-3">{title}</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Subtotal:</span>
            <span>{formatAmount(totalSubtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Tax:</span>
            <span>{formatAmount(totalTaxAmount)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Grand Total:</span>
            <span>{formatAmount(totalAmount)}</span>
          </div>
        </div>
        
        {calculations.length > 1 && (
          <div className="mt-4 pt-3 border-t">
            <h5 className="text-sm font-medium mb-2">Breakdown by Tax Rate:</h5>
            <div className="space-y-1">
              {calculations.map((calc, index) => (
                <div key={index} className="flex justify-between text-xs text-muted-foreground">
                  <span>{(calc.taxRate * 100).toFixed(2)}% rate:</span>
                  <span>{calc.formattedTaxAmount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaxBadgeProps {
  taxRate: number;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

export function TaxBadge({ taxRate, variant = 'outline', className = '' }: TaxBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      {(taxRate * 100).toFixed(2)}% Tax
    </Badge>
  );
}

interface TaxInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function TaxRateInput({ 
  value, 
  onChange, 
  label = "Tax Rate (%)",
  placeholder = "Enter tax rate",
  disabled = false,
  error,
  className = ''
}: TaxInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string, numbers, and decimal points
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      // Limit to reasonable tax rate range (0-100%)
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue) || numValue <= 100) {
        onChange(inputValue);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-input rounded-md
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-destructive' : ''}
          `}
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
          %
        </span>
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Enter as percentage (e.g., 8.25 for 8.25%)
      </p>
    </div>
  );
}
