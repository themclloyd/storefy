import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, AlertTriangle, Edit, Trash2, TrendingUp, Loader2, History } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditProductDialog } from "./EditProductDialog";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { ProductHistoryModal } from "./ProductHistoryModal";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string;
  supplier_id: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
  categories?: {
    name: string;
  };
  suppliers?: {
    name: string;
  };
}

interface FilteredInventoryViewProps {
  filterType: 'category' | 'supplier';
  filterId: string;
  filterName: string;
  onBack: () => void;
}

export function FilteredInventoryView({ 
  filterType, 
  filterId, 
  filterName, 
  onBack 
}: FilteredInventoryViewProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (currentStore && user) {
      fetchProducts();
    }
  }, [currentStore, user, filterId, filterType]);

  const fetchProducts = async () => {
    if (!currentStore) return;

    try {
      const filterColumn = filterType === 'category' ? 'category_id' : 'supplier_id';
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          description,
          price,
          cost,
          stock_quantity,
          low_stock_threshold,
          category_id,
          supplier_id,
          image_url,
          is_active,
          created_at,
          categories (name),
          suppliers (name)
        `)
        .eq('store_id', currentStore.id)
        .eq(filterColumn, filterId)
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

  const lowStockItems = products.filter(item => item.stock_quantity <= item.low_stock_threshold);
  const totalValue = products.reduce((sum, item) => sum + (item.price * item.stock_quantity), 0);

  // Dialog handlers
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditDialog(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const handleStockAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setShowStockDialog(true);
  };

  const handleViewHistory = (product: Product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
    setShowStockDialog(false);
    setShowHistoryModal(false);
  };

  const handleProductUpdated = () => {
    fetchProducts();
    handleDialogClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Products in {filterName}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2">
            {filterType === 'category' ? 'Category' : 'Supplier'}: {filterName}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-foreground">Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No products found in this {filterType}.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-md border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.sku ? (
                          <Badge variant="outline">{item.sku}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={item.stock_quantity <= item.low_stock_threshold ? "text-warning font-medium" : ""}>
                            {item.stock_quantity}
                          </span>
                          {item.stock_quantity <= item.low_stock_threshold && (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${item.price.toFixed(2)}</TableCell>
                      <TableCell>${item.cost?.toFixed(2) || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(item)}
                            title="View History"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStockAdjustment(item)}
                            title="Adjust Stock"
                          >
                            <TrendingUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(item)}
                            title="Edit Product"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProduct(item)}
                            title="Delete Product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditProductDialog
        open={showEditDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />

      <DeleteProductDialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        product={selectedProduct}
        onProductDeleted={handleProductUpdated}
      />

      <StockAdjustmentDialog
        open={showStockDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        product={selectedProduct}
        onStockAdjusted={handleProductUpdated}
      />

      <ProductHistoryModal
        open={showHistoryModal}
        onOpenChange={(open) => !open && handleDialogClose()}
        product={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          current_stock: selectedProduct.stock_quantity,
          created_at: selectedProduct.created_at || new Date().toISOString(),
        } : null}
      />
    </div>
  );
}
