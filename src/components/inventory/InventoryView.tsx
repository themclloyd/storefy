import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, Loader2, Settings, TrendingUp, Download, CheckSquare, FolderOpen, History, MoreVertical, Filter, Grid3X3, List, Globe } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { SecureAction, SecureButton } from "@/components/auth/SecureAction";
import { useStoreData } from "@/hooks/useSupabaseClient";
import { toast } from "sonner";
import {
  useInventoryStore,
  useProducts,
  useCategories,
  useSuppliers,
  type Product,
  type FilterOptions
} from "@/stores/inventoryStore";
import { AddProductDialog } from "./AddProductDialog";
import { EditProductDialog } from "./EditProductDialog";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { SuppliersView } from "./SuppliersView";
import { CategoriesView } from "./CategoriesView";
import { FilteredInventoryView } from "./FilteredInventoryView";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { BulkStockAdjustmentDialog } from "./BulkStockAdjustmentDialog";
import { FilterOptions } from "./AdvancedFilters";
import { ExportDialog } from "./ExportDialog";
import { ProductHistoryModal } from "./ProductHistoryModal";
import { ProductPublicVisibilityDialog } from "./ProductPublicVisibilityDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTax } from "@/hooks/useTax";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  created_at: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string;
  supplier_id: string;
  image_url: string;
  is_active: boolean;
  categories?: {
    name: string;
  };
  suppliers?: {
    name: string;
  };
}

export function InventoryView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const { formatCurrency } = useTax();

  // Use Zustand store state
  const products = useProducts();
  const categories = useCategories();
  const suppliers = useSuppliers();
  const searchTerm = useInventoryStore(state => state.searchTerm);
  const selectedCategory = useInventoryStore(state => state.selectedCategory);
  const loading = useInventoryStore(state => state.loading);
  const filters = useInventoryStore(state => state.filters);
  const filteredView = useInventoryStore(state => state.filteredView);
  const viewMode = useInventoryStore(state => state.viewMode);
  const selectedProducts = useInventoryStore(state => state.selectedProducts);

  // Dialog states from Zustand
  const showAddDialog = useInventoryStore(state => state.showAddDialog);
  const showEditDialog = useInventoryStore(state => state.showEditDialog);
  const showDeleteDialog = useInventoryStore(state => state.showDeleteDialog);
  const showStockDialog = useInventoryStore(state => state.showStockDialog);
  const showBulkStockDialog = useInventoryStore(state => state.showBulkStockDialog);
  const showExportDialog = useInventoryStore(state => state.showExportDialog);
  const showHistoryModal = useInventoryStore(state => state.showHistoryModal);
  const showPublicVisibilityDialog = useInventoryStore(state => state.showPublicVisibilityDialog);
  const selectedProduct = useInventoryStore(state => state.selectedProduct);

  // Actions from Zustand
  const setSearchTerm = useInventoryStore(state => state.setSearchTerm);
  const setSelectedCategory = useInventoryStore(state => state.setSelectedCategory);
  const setFilters = useInventoryStore(state => state.setFilters);
  const setFilteredView = useInventoryStore(state => state.setFilteredView);
  const setViewMode = useInventoryStore(state => state.setViewMode);
  const setSelectedProducts = useInventoryStore(state => state.setSelectedProducts);
  const setShowAddDialog = useInventoryStore(state => state.setShowAddDialog);
  const setShowEditDialog = useInventoryStore(state => state.setShowEditDialog);
  const setShowDeleteDialog = useInventoryStore(state => state.setShowDeleteDialog);
  const setShowStockDialog = useInventoryStore(state => state.setShowStockDialog);
  const setShowBulkStockDialog = useInventoryStore(state => state.setShowBulkStockDialog);
  const setShowExportDialog = useInventoryStore(state => state.setShowExportDialog);
  const setShowHistoryModal = useInventoryStore(state => state.setShowHistoryModal);
  const setShowPublicVisibilityDialog = useInventoryStore(state => state.setShowPublicVisibilityDialog);
  const setSelectedProduct = useInventoryStore(state => state.setSelectedProduct);
  const fetchProducts = useInventoryStore(state => state.fetchProducts);
  const fetchCategories = useInventoryStore(state => state.fetchCategories);
  const fetchSuppliers = useInventoryStore(state => state.fetchSuppliers);

  // Local UI states that should remain local
  const [showSuppliersView, setShowSuppliersView] = useState(false);
  const [showCategoriesView, setShowCategoriesView] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    const storeId = currentStoreId || currentStore?.id;
    if (storeId && ((currentStore && user) || (currentStoreId && isPinSession))) {
      fetchProducts(storeId);
      fetchCategories(storeId);
      fetchSuppliers(storeId);
    }
  }, [currentStore, user, currentStoreId, isPinSession, fetchProducts, fetchCategories, fetchSuppliers]);

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

  const handlePublicVisibility = (product: Product) => {
    setSelectedProduct(product);
    setShowPublicVisibilityDialog(true);
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
    setShowPublicVisibilityDialog(false);
    setShowHistoryModal(false);
  };

  const handleProductUpdated = () => {
    const storeId = currentStoreId || currentStore?.id;
    if (storeId) {
      fetchProducts(storeId);
    }
    handleDialogClose();
  };

  // Bulk operations handlers - use Zustand actions
  const selectProduct = useInventoryStore(state => state.selectProduct);
  const selectAllProducts = useInventoryStore(state => state.selectAllProducts);
  const resetFilters = useInventoryStore(state => state.resetFilters);

  const handleSelectProduct = (product: Product, checked: boolean) => {
    selectProduct(product, checked);
  };

  const handleSelectAll = (checked: boolean) => {
    selectAllProducts(filteredInventory, checked);
  };

  const handleBulkStockAdjustment = (products: Product[]) => {
    setSelectedProducts(products);
    setShowBulkStockDialog(true);
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
    <PageLayout>
      <PageHeader
        title="Inventory"
        description={`${filteredInventory.length} products`}
        icon={<Package className="w-8 h-8 text-primary" />}
        actions={
          <>
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Filters */}
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Mobile Actions Menu */}
            <Sheet open={showMobileActions} onOpenChange={setShowMobileActions}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Desktop Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              disabled={filteredInventory.length === 0}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoriesView(true)}
              className="hidden sm:flex"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Categories</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuppliersView(true)}
              className="hidden sm:flex"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Suppliers</span>
            </Button>

            {/* Add Product Button */}
            <SecureButton
              permission="manage_inventory"
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Add Product</span>
            </SecureButton>
          </>
        }
      />

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{products.length}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {products.filter(p => p.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-warning">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-success">
              {formatCurrency(products.reduce((sum, item) => sum + (item.stock_quantity * item.cost), 0))}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden sm:block">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={filters.stockLevel}
                onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground min-w-[140px]"
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="in">In Stock</option>
              </select>
              {(filters.search || filters.category !== 'all' || filters.stockLevel !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>



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
          {/* Mobile Card View */}
          {viewMode === 'cards' && (
            <div className="p-3 sm:p-6 space-y-3">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {products.length === 0 ? "No products found. Add your first product to get started." : "No products match your search criteria."}
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <Card key={item.id} className="border border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <Checkbox
                                checked={selectedProducts.some(p => p.id === item.id)}
                                onCheckedChange={(checked) => handleSelectProduct(item, checked as boolean)}
                                aria-label={`Select ${item.name}`}
                              />
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Category:</span>
                              <p className="font-medium">{item.categories?.name || 'Uncategorized'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Stock:</span>
                              <div className="flex items-center gap-1">
                                <span className={`font-medium ${item.stock_quantity <= item.low_stock_threshold ? 'text-destructive' : 'text-foreground'}`}>
                                  {item.stock_quantity}
                                </span>
                                {item.stock_quantity <= item.low_stock_threshold && (
                                  <AlertTriangle className="w-3 h-3 text-destructive" />
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Price:</span>
                              <p className="font-medium">{formatCurrency(item.price)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Supplier:</span>
                              <p className="font-medium truncate">{item.suppliers?.name || 'No supplier'}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <SecureButton
                              permission="manage_inventory"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(item);
                                setShowStockDialog(true);
                              }}
                              className="flex-1"
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Stock
                            </SecureButton>
                            <SecureButton
                              permission="manage_inventory"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(item);
                                setShowEditDialog(true);
                              }}
                              className="flex-1"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </SecureButton>
                            <SecureButton
                              permission="manage_inventory"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(item);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </SecureButton>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Desktop Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
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
                        <SecureButton
                          permission="manage_inventory"
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublicVisibility(item)}
                          title="Public Showcase Settings"
                        >
                          <Globe className="w-3 h-3" />
                        </SecureButton>
                        <SecureButton
                          permission="manage_inventory"
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(item)}
                          title="Edit Product"
                        >
                          <Edit className="w-3 h-3" />
                        </SecureButton>
                        <SecureButton
                          permission="manage_inventory"
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProduct(item)}
                          title="Delete Product"
                        >
                          <Trash2 className="w-3 h-3" />
                        </SecureButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </div>
          )}
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

      <ProductPublicVisibilityDialog
        open={showPublicVisibilityDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        product={selectedProduct}
        onUpdate={handleProductUpdated}
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

      {/* Mobile Filters Sheet */}
      <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <SheetContent side="right" className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Filters & Search</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Level</label>
              <select
                value={filters.stockLevel}
                onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="in">In Stock</option>
              </select>
            </div>

            <Button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              variant="outline"
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Actions Sheet */}
      <Sheet open={showMobileActions} onOpenChange={setShowMobileActions}>
        <SheetContent side="right" className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <SecureButton
              permission="manage_inventory"
              onClick={() => {
                setShowAddDialog(true);
                setShowMobileActions(false);
              }}
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </SecureButton>

            <Button
              variant="outline"
              onClick={() => {
                setShowCategoriesView(true);
                setShowMobileActions(false);
              }}
              className="w-full justify-start"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowSuppliersView(true);
                setShowMobileActions(false);
              }}
              className="w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Suppliers
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowExportDialog(true);
                setShowMobileActions(false);
              }}
              disabled={filteredInventory.length === 0}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>

            {selectedProducts.length > 0 && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedProducts.length} products selected
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkStockDialog(true);
                      setShowMobileActions(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Bulk Stock Update
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Add Button for Mobile */}
      <div className="sm:hidden fixed bottom-20 right-4 z-40">
        <SecureButton
          permission="manage_inventory"
          onClick={() => setShowAddDialog(true)}
          className="h-14 w-14 rounded-full shadow-lg"
          size="sm"
        >
          <Plus className="w-6 h-6" />
        </SecureButton>
      </div>
    </PageLayout>
  );
}