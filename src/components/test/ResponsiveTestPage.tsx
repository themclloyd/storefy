import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveSearch } from '@/components/ui/responsive-search';
import { ResponsiveFilters, QuickFilterButtons } from '@/components/ui/responsive-filters';
import { ResponsiveTable, ResponsiveTableHeader, ResponsiveTableBody, ResponsiveTableRow, ResponsiveTableCell, ResponsiveCardGrid } from '@/components/ui/responsive-table';
import { ResponsiveH1, ResponsiveH2, ResponsiveH3, ResponsiveBodyText, ResponsiveContainer, ResponsiveSection, ResponsiveCard } from '@/components/ui/responsive-typography';
import { useScreenSize } from '@/hooks/use-mobile';
import { responsiveGrid, responsiveSpacing, responsiveText, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  Star,
  Heart,
  Eye
} from 'lucide-react';

export function ResponsiveTestPage() {
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    price: { min: '', max: '' }
  });
  const [activeFilter, setActiveFilter] = useState('all');

  // Sample data for testing
  const sampleProducts = [
    { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics', stock: 25, status: 'active' },
    { id: 2, name: 'Coffee Mug', price: 12.99, category: 'Home', stock: 50, status: 'active' },
    { id: 3, name: 'Notebook', price: 8.99, category: 'Office', stock: 0, status: 'inactive' },
    { id: 4, name: 'Smartphone Case', price: 24.99, category: 'Electronics', stock: 15, status: 'active' },
    { id: 5, name: 'Desk Lamp', price: 45.99, category: 'Home', stock: 8, status: 'active' }
  ];

  const filterOptions = [
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'home', label: 'Home' },
        { value: 'office', label: 'Office' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      id: 'price',
      label: 'Price Range',
      type: 'range' as const,
      min: 0,
      max: 1000
    }
  ];

  return (
    <ResponsiveContainer size="full" className="py-6">
      {/* Header Section */}
      <ResponsiveSection spacing="md">
        <div className="text-center mb-8">
          <ResponsiveH1 className="mb-4">
            Responsive Design Test Page
          </ResponsiveH1>
          <ResponsiveBodyText className="text-muted-foreground max-w-2xl mx-auto">
            This page demonstrates all the responsive components and utilities implemented in the Storefy app.
            Test it across different screen sizes to see the adaptive behavior.
          </ResponsiveBodyText>
        </div>

        {/* Screen Size Indicator */}
        <Card className="mb-6">
          <CardContent className={responsiveSpacing.padding.sm}>
            <div className="flex items-center justify-center gap-4">
              <Badge variant={isMobile ? "default" : "outline"}>
                Mobile ({isMobile ? 'Active' : 'Inactive'})
              </Badge>
              <Badge variant={isTablet ? "default" : "outline"}>
                Tablet ({isTablet ? 'Active' : 'Inactive'})
              </Badge>
              <Badge variant={isDesktop ? "default" : "outline"}>
                Desktop ({isDesktop ? 'Active' : 'Inactive'})
              </Badge>
            </div>
          </CardContent>
        </Card>
      </ResponsiveSection>

      {/* Typography Section */}
      <ResponsiveSection spacing="md" background="muted">
        <ResponsiveH2 className="mb-6">Typography Scale</ResponsiveH2>
        <div className="space-y-4">
          <ResponsiveH1>Heading 1 - Responsive</ResponsiveH1>
          <ResponsiveH2>Heading 2 - Responsive</ResponsiveH2>
          <ResponsiveH3>Heading 3 - Responsive</ResponsiveH3>
          <ResponsiveBodyText>Body text that scales responsively across devices</ResponsiveBodyText>
          <ResponsiveBodyText className="text-muted-foreground" as="p">
            Muted text for secondary information
          </ResponsiveBodyText>
        </div>
      </ResponsiveSection>

      {/* Search and Filters Section */}
      <ResponsiveSection spacing="md">
        <ResponsiveH2 className="mb-6">Search & Filters</ResponsiveH2>
        
        <div className="space-y-6">
          {/* Responsive Search */}
          <ResponsiveSearch
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            placeholder="Search products..."
            showFilters={true}
            filterCount={Object.values(filters).filter(v => v && v !== 'all').length}
            compactMode={false}
          />

          {/* Quick Filter Buttons */}
          <QuickFilterButtons
            options={[
              { label: "All Products", value: "all", count: sampleProducts.length },
              { label: "Electronics", value: "electronics", count: 2 },
              { label: "Home", value: "home", count: 2 },
              { label: "Office", value: "office", count: 1 }
            ]}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />

          {/* Advanced Filters */}
          <ResponsiveFilters
            filters={filterOptions}
            values={filters}
            onChange={setFilters}
            onReset={() => setFilters({ category: 'all', status: 'all', price: { min: '', max: '' } })}
            title="Advanced Filters"
          />
        </div>
      </ResponsiveSection>

      {/* Grid Layouts Section */}
      <ResponsiveSection spacing="md" background="card">
        <ResponsiveH2 className="mb-6">Grid Layouts</ResponsiveH2>
        
        {/* Stats Cards */}
        <div className="mb-8">
          <ResponsiveH3 className="mb-4">Stats Grid</ResponsiveH3>
          <ResponsiveCardGrid variant="stats">
            <ResponsiveCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </ResponsiveCard>
            <ResponsiveCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">$45,678</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </ResponsiveCard>
            <ResponsiveCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">567</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </ResponsiveCard>
            <ResponsiveCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold">+12%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </ResponsiveCard>
          </ResponsiveCardGrid>
        </div>

        {/* Product Cards */}
        <div className="mb-8">
          <ResponsiveH3 className="mb-4">Product Grid</ResponsiveH3>
          <ResponsiveCardGrid variant="cards">
            {sampleProducts.slice(0, 4).map((product) => (
              <ResponsiveCard key={product.id} padding="md" hover clickable>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">${product.price}</span>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <Button className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </ResponsiveCard>
            ))}
          </ResponsiveCardGrid>
        </div>
      </ResponsiveSection>

      {/* Table Section */}
      <ResponsiveSection spacing="md">
        <ResponsiveH2 className="mb-6">Responsive Table</ResponsiveH2>
        
        <ResponsiveTable>
          <ResponsiveTableHeader>
            <tr>
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </ResponsiveTableHeader>
          <ResponsiveTableBody>
            {sampleProducts.map((product) => (
              <ResponsiveTableRow key={product.id}>
                <ResponsiveTableCell label="Product" primary>
                  {product.name}
                </ResponsiveTableCell>
                <ResponsiveTableCell label="Category">
                  {product.category}
                </ResponsiveTableCell>
                <ResponsiveTableCell label="Price">
                  ${product.price}
                </ResponsiveTableCell>
                <ResponsiveTableCell label="Stock">
                  {product.stock}
                </ResponsiveTableCell>
                <ResponsiveTableCell label="Status">
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </ResponsiveTableCell>
              </ResponsiveTableRow>
            ))}
          </ResponsiveTableBody>
        </ResponsiveTable>
      </ResponsiveSection>

      {/* Touch-Friendly Elements */}
      <ResponsiveSection spacing="md" background="muted">
        <ResponsiveH2 className="mb-6">Touch-Friendly Elements</ResponsiveH2>
        
        <div className={cn("grid gap-4", responsiveGrid.split)}>
          <ResponsiveCard padding="md">
            <ResponsiveH3 className="mb-4">Button Sizes</ResponsiveH3>
            <div className="space-y-3">
              <Button size="sm" className="w-full">Small Button</Button>
              <Button size="default" className="w-full">Default Button</Button>
              <Button size="lg" className="w-full">Large Button</Button>
            </div>
          </ResponsiveCard>
          
          <ResponsiveCard padding="md">
            <ResponsiveH3 className="mb-4">Touch Targets</ResponsiveH3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Button
                  key={i}
                  variant="outline"
                  className={cn(touchFriendly.minTouch, "aspect-square")}
                >
                  {i}
                </Button>
              ))}
            </div>
          </ResponsiveCard>
        </div>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
}
