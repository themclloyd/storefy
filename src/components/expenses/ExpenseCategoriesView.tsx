import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FolderOpen, Edit, Trash2, Loader2, Palette } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddExpenseCategoryDialog } from "./AddExpenseCategoryDialog";
import { EditExpenseCategoryDialog } from "./EditExpenseCategoryDialog";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  expense_count?: number;
}

interface ExpenseCategoriesViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesUpdated: () => void;
}

export function ExpenseCategoriesView({ 
  open, 
  onOpenChange, 
  onCategoriesUpdated 
}: ExpenseCategoriesViewProps) {
  const currentStore = useCurrentStore();
  const user = useUser();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  useEffect(() => {
    if (open && currentStore) {
      fetchCategories();
    }
  }, [open, currentStore]);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch expense counts for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          if (countError) {
            console.error('Error counting expenses for category:', countError);
            return { ...category, expense_count: 0 };
          }

          return { ...category, expense_count: count || 0 };
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

  const filterCategories = () => {
    let filtered = [...categories];

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setShowEditCategory(true);
  };

  const handleDeleteCategory = async (category: ExpenseCategory) => {
    if (category.expense_count && category.expense_count > 0) {
      toast.error(`Cannot delete category "${category.name}" because it has ${category.expense_count} associated expenses`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      fetchCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const toggleCategoryStatus = async (category: ExpenseCategory) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      toast.success(`Category ${category.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Failed to update category status');
    }
  };

  const handleCategoryAdded = () => {
    fetchCategories();
    onCategoriesUpdated();
  };

  const handleCategoryUpdated = () => {
    fetchCategories();
    onCategoriesUpdated();
  };

  const createDefaultCategories = async () => {
    if (!currentStore) return;

    try {
      const { error } = await supabase
        .rpc('create_default_expense_categories', { store_id: currentStore.id });

      if (error) throw error;

      toast.success('Default categories created successfully');
      fetchCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast.error('Failed to create default categories');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Categories</DialogTitle>
            <DialogDescription>
              Manage your expense categories to organize and track business expenses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {categories.length === 0 && !loading && (
                  <Button
                    variant="outline"
                    onClick={createDefaultCategories}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Create Defaults
                  </Button>
                )}
                <Button onClick={() => setShowAddCategory(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            {/* Categories Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Categories ({filteredCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {searchTerm ? "No categories found" : "No categories yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm 
                        ? "Try adjusting your search terms"
                        : "Create categories to organize your expenses"
                      }
                    </p>
                    {!searchTerm && (
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={createDefaultCategories}
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Create Defaults
                        </Button>
                        <Button onClick={() => setShowAddCategory(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Category
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Expenses</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px] truncate">
                                {category.description || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded border" 
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-xs font-mono">
                                  {category.color}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {category.expense_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={category.is_active ? "default" : "secondary"}
                                className="cursor-pointer"
                                onClick={() => toggleCategoryStatus(category)}
                              >
                                {category.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-destructive hover:text-destructive"
                                  disabled={category.expense_count > 0}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <AddExpenseCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Edit Category Dialog */}
      <EditExpenseCategoryDialog
        open={showEditCategory}
        onOpenChange={setShowEditCategory}
        category={selectedCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />
    </>
  );
}
