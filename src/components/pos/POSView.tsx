import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Plus, Minus, Trash2, Percent, DollarSign, CreditCard, Search, Loader2, User, UserPlus, History, Grid3X3, List, LayoutGrid, X } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useTax } from "@/hooks/useTax";
import { TaxDisplay } from "@/components/common/TaxDisplay";
import { ReceiptDialog } from "./ReceiptDialog";
import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { useAnalytics } from "@/hooks/useAnalyticsTracking";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  stock_quantity: number;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  categories?: { name: string } | null;
  image_url: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  total_orders: number;
  total_spent: number;
}

export function POSView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const { getPaymentOptions, isValidPaymentMethod, formatPaymentMethodDisplay } = usePaymentMethods();
  const { calculateItemsTax, formatCurrency } = useTax();
  const { trackTransaction, trackSearch, trackFeatureUsage } = useAnalytics();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  // Product management state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "list">("compact");

  // Customer management state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Order processing state
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Order history state
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Add customer state
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Mobile cart state
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Tax calculation state
  const [taxCalculation, setTaxCalculation] = useState<any>(null);

  // Fetch products, categories, and customers
  useEffect(() => {
    if (currentStore) {
      fetchProducts();
      fetchCategories();
      fetchCustomers();
    }
  }, [currentStore]);

  // Calculate tax when cart changes
  useEffect(() => {
    const calculateCartTax = async () => {
      if (cart.length === 0 || !currentStore) {
        setTaxCalculation(null);
        return;
      }

      try {
        const cartItems = cart.map(item => ({
          price: item.price,
          quantity: item.quantity,
          taxable: true // All items are taxable by default
        }));

        const subtotalBeforeDiscount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = discountValue ?
          (discountType === "percent" ? subtotalBeforeDiscount * (parseFloat(discountValue) / 100) : parseFloat(discountValue)) : 0;

        // Calculate tax on discounted amount
        const taxableAmount = Math.max(0, subtotalBeforeDiscount - discountAmount);
        const calculation = await calculateItemsTax([{ price: taxableAmount, quantity: 1, taxable: true }]);

        setTaxCalculation(calculation);
      } catch (error) {
        console.error('Error calculating tax:', error);
        setTaxCalculation(null);
      }
    };

    calculateCartTax();
  }, [cart, discountValue, discountType, currentStore, calculateItemsTax]);

  const fetchProducts = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          price,
          stock_quantity,
          category_id,
          image_url,
          is_active,
          categories (name)
        `)
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCustomers = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, status, total_orders, total_spent')
        .eq('store_id', currentStore.id)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addToCart = (product: Product) => {
    // Check stock availability
    const existingItem = cart.find(item => item.id === product.id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;

    if (currentCartQuantity >= product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        sku: product.sku,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url
      }]);
    }

    // Track feature usage
    trackFeatureUsage('pos_add_to_cart', `product_${product.id}`);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      // Check stock availability
      const cartItem = cart.find(item => item.id === id);
      if (cartItem && quantity > cartItem.stock_quantity) {
        toast.error(`Only ${cartItem.stock_quantity} items available in stock`);
        return;
      }

      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  // Helper function to get quantity of a product in cart
  const getCartQuantity = (productId: string) => {
    const cartItem = cart.find(item => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Helper function to check if order is ready to process
  const isOrderValid = () => {
    return cart.length > 0 && selectedCustomer && paymentMethod &&
           cart.every(item => item.quantity <= item.stock_quantity && item.stock_quantity > 0);
  };

  // Function to show validation errors when user clicks disabled button
  const showValidationErrors = () => {
    const validationErrors = [];

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
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `ORD-${timestamp}${random}`;
  };

  // Process order
  const processOrder = async () => {
    // Comprehensive validation
    const validationErrors = [];

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
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_code: discountCode || null,
          tax_amount: taxAmount,
          total: total,
          status: 'completed',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
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
        console.error('Error generating transaction number:', transactionNumberError);
        // Don't fail the order for this, but log it
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
          console.error('Error creating transaction record:', transactionError);
          // Don't fail the order for this, but log it
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
          console.error('Error updating customer stats:', customerError);
          // Don't fail the order for this
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
        paymentMethod: paymentMethod,
        customerType: selectedCustomer?.status === 'vip' ? 'vip' :
                     selectedCustomer?.total_orders === 0 ? 'new' : 'returning'
      });

      // Reset cart and form
      setCart([]);
      setDiscountValue("");
      setDiscountCode("");
      setSelectedCustomer(null);

      // Refresh products to update stock quantities
      fetchProducts();

    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Calculate totals using tax utility
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountValue ?
    (discountType === "percent" ? subtotal * (parseFloat(discountValue) / 100) : parseFloat(discountValue)) : 0;

  // Use tax calculation from hook or fallback to simple calculation
  const taxRate = taxCalculation?.taxRate || currentStore?.tax_rate || 0;
  const taxAmount = taxCalculation?.taxAmount || ((subtotal - discountAmount) * taxRate);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  return (
    <>
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6 h-full">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">POS System</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Select products to add to cart</p>
          </div>
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
            </Sheet>

            <Button
              variant="outline"
              onClick={() => setShowOrderHistory(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Order History</span>
              <span className="sm:hidden">History</span>
            </Button>
          </div>
        </div>



        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-foreground text-lg sm:text-xl">Products</CardTitle>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 self-start sm:self-auto">
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
          <CardContent className="space-y-4 px-3 sm:px-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-9"
                />
              </div>
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 h-10 sm:h-9 border border-border rounded-md bg-background text-foreground text-sm min-w-[140px]"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                        onClick={() => addToCart(product)}
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
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) nextElement.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}>
                            <span className="text-2xl font-semibold text-muted-foreground">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 leading-tight">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2">
                            {product.categories?.name || 'No category'}
                          </p>

                          {/* Stock indicator */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground">{product.stock_quantity} Available</span>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>

                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-lg font-bold">{formatCurrency(product.price)}</span>
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
                                  addToCart(product);
                                }}
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                        onClick={() => addToCart(product)}
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
                            <span className="text-4xl font-semibold text-muted-foreground">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {product.categories?.name || 'No category'} • SKU: {product.sku}
                          </p>

                          {/* Stock indicator */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">{product.stock_quantity} Available</span>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>

                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">{formatCurrency(product.price)}</span>
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 w-10 p-0 rounded-full"
                                disabled={getCartQuantity(product.id) === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, getCartQuantity(product.id) - 1);
                                }}
                              >
                                <Minus className="w-5 h-5" />
                              </Button>
                              <span className="w-10 text-center font-semibold">{getCartQuantity(product.id)}</span>
                              <Button
                                size="sm"
                                className="h-10 w-10 p-0 rounded-full"
                                disabled={product.stock_quantity === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                              >
                                <Plus className="w-5 h-5" />
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
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            {/* Product Image */}
                            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 mr-4">
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
                                <span className="text-xl font-semibold text-muted-foreground">
                                  {product.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <div className="flex-1 min-w-0 mr-4">
                                <h3 className="font-semibold text-base mb-1 truncate">{product.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {product.categories?.name || 'No category'} • SKU: {product.sku}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">{product.stock_quantity} Available</span>
                                  <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
                                    {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Price and Controls */}
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="text-xl font-bold">{formatCurrency(product.price)}</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-full"
                                    disabled={getCartQuantity(product.id) === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(product.id, getCartQuantity(product.id) - 1);
                                    }}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">{getCartQuantity(product.id)}</span>
                                  <Button
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    disabled={product.stock_quantity === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
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
          </CardContent>
        </Card>
      </div>

      {/* Desktop Cart Section */}
      <div className="hidden lg:block lg:col-span-1 space-y-6">
        <Card className="sticky top-4 h-[85vh] flex flex-col">
          <CardHeader className="pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">Cart Summary</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {cart.length} items
              </Badge>
            </div>

            {/* Customer Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="font-medium">Customer</span>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
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
                    className="h-6 px-2 text-xs flex-shrink-0 ml-2"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="flex-1 h-8 text-xs"
                  >
                    <User className="w-3 h-3 mr-1" />
                    Select Customer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustomer(true)}
                    className="h-8 px-2"
                  >
                    <UserPlus className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Customer Search Dropdown */}
              {showCustomerSearch && !selectedCustomer && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                    <Input
                      placeholder="Search customers..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>

                  {customerSearchTerm && (
                    <div className="max-h-32 overflow-y-auto border border-border rounded-md bg-background">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground text-xs">
                          No customers found
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-2 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerSearch(false);
                              setCustomerSearchTerm("");
                            }}
                          >
                            <div className="font-medium text-xs">{customer.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {customer.email || customer.phone || 'No contact info'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items List - Scrollable */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex-shrink-0">Items</h4>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                        {/* Product Image */}
                        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const next = e.currentTarget.nextElementSibling as HTMLElement;
                                if (next) next.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}>
                            <span className="text-sm font-medium text-muted-foreground">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-foreground truncate">{item.name}</h5>
                            <span className="text-sm font-medium text-foreground ml-2">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, 0)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed Bottom Section */}
                <div className="flex-shrink-0 space-y-4 pt-4 border-t">
                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Payment Method</h4>
                    <Select value={paymentMethod || ""} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method">
                          {paymentMethod && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const option = getPaymentOptions().find(opt => opt.id === paymentMethod);
                                if (!option) return null;
                                return (
                                  <>
                                    {option.type === 'cash' ? (
                                      <DollarSign className="w-4 h-4" />
                                    ) : (
                                      <CreditCard className="w-4 h-4" />
                                    )}
                                    <div className="flex flex-col items-start">
                                      <span>{option.name}</span>
                                      {option.provider && (
                                        <span className="text-xs text-muted-foreground">{option.provider}</span>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </SelectValue>
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
                              <div className="flex flex-col items-start">
                                <span>{option.name}</span>
                                {option.provider && (
                                  <span className="text-xs text-muted-foreground">{option.provider}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Discount</h4>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={discountType === "percent" ? "default" : "outline"}
                          onClick={() => setDiscountType("percent")}
                          className="px-3"
                        >
                          <Percent className="w-3 h-3 mr-1" />
                          %
                        </Button>
                        <Button
                          size="sm"
                          variant={discountType === "fixed" ? "default" : "outline"}
                          onClick={() => setDiscountType("fixed")}
                          className="px-3"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          $
                        </Button>
                        <Input
                          placeholder={discountType === "percent" ? "10" : "5.00"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <Input
                        placeholder="Discount code (optional)"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {taxAmount > 0 && taxCalculation && (
                        <TaxDisplay
                          calculation={taxCalculation}
                          variant="compact"
                          showBreakdown={false}
                        />
                      )}
                      {taxAmount > 0 && !taxCalculation && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                          <span className="font-medium">{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    className="w-full h-12 text-base font-medium"
                    onClick={isOrderValid() ? processOrder : showValidationErrors}
                    disabled={isProcessingOrder}
                    variant={isOrderValid() ? "default" : "secondary"}
                  >
                    {isProcessingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Order...
                      </>
                    ) : isOrderValid() ? (
                      <>
                        Complete Order - {formatCurrency(total)}
                      </>
                    ) : (
                      <>
                        Complete Order - {formatCurrency(total)}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

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
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
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
                <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getPaymentOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {formatPaymentMethodDisplay(option.value)}
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
                    Processing...
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
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
          size="sm"
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