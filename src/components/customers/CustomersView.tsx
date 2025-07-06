import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, Phone, Mail, Edit, Eye } from "lucide-react";

const sampleCustomers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1 (555) 123-4567',
    totalOrders: 15,
    totalSpent: 425.67,
    lastOrder: '2024-01-10',
    status: 'active',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@email.com',
    phone: '+1 (555) 234-5678',
    totalOrders: 8,
    totalSpent: 189.34,
    lastOrder: '2024-01-08',
    status: 'active',
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily@email.com',
    phone: '+1 (555) 345-6789',
    totalOrders: 23,
    totalSpent: 1247.89,
    lastOrder: '2024-01-12',
    status: 'vip',
  },
  {
    id: '4',
    name: 'Robert Wilson',
    email: 'robert@email.com',
    phone: '+1 (555) 456-7890',
    totalOrders: 3,
    totalSpent: 67.45,
    lastOrder: '2023-12-15',
    status: 'inactive',
  },
];

export function CustomersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const statuses = ["all", "active", "vip", "inactive"];
  
  const filteredCustomers = sampleCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesStatus = selectedStatus === "all" || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = sampleCustomers.length;
  const activeCustomers = sampleCustomers.filter(c => c.status === 'active').length;
  const vipCustomers = sampleCustomers.filter(c => c.status === 'vip').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your customer relationships and track purchase history
          </p>
        </div>
        <Button className="bg-gradient-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeCustomers}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VIP Customers
            </CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{vipCustomers}</div>
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-foreground">Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{customer.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{customer.totalOrders}</TableCell>
                  <TableCell className="font-medium text-success">
                    ${customer.totalSpent.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.lastOrder}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === 'vip' ? 'default' :
                        customer.status === 'active' ? 'secondary' : 'outline'
                      }
                      className={
                        customer.status === 'vip' ? 'bg-warning text-warning-foreground' :
                        customer.status === 'active' ? 'bg-success/10 text-success' :
                        'text-muted-foreground'
                      }
                    >
                      {customer.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
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