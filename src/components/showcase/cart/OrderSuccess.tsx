import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, MessageCircle, Copy, Phone, Timer, X, ShoppingBag } from 'lucide-react';
import { OrderResult } from '@/stores/showcaseCartStore';
import { formatCurrency } from '@/lib/taxUtils';
import { toast } from 'sonner';
import { useWhatsAppRedirect } from '@/hooks/useWhatsAppRedirect';

interface OrderSuccessProps {
  orderResult: OrderResult;
  storeCurrency: string;
  onClose: () => void;
  onNewOrder: () => void;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

export function OrderSuccess({
  orderResult,
  storeCurrency,
  onClose,
  onNewOrder,
  themeColors
}: OrderSuccessProps) {
  const [copied, setCopied] = useState(false);

  const getWhatsAppMessage = () => {
    return `Hi! I've placed an order on your showcase:

Order Code: ${orderResult.orderCode}
Total: ${formatPrice(orderResult.total)}

Please confirm my order. Thank you!`;
  };

  // Auto-redirect to WhatsApp
  const { countdown, redirected, redirectNow, cancelRedirect, progress } = useWhatsAppRedirect({
    whatsappNumber: orderResult.whatsappNumber,
    message: getWhatsAppMessage(),
    enabled: !!orderResult.whatsappNumber,
    delay: 3,
  });

  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  const handleCopyOrderCode = async () => {
    try {
      await navigator.clipboard.writeText(orderResult.orderCode);
      setCopied(true);
      toast.success('Order code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy order code');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Order Placed Successfully!
      </h2>
      <p className="text-gray-600 mb-6">
        Your order has been submitted to {orderResult.storeName}
      </p>

      {/* Order Code Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 mb-2">Your Order Code:</div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span 
              className="text-2xl font-bold tracking-wider"
              style={{ color: themeColors.primary }}
            >
              {orderResult.orderCode}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyOrderCode}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          {copied && (
            <div className="text-xs text-green-600">Copied!</div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardContent className="p-4 text-left">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Store:</span>
              <span className="font-medium">{orderResult.storeName}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant="secondary" className="text-xs">
                {orderResult.status.charAt(0).toUpperCase() + orderResult.status.slice(1)}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(orderResult.subtotal)}</span>
            </div>
            
            {orderResult.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span>{formatPrice(orderResult.taxAmount)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span style={{ color: themeColors.primary }}>
                {formatPrice(orderResult.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="text-sm text-blue-800">
          <strong>Important:</strong> Save your order code! The store owner will use this code to find and confirm your order.
        </div>
      </div>

      {/* Auto-redirect Notice */}
      {orderResult.whatsappNumber && !redirected && countdown > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
              <Timer className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-green-800">
                Redirecting to WhatsApp in {countdown}...
              </div>
              <div className="text-sm text-green-600">
                Your order details will be sent automatically
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRedirect}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2 mb-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={redirectNow}
              className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              Send Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRedirect}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Contact Actions */}
      <div className="space-y-3 mb-6">
        {orderResult.whatsappNumber && (
          <Button
            onClick={redirectNow}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {redirected ? 'Send Again via WhatsApp' : 'Send Order via WhatsApp Now'}
          </Button>
        )}

        {orderResult.storePhone && (
          <Button
            asChild
            variant="outline"
            className="w-full"
            style={{ borderColor: themeColors.primary, color: themeColors.primary }}
          >
            <a href={`tel:${orderResult.storePhone}`}>
              <Phone className="w-4 h-4 mr-2" />
              Call Store
            </a>
          </Button>
        )}
      </div>

      {/* WhatsApp Status */}
      {orderResult.whatsappNumber && redirected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              WhatsApp Opened
            </span>
          </div>
          <p className="text-xs text-green-600">
            Your order details have been sent to WhatsApp. The store will contact you soon!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onNewOrder}
          className="flex-1"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Shop More
        </Button>
        
        <Button
          onClick={onClose}
          className="flex-1"
          style={{ backgroundColor: themeColors.primary }}
        >
          Done
        </Button>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-gray-500 mt-4">
        The store will contact you soon to confirm your order and arrange payment/delivery.
      </p>
    </div>
  );
}
