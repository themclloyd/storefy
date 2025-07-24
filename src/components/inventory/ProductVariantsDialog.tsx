import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, Save, X, Palette, Ruler, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/taxUtils';

interface ProductVariant {
  id?: string;
  variant_type: 'color' | 'size' | 'style';
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
  sku_suffix?: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
}

interface ProductVariantsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function ProductVariantsDialog({
  product,
  open,
  onOpenChange,
  onUpdate
}: ProductVariantsDialogProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    variant_type: 'color',
    variant_name: '',
    variant_value: '',
    price_adjustment: 0,
    stock_quantity: 0,
    is_active: true
  });

  useEffect(() => {
    if (open && product) {
      loadVariants();
    }
  }, [open, product]);

  const loadVariants = async () => {
    if (!product) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('variant_type', { ascending: true });

      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
      toast.error('Failed to load product variants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = async () => {
    if (!product || !newVariant.variant_name || !newVariant.variant_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          variant_type: newVariant.variant_type,
          variant_name: newVariant.variant_name,
          variant_value: newVariant.variant_value,
          price_adjustment: newVariant.price_adjustment || 0,
          stock_quantity: newVariant.stock_quantity || 0,
          sku_suffix: newVariant.sku_suffix || '',
          is_active: newVariant.is_active !== false
        });

      if (error) throw error;

      toast.success('Variant added successfully');
      setNewVariant({
        variant_type: 'color',
        variant_name: '',
        variant_value: '',
        price_adjustment: 0,
        stock_quantity: 0,
        is_active: true
      });
      loadVariants();
    } catch (error) {
      console.error('Error adding variant:', error);
      toast.error('Failed to add variant');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (variantId: string, updates: Partial<ProductVariant>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', variantId);

      if (error) throw error;

      toast.success('Variant updated successfully');
      setEditingId(null);
      loadVariants();
    } catch (error) {
      console.error('Error updating variant:', error);
      toast.error('Failed to update variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      toast.success('Variant deleted successfully');
      loadVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Failed to delete variant');
    } finally {
      setSaving(false);
    }
  };

  const getVariantIcon = (type: string) => {
    switch (type) {
      case 'color': return <Palette className="w-4 h-4" />;
      case 'size': return <Ruler className="w-4 h-4" />;
      case 'style': return <Sparkles className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price, product?.currency || 'USD');
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Product Variants - {product.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {/* Add New Variant */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Variant
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="variant-type">Type</Label>
                <Select
                  value={newVariant.variant_type}
                  onValueChange={(value: 'color' | 'size' | 'style') => 
                    setNewVariant(prev => ({ ...prev, variant_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="variant-name">Name</Label>
                <Input
                  id="variant-name"
                  value={newVariant.variant_name}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, variant_name: e.target.value }))}
                  placeholder="e.g., Red, Large, Premium"
                />
              </div>

              <div>
                <Label htmlFor="variant-value">Value</Label>
                <Input
                  id="variant-value"
                  value={newVariant.variant_value}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, variant_value: e.target.value }))}
                  placeholder="e.g., red, L, premium"
                />
              </div>

              <div>
                <Label htmlFor="price-adjustment">Price Adjustment</Label>
                <Input
                  id="price-adjustment"
                  type="number"
                  step="0.01"
                  value={newVariant.price_adjustment}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price_adjustment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="stock-quantity">Stock Quantity</Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="0"
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleAddVariant}
                  disabled={saving || !newVariant.variant_name || !newVariant.variant_value}
                  className="w-full"
                >
                  {saving ? 'Adding...' : 'Add Variant'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Existing Variants */}
          <div className="flex-1 overflow-hidden">
            <h3 className="font-medium mb-4">Existing Variants ({variants.length})</h3>
            
            {loading ? (
              <div className="text-center py-8">Loading variants...</div>
            ) : variants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No variants added yet. Add your first variant above.
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getVariantIcon(variant.variant_type)}
                          <div>
                            <div className="font-medium">
                              {variant.variant_name}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {variant.variant_type}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Value: {variant.variant_value} • 
                              Stock: {variant.stock_quantity} • 
                              Price: {formatPrice(product.price + variant.price_adjustment)}
                              {variant.price_adjustment !== 0 && (
                                <span className="ml-1">
                                  ({variant.price_adjustment > 0 ? '+' : ''}{formatPrice(variant.price_adjustment)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={variant.is_active ? "default" : "secondary"}>
                            {variant.is_active ? "Active" : "Inactive"}
                          </Badge>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVariant(variant.id!)}
                            disabled={saving}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onUpdate && (
            <Button onClick={onUpdate}>
              Refresh Product
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
