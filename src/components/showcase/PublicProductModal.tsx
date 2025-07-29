import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Phone, Mail, MapPin, ExternalLink, Share2, MessageCircle, ShoppingCart, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/taxUtils";
import { useShowcaseCartStore } from "@/stores/showcaseCartStore";
import { ProductVariantSelector, ProductVariant } from "./cart/ProductVariantSelector";
import { supabase } from "@/integrations/supabase/client";

interface PublicProduct {
  product_id: string;
  product_name: string;
  product_description?: string;
  public_description?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_name?: string;
  category_id?: string;
  show_stock_publicly: boolean;
  show_price_publicly: boolean;
  created_at: string;
  sku?: string;
}

import { ShowcaseTheme, ShowcaseContactInfo } from '@/stores/publicShowcaseStore';

interface PublicStore {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  store_code?: string;
  showcase_theme?: ShowcaseTheme;
  showcase_description?: string;
  showcase_logo_url?: string;
  showcase_banner_url?: string;
  showcase_contact_info?: ShowcaseContactInfo;
  showcase_seo_title?: string;
  showcase_seo_description?: string;
  product_count: number;
  category_count: number;
}

interface PublicProductModalProps {
  product: PublicProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeInfo: PublicStore;
  themeColors: {
    primary: string;
    secondary: string;
  };
  storeCurrency?: string;
}

export function PublicProductModal({
  product,
  open,
  onOpenChange,
  storeInfo,
  themeColors,
  storeCurrency = 'USD'
}: PublicProductModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [variantAdjustments, setVariantAdjustments] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const { addToCart, setStoreInfo } = useShowcaseCartStore();

  // Set store info when component mounts
  useEffect(() => {
    if (storeInfo) {
      const taxRate = 0; // You might want to get this from store settings
      setStoreInfo(storeInfo.id, storeCurrency, taxRate);
    }
  }, [storeInfo, storeCurrency, setStoreInfo]);

  // Load product variants when modal opens
  useEffect(() => {
    if (open && product.product_id) {
      loadProductVariants();
    }
  }, [open, product.product_id]);

  // Reset state when product changes
  useEffect(() => {
    setSelectedVariants({});
    setVariantAdjustments(0);
    setQuantity(1);
  }, [product.product_id]);

  const loadProductVariants = async () => {
    try {
      setIsLoadingVariants(true);
      // Type assertion to work around outdated Supabase types
      const { data, error } = await supabase
        .from('product_variants' as any)
        .select('*')
        .eq('product_id', product.product_id)
        .eq('is_active', true);

      if (error) throw error;

      const formattedVariants: ProductVariant[] = (data || []).map((variant: any) => ({
        id: variant.id,
        type: variant.variant_type as 'color' | 'size' | 'style',
        name: variant.variant_name,
        value: variant.variant_value,
        priceAdjustment: variant.price_adjustment || 0,
        stockQuantity: variant.stock_quantity || 0,
        isActive: variant.is_active
      }));

      setVariants(formattedVariants);
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleVariantChange = (type: string, value: string, _priceAdjustment: number) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }));

    // Recalculate total variant adjustments
    const newVariants = { ...selectedVariants, [type]: value };
    let totalAdjustment = 0;
    Object.entries(newVariants).forEach(([variantType, variantValue]) => {
      const variant = variants.find(v => v.type === variantType && v.value === variantValue);
      if (variant) {
        totalAdjustment += variant.priceAdjustment;
      }
    });
    setVariantAdjustments(totalAdjustment);
  };

  const handleAddToCart = () => {
    addToCart(
      product.product_id,
      product.product_name,
      product.price,
      product.stock_quantity,
      selectedVariants,
      variantAdjustments,
      product.image_url,
      quantity
    );

    // Close modal after adding to cart
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 5) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const shouldShowContactInfo = (type: 'phone' | 'email' | 'address') => {
    const contactInfo = storeInfo?.showcase_contact_info;
    if (!contactInfo) return true;

    switch (type) {
      case 'phone': return contactInfo.showPhone !== false;
      case 'email': return contactInfo.showEmail !== false;
      case 'address': return contactInfo.showAddress !== false;
      default: return true;
    }
  };

  const getWhatsAppLink = (phone: string, message: string) => {
    // Clean phone number - remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp link
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  const getWhatsAppMessage = () => {
    const productName = product.product_name;
    const storeName = storeInfo.name;
    const priceText = product.show_price_publicly ? ` (${formatPrice(product.price)})` : '';

    return `Hi! I'm interested in "${productName}"${priceText} from ${storeName}. Is this item available?`;
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.product_name} - ${storeInfo.name}`,
      text: product.public_description || product.product_description || `Check out ${product.product_name} at ${storeInfo.name}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  const stockStatus = getStockStatus(product.stock_quantity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl">{product.product_name}</DialogTitle>
          <DialogDescription className="text-sm">
            {product.public_description || product.product_description || "View product details and add to cart"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
            
            {/* Share Button */}
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Product
            </Button>
          </div>
          
          {/* Product Details */}
          <div className="space-y-4">
            {/* SKU and Category */}
            <div className="space-y-2">
              {product.sku && (
                <div className="text-xs text-muted-foreground">
                  SKU: <span className="font-mono">{product.sku}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {product.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {product.category_name}
                  </Badge>
                )}
                {product.show_stock_publicly && (
                  <Badge variant={stockStatus.variant} className="text-xs">
                    {stockStatus.label}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Price */}
            {product.show_price_publicly && (
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                  {formatPrice(product.price + variantAdjustments)}
                </div>
                {variantAdjustments !== 0 && (
                  <div className="text-xs text-muted-foreground">
                    Base: {formatPrice(product.price)}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {(product.public_description || product.product_description) && (
              <div className="space-y-1">
                <h3 className="font-medium text-sm">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.public_description || product.product_description}
                </p>
              </div>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Options</h3>
                <ProductVariantSelector
                  variants={variants}
                  selectedVariants={selectedVariants}
                  onVariantChange={handleVariantChange}
                  basePrice={product.price}
                  storeCurrency={storeCurrency}
                  themeColors={themeColors}
                />
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock_quantity > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quantity" className="font-medium text-sm">Quantity</Label>
                  {product.show_stock_publicly && (
                    <span className="text-xs text-muted-foreground">
                      {product.stock_quantity} available
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>

                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(product.stock_quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-14 text-center text-sm h-8"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    style={
                      quantity < product.stock_quantity
                        ? { borderColor: themeColors.primary, color: themeColors.primary }
                        : {}
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            {product.stock_quantity > 0 && (
              <Button
                className="w-full"
                onClick={handleAddToCart}
                style={{ backgroundColor: themeColors.primary }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            )}

            <Separator />

            {/* Store Contact Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Contact Store</h3>
              <div className="space-y-3">
                {shouldShowContactInfo('phone') && storeInfo.phone && (
                  <>
                    <a
                      href={`tel:${storeInfo.phone}`}
                      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Phone className="w-4 h-4" style={{ color: themeColors.primary }} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Call Store</div>
                        <div className="text-xs text-muted-foreground">{storeInfo.phone}</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>

                    <a
                      href={getWhatsAppLink(storeInfo.phone, getWhatsAppMessage())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors bg-green-50 border-green-200 hover:bg-green-100"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-green-800">WhatsApp Store</div>
                        <div className="text-xs text-green-600">Ask about this product</div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-green-600" />
                    </a>
                  </>
                )}
                
                {shouldShowContactInfo('email') && storeInfo.email && (
                  <a 
                    href={`mailto:${storeInfo.email}?subject=Inquiry about ${product.product_name}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Mail className="w-5 h-5" style={{ color: themeColors.primary }} />
                    <div>
                      <div className="font-medium">Email Store</div>
                      <div className="text-sm text-muted-foreground">{storeInfo.email}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                  </a>
                )}
                
                {shouldShowContactInfo('address') && storeInfo.address && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <MapPin className="w-5 h-5" style={{ color: themeColors.primary }} />
                    <div>
                      <div className="font-medium">Visit Store</div>
                      <div className="text-sm text-muted-foreground">{storeInfo.address}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Call to Action */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Interested in this product? Contact {storeInfo.name} directly for more information, 
                  availability, or to make a purchase.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {shouldShowContactInfo('phone') && storeInfo.phone && (
                    <>
                      <Button
                        asChild
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <a
                          href={getWhatsAppLink(storeInfo.phone, getWhatsAppMessage())}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp Now
                        </a>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                        style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                      >
                        <a href={`tel:${storeInfo.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call Store
                        </a>
                      </Button>
                    </>
                  )}

                  {shouldShowContactInfo('email') && storeInfo.email && (
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1"
                      style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                    >
                      <a href={`mailto:${storeInfo.email}?subject=Inquiry about ${product.product_name}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
