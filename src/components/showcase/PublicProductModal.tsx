import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Phone, Mail, MapPin, ExternalLink, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/taxUtils";

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
}

interface PublicStore {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  store_code?: string;
  showcase_theme?: any;
  showcase_description?: string;
  showcase_logo_url?: string;
  showcase_banner_url?: string;
  showcase_contact_info?: any;
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.product_name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="space-y-6">
            {/* Category and Stock */}
            <div className="flex flex-wrap gap-2">
              {product.category_name && (
                <Badge variant="outline">
                  {product.category_name}
                </Badge>
              )}
              {product.show_stock_publicly && (
                <Badge variant={stockStatus.variant}>
                  {stockStatus.label}
                </Badge>
              )}
            </div>
            
            {/* Price */}
            {product.show_price_publicly && (
              <div className="text-3xl font-bold" style={{ color: themeColors.primary }}>
                {formatPrice(product.price)}
              </div>
            )}
            
            {/* Description */}
            {(product.public_description || product.product_description) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.public_description || product.product_description}
                </p>
              </div>
            )}
            
            {/* Stock Information */}
            {product.show_stock_publicly && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Availability</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.label}
                  </Badge>
                  {product.stock_quantity > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {product.stock_quantity} units available
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <Separator />
            
            {/* Store Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Store</h3>
              <div className="space-y-3">
                {shouldShowContactInfo('phone') && storeInfo.phone && (
                  <>
                    <a
                      href={`tel:${storeInfo.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Phone className="w-5 h-5" style={{ color: themeColors.primary }} />
                      <div>
                        <div className="font-medium">Call Store</div>
                        <div className="text-sm text-muted-foreground">{storeInfo.phone}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
                    </a>

                    <a
                      href={getWhatsAppLink(storeInfo.phone, getWhatsAppMessage())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors bg-green-50 border-green-200 hover:bg-green-100"
                    >
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800">WhatsApp Store</div>
                        <div className="text-sm text-green-600">Send instant message about this product</div>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto text-green-600" />
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
