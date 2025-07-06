import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, Phone, Mail, Edit, Eye, Loader2 } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_orders: number | null;
  total_spent: number | null;
  status: string | null;
  created_at: string;
  last_order_date?: string | null;
}

export function CustomersView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const statuses = ["all", "active", "vip", "inactive"];

  useEffect(() => {
    if (currentStore && user) {
      fetchCustomers();
    }
  }, [currentStore, user]);

  const fetchCustomers = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          phone,
          total_orders,
          total_spent,
          status,
          created_at
        `)
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
        return;
      }

      // For each customer, get their last order date
      const customersWithLastOrder = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('created_at')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...customer,
            last_order_date: lastOrder?.created_at || null,
          };
        })
      );

      setCustomers(customersWithLastOrder);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (customer.phone && customer.phone.includes(searchTerm));
    const matchesStatus = selectedStatus === "all" || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customers...</span>
      </div>
    );
  }

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
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {customers.length === 0 ? "No customers found. Add your first customer to get started." : "No customers match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{customer.total_orders || 0}</TableCell>
                    <TableCell className="font-medium text-success">
                      ${(customer.total_spent || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString()
                        : 'No orders yet'
                      }
                    </TableCell>
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
                        {(customer.status || 'active').toUpperCase()}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}