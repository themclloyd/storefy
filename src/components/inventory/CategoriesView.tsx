import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FolderOpen, Edit, Trash2, Loader2, Package } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { useInventoryStore, useCategories, type Category } from "@/stores/inventoryStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";



interface CategoriesViewProps {
  onClose: () => void;
  onViewCategoryProducts?: (categoryId: string, categoryName: string) => void;
}

export function CategoriesView({ onClose, onViewCategoryProducts }: CategoriesViewProps) {
  const currentStore = useCurrentStore();
  const user = useUser();
  const navigate = useNavigate();

  // Use Zustand store state
  const categories = useCategories();
  const loading = useInventoryStore(state => state.loading);
  const searchTerm = useInventoryStore(state => state.categorySearchTerm);
  const showAddDialog = useInventoryStore(state => state.showAddCategoryDialog);
  const showEditDialog = useInventoryStore(state => state.showEditCategoryDialog);
  const showDeleteDialog = useInventoryStore(state => state.showDeleteCategoryDialog);
  const selectedCategory = useInventoryStore(state => state.selectedCategoryEntity);

  // Actions from Zustand
  const setSearchTerm = useInventoryStore(state => state.setCategorySearchTerm);
  const setShowAddDialog = useInventoryStore(state => state.setShowAddCategoryDialog);
  const setShowEditDialog = useInventoryStore(state => state.setShowEditCategoryDialog);
  const setShowDeleteDialog = useInventoryStore(state => state.setShowDeleteCategoryDialog);
  const setSelectedCategory = useInventoryStore(state => state.setSelectedCategoryEntity);
  const fetchCategories = useInventoryStore(state => state.fetchCategories);

  useEffect(() => {
    if (currentStore?.id && user) {
      fetchCategories(currentStore.id);
    }
  }, [currentStore?.id, user, fetchCategories]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dialog handlers
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditDialog(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleDialogClose = () => {
    setSelectedCategory(null);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
  };

  const handleCategoryUpdated = () => {
    if (currentStore?.id) {
      fetchCategories(currentStore.id);
    }
    handleDialogClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Category Management</h1>
          <p className="text-muted-foreground mt-1 md:mt-2">
            Organize your products with categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // If onClose is a no-op (empty function), navigate to inventory
              if (onClose.toString() === '() => {}') {
                navigate('/app/inventory');
              } else {
                onClose();
              }
            }}
          >
            Back to Inventory
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{categories.length}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories with Products
            </CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {categories.filter(cat => (cat.product_count || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empty Categories
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {categories.filter(cat => (cat.product_count || 0) === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-professional">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-foreground">Categories</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredCategories.length} of {categories.length} categories</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {categories.length === 0 ? "No categories found. Add your first category to get started." : "No categories match your search criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onViewCategoryProducts?.(category.id, category.name)}
                            title={`View products in ${category.name}`}
                          >
                            {category.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {category.description ? (
                          <div className="max-w-[300px] truncate" title={category.description}>
                            {category.description}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.product_count ? "default" : "secondary"}>
                          {category.product_count || 0} products
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditCategory(category)}
                            title="Edit Category"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                            title="Delete Category"
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
      <AddCategoryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCategoryAdded={() => currentStore?.id && fetchCategories(currentStore.id)}
      />

      <EditCategoryDialog
        open={showEditDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        category={selectedCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />

      <DeleteCategoryDialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        category={selectedCategory}
        onCategoryDeleted={handleCategoryUpdated}
      />
    </div>
  );
}
