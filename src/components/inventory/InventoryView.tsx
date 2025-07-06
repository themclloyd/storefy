import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, AlertTriangle, Edit, Trash2 } from "lucide-react";

const sampleInventory = [
  {
    id: '1',
    name: 'Premium Coffee Beans',
    sku: 'COFFEE-001',
    category: 'Beverages',
    stock: 45,
    lowStockThreshold: 10,
    price: 24.99,
    cost: 12.50,
    supplier: 'Coffee Co.',
  },
  {
    id: '2',
    name: 'Organic Tea Set',
    sku: 'TEA-002',
    category: 'Beverages',
    stock: 8,
    lowStockThreshold: 15,
    price: 15.99,
    cost: 8.00,
    supplier: 'Tea Masters',
  },
  {
    id: '3',
    name: 'Ceramic Mug',
    sku: 'MUG-003',
    category: 'Accessories',
    stock: 23,
    lowStockThreshold: 5,
    price: 8.99,
    cost: 4.25,
    supplier: 'Ceramics Plus',
  },
  {
    id: '4',
    name: 'Artisan Cookies',
    sku: 'COOKIE-004',
    category: 'Food',
    stock: 2,
    lowStockThreshold: 10,
    price: 12.99,
    cost: 6.50,
    supplier: 'Bakery Fresh',
  },
];

export function InventoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(sampleInventory.map(item => item.category)))];
  
  const filteredInventory = sampleInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = sampleInventory.filter(item => item.stock <= item.lowStockThreshold);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your product inventory
          </p>
        </div>
        <Button className="bg-gradient-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{sampleInventory.length}</div>
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
              ${sampleInventory.reduce((sum, item) => sum + (item.stock * item.cost), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-professional">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-foreground">Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.sku}</Badge>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={item.stock <= item.lowStockThreshold ? "text-warning font-medium" : ""}>
                        {item.stock}
                      </span>
                      {item.stock <= item.lowStockThreshold && (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${item.price}</TableCell>
                  <TableCell>${item.cost}</TableCell>
                  <TableCell className="text-muted-foreground">{item.supplier}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}