import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Crown, 
  UserCheck, 
  UserX, 
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart
} from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface CustomerStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onStatusUpdated: () => void;
}

const VIP_THRESHOLD = 500; // Minimum spending to qualify for VIP
const ACTIVE_ORDER_THRESHOLD = 5; // Minimum orders to maintain active status

export function CustomerStatusDialog({ 
  open, 
  onOpenChange, 
  customer,
  onStatusUpdated 
}: CustomerStatusDialogProps) {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  if (!customer) return null;

  const currentStatus = customer.status || 'active';
  const totalSpent = customer.total_spent || 0;
  const totalOrders = customer.total_orders || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip':
        return <Crown className="w-4 h-4 text-warning" />;
      case 'active':
        return <UserCheck className="w-4 h-4 text-success" />;
      case 'inactive':
        return <UserX className="w-4 h-4 text-muted-foreground" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip':
        return 'bg-warning text-warning-foreground';
      case 'active':
        return 'bg-success/10 text-success';
      case 'inactive':
        return 'text-muted-foreground';
      default:
        return 'bg-success/10 text-success';
    }
  };

  const getRecommendedStatus = () => {
    if (totalSpent >= VIP_THRESHOLD) {
      return 'vip';
    } else if (totalOrders >= ACTIVE_ORDER_THRESHOLD) {
      return 'active';
    } else {
      return 'inactive';
    }
  };

  const recommendedStatus = getRecommendedStatus();
  const isRecommendationDifferent = recommendedStatus !== currentStatus;

  const handleStatusUpdate = async () => {
    if (!currentStore || !customer || !newStatus) {
      toast.error("Please select a status");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id)
        .eq('store_id', currentStore.id);

      if (error) {
        console.error('Error updating customer status:', error);
        toast.error('Failed to update customer status');
        return;
      }

      toast.success(`Customer status updated to ${newStatus.toUpperCase()}`);
      onStatusUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Update Customer Status
          </DialogTitle>
          <DialogDescription>
            Change the status for {customer.name} based on their activity and spending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentStatus)}
                  <span className="font-medium">Current Status</span>
                </div>
                <Badge className={getStatusColor(currentStatus)} variant="secondary">
                  {currentStatus.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="font-semibold">{totalOrders}</div>
                  <div className="text-muted-foreground">Orders</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="font-semibold">${totalSpent.toFixed(2)}</div>
                  <div className="text-muted-foreground">Spent</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="font-semibold">
                    ${totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-muted-foreground">Avg Order</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation */}
          {isRecommendationDifferent && (
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  <span className="font-medium text-warning">Recommendation</span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Based on customer activity, we recommend changing status to:
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(recommendedStatus)}
                  <Badge className={getStatusColor(recommendedStatus)} variant="secondary">
                    {recommendedStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {recommendedStatus === 'vip' && `Customer has spent $${totalSpent.toFixed(2)} (≥ $${VIP_THRESHOLD} VIP threshold)`}
                  {recommendedStatus === 'active' && `Customer has ${totalOrders} orders (≥ ${ACTIVE_ORDER_THRESHOLD} active threshold)`}
                  {recommendedStatus === 'inactive' && `Customer has low activity (< ${ACTIVE_ORDER_THRESHOLD} orders)`}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">New Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-success" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="vip">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-warning" />
                    VIP
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-muted-foreground" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Descriptions */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Crown className="w-3 h-3 text-warning" />
              <span><strong>VIP:</strong> High-value customers with special privileges</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-3 h-3 text-success" />
              <span><strong>Active:</strong> Regular customers with recent activity</span>
            </div>
            <div className="flex items-center gap-2">
              <UserX className="w-3 h-3 text-muted-foreground" />
              <span><strong>Inactive:</strong> Customers with low or no recent activity</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {isRecommendationDifferent && (
            <Button
              variant="outline"
              onClick={() => setNewStatus(recommendedStatus)}
              disabled={loading}
              className="border-warning text-warning hover:bg-warning/10"
            >
              Use Recommended
            </Button>
          )}
          <Button
            onClick={handleStatusUpdate}
            disabled={loading || !newStatus || newStatus === currentStatus}
            className="bg-gradient-primary text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
