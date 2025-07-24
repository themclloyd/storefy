import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/taxUtils';
import { cn } from '@/lib/utils';

export interface ProductVariant {
  id: string;
  type: 'color' | 'size' | 'style';
  name: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariants: Record<string, string>;
  onVariantChange: (type: string, value: string, priceAdjustment: number) => void;
  basePrice: number;
  storeCurrency: string;
  themeColors: {
    primary: string;
    secondary: string;
  };
  className?: string;
}

export function ProductVariantSelector({
  variants,
  selectedVariants,
  onVariantChange,
  basePrice,
  storeCurrency,
  themeColors,
  className
}: ProductVariantSelectorProps) {
  const [totalPriceAdjustment, setTotalPriceAdjustment] = useState(0);

  // Group variants by type
  const variantsByType = variants.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  // Calculate total price adjustment when selected variants change
  useEffect(() => {
    let adjustment = 0;
    Object.entries(selectedVariants).forEach(([type, value]) => {
      const variant = variants.find(v => v.type === type && v.value === value);
      if (variant) {
        adjustment += variant.priceAdjustment;
      }
    });
    setTotalPriceAdjustment(adjustment);
  }, [selectedVariants, variants]);

  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  const getVariantDisplayName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleVariantSelect = (type: string, value: string) => {
    const variant = variants.find(v => v.type === type && v.value === value);
    if (variant) {
      onVariantChange(type, value, variant.priceAdjustment);
    }
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(variantsByType).map(([type, typeVariants]) => {
        const selectedValue = selectedVariants[type];
        const selectedVariant = typeVariants.find(v => v.value === selectedValue);

        return (
          <div key={type} className="space-y-2">
            <Label className="text-sm font-medium">
              {getVariantDisplayName(type)}
              {selectedVariant && selectedVariant.priceAdjustment !== 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedVariant.priceAdjustment > 0 ? '+' : ''}
                  {formatPrice(selectedVariant.priceAdjustment)})
                </span>
              )}
            </Label>

            {type === 'color' ? (
              // Color swatches for color variants
              <div className="flex flex-wrap gap-2">
                {typeVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(type, variant.value)}
                    className={cn(
                      "relative w-8 h-8 rounded-full border-2 transition-all",
                      selectedValue === variant.value
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    style={{
                      backgroundColor: variant.value.toLowerCase(),
                      borderColor: selectedValue === variant.value ? themeColors.primary : undefined
                    }}
                    title={`${variant.name} ${variant.priceAdjustment !== 0 ? `(${variant.priceAdjustment > 0 ? '+' : ''}${formatPrice(variant.priceAdjustment)})` : ''}`}
                  >
                    {selectedValue === variant.value && (
                      <div className="absolute inset-1 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : type === 'size' ? (
              // Size buttons for size variants
              <div className="flex flex-wrap gap-2">
                {typeVariants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant={selectedValue === variant.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVariantSelect(type, variant.value)}
                    className={cn(
                      "h-8 px-3 text-xs",
                      selectedValue === variant.value && "text-white"
                    )}
                    style={
                      selectedValue === variant.value
                        ? { backgroundColor: themeColors.primary }
                        : { borderColor: themeColors.primary, color: themeColors.primary }
                    }
                  >
                    {variant.value}
                    {variant.priceAdjustment !== 0 && (
                      <span className="ml-1 text-xs opacity-75">
                        ({variant.priceAdjustment > 0 ? '+' : ''}{formatPrice(variant.priceAdjustment)})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              // Dropdown for other variant types
              <Select
                value={selectedValue || ''}
                onValueChange={(value) => handleVariantSelect(type, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${type}`} />
                </SelectTrigger>
                <SelectContent>
                  {typeVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{variant.name}</span>
                        {variant.priceAdjustment !== 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({variant.priceAdjustment > 0 ? '+' : ''}{formatPrice(variant.priceAdjustment)})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Show selected variant info */}
            {selectedVariant && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedVariant.name}
                </Badge>
                {selectedVariant.stockQuantity <= 5 && selectedVariant.stockQuantity > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                    Only {selectedVariant.stockQuantity} left
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Total price with adjustments */}
      {totalPriceAdjustment !== 0 && (
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span>Base price:</span>
            <span>{formatPrice(basePrice)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Variant adjustment:</span>
            <span>
              {totalPriceAdjustment > 0 ? '+' : ''}{formatPrice(totalPriceAdjustment)}
            </span>
          </div>
          <div className="flex justify-between items-center font-medium">
            <span>Total price:</span>
            <span style={{ color: themeColors.primary }}>
              {formatPrice(basePrice + totalPriceAdjustment)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
