import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Filter, 
  ChevronDown, 
  X, 
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { supabase } from "@/integrations/supabase/client";

export interface FilterOptions {
  search: string;
  category: string;
  supplier: string;
  stockLevel: 'all' | 'low' | 'out' | 'normal';
  priceRange: {
    min: number | null;
    max: number | null;
  };
  sortBy: 'name' | 'price' | 'stock' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, onReset }: AdvancedFiltersProps) {
  const currentStore = useCurrentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (currentStore) {
      fetchCategories();
      fetchSuppliers();
    }
  }, [currentStore]);

  const fetchCategories = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const updatePriceRange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    onFiltersChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [type]: numValue,
      },
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category !== 'all') count++;
    if (filters.supplier !== 'all') count++;
    if (filters.stockLevel !== 'all') count++;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getSortIcon = () => {
    if (filters.sortOrder === 'asc') {
      return <ArrowUp className="w-3 h-3" />;
    } else {
      return <ArrowDown className="w-3 h-3" />;
    }
  };

  return (
    <Card className="card-professional">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search and Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search Products</Label>
                <Input
                  placeholder="Search by name or SKU..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={filters.supplier} onValueChange={(value) => updateFilter('supplier', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock Level and Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Stock Level</Label>
                <Select value={filters.stockLevel} onValueChange={(value: any) => updateFilter('stockLevel', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                    <SelectItem value="normal">Normal Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={filters.priceRange.min || ''}
                    onChange={(e) => updatePriceRange('min', e.target.value)}
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={filters.priceRange.max || ''}
                    onChange={(e) => updatePriceRange('max', e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Product Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="stock">Stock Quantity</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Button
                  variant="outline"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full justify-start"
                >
                  {getSortIcon()}
                  <span className="ml-2">
                    {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </Button>
              
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied</span>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
