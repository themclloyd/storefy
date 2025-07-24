import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import { CartSummary } from './CartSummary';
import { OrderSuccess } from './OrderSuccess';
import { CartSummary as CartSummaryType, CustomerInfo, OrderResult } from '@/stores/showcaseCartStore';
import { useShowcaseCartStore } from '@/stores/showcaseCartStore';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number is required for WhatsApp contact'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  cartSummary: CartSummaryType;
  storeCurrency: string;
  onSubmit: (customerInfo: CustomerInfo) => Promise<OrderResult | null>;
  isLoading: boolean;
  onClose: () => void;
  onNewOrder: () => void;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

export function CheckoutForm({
  cartSummary,
  storeCurrency,
  onSubmit,
  isLoading,
  onClose,
  onNewOrder,
  themeColors
}: CheckoutFormProps) {
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const { setCustomerInfo } = useShowcaseCartStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange'
  });

  const handleFormSubmit = async (data: CheckoutFormData) => {
    const customerInfo: CustomerInfo = {
      name: data.name,
      phone: data.phone,
    };

    // Save customer info to store
    setCustomerInfo(customerInfo);

    try {
      const result = await onSubmit(customerInfo);
      if (result) {
        setOrderResult(result);

        // Show success message briefly, then redirect to WhatsApp
        toast.success(`Order ${result.orderCode} created! Redirecting to WhatsApp...`, {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  // If order is complete, show success message
  if (orderResult) {
    return (
      <OrderSuccess
        orderResult={orderResult}
        storeCurrency={storeCurrency}
        onClose={onClose}
        onNewOrder={onNewOrder}
        themeColors={themeColors}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 px-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: themeColors.primary }} />
              Customer Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter your full name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="Enter your WhatsApp number"
                  type="tel"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  📱 We'll contact you on WhatsApp with this number
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-medium mb-3">Order Summary</h3>
            <CartSummary
              summary={cartSummary}
              storeCurrency={storeCurrency}
              showItemCount={true}
            />
          </div>
        </form>
      </ScrollArea>

      {/* Submit Button */}
      <div className="p-6 pt-4 border-t">
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          disabled={!isValid || isLoading}
          className="w-full"
          style={{ backgroundColor: themeColors.primary }}
        >
          {isLoading ? 'Placing Order...' : 'Place Order'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          By placing this order, you agree to contact the store for confirmation and payment.
        </p>
      </div>
    </div>
  );
}
