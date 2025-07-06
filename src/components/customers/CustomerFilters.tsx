import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  DollarSign,
  ShoppingCart,
  Users
} from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  total_orders: number | null;
  total_spent: number | null;
  status: string | null;
  created_at: string;
}

interface FilterOptions {
  searchTerm: string;
  status: string;
  minSpent: string;
  maxSpent: string;
  minOrders: string;
  maxOrders: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface CustomerFiltersProps {
  customers: Customer[];
  onFilteredCustomersChange: (filtered: Customer[]) => void;
}

export function CustomerFilters({ customers, onFilteredCustomersChange }: CustomerFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    status: "all",
    minSpent: "",
    maxSpent: "",
    minOrders: "",
    maxOrders: "",
    dateFrom: undefined,
    dateTo: undefined,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const applyFilters = (newFilters: FilterOptions) => {
    let filtered = [...customers];

    // Text search
    if (newFilters.searchTerm) {
      const searchLower = newFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.includes(newFilters.searchTerm))
      );
    }

    // Status filter
    if (newFilters.status !== "all") {
      filtered = filtered.filter(customer => customer.status === newFilters.status);
    }

    // Spending range filter
    if (newFilters.minSpent) {
      const minSpent = parseFloat(newFilters.minSpent);
      filtered = filtered.filter(customer => (customer.total_spent || 0) >= minSpent);
    }
    if (newFilters.maxSpent) {
      const maxSpent = parseFloat(newFilters.maxSpent);
      filtered = filtered.filter(customer => (customer.total_spent || 0) <= maxSpent);
    }

    // Orders range filter
    if (newFilters.minOrders) {
      const minOrders = parseInt(newFilters.minOrders);
      filtered = filtered.filter(customer => (customer.total_orders || 0) >= minOrders);
    }
    if (newFilters.maxOrders) {
      const maxOrders = parseInt(newFilters.maxOrders);
      filtered = filtered.filter(customer => (customer.total_orders || 0) <= maxOrders);
    }

    // Date range filter
    if (newFilters.dateFrom) {
      filtered = filtered.filter(customer => 
        new Date(customer.created_at) >= newFilters.dateFrom!
      );
    }
    if (newFilters.dateTo) {
      filtered = filtered.filter(customer => 
        new Date(customer.created_at) <= newFilters.dateTo!
      );
    }

    onFilteredCustomersChange(filtered);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      searchTerm: "",
      status: "all",
      minSpent: "",
      maxSpent: "",
      minOrders: "",
      maxOrders: "",
      dateFrom: undefined,
      dateTo: undefined,
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== "all") count++;
    if (filters.minSpent || filters.maxSpent) count++;
    if (filters.minOrders || filters.maxOrders) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="card-professional">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Basic Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Spending Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="w-4 h-4" />
                    Total Spent Range
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min $"
                      value={filters.minSpent}
                      onChange={(e) => updateFilter('minSpent', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Max $"
                      value={filters.maxSpent}
                      onChange={(e) => updateFilter('maxSpent', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Orders Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <ShoppingCart className="w-4 h-4" />
                    Total Orders Range
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minOrders}
                      onChange={(e) => updateFilter('minOrders', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxOrders}
                      onChange={(e) => updateFilter('maxOrders', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <CalendarIcon className="w-4 h-4" />
                    Join Date Range
                  </Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? format(filters.dateFrom, "MMM dd") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => updateFilter('dateFrom', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? format(filters.dateTo, "MMM dd") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => updateFilter('dateTo', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Quick Filter Presets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Filters</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFilter('status', 'vip');
                      updateFilter('minSpent', '500');
                    }}
                  >
                    High Value (VIP, $500+)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFilter('minOrders', '10');
                      updateFilter('status', 'active');
                    }}
                  >
                    Frequent Buyers (10+ orders)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      updateFilter('dateFrom', thirtyDaysAgo);
                    }}
                  >
                    New Customers (30 days)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateFilter('status', 'inactive');
                      updateFilter('maxOrders', '2');
                    }}
                  >
                    At Risk (Inactive, ≤2 orders)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </span>
              {filters.status !== "all" && (
                <Badge variant="secondary" className="capitalize">
                  {filters.status}
                </Badge>
              )}
              {(filters.minSpent || filters.maxSpent) && (
                <Badge variant="secondary">
                  ${filters.minSpent || '0'} - ${filters.maxSpent || '∞'}
                </Badge>
              )}
              {(filters.minOrders || filters.maxOrders) && (
                <Badge variant="secondary">
                  {filters.minOrders || '0'} - {filters.maxOrders || '∞'} orders
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
