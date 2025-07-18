import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Eye, EyeOff, DollarSign, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  is_public?: boolean;
  public_description?: string;
  show_stock_publicly?: boolean;
  show_price_publicly?: boolean;
}

interface ProductPublicVisibilityDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ProductPublicVisibilityDialog({
  product,
  open,
  onOpenChange,
  onUpdate
}: ProductPublicVisibilityDialogProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [publicDescription, setPublicDescription] = useState('');
  const [showStockPublicly, setShowStockPublicly] = useState(false);
  const [showPricePublicly, setShowPricePublicly] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product && open) {
      setIsPublic(product.is_public || false);
      setPublicDescription(product.public_description || '');
      setShowStockPublicly(product.show_stock_publicly || false);
      setShowPricePublicly(product.show_price_publicly !== false); // Default to true
    }
  }, [product, open]);

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_public: isPublic,
          public_description: publicDescription.trim() || null,
          show_stock_publicly: showStockPublicly,
          show_price_publicly: showPricePublicly,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(
        isPublic 
          ? 'Product is now visible in public showcase' 
          : 'Product removed from public showcase'
      );
      
      onUpdate();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error updating product visibility:', error);
      toast.error(error.message || 'Failed to update product visibility');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Public Showcase Settings
          </DialogTitle>
          <DialogDescription>
            Configure how this product appears in your public store showcase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Preview */}
          <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{formatPrice(product.price)}</Badge>
                <Badge variant="outline">{product.stock_quantity} in stock</Badge>
              </div>
            </div>
          </div>

          {/* Public Visibility Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="is-public" className="text-base font-medium">
                  Show in Public Showcase
                </Label>
                <Badge variant={isPublic ? "default" : "secondary"}>
                  {isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Make this product visible to customers browsing your public store
              </p>
            </div>
            <Switch
              id="is-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Public Settings (only shown when public is enabled) */}
          {isPublic && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Public Display Settings</h4>
                
                {/* Public Description */}
                <div className="space-y-2">
                  <Label htmlFor="public-description">
                    Public Description (Optional)
                  </Label>
                  <Textarea
                    id="public-description"
                    placeholder="Enter a customer-facing description (leave empty to use the regular description)"
                    value={publicDescription}
                    onChange={(e) => setPublicDescription(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This description will be shown to customers instead of the internal description
                  </p>
                </div>

                {/* Price Visibility */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <div>
                      <Label htmlFor="show-price" className="font-medium">
                        Show Price Publicly
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Display the product price to customers
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-price"
                    checked={showPricePublicly}
                    onCheckedChange={setShowPricePublicly}
                  />
                </div>

                {/* Stock Visibility */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <div>
                      <Label htmlFor="show-stock" className="font-medium">
                        Show Stock Information
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Display stock levels and availability status
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="show-stock"
                    checked={showStockPublicly}
                    onCheckedChange={setShowStockPublicly}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Customer Preview</Label>
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{product.name}</h4>
                    {showPricePublicly && (
                      <div className="font-bold text-primary">
                        {formatPrice(product.price)}
                      </div>
                    )}
                  </div>
                  
                  {(publicDescription || product.description) && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {publicDescription || product.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {showStockPublicly && (
                      <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                        {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    )}
                    {!showPricePublicly && (
                      <Badge variant="outline">Contact for Price</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
