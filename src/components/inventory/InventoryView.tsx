import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, Loader2, Settings, TrendingUp, Download, CheckSquare, FolderOpen, History } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddProductDialog } from "./AddProductDialog";
import { EditProductDialog } from "./EditProductDialog";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { SuppliersView } from "./SuppliersView";
import { CategoriesView } from "./CategoriesView";
import { FilteredInventoryView } from "./FilteredInventoryView";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { BulkStockAdjustmentDialog } from "./BulkStockAdjustmentDialog";
import { AdvancedFilters, FilterOptions } from "./AdvancedFilters";
import { ExportDialog } from "./ExportDialog";
import { ProductHistoryModal } from "./ProductHistoryModal";
import { Checkbox } from "@/components/ui/checkbox";

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

export function InventoryView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuppliersView, setShowSuppliersView] = useState(false);
  const [showCategoriesView, setShowCategoriesView] = useState(false);
  const [filteredView, setFilteredView] = useState<{
    type: 'category' | 'supplier';
    id: string;
    name: string;
  } | null>(null);

  // Bulk operations
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showBulkStockDialog, setShowBulkStockDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Advanced filtering
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "all",
    supplier: "all",
    stockLevel: "all",
    priceRange: { min: null, max: null },
    sortBy: "name",
    sortOrder: "asc",
  });

  useEffect(() => {
    if (currentStore && user) {
      fetchProducts();
      fetchCategories();
    }
  }, [currentStore, user]);

  const fetchProducts = async () => {
    if (!currentStore) return;

    try {
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
        .select('name')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      const categoryNames = data?.map(cat => cat.name) || [];
      setCategories(["all", ...categoryNames]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredInventory = products.filter(item => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
                           item.sku?.toLowerCase().includes(searchLower) ||
                           item.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category !== "all") {
      if (item.category_id !== filters.category) return false;
    }

    // Supplier filter
    if (filters.supplier !== "all") {
      if (item.supplier_id !== filters.supplier) return false;
    }

    // Stock level filter
    if (filters.stockLevel !== "all") {
      switch (filters.stockLevel) {
        case "low":
          if (item.stock_quantity > item.low_stock_threshold) return false;
          break;
        case "out":
          if (item.stock_quantity > 0) return false;
          break;
        case "normal":
          if (item.stock_quantity <= item.low_stock_threshold) return false;
          break;
      }
    }

    // Price range filter
    if (filters.priceRange.min !== null && item.price < filters.priceRange.min) return false;
    if (filters.priceRange.max !== null && item.price > filters.priceRange.max) return false;

    return true;
  }).sort((a, b) => {
    let aValue: any, bValue: any;

    switch (filters.sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "price":
        aValue = a.price;
        bValue = b.price;
        break;
      case "stock":
        aValue = a.stock_quantity;
        bValue = b.stock_quantity;
        break;
      case "created_at":
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const lowStockItems = products.filter(item => item.stock_quantity <= item.low_stock_threshold);

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

  // Bulk operations handlers
  const handleSelectProduct = (product: Product, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, product]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredInventory);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkStockAdjustment = (products: Product[]) => {
    setSelectedProducts(products);
    setShowBulkStockDialog(true);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      supplier: "all",
      stockLevel: "all",
      priceRange: { min: null, max: null },
      sortBy: "name",
      sortOrder: "asc",
    });
    setSearchTerm("");
    setSelectedCategory("all");
  };

  // Show filtered view if requested
  if (filteredView) {
    return (
      <FilteredInventoryView
        filterType={filteredView.type}
        filterId={filteredView.id}
        filterName={filteredView.name}
        onBack={() => setFilteredView(null)}
      />
    );
  }

  // Show suppliers view if requested
  if (showSuppliersView) {
    return (
      <SuppliersView
        onClose={() => setShowSuppliersView(false)}
        onViewSupplierProducts={(supplierId, supplierName) => {
          setShowSuppliersView(false);
          setFilteredView({ type: 'supplier', id: supplierId, name: supplierName });
        }}
      />
    );
  }

  // Show categories view if requested
  if (showCategoriesView) {
    return (
      <CategoriesView
        onClose={() => setShowCategoriesView(false)}
        onViewCategoryProducts={(categoryId, categoryName) => {
          setShowCategoriesView(false);
          setFilteredView({ type: 'category', id: categoryId, name: categoryName });
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1 md:mt-2">
            Track and manage your product inventory
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            disabled={filteredInventory.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCategoriesView(true)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSuppliersView(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Suppliers
          </Button>
          <Button
            className="bg-gradient-primary text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
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
              Low Stock Alerts
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
            <div className="text-2xl font-bold text-success">
              ${products.reduce((sum, item) => sum + (item.stock_quantity * item.cost), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* Inventory Table */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-foreground">Product Inventory</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredInventory.length} of {products.length} products</span>
              {selectedProducts.length > 0 && (
                <span>• {selectedProducts.length} selected</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === filteredInventory.length && filteredInventory.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all products"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {products.length === 0 ? "No products found. Add your first product to get started." : "No products match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.some(p => p.id === item.id)}
                        onCheckedChange={(checked) => handleSelectProduct(item, checked as boolean)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
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
                    <TableCell>{item.categories?.name || 'Uncategorized'}</TableCell>
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
                    <TableCell>{item.suppliers?.name || '-'}</TableCell>
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
      <AddProductDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onProductAdded={handleProductUpdated}
      />

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

      <BulkStockAdjustmentDialog
        open={showBulkStockDialog}
        onOpenChange={setShowBulkStockDialog}
        products={selectedProducts}
        onStockAdjusted={() => {
          handleProductUpdated();
          setSelectedProducts([]);
        }}
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        products={filteredInventory}
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

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedProducts={selectedProducts}
        onClearSelection={() => setSelectedProducts([])}
        onProductsUpdated={() => {
          handleProductUpdated();
          setSelectedProducts([]);
        }}
        onBulkStockAdjustment={handleBulkStockAdjustment}
      />
    </div>
  );
}