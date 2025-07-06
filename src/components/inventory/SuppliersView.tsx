import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Building2, Edit, Trash2, Loader2, Mail, Phone, Globe } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

interface SuppliersViewProps {
  onClose: () => void;
  onViewSupplierProducts?: (supplierId: string, supplierName: string) => void;
}

export function SuppliersView({ onClose, onViewSupplierProducts }: SuppliersViewProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (currentStore && user) {
      fetchSuppliers();
    }
  }, [currentStore, user]);

  const fetchSuppliers = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Failed to load suppliers');
        return;
      }

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSuppliers = suppliers.filter(supplier => supplier.is_active);

  // Dialog handlers
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditDialog(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteDialog(true);
  };

  const handleDialogClose = () => {
    setSelectedSupplier(null);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
  };

  const handleSupplierUpdated = () => {
    fetchSuppliers();
    handleDialogClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading suppliers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supplier Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your suppliers and vendor information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Back to Inventory
          </Button>
          <Button 
            className="bg-gradient-primary text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{suppliers.length}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeSuppliers.length}</div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {suppliers.length - activeSuppliers.length}
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
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-foreground">Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {suppliers.length === 0 ? "No suppliers found. Add your first supplier to get started." : "No suppliers match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div
                          className="font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => onViewSupplierProducts?.(supplier.id, supplier.name)}
                          title={`View products from ${supplier.name}`}
                        >
                          {supplier.name}
                        </div>
                        {supplier.address && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {supplier.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.contact_person || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <a 
                            href={`mailto:${supplier.email}`}
                            className="text-primary hover:underline"
                          >
                            {supplier.email}
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <a 
                            href={`tel:${supplier.phone}`}
                            className="text-primary hover:underline"
                          >
                            {supplier.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {supplier.website && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(supplier.website, '_blank')}
                            title="Visit Website"
                          >
                            <Globe className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSupplier(supplier)}
                          title="Edit Supplier"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSupplier(supplier)}
                          title="Delete Supplier"
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddSupplierDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSupplierAdded={fetchSuppliers}
      />

      <EditSupplierDialog
        open={showEditDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        supplier={selectedSupplier}
        onSupplierUpdated={handleSupplierUpdated}
      />

      <DeleteSupplierDialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && handleDialogClose()}
        supplier={selectedSupplier}
        onSupplierDeleted={handleSupplierUpdated}
      />
    </div>
  );
}
