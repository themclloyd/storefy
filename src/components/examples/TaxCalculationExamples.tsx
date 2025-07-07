import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTax } from '@/hooks/useTax';
import { TaxDisplay, TaxSummary, TaxBadge, TaxRateInput } from '@/components/common/TaxDisplay';
import { Calculator, DollarSign, Percent } from 'lucide-react';

/**
 * Example component demonstrating tax utility usage
 * This shows how to integrate tax calculations throughout the app
 */
export function TaxCalculationExamples() {
  const { taxConfig, calculateTax, calculateItemsTax, formatCurrency, getTaxRatePercentage } = useTax();
  
  // Example 1: Simple tax calculation
  const [simpleAmount, setSimpleAmount] = useState('100.00');
  const [simpleResult, setSimpleResult] = useState<any>(null);
  
  // Example 2: Multiple items calculation
  const [items, setItems] = useState([
    { name: 'Product A', price: 25.99, quantity: 2, taxable: true },
    { name: 'Product B', price: 15.50, quantity: 1, taxable: true },
    { name: 'Service Fee', price: 10.00, quantity: 1, taxable: false }
  ]);
  const [itemsResult, setItemsResult] = useState<any>(null);
  
  // Example 3: Custom tax rate
  const [customRate, setCustomRate] = useState('10.00');
  const [customAmount, setCustomAmount] = useState('50.00');
  const [customResult, setCustomResult] = useState<any>(null);
  
  // Example 4: Tax rate display
  const [currentTaxRate, setCurrentTaxRate] = useState('');

  useEffect(() => {
    if (taxConfig) {
      getTaxRatePercentage().then(setCurrentTaxRate);
    }
  }, [taxConfig, getTaxRatePercentage]);

  const handleSimpleCalculation = async () => {
    try {
      const amount = parseFloat(simpleAmount);
      if (!isNaN(amount)) {
        const result = await calculateTax(amount);
        setSimpleResult(result);
      }
    } catch (error) {
      console.error('Error calculating simple tax:', error);
    }
  };

  const handleItemsCalculation = async () => {
    try {
      const result = await calculateItemsTax(items);
      setItemsResult(result);
    } catch (error) {
      console.error('Error calculating items tax:', error);
    }
  };

  const handleCustomCalculation = async () => {
    try {
      const amount = parseFloat(customAmount);
      const rate = parseFloat(customRate) / 100; // Convert percentage to decimal
      if (!isNaN(amount) && !isNaN(rate)) {
        const result = await calculateTax(amount, rate);
        setCustomResult(result);
      }
    } catch (error) {
      console.error('Error calculating custom tax:', error);
    }
  };

  const updateItemPrice = (index: number, price: string) => {
    const newItems = [...items];
    newItems[index].price = parseFloat(price) || 0;
    setItems(newItems);
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseInt(quantity) || 0;
    setItems(newItems);
  };

  const toggleItemTaxable = (index: number) => {
    const newItems = [...items];
    newItems[index].taxable = !newItems[index].taxable;
    setItems(newItems);
  };

  if (!taxConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading tax configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Tax Calculation Examples</h2>
          <p className="text-muted-foreground">
            Demonstrating tax utility usage throughout the application
          </p>
        </div>
      </div>

      {/* Current Store Tax Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Current Store Tax Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tax Rate</Label>
              <div className="flex items-center gap-2 mt-1">
                <TaxBadge taxRate={taxConfig.rate} />
                <span className="text-sm text-muted-foreground">({currentTaxRate})</span>
              </div>
            </div>
            <div>
              <Label>Currency</Label>
              <div className="mt-1">
                <Badge variant="outline">{taxConfig.currency}</Badge>
              </div>
            </div>
            <div>
              <Label>Store ID</Label>
              <div className="mt-1 text-sm text-muted-foreground font-mono">
                {taxConfig.storeId.slice(0, 8)}...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example 1: Simple Tax Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Example 1: Simple Tax Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="simple-amount">Amount</Label>
                <Input
                  id="simple-amount"
                  type="number"
                  step="0.01"
                  value={simpleAmount}
                  onChange={(e) => setSimpleAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <Button onClick={handleSimpleCalculation} className="w-full">
                Calculate Tax
              </Button>
            </div>
            <div>
              {simpleResult && (
                <TaxDisplay calculation={simpleResult} variant="detailed" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Multiple Items Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Example 2: Multiple Items with Mixed Taxability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-center p-3 border rounded">
                <div className="font-medium">{item.name}</div>
                <Input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItemPrice(index, e.target.value)}
                  placeholder="Price"
                />
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(index, e.target.value)}
                  placeholder="Qty"
                />
                <Button
                  variant={item.taxable ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleItemTaxable(index)}
                >
                  {item.taxable ? "Taxable" : "Tax-Free"}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleItemsCalculation} className="w-full">
            Calculate Items Tax
          </Button>
          {itemsResult && (
            <TaxDisplay calculation={itemsResult} variant="detailed" />
          )}
        </CardContent>
      </Card>

      {/* Example 3: Custom Tax Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Example 3: Custom Tax Rate Override</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-amount">Amount</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <TaxRateInput
                value={customRate}
                onChange={setCustomRate}
                label="Custom Tax Rate"
              />
              <Button onClick={handleCustomCalculation} className="w-full">
                Calculate with Custom Rate
              </Button>
            </div>
            <div>
              {customResult && (
                <TaxDisplay calculation={customResult} variant="detailed" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
