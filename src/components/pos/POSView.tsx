import { useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ShoppingCart, Plus, Minus, Trash2, Percent, DollarSign,
  CreditCard, Search, Loader2, User, UserPlus, History,
  Grid3X3, List, LayoutGrid, X
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import {
  usePOSStore,
  useCart,
  useProducts,
  useCustomers,
  type Product,
  type Customer
} from "@/stores/posStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useTax } from "@/hooks/useTax";
import { TaxDisplay } from "@/components/common/TaxDisplay";
import { ReceiptDialog } from "./ReceiptDialog";
import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { useAnalytics } from "@/hooks/useAnalyticsTracking";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";
import { ResponsiveSearch, QuickSearch } from "@/components/ui/responsive-search";
import { POSCartSection } from "./cart/POSCartSection";
import { QuickFilterButtons } from "@/components/ui/responsive-filters";
import { useScreenSize } from "@/hooks/use-mobile";
import { responsiveGrid, responsiveSpacing, touchFriendly } from "@/lib/responsive-utils";
import { cn } from "@/lib/utils";

// Interfaces are now imported from the POS store

export function POSView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { getPaymentOptions, isValidPaymentMethod, _formatPaymentMethodDisplay } = usePaymentMethods();
  const { calculateItemsTax, formatCurrency } = useTax();
  const { trackTransaction, trackSearch, trackFeatureUsage } = useAnalytics();

  // Zustand store state - using only individual property selectors to avoid infinite loops
  // Cart state - use simple selectors where possible
  const cart = useCart();
  const addToCart = usePOSStore(state => state.addToCart);
  const updateQuantity = usePOSStore(state => state.updateQuantity);
  const removeFromCart = usePOSStore(state => state.removeFromCart);
  const clearCart = usePOSStore(state => state.clearCart);
  const getCartQuantity = usePOSStore(state => state.getCartQuantity);

  // Product state
  const products = useProducts();
  const searchTerm = usePOSStore(state => state.searchTerm);
  const selectedCategory = usePOSStore(state => state.selectedCategory);
  const viewMode = usePOSStore(state => state.viewMode);
  const categories = usePOSStore(state => state.categories);
  const loading = usePOSStore(state => state.loading);
  const setSearchTerm = usePOSStore(state => state.setSearchTerm);
  const setSelectedCategory = usePOSStore(state => state.setSelectedCategory);
  const setViewMode = usePOSStore(state => state.setViewMode);
  const setCategories = usePOSStore(state => state.setCategories);
  const setLoading = usePOSStore(state => state.setLoading);

  // Customer state
  const customers = useCustomers();
  const selectedCustomer = usePOSStore(state => state.selectedCustomer);
  const customerSearchTerm = usePOSStore(state => state.customerSearchTerm);
  const showCustomerSearch = usePOSStore(state => state.showCustomerSearch);
  const setSelectedCustomer = usePOSStore(state => state.setSelectedCustomer);
  const setCustomerSearchTerm = usePOSStore(state => state.setCustomerSearchTerm);
  const setShowCustomerSearch = usePOSStore(state => state.setShowCustomerSearch);

  // Discount state
  const discountType = usePOSStore(state => state.discountType);
  const discountValue = usePOSStore(state => state.discountValue);
  const discountCode = usePOSStore(state => state.discountCode);
  const setDiscountType = usePOSStore(state => state.setDiscountType);
  const setDiscountValue = usePOSStore(state => state.setDiscountValue);
  const setDiscountCode = usePOSStore(state => state.setDiscountCode);

  // Order state
  const paymentMethod = usePOSStore(state => state.paymentMethod);
  const isProcessingOrder = usePOSStore(state => state.isProcessingOrder);
  const setPaymentMethod = usePOSStore(state => state.setPaymentMethod);
  const setIsProcessingOrder = usePOSStore(state => state.setIsProcessingOrder);

  // UI state
  const showReceipt = usePOSStore(state => state.showReceipt);
  const lastOrder = usePOSStore(state => state.lastOrder);
  const showOrderHistory = usePOSStore(state => state.showOrderHistory);
  const showAddCustomer = usePOSStore(state => state.showAddCustomer);
  const showMobileCart = usePOSStore(state => state.showMobileCart);
  const setShowReceipt = usePOSStore(state => state.setShowReceipt);
  const setLastOrder = usePOSStore(state => state.setLastOrder);
  const setShowOrderHistory = usePOSStore(state => state.setShowOrderHistory);
  const setShowAddCustomer = usePOSStore(state => state.setShowAddCustomer);
  const setShowMobileCart = usePOSStore(state => state.setShowMobileCart);

  // Tax state
  const taxCalculation = usePOSStore(state => state.taxCalculation);
  const setTaxCalculation = usePOSStore(state => state.setTaxCalculation);

  // Fetch products, categories, and customers
  useEffect(() => {
    if (currentStore?.id) {
      // Call functions directly from store to avoid dependency issues
      usePOSStore.getState().fetchProducts(currentStore.id);
      usePOSStore.getState().fetchCategories(currentStore.id);
      usePOSStore.getState().fetchCustomers(currentStore.id);
    }
  }, [currentStore?.id]); // Only depend on store ID

  // Memoized tax calculation function
  const calculateCartTax = useCallback(async () => {
    if (cart.length === 0 || !currentStore) {
      setTaxCalculation(null);
      return;
    }

    try {
      const subtotalBeforeDiscount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = discountValue ?
        (discountType === "percent" ? subtotalBeforeDiscount * (parseFloat(discountValue) / 100) : parseFloat(discountValue)) : 0;

      // Calculate tax on discounted amount
      const taxableAmount = Math.max(0, subtotalBeforeDiscount - discountAmount);
      const calculation = await calculateItemsTax([{ price: taxableAmount, quantity: 1, taxable: true }]);

      setTaxCalculation(calculation);
    } catch (error) {
      // Reset tax calculation on error
      setTaxCalculation(null);
      toast.error('Failed to calculate tax');
    }
  }, [cart, discountValue, discountType, currentStore, calculateItemsTax, setTaxCalculation]);

  // Calculate tax when dependencies change
  useEffect(() => {
    calculateCartTax();
  }, [calculateCartTax]);

  // Fetch functions are now in the POS store

  // Cart management functions are now in the POS store

  // Enhanced addToCart with analytics tracking
  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
    trackFeatureUsage('pos_add_to_cart', `product_${product.id}`);
  }, [addToCart, trackFeatureUsage]);

  // Helper function to check if order is ready to process
  const isOrderValid = () => {
    return cart.length > 0 && selectedCustomer && paymentMethod &&
           cart.every(item => item.quantity <= item.stock_quantity && item.stock_quantity > 0);
  };

  // Function to show validation errors when user clicks disabled button
  const showValidationErrors = (): void => {
    const validationErrors: string[] = [];

    if (cart.length === 0) {
      validationErrors.push('Add products to your cart');
    }

    if (!selectedCustomer) {
      validationErrors.push('Select a customer');
    }

    if (!paymentMethod) {
      validationErrors.push('Choose a payment method (Cash or Card)');
    }

    const stockErrors = [];
    cart.forEach(item => {
      if (item.quantity > item.stock_quantity) {
        stockErrors.push(`${item.name}: Only ${item.stock_quantity} available`);
      }
      if (item.stock_quantity <= 0) {
        stockErrors.push(`${item.name}: Out of stock`);
      }
    });

    if (stockErrors.length > 0) {
      validationErrors.push(...stockErrors);
    }

    if (validationErrors.length > 0) {
      toast.error(
        <div className="space-y-2">
          <div className="font-semibold">Complete these steps to checkout:</div>
          <ul className="text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>,
        {
          duration: 5000,
          style: {
            maxWidth: '350px',
          }
        }
      );
    }
  };

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Track product search with debouncing
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timeoutId = setTimeout(() => {
        trackSearch('product', searchTerm, filteredProducts.length);
      }, 500); // Debounce search tracking

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filteredProducts.length, trackSearch]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.includes(customerSearchTerm)
  );

  // Generate order number
  const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `ORD-${timestamp}${random}`;
  };

  // Process order
  const processOrder = async (): Promise<void> => {
    // Comprehensive validation
    const validationErrors: string[] = [];

    // 1. Validate system requirements
    if (!currentStore || !user) {
      validationErrors.push('System error - missing store or user information');
    }

    // 2. Validate cart has products
    if (cart.length === 0) {
      validationErrors.push('Cart is empty - please add products to continue');
    }

    // 3. Validate customer is selected
    if (!selectedCustomer) {
      validationErrors.push('Customer is required - please select a customer from the list');
    }

    // 4. Validate payment method is selected
    if (!paymentMethod) {
      validationErrors.push('Payment method is required - please select a payment method');
    } else if (!isValidPaymentMethod(paymentMethod)) {
      validationErrors.push('Selected payment method is not available');
    }

    // 5. Validate product stock availability
    const stockErrors = [];
    cart.forEach(item => {
      if (item.quantity > item.stock_quantity) {
        stockErrors.push(`${item.name}: Only ${item.stock_quantity} available, but ${item.quantity} requested`);
      }
      if (item.stock_quantity <= 0) {
        stockErrors.push(`${item.name}: Out of stock`);
      }
    });

    if (stockErrors.length > 0) {
      validationErrors.push(...stockErrors);
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      toast.error(
        <div className="space-y-2">
          <div className="font-semibold text-red-600">⚠️ Cannot Process Order</div>
          <div className="text-sm">Please fix the following issues:</div>
          <ul className="text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>,
        {
          duration: 8000,
          style: {
            maxWidth: '400px',
          }
        }
      );
      return;
    }

    setIsProcessingOrder(true);
    try {
      // Create order
      const orderNumber = generateOrderNumber();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: currentStore.id,
          customer_id: selectedCustomer?.id || null,
          cashier_id: user.id,
          order_number: orderNumber,
          subtotal,
          discount_amount: discountAmount,
          discount_code: discountCode || null,
          tax_amount: taxAmount,
          total,
          status: 'completed',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) {
        toast.error('Failed to create order');
        return;
      }

      // Create order items and update stock
      const orderItemsPromises = cart.map(async (item) => {
        // Insert order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          });

        if (itemError) {
          throw itemError;
        }

        // Update product stock
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock_quantity: item.stock_quantity - item.quantity,
          })
          .eq('id', item.id);

        if (stockError) {
          throw stockError;
        }
      });

      await Promise.all(orderItemsPromises);

      // Create transaction record
      const { data: transactionNumber, error: transactionNumberError } = await supabase
        .rpc('generate_transaction_number', { store_id_param: currentStore.id });

      if (transactionNumberError) {
        // Don't fail the order for this, continue without transaction number
      } else {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            store_id: currentStore.id,
            transaction_number: transactionNumber,
            transaction_type: 'sale',
            amount: total,
            payment_method: paymentMethod,
            reference_id: orderData.id,
            reference_type: 'order',
            customer_id: selectedCustomer?.id || null,
            customer_name: selectedCustomer?.name || null,
            description: `Sale - Order ${orderNumber}`,
            processed_by: user.id
          });

        if (transactionError) {
          // Don't fail the order for this, continue without transaction record
        }
      }

      // Update customer statistics if customer is selected
      if (selectedCustomer) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            total_orders: selectedCustomer.total_orders + 1,
            total_spent: selectedCustomer.total_spent + total,
          })
          .eq('id', selectedCustomer.id);

        if (customerError) {
          // Don't fail the order for this, continue without updating customer stats
        }
      }

      toast.success(`Order ${orderNumber} processed successfully!`);

      // Prepare receipt data
      const receiptData = {
        orderNumber,
        orderDate: orderData.created_at,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        })),
        subtotal,
        discountAmount,
        discountCode,
        taxAmount,
        total,
        paymentMethod,
        customer: selectedCustomer,
      };

      setLastOrder(receiptData);
      setShowReceipt(true);

      // Track successful transaction
      trackTransaction({
        amount: total,
        itemsCount: cart.length,
        paymentMethod,
        customerType: selectedCustomer?.status === 'vip' ? 'vip' :
                     selectedCustomer?.total_orders === 0 ? 'new' : 'returning'
      });

      // Reset cart and form
      clearCart();
      setDiscountValue("");
      setDiscountCode("");
      setSelectedCustomer(null);

      // Refresh products to update stock quantities
      fetchProducts();

    } catch (error) {
      toast.error('Failed to process order');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Calculate totals using tax utility - memoized for performance
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!discountValue) return 0;
    return discountType === "percent"
      ? subtotal * (parseFloat(discountValue) / 100)
      : parseFloat(discountValue);
  }, [discountValue, discountType, subtotal]);

  // Use tax calculation from hook or fallback to simple calculation
  const taxRate = useMemo(() => {
    return taxCalculation?.taxRate || currentStore?.tax_rate || 0;
  }, [taxCalculation, currentStore]);

  const taxAmount = useMemo(() => {
    return taxCalculation?.taxAmount || ((subtotal - discountAmount) * taxRate);
  }, [taxCalculation, subtotal, discountAmount, taxRate]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  return (
    <>
      <PageLayout className="h-full overflow-hidden">
        {/* Main POS Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          {/* Left Side - Products Section */}
          <div className="flex-1 lg:w-3/4 flex flex-col min-h-0 overflow-hidden">
            <PageHeader
              title="POS System"
              description="Select products to add to cart"
              icon={<ShoppingCart className="w-8 h-8 text-primary" />}
              actions={
                <div className="flex items-center gap-2">
                  {/* Mobile Cart Button */}
                  <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        className="lg:hidden relative"
                        size="sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {cart.length > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {cart.length}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-96">
                      <SheetHeader>
                        <SheetTitle>Shopping Cart</SheetTitle>
                      </SheetHeader>
                      <POSCartSection
                        cart={cart}
                        subtotal={subtotal}
                        discountAmount={discountAmount}
                        taxAmount={taxAmount}
                        total={total}
                        selectedCustomer={selectedCustomer}
                        paymentMethod={paymentMethod}
                        discountValue={discountValue}
                        discountType={discountType}
                        discountCode={discountCode}
                        isProcessingOrder={isProcessingOrder}
                        customers={customers}
                        paymentOptions={getPaymentOptions()}
                        onUpdateQuantity={updateQuantity}
                        onClearCart={clearCart}
                        onSetSelectedCustomer={setSelectedCustomer}
                        onSetPaymentMethod={setPaymentMethod}
                        onSetDiscountValue={setDiscountValue}
                        onSetDiscountType={setDiscountType}
                        onSetDiscountCode={setDiscountCode}
                        onProcessOrder={processOrder}
                        className="mt-6"
                      />
                    </SheetContent>
                  </Sheet>


                </div>
              }
            />

            {/* Products Content */}
            <div className="flex-1 flex flex-col min-h-0 space-y-4 md:space-y-6">
            {/* Products Card */}
            <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 sm:pb-6 flex-shrink-0">
            {/* Search, Filter, and View Controls in One Line */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <ResponsiveSearch
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  placeholder="Search products..."
                  compactMode={false}
                />
              </div>

              {/* Category Filter - Desktop */}
              <div className="hidden sm:block flex-shrink-0">
                <QuickFilterButtons
                  options={[
                    { label: "All Categories", value: "" },
                    ...categories.map(cat => ({
                      label: cat.name,
                      value: cat.id,
                      count: products.filter(p => p.category_id === cat.id).length
                    }))
                  ]}
                  activeValue={selectedCategory || ""}
                  onChange={(value) => setSelectedCategory(value || null)}
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-shrink-0">
                <Button
                  variant={viewMode === "compact" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("compact")}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn("flex-1 flex flex-col min-h-0 overflow-hidden", responsiveSpacing.padding.sm)}>
            {/* Category Filter - Mobile */}
            <div className="sm:hidden flex-shrink-0 mb-4">
              <QuickFilterButtons
                options={[
                  { label: "All Categories", value: "" },
                  ...categories.map(cat => ({
                    label: cat.name,
                    value: cat.id,
                    count: products.filter(p => p.category_id === cat.id).length
                  }))
                ]}
                activeValue={selectedCategory || ""}
                onChange={(value) => setSelectedCategory(value || null)}
              />
            </div>

            {/* Products Display - Scrollable */}
            <div className="flex-1 overflow-y-auto">
            {/* Products Display */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading products...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || selectedCategory ? 'No products found matching your criteria' : 'No products available'}
              </div>
            ) : (
              <>
                {/* Compact View - Enhanced Responsive Grid */}
                {viewMode === "compact" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                        onClick={() => handleAddToCart(product)}
                      >
                        {/* Product Image */}
                        <div className="aspect-square bg-muted overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) nextElement.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}>
                            <span className="text-lg sm:text-xl font-semibold text-muted-foreground">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-2 sm:p-3 flex-1 flex flex-col">
                          <h3 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-2 leading-tight flex-shrink-0">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1 flex-shrink-0">
                            {product.categories?.name || 'No category'}
                          </p>

                          {/* Stock indicator */}
                          <div className="flex items-center justify-between mb-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground truncate">{product.stock_quantity} Available</span>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs flex-shrink-0">
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>

                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-sm sm:text-base font-bold truncate">{formatCurrency(product.price)}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full touch-manipulation"
                                disabled={getCartQuantity(product.id) === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, getCartQuantity(product.id) - 1);
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-4 sm:w-6 text-center font-medium text-xs sm:text-sm">{getCartQuantity(product.id)}</span>
                              <Button
                                size="sm"
                                className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full touch-manipulation"
                                disabled={product.stock_quantity === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Grid View - Enhanced Responsive */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                        onClick={() => handleAddToCart(product)}
                      >
                        {/* Product Image */}
                        <div className="aspect-[4/3] bg-muted overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const next = e.currentTarget.nextElementSibling as HTMLElement;
                                if (next) next.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}>
                            <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-muted-foreground">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2 flex-shrink-0">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 flex-shrink-0">
                            {product.categories?.name || 'No category'} • SKU: {product.sku}
                          </p>

                          {/* Stock indicator */}
                          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
                            <span className="text-sm text-muted-foreground truncate">{product.stock_quantity} Available</span>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="flex-shrink-0">
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>

                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{formatCurrency(product.price)}</span>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full touch-manipulation"
                                disabled={getCartQuantity(product.id) === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, getCartQuantity(product.id) - 1);
                                }}
                              >
                                <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                              </Button>
                              <span className="w-6 sm:w-8 lg:w-10 text-center font-semibold text-sm sm:text-base">{getCartQuantity(product.id)}</span>
                              <Button
                                size="sm"
                                className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full touch-manipulation"
                                disabled={product.stock_quantity === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                              >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleAddToCart(product)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            {/* Product Image */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    const next = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (next) next.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}>
                                <span className="text-lg sm:text-xl font-semibold text-muted-foreground">
                                  {product.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 min-w-0 gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-1">{product.name}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 line-clamp-1">
                                  {product.categories?.name || 'No category'} • SKU: {product.sku}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm text-muted-foreground">{product.stock_quantity} Available</span>
                                  <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
                                    {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Price and Controls */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0">
                                <span className="text-lg sm:text-xl font-bold">{formatCurrency(product.price)}</span>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full touch-manipulation"
                                    disabled={getCartQuantity(product.id) === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(product.id, getCartQuantity(product.id) - 1);
                                    }}
                                  >
                                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center font-medium text-sm">{getCartQuantity(product.id)}</span>
                                  <Button
                                    size="sm"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full touch-manipulation"
                                    disabled={product.stock_quantity === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(product);
                                    }}
                                  >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
            </div> {/* End scrollable container */}
          </CardContent>
        </Card>
            </div>
          </div>

          {/* Right Side - Cart Section (Full Height) */}
          <div className="hidden lg:block lg:w-1/4 lg:flex-shrink-0 lg:min-w-[320px] lg:max-w-[400px] h-full">
            <POSCartSection
              cart={cart}
              subtotal={subtotal}
              discountAmount={discountAmount}
              taxAmount={taxAmount}
              total={total}
              selectedCustomer={selectedCustomer}
              paymentMethod={paymentMethod}
              discountValue={discountValue}
              discountType={discountType}
              discountCode={discountCode}
              isProcessingOrder={isProcessingOrder}
              customers={customers}
              paymentOptions={getPaymentOptions()}
              onUpdateQuantity={updateQuantity}
              onClearCart={clearCart}
              onSetSelectedCustomer={setSelectedCustomer}
              onSetPaymentMethod={setPaymentMethod}
              onSetDiscountValue={setDiscountValue}
              onSetDiscountType={setDiscountType}
              onSetDiscountCode={setDiscountCode}
              onProcessOrder={processOrder}
              className="h-full"
            />
          </div>
        </div>
      </PageLayout>

      {/* Receipt Dialog */}
    {lastOrder && (
      <ReceiptDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        orderNumber={lastOrder.orderNumber}
        orderDate={lastOrder.orderDate}
        storeName={currentStore?.name || 'Store'}
        storeAddress={currentStore?.address}
        storePhone={currentStore?.phone}
        customerName={lastOrder.customer?.name}
        customerEmail={lastOrder.customer?.email}
        customerPhone={lastOrder.customer?.phone}
        items={lastOrder.items}
        subtotal={lastOrder.subtotal}
        discountAmount={lastOrder.discountAmount}
        discountCode={lastOrder.discountCode}
        taxAmount={lastOrder.taxAmount}
        taxRate={taxRate}
        total={lastOrder.total}
        paymentMethod={lastOrder.paymentMethod}
        cashierName={user?.email}
      />
    )}

    {/* Order History Dialog */}
    <OrderHistoryDialog
      open={showOrderHistory}
      onOpenChange={setShowOrderHistory}
    />

    {/* Add Customer Dialog */}
    <AddCustomerDialog
      open={showAddCustomer}
      onOpenChange={setShowAddCustomer}
      onCustomerAdded={(customer) => {
        setCustomers([...customers, customer]);
        setSelectedCustomer(customer);
        toast.success(`Customer ${customer.name} added and selected`);
      }}
    />

    {/* Mobile Cart Sheet */}
    <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Cart Summary
            </SheetTitle>
            <Badge variant="secondary" className="text-xs">
              {cart.length} items
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Customer Selection - Mobile */}
          <div className="px-6 py-4 border-b space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="font-medium">Customer</span>
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{selectedCustomer.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedCustomer.email || selectedCustomer.phone || 'No contact info'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-8 px-2 text-xs flex-shrink-0 ml-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                  className="flex-1 h-10 justify-start"
                >
                  <User className="w-4 h-4 mr-2" />
                  Walk-in Customer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCustomer(true)}
                  className="h-10 px-3"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Cart Items - Mobile */}
          <div className="flex-1 overflow-hidden flex flex-col px-6">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
                </div>
              </div>
            ) : (
              <>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide py-4 flex-shrink-0">Items</h4>
                <div className="flex-1 overflow-y-auto pb-4">
                  {cart.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors">
                      {/* Product Image */}
                      <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h5 className="font-medium text-foreground text-sm truncate pr-2">{item.name}</h5>
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(item.price)} each</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      </div>
                      {index < cart.length - 1 && (
                        <div className="border-b border-border/30 my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cart Summary and Checkout - Mobile */}
          {cart.length > 0 && (
            <div className="border-t bg-background p-6 space-y-4">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {discountCode && `(${discountCode})`}</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPaymentOptions().map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          {option.type === 'cash' ? (
                            <DollarSign className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          <span>{option.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={processOrder}
                disabled={isProcessingOrder || cart.length === 0}
                className="w-full h-12 text-base font-medium"
              >
                {isProcessingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Sale - {formatCurrency(total)}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Floating Cart Button for Mobile */}
    {cart.length > 0 && (
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setShowMobileCart(true)}
          className="h-14 w-14 rounded-full shadow-lg relative"
        >
          <ShoppingCart className="w-6 h-6" />
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
          >
            {cart.length}
          </Badge>
        </Button>
      </div>
    )}
    </>
  );
}