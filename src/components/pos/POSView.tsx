import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, Percent, DollarSign, CreditCard, Search, Loader2, User, UserPlus, History } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReceiptDialog } from "./ReceiptDialog";
import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { AddCustomerDialog } from "./AddCustomerDialog";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  stock_quantity: number;
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

  // Fetch products, categories, and customers
  useEffect(() => {
    if (currentStore) {
      fetchProducts();
      fetchCategories();
      fetchCustomers();
    }
  }, [currentStore]);

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
        stock_quantity: product.stock_quantity
      }]);
    }
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

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    if (!currentStore || !user || cart.length === 0) {
      toast.error('Cannot process order: missing required information');
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

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountValue ?
    (discountType === "percent" ? subtotal * (parseFloat(discountValue) / 100) : parseFloat(discountValue)) : 0;
  const taxRate = currentStore?.tax_rate || 0;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">POS System</h1>
            <p className="text-muted-foreground mt-2">Select products to add to cart</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowOrderHistory(true)}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Order History
          </Button>
        </div>

        {/* Customer Selection */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="w-5 h-5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">{selectedCustomer.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.email || selectedCustomer.phone || 'No contact info'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="flex-1"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Select Customer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustomer(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </div>

                {showCustomerSearch && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {customerSearchTerm && (
                      <div className="max-h-40 overflow-y-auto border border-border rounded-md">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            No customers found
                          </div>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowCustomerSearch(false);
                                setCustomerSearchTerm("");
                              }}
                            >
                              <div className="font-medium text-foreground">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
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
            )}
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 border border-border rounded-lg hover:shadow-medium transition-smooth cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-foreground">{product.name}</h3>
                      <Badge variant="secondary" className="text-xs">{product.sku}</Badge>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                      <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
                        Stock: {product.stock_quantity}
                      </Badge>
                    </div>
                    {product.categories && (
                      <p className="text-xs text-muted-foreground mb-2">{product.categories.name}</p>
                    )}
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      disabled={product.stock_quantity === 0}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-6">
        <Card className="card-professional h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">${item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 0)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-foreground mb-3">Apply Discount</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={discountType === "percent" ? "default" : "outline"}
                        onClick={() => setDiscountType("percent")}
                      >
                        <Percent className="w-3 h-3 mr-1" />
                        %
                      </Button>
                      <Button
                        size="sm"
                        variant={discountType === "fixed" ? "default" : "outline"}
                        onClick={() => setDiscountType("fixed")}
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
                      placeholder="Enter discount code (optional)"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-foreground mb-3">Payment Method</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("cash")}
                    >
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === "card" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("card")}
                    >
                      Card
                    </Button>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-foreground border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full bg-gradient-primary text-white font-medium py-3"
                  onClick={processOrder}
                  disabled={isProcessingOrder || cart.length === 0}
                >
                  {isProcessingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment - ${total.toFixed(2)}
                    </>
                  )}
                </Button>
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
    </>
  );
}