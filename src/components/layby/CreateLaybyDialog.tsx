import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Search, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

interface LaybyItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface CreateLaybyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLaybyDialog({ open, onOpenChange, onSuccess }: CreateLaybyDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<LaybyItem[]>([]);
  
  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && currentStore) {
      fetchProducts();
      fetchCustomers();
    }
  }, [open, currentStore]);

  const fetchProducts = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, stock_quantity')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('store_id', currentStore.id)
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProduct = (product: Product) => {
    const existingItem = selectedItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setSelectedItems(items =>
        items.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price
              }
            : item
        )
      );
    } else {
      setSelectedItems(items => [
        ...items,
        {
          product,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price
        }
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }

    setSelectedItems(items =>
      items.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total_price: quantity * item.unit_price
            }
          : item
      )
    );
  };

  const removeProduct = (productId: string) => {
    setSelectedItems(items => items.filter(item => item.product.id !== productId));
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone || "");
      setCustomerEmail(customer.email || "");
    }
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.total_price, 0);
  const depositAmountNum = parseFloat(depositAmount) || 0;
  const balanceRemaining = totalAmount - depositAmountNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore || !user) {
      toast.error('Store or user not found');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (depositAmountNum <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    if (depositAmountNum >= totalAmount) {
      toast.error('Deposit amount must be less than total amount');
      return;
    }

    setLoading(true);

    try {
      // Generate layby number
      const { data: laybyNumberData, error: laybyNumberError } = await supabase
        .rpc('generate_layby_number', { store_id_param: currentStore.id });

      if (laybyNumberError) {
        throw laybyNumberError;
      }

      // Create layby order
      const { data: laybyOrder, error: laybyError } = await supabase
        .from('layby_orders')
        .insert({
          store_id: currentStore.id,
          customer_id: selectedCustomerId || null,
          layby_number: laybyNumberData,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          total_amount: totalAmount,
          deposit_amount: depositAmountNum,
          balance_remaining: balanceRemaining,
          due_date: dueDate || null,
          notes: notes.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (laybyError) {
        throw laybyError;
      }

      // Create layby items
      const laybyItems = selectedItems.map(item => ({
        layby_order_id: laybyOrder.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('layby_items')
        .insert(laybyItems);

      if (itemsError) {
        throw itemsError;
      }

      // Create initial deposit payment record
      const { error: paymentError } = await supabase
        .from('layby_payments')
        .insert({
          layby_order_id: laybyOrder.id,
          amount: depositAmountNum,
          payment_method: 'cash',
          notes: 'Initial deposit',
          processed_by: user.id
        });

      if (paymentError) {
        throw paymentError;
      }

      // Create transaction record
      const { data: transactionNumber, error: transactionNumberError } = await supabase
        .rpc('generate_transaction_number', { store_id_param: currentStore.id });

      if (transactionNumberError) {
        throw transactionNumberError;
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          store_id: currentStore.id,
          transaction_number: transactionNumber,
          transaction_type: 'layby_deposit',
          amount: depositAmountNum,
          payment_method: 'cash',
          reference_id: laybyOrder.id,
          reference_type: 'layby_order',
          customer_id: selectedCustomerId || null,
          customer_name: customerName.trim(),
          description: `Layby deposit for ${laybyNumberData}`,
          processed_by: user.id
        });

      if (transactionError) {
        throw transactionError;
      }

      toast.success('Layby order created successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating layby order:', error);
      toast.error('Failed to create layby order');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSelectedCustomerId("");
    setDepositAmount("");
    setDueDate("");
    setNotes("");
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Layby Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="existing-customer">Select Existing Customer (Optional)</Label>
                  <Select value={selectedCustomerId} onValueChange={selectCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose existing customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customer-phone">Phone Number</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="customer-email">Email Address</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deposit-amount">Deposit Amount *</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter deposit amount"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="due-date">Due Date (Optional)</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>

                {totalAmount > 0 && (
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit:</span>
                      <span className="font-semibold">${depositAmountNum.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Balance Remaining:</span>
                      <span className="font-semibold text-primary">${balanceRemaining.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Products</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addProduct(product)}>
                    <CardContent className="p-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.sku}</div>
                      <div className="text-lg font-semibold text-primary">${product.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">{item.product.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>${item.total_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeProduct(item.product.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedItems.length === 0}>
              {loading ? "Creating..." : "Create Layby Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
