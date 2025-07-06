import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FolderOpen, Edit, Trash2, Loader2, Package } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  product_count?: number;
}

interface CategoriesViewProps {
  onClose: () => void;
  onViewCategoryProducts?: (categoryId: string, categoryName: string) => void;
}

export function CategoriesView({ onClose, onViewCategoryProducts }: CategoriesViewProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (currentStore && user) {
      fetchCategories();
    }
  }, [currentStore, user]);

  const fetchCategories = async () => {
    if (!currentStore) return;

    try {
      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, description, created_at')
        .eq('store_id', currentStore.id)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        toast.error('Failed to load categories');
        return;
      }

      // Fetch product counts for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('is_active', true);

          if (countError) {
            console.error('Error counting products for category:', countError);
            return { ...category, product_count: 0 };
          }

          return { ...category, product_count: count || 0 };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

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
    fetchCategories();
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
          <Button variant="outline" onClick={onClose}>
            Back to Inventory
          </Button>
          <Button 
            className="bg-gradient-primary text-white"
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
                        {new Date(category.created_at).toLocaleDateString()}
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
        onCategoryAdded={fetchCategories}
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
