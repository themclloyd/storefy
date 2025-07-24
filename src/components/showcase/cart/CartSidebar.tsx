import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, X, Package, User, Phone, ArrowLeft } from 'lucide-react';
import { useShowcaseCartStore } from '@/stores/showcaseCartStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { toast } from 'sonner';

interface CartSidebarProps {
  storeIdentifier: string;
  storeName: string;
  storePhone?: string;
  whatsappNumber?: string;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

export function CartSidebar({
  storeIdentifier,
  storeName,
  storePhone,
  whatsappNumber,
  themeColors
}: CartSidebarProps) {
  // Customer information state
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerErrors, setCustomerErrors] = useState<{name?: string; phone?: string}>({});
  
  const {
    items,
    isOpen,
    storeCurrency,
    isCreatingOrder,
    openCart,
    closeCart,
    getCartSummary,
    getItemCount,
    createOrder,
    getWhatsAppMessage,
    getWhatsAppLink
  } = useShowcaseCartStore();

  const cartSummary = getCartSummary();
  const itemCount = getItemCount();

  const validateCustomerInfo = () => {
    const errors: {name?: string; phone?: string} = {};

    if (!customerName.trim()) {
      errors.name = 'Name is required';
    }

    if (!customerPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (customerPhone.trim().length < 8) {
      errors.phone = 'Please enter a valid phone number';
    }

    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    setShowCheckout(true);
  };

  const handleCreateOrder = async () => {
    if (items.length === 0) return;

    if (!validateCustomerInfo()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const orderResult = await createOrder(storeIdentifier, {
        name: customerName.trim(),
        phone: customerPhone.trim()
      });

      if (orderResult) {
        // Show success notification
        toast.success(`Order #${orderResult.orderNumber} created successfully!`, {
          description: "You'll be redirected to WhatsApp to complete your order.",
          duration: 3000,
        });

        // Create WhatsApp message with order details
        const whatsappMessage = getWhatsAppMessage(orderResult);
        const whatsappLink = getWhatsAppLink(whatsappNumber || storePhone || '', whatsappMessage);

        // Redirect to WhatsApp after a short delay
        setTimeout(() => {
          window.open(whatsappLink, '_blank');
        }, 1000);

        // Reset form and close cart
        setCustomerName('');
        setCustomerPhone('');
        setShowCheckout(false);
        closeCart();
      }
    } catch (error) {
      toast.error('Failed to create order. Please try again.');
    }
  };



  return (
    <>
      {/* Cart Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={openCart}
        className="relative"
        style={{ borderColor: themeColors.primary, color: themeColors.primary }}
      >
        <ShoppingCart className="w-4 h-4" />
        {itemCount > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            style={{ backgroundColor: themeColors.primary }}
          >
            {itemCount}
          </Badge>
        )}
      </Button>

      {/* Cart Sidebar */}
      <Sheet open={isOpen} onOpenChange={closeCart}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: themeColors.primary }} />
                Shopping Cart
                {itemCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={closeCart}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {items.length === 0 ? (
            // Empty Cart State
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some products from {storeName} to get started
              </p>
              <Button onClick={closeCart} style={{ backgroundColor: themeColors.primary }}>
                Continue Shopping
              </Button>
            </div>
          ) : showCheckout ? (
            // Checkout Form
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCheckout(false)}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Button>
                <h3 className="text-lg font-semibold">Your Information</h3>
                <p className="text-sm text-muted-foreground">
                  Please provide your details to complete the order
                </p>
              </div>

              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {/* Customer Name */}
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (customerErrors.name) {
                          setCustomerErrors(prev => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="Enter your full name"
                      className={customerErrors.name ? 'border-red-300' : ''}
                    />
                    {customerErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{customerErrors.name}</p>
                    )}
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (customerErrors.phone) {
                          setCustomerErrors(prev => ({ ...prev, phone: undefined }));
                        }
                      }}
                      placeholder="Enter your phone number"
                      className={customerErrors.phone ? 'border-red-300' : ''}
                    />
                    {customerErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{customerErrors.phone}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <CartSummary
                      summary={cartSummary}
                      storeCurrency={storeCurrency}
                    />
                  </div>
                </div>
              </ScrollArea>

              {/* Checkout Actions */}
              <div className="border-t p-6">
                <Button
                  onClick={handleCreateOrder}
                  className="w-full"
                  style={{ backgroundColor: themeColors.primary }}
                  disabled={isCreatingOrder || !whatsappNumber && !storePhone}
                >
                  {isCreatingOrder ? 'Creating Order...' : 'Complete Order'}
                </Button>

                {(!whatsappNumber && !storePhone) && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Store contact information not available
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Cart Items and Summary
            <div className="flex-1 flex flex-col">
              {/* Cart Items */}
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      storeCurrency={storeCurrency}
                      themeColors={themeColors}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 pt-4 border-t">
                {/* Cart Summary */}
                <CartSummary
                  summary={cartSummary}
                  storeCurrency={storeCurrency}
                  className="mb-4"
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleProceedToCheckout}
                    className="w-full"
                    style={{ backgroundColor: themeColors.primary }}
                    disabled={isCreatingOrder}
                  >
                    Proceed to Checkout
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Secure checkout • Your information is protected
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
