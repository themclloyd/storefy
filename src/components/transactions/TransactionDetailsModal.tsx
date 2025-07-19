import { useState, useEffect } from "react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Receipt,
  User,
  Calendar,
  CreditCard,
  FileText,
  Package,
  Edit3,
  Save,
  X,
  Printer,
  Ban,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { TransactionReceiptDialog } from "./TransactionReceiptDialog";

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  reference_id: string;
  reference_type: string;
  customer_id: string;
  customer_name: string;
  description: string;
  notes: string;
  created_at: string;
  processed_by: string;
}

interface TransactionDetailsModalProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdate: () => void;
}

interface OrderDetails {
  id: string;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    sku: string;
    is_active: boolean;
  } | null;
}



interface LaybyDetails {
  id: string;
  layby_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  deposit_amount: number;
  balance_remaining: number;
  status: string;
  due_date: string;
  created_at: string;
  layby_items?: LaybyItem[];
}

interface LaybyItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    sku: string;
    is_active: boolean;
  } | null;
}

interface TransactionHistoryEntry {
  id: string;
  action_type: string;
  action_description: string;
  old_values?: any;
  new_values?: any;
  performed_by: string;
  performed_at: string;
  user_email?: string;
}

export function TransactionDetailsModal({
  transaction,
  open,
  onOpenChange,
  onTransactionUpdate
}: TransactionDetailsModalProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { getPaymentMethodDisplay, getPaymentMethodBadgeVariant } = usePaymentMethods();
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [laybyDetails, setLaybyDetails] = useState<LaybyDetails | null>(null);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(transaction.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      setNotes(transaction.notes || "");
      fetchRelatedDetails();
      // Temporarily disabled to prevent issues
      // fetchTransactionHistory();
    }
  }, [open, transaction]);

  const fetchRelatedDetails = async () => {
    if (!transaction.reference_id || !currentStore) return;

    setLoading(true);
    try {
      if (transaction.reference_type === 'order') {
        await fetchOrderDetails();
      } else if (transaction.reference_type === 'layby_order') {
        await fetchLaybyDetails();
      }
    } catch (error) {
      console.error('Error fetching related details:', error);
      toast.error('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    // First try with inner join to get only items with existing products
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (id, name, email, phone),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          product_id,
          products (id, name, sku, is_active)
        )
      `)
      .eq('id', transaction.reference_id)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      return;
    }

    // Check for items with missing products and fetch them separately
    if (data.order_items) {
      const itemsWithMissingProducts = data.order_items.filter(item => !item.products);

      if (itemsWithMissingProducts.length > 0) {
        console.warn('Found order items with missing products:', itemsWithMissingProducts);

        // Try to fetch product info for missing products (including inactive ones)
        for (const item of itemsWithMissingProducts) {
          const { data: productData } = await supabase
            .from('products')
            .select('id, name, sku, is_active')
            .eq('id', item.product_id)
            .single();

          if (productData) {
            item.products = productData;
          }
        }
      }
    }

    // Order details fetched successfully
    setOrderDetails(data);
  };

  const fetchLaybyDetails = async () => {
    const { data, error } = await supabase
      .from('layby_orders')
      .select(`
        *,
        layby_items (
          id,
          quantity,
          unit_price,
          total_price,
          product_id,
          products (id, name, sku, is_active)
        )
      `)
      .eq('id', transaction.reference_id)
      .single();

    if (error) {
      console.error('Error fetching layby details:', error);
      toast.error('Failed to load layby details');
      return;
    }

    // Check for items with missing products and fetch them separately
    if (data.layby_items) {
      const itemsWithMissingProducts = data.layby_items.filter(item => !item.products);

      if (itemsWithMissingProducts.length > 0) {
        console.warn('Found layby items with missing products:', itemsWithMissingProducts);

        // Try to fetch product info for missing products (including inactive ones)
        for (const item of itemsWithMissingProducts) {
          const { data: productData } = await supabase
            .from('products')
            .select('id, name, sku, is_active')
            .eq('id', item.product_id)
            .single();

          if (productData) {
            item.products = productData;
          }
        }
      }
    }

    // Layby details fetched successfully
    setLaybyDetails(data);
  };

  const fetchTransactionHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('transaction_id', transaction.id)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching transaction history:', error);
        return;
      }

      // For now, we'll use the user ID as the identifier
      // In a production app, you'd want to join with a users table or profiles table
      const historyWithUserInfo = (data || []).map((entry) => ({
        ...entry,
        user_email: entry.performed_by === user?.id ? user.email || 'Current User' : 'Other User'
      }));

      setTransactionHistory(historyWithUserInfo);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveNotes = async () => {
    if (!currentStore || !user) return;

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ notes: notes.trim() || null })
        .eq('id', transaction.id);

      if (error) {
        throw error;
      }

      // Log the notes update
      await logTransactionAction('note_updated', 'Transaction notes updated');

      toast.success('Notes updated successfully');
      setEditingNotes(false);
      onTransactionUpdate();
      fetchTransactionHistory();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const logTransactionAction = async (actionType: string, description: string, additionalData?: any) => {
    try {
      await supabase
        .from('transaction_history')
        .insert({
          transaction_id: transaction.id,
          action_type: actionType,
          action_description: description,
          new_values: additionalData,
          performed_by: user?.id
        });
    } catch (error) {
      console.error('Error logging transaction action:', error);
    }
  };

  const handlePrintReceipt = async () => {
    if (!orderDetails && !laybyDetails) {
      toast.error('No receipt data available for this transaction');
      return;
    }

    setActionLoading('print');
    try {
      // Log the print action
      await logTransactionAction('printed', 'Receipt printed');
      fetchTransactionHistory();

      // Show receipt dialog
      setShowReceiptDialog(true);

      toast.success('Receipt dialog opened');
    } catch (error) {
      console.error('Error opening receipt:', error);
      toast.error('Failed to open receipt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRefund = async () => {
    if (transaction.transaction_type === 'refund') {
      toast.error('Cannot refund a refund transaction');
      return;
    }

    setActionLoading('refund');
    try {
      // Generate refund transaction number
      const { data: refundTransactionNumber, error: transactionNumberError } = await supabase
        .rpc('generate_transaction_number', { store_id_param: currentStore?.id });

      if (transactionNumberError) {
        throw transactionNumberError;
      }

      // Create refund transaction
      const { error: refundError } = await supabase
        .from('transactions')
        .insert({
          store_id: currentStore?.id,
          transaction_number: refundTransactionNumber,
          transaction_type: 'refund',
          amount: transaction.amount,
          payment_method: transaction.payment_method,
          reference_id: transaction.reference_id,
          reference_type: transaction.reference_type,
          customer_id: transaction.customer_id,
          customer_name: transaction.customer_name,
          description: `Refund for ${transaction.transaction_number}`,
          notes: `Refund of original transaction ${transaction.transaction_number}`,
          processed_by: user?.id
        });

      if (refundError) {
        throw refundError;
      }

      // Log the refund action
      await logTransactionAction('refunded', `Refund transaction created: ${refundTransactionNumber}`, {
        refund_transaction_number: refundTransactionNumber,
        refund_amount: transaction.amount
      });
      fetchTransactionHistory();

      toast.success('Refund transaction created successfully');
      onTransactionUpdate();
    } catch (error) {
      console.error('Error creating refund:', error);
      toast.error('Failed to create refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoidTransaction = async () => {
    if (!confirm('Are you sure you want to void this transaction? This action cannot be undone.')) {
      return;
    }

    setActionLoading('void');
    try {
      // Update transaction with void status (we'll add a status field or use notes)
      const { error } = await supabase
        .from('transactions')
        .update({
          notes: `${notes ? notes + '\n\n' : ''}VOIDED: Transaction voided on ${new Date().toISOString()} by ${user?.email}`
        })
        .eq('id', transaction.id);

      if (error) {
        throw error;
      }

      // Log the void action
      await logTransactionAction('voided', 'Transaction voided');
      fetchTransactionHistory();

      toast.success('Transaction voided successfully');
      onTransactionUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error voiding transaction:', error);
      toast.error('Failed to void transaction');
    } finally {
      setActionLoading(null);
    }
  };



  const getTransactionTypeBadge = (type: string) => {
    const typeConfig = {
      sale: { label: "Sale", variant: "default" as const },
      layby_payment: { label: "Layby Payment", variant: "secondary" as const },
      layby_deposit: { label: "Layby Deposit", variant: "secondary" as const },
      refund: { label: "Refund", variant: "destructive" as const },
      adjustment: { label: "Adjustment", variant: "outline" as const },
      other: { label: "Other", variant: "outline" as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const label = getPaymentMethodDisplay(method);
    const variant = getPaymentMethodBadgeVariant(method);
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transaction Details - {transaction.transaction_number}
          </DialogTitle>
          <DialogDescription>
            View and manage transaction details, including related orders, notes, and actions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Transaction #:</span>
                    <span>{transaction.transaction_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>{format(new Date(transaction.created_at), "PPP 'at' p")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Type:</span>
                    {getTransactionTypeBadge(transaction.transaction_type)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Customer:</span>
                    <span>{transaction.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Payment Method:</span>
                    {getPaymentMethodBadge(transaction.payment_method)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Amount:</span>
                    <span className={`text-lg font-bold ${
                      transaction.transaction_type === 'refund' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.transaction_type === 'refund' ? '-' : ''}${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {transaction.description && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-muted-foreground">{transaction.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notes</CardTitle>
                {!editingNotes ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingNotes(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Notes
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveNotes} disabled={savingNotes}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(transaction.notes || "");
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this transaction..."
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">
                  {notes || "No notes added for this transaction."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Order Details */}
          {orderDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Details - {orderDetails.order_number}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div><span className="font-medium">Subtotal:</span> ${orderDetails.subtotal.toFixed(2)}</div>
                    <div><span className="font-medium">Discount:</span> ${orderDetails.discount_amount?.toFixed(2) || '0.00'}</div>
                    <div><span className="font-medium">Tax:</span> ${orderDetails.tax_amount?.toFixed(2) || '0.00'}</div>
                    <div><span className="font-medium">Total:</span> ${orderDetails.total.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="font-medium">Status:</span>
                      <Badge variant="outline" className="ml-2">{orderDetails.status}</Badge>
                    </div>
                    <div><span className="font-medium">Date:</span> {format(new Date(orderDetails.created_at), "PPP")}</div>
                  </div>
                </div>

                {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Order Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderDetails.order_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.products?.name || (
                                  <span className="text-muted-foreground italic">
                                    Product Not Found (ID: {item.product_id.slice(-8)})
                                  </span>
                                )}
                                {item.products && !item.products.is_active && (
                                  <Badge variant="secondary" className="ml-2">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell>{item.products?.sku || 'N/A'}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell>${item.total_price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related Layby Details */}
          {laybyDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Layby Details - {laybyDetails.layby_number}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div><span className="font-medium">Customer:</span> {laybyDetails.customer_name}</div>
                    <div><span className="font-medium">Phone:</span> {laybyDetails.customer_phone}</div>
                    <div><span className="font-medium">Total Amount:</span> ${laybyDetails.total_amount.toFixed(2)}</div>
                    <div><span className="font-medium">Deposit:</span> ${laybyDetails.deposit_amount.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="font-medium">Balance:</span> ${laybyDetails.balance_remaining.toFixed(2)}</div>
                    <div><span className="font-medium">Status:</span>
                      <Badge variant="outline" className="ml-2">{laybyDetails.status}</Badge>
                    </div>
                    <div><span className="font-medium">Due Date:</span> {format(new Date(laybyDetails.due_date), "PPP")}</div>
                  </div>
                </div>

                {laybyDetails.layby_items && laybyDetails.layby_items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Layby Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {laybyDetails.layby_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.products?.name || (
                                  <span className="text-muted-foreground italic">
                                    Product Not Found (ID: {item.product_id.slice(-8)})
                                  </span>
                                )}
                                {item.products && !item.products.is_active && (
                                  <Badge variant="secondary" className="ml-2">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell>{item.products?.sku || 'N/A'}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell>${item.total_price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction History - Temporarily disabled */}
          {/*
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Transaction history temporarily disabled.</div>
            </CardContent>
          </Card>
          */}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              disabled={actionLoading === 'print' || (!orderDetails && !laybyDetails)}
            >
              <Printer className="w-4 h-4 mr-2" />
              {actionLoading === 'print' ? 'Printing...' : 'Print Receipt'}
            </Button>
            {transaction.transaction_type !== 'refund' && (
              <Button
                variant="outline"
                onClick={handleCreateRefund}
                disabled={actionLoading === 'refund'}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {actionLoading === 'refund' ? 'Creating...' : 'Create Refund'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleVoidTransaction}
              disabled={actionLoading === 'void'}
            >
              <Ban className="w-4 h-4 mr-2" />
              {actionLoading === 'void' ? 'Voiding...' : 'Void Transaction'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Receipt Dialog */}
      {(orderDetails || laybyDetails) && (
        <TransactionReceiptDialog
          open={showReceiptDialog}
          onOpenChange={setShowReceiptDialog}
          transactionNumber={transaction.transaction_number}
          transactionDate={transaction.created_at}
          transactionType={transaction.transaction_type}
          orderNumber={orderDetails?.order_number || laybyDetails?.layby_number}
          storeName={currentStore?.name || 'Store'}
          storeAddress={currentStore?.address}
          storePhone={currentStore?.phone}
          customerName={orderDetails?.customer?.name || laybyDetails?.customer_name || transaction.customer_name}
          customerEmail={orderDetails?.customer?.email}
          customerPhone={orderDetails?.customer?.phone || laybyDetails?.customer_phone}
          items={
            orderDetails?.order_items?.map(item => ({
              id: item.id,
              name: item.products?.name || `Product Not Found (${item.product_id.slice(-8)})`,
              sku: item.products?.sku || 'N/A',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
            })) ||
            laybyDetails?.layby_items?.map(item => ({
              id: item.id,
              name: item.products?.name || `Product Not Found (${item.product_id.slice(-8)})`,
              sku: item.products?.sku || 'N/A',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
            })) || []
          }
          subtotal={orderDetails?.subtotal || laybyDetails?.total_amount || 0}
          discountAmount={orderDetails?.discount_amount || 0}
          taxAmount={orderDetails?.tax_amount || 0}
          total={transaction.amount}
          paymentMethod={transaction.payment_method}
          cashierName={user?.email}
          isLayby={!!laybyDetails}
          laybyBalance={laybyDetails?.balance_remaining || 0}
        />
      )}
    </Dialog>
  );
}
