import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface ProductVariant {
  type: 'color' | 'size' | 'style';
  name: string;
  value: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string; // Unique cart item ID (product_id + variants hash)
  productId: string;
  productName: string;
  productImage?: string;
  basePrice: number;
  quantity: number;
  selectedVariants: Record<string, string>; // { color: 'red', size: 'M' }
  variantAdjustments: number; // Total price adjustment from variants
  totalPrice: number; // (basePrice + variantAdjustments) * quantity
  stockQuantity: number;
  maxQuantity: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface OrderResult {
  orderId: string;
  orderCode: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  storeName: string;
  storePhone?: string;
  whatsappNumber?: string;
}

interface ShowcaseCartState {
  // Cart state
  items: CartItem[];
  isOpen: boolean;
  
  // Store info
  storeId: string | null;
  storeCurrency: string;
  storeTaxRate: number;
  
  // Customer info
  customerInfo: CustomerInfo | null;
  
  // Loading states
  isLoading: boolean;
  isCreatingOrder: boolean;
}

interface ShowcaseCartActions {
  // Cart management
  addToCart: (
    productId: string,
    productName: string,
    basePrice: number,
    stockQuantity: number,
    selectedVariants?: Record<string, string>,
    variantAdjustments?: number,
    productImage?: string,
    quantity?: number
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Cart UI
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Store setup
  setStoreInfo: (storeId: string, currency: string, taxRate: number) => void;
  
  // Customer info
  setCustomerInfo: (info: CustomerInfo) => void;
  
  // Order creation
  createOrder: (storeIdentifier: string) => Promise<OrderResult | null>;
  
  // Calculations
  getCartSummary: () => CartSummary;
  getItemCount: () => number;
  
  // Utilities
  generateCartItemId: (productId: string, variants: Record<string, string>) => string;
  getWhatsAppMessage: (orderResult: OrderResult) => string;
  getWhatsAppLink: (phone: string, message: string) => string;
}

type ShowcaseCartStore = ShowcaseCartState & ShowcaseCartActions;

const initialState: ShowcaseCartState = {
  items: [],
  isOpen: false,
  storeId: null,
  storeCurrency: 'USD',
  storeTaxRate: 0,
  customerInfo: null,
  isLoading: false,
  isCreatingOrder: false,
};

export const useShowcaseCartStore = create<ShowcaseCartStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Generate unique cart item ID based on product and variants
        generateCartItemId: (productId: string, variants: Record<string, string>) => {
          const variantString = Object.keys(variants)
            .sort()
            .map(key => `${key}:${variants[key]}`)
            .join('|');
          return `${productId}${variantString ? `_${btoa(variantString)}` : ''}`;
        },

        // Add item to cart
        addToCart: (
          productId: string,
          productName: string,
          basePrice: number,
          stockQuantity: number,
          selectedVariants = {},
          variantAdjustments = 0,
          productImage = '',
          quantity = 1
        ) => {
          const { generateCartItemId } = get();
          const itemId = generateCartItemId(productId, selectedVariants);
          
          set((state) => {
            const existingItemIndex = state.items.findIndex(item => item.id === itemId);
            
            if (existingItemIndex >= 0) {
              // Update existing item quantity
              const existingItem = state.items[existingItemIndex];
              const newQuantity = Math.min(
                existingItem.quantity + quantity,
                existingItem.maxQuantity
              );
              
              const updatedItems = [...state.items];
              updatedItems[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                totalPrice: (existingItem.basePrice + existingItem.variantAdjustments) * newQuantity
              };
              
              return { items: updatedItems };
            } else {
              // Add new item
              const newItem: CartItem = {
                id: itemId,
                productId,
                productName,
                productImage,
                basePrice,
                quantity: Math.min(quantity, stockQuantity),
                selectedVariants,
                variantAdjustments,
                totalPrice: (basePrice + variantAdjustments) * Math.min(quantity, stockQuantity),
                stockQuantity,
                maxQuantity: stockQuantity
              };
              
              return { items: [...state.items, newItem] };
            }
          }, false, 'addToCart');
          
          toast.success(`${productName} added to cart`);
        },

        // Remove item from cart
        removeFromCart: (itemId: string) => {
          set((state) => ({
            items: state.items.filter(item => item.id !== itemId)
          }), false, 'removeFromCart');
          
          toast.success('Item removed from cart');
        },

        // Update item quantity
        updateQuantity: (itemId: string, quantity: number) => {
          if (quantity <= 0) {
            get().removeFromCart(itemId);
            return;
          }
          
          set((state) => {
            const updatedItems = state.items.map(item => {
              if (item.id === itemId) {
                const newQuantity = Math.min(quantity, item.maxQuantity);
                return {
                  ...item,
                  quantity: newQuantity,
                  totalPrice: (item.basePrice + item.variantAdjustments) * newQuantity
                };
              }
              return item;
            });
            
            return { items: updatedItems };
          }, false, 'updateQuantity');
        },

        // Clear cart
        clearCart: () => {
          set({ items: [] }, false, 'clearCart');
        },

        // Cart UI controls
        openCart: () => set({ isOpen: true }, false, 'openCart'),
        closeCart: () => set({ isOpen: false }, false, 'closeCart'),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen }), false, 'toggleCart'),

        // Set store information
        setStoreInfo: (storeId: string, currency: string, taxRate: number) => {
          set({
            storeId,
            storeCurrency: currency,
            storeTaxRate: taxRate
          }, false, 'setStoreInfo');
        },

        // Set customer information
        setCustomerInfo: (info: CustomerInfo) => {
          set({ customerInfo: info }, false, 'setCustomerInfo');
        },

        // Get cart summary
        getCartSummary: () => {
          const { items, storeTaxRate } = get();
          
          const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
          const taxAmount = subtotal * storeTaxRate;
          const total = subtotal + taxAmount;
          
          return {
            itemCount,
            subtotal,
            taxAmount,
            total
          };
        },

        // Get total item count
        getItemCount: () => {
          const { items } = get();
          return items.reduce((sum, item) => sum + item.quantity, 0);
        },

        // Create order
        createOrder: async (storeIdentifier: string, customerData?: { name: string; phone: string }) => {
          const { items, getCartSummary } = get();

          if (items.length === 0) {
            toast.error('Cart is empty');
            return null;
          }

          if (!storeIdentifier) {
            toast.error('Store identifier is required');
            return null;
          }

          if (!customerData?.name || !customerData?.phone) {
            toast.error('Customer name and phone are required');
            return null;
          }

          try {
            set({ isCreatingOrder: true }, false, 'createOrder:start');

            // Prepare order items for the RPC call
            const orderItems = items.map(item => ({
              product_id: item.productId,
              quantity: item.quantity,
              variants: item.selectedVariants
            }));

            // Call the RPC function to create the order
            const { data, error } = await supabase.rpc('create_public_order', {
              store_identifier: storeIdentifier,
              customer_data: customerData,
              order_items: orderItems
            });

            if (error) throw error;
            
            const orderResult: OrderResult = {
              orderId: data.order_id,
              orderCode: data.order_code,
              subtotal: data.subtotal,
              taxAmount: data.tax_amount,
              total: data.total,
              status: data.status,
              storeName: data.store_name,
              storePhone: data.store_phone,
              whatsappNumber: data.whatsapp_number
            };
            
            // Clear cart after successful order
            get().clearCart();
            get().closeCart();
            
            toast.success(`Order ${orderResult.orderCode} created successfully!`);
            
            return orderResult;
            
          } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Failed to create order. Please try again.');
            return null;
          } finally {
            set({ isCreatingOrder: false }, false, 'createOrder:end');
          }
        },

        // Generate WhatsApp message
        getWhatsAppMessage: (orderResult: OrderResult) => {
          const { storeCurrency } = get();
          
          const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: storeCurrency
            }).format(amount);
          };
          
          return `Hi! I've placed an order on your showcase:

Order Code: ${orderResult.orderCode}
Total: ${formatCurrency(orderResult.total)}

Please confirm my order. Thank you!`;
        },

        // Generate WhatsApp link
        getWhatsAppLink: (phone: string, message: string) => {
          const cleanPhone = phone.replace(/\D/g, '');
          const encodedMessage = encodeURIComponent(message);
          return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        },
      }),
      {
        name: 'showcase-cart-storage',
        partialize: (state) => ({
          items: state.items,
          customerInfo: state.customerInfo,
          storeId: state.storeId,
          storeCurrency: state.storeCurrency,
          storeTaxRate: state.storeTaxRate,
        }),
      }
    ),
    { name: 'showcase-cart-store' }
  )
);
