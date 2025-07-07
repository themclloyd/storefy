import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Bell, Trash2, AlertTriangle, DollarSign } from "lucide-react";

interface LaybyBulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLaybyIds: string[];
  laybyOrders: any[];
  onSuccess: () => void;
}

export function LaybyBulkActionsDialog({ 
  open, 
  onOpenChange, 
  selectedLaybyIds, 
  laybyOrders,
  onSuccess 
}: LaybyBulkActionsDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("");

  const selectedLaybys = laybyOrders.filter(layby => selectedLaybyIds.includes(layby.id));

  const handleBulkAction = async () => {
    if (!selectedAction) {
      toast.error("Please select an action");
      return;
    }

    if (!currentStore || !user) {
      toast.error("Store or user not found");
      return;
    }

    setLoading(true);

    try {
      switch (selectedAction) {
        case "update_status":
          if (!newStatus) {
            toast.error("Please select a new status");
            return;
          }
          await updateStatus();
          break;
        case "update_priority":
          if (!priorityLevel) {
            toast.error("Please select a priority level");
            return;
          }
          await updatePriority();
          break;
        case "send_reminders":
          await sendReminders();
          break;
        case "add_notes":
          if (!notes.trim()) {
            toast.error("Please enter notes");
            return;
          }
          await addNotes();
          break;
        default:
          toast.error("Invalid action selected");
          return;
      }

      toast.success(`Bulk action completed for ${selectedLaybyIds.length} layby orders`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    const { error } = await supabase
      .from('layby_orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedLaybyIds);

    if (error) throw error;

    // Add history entries
    const historyEntries = selectedLaybyIds.map(id => ({
      layby_order_id: id,
      action_type: 'status_changed',
      action_description: `Status changed to ${newStatus}`,
      performed_by: user.id,
      notes: notes.trim() || null
    }));

    await supabase.from('layby_history').insert(historyEntries);
  };

  const updatePriority = async () => {
    const { error } = await supabase
      .from('layby_orders')
      .update({ 
        priority_level: priorityLevel,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedLaybyIds);

    if (error) throw error;

    // Add history entries
    const historyEntries = selectedLaybyIds.map(id => ({
      layby_order_id: id,
      action_type: 'status_changed',
      action_description: `Priority changed to ${priorityLevel}`,
      performed_by: user.id,
      notes: notes.trim() || null
    }));

    await supabase.from('layby_history').insert(historyEntries);
  };

  const sendReminders = async () => {
    // Create notification entries for each layby
    const notifications = selectedLaybys.map(layby => ({
      layby_order_id: layby.id,
      notification_type: 'payment_reminder',
      recipient_email: layby.customer_email,
      recipient_phone: layby.customer_phone,
      subject: `Payment Reminder - Layby ${layby.layby_number}`,
      message: `Dear ${layby.customer_name}, this is a reminder about your layby payment. Balance remaining: $${layby.balance_remaining.toFixed(2)}`,
      created_by: user.id
    }));

    const { error } = await supabase
      .from('layby_notifications')
      .insert(notifications);

    if (error) throw error;

    // Update reminder count and last reminder sent
    await supabase
      .from('layby_orders')
      .update({
        reminder_count: supabase.raw('reminder_count + 1'),
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', selectedLaybyIds);

    // Add history entries
    const historyEntries = selectedLaybyIds.map(id => ({
      layby_order_id: id,
      action_type: 'reminder_sent',
      action_description: 'Payment reminder sent',
      performed_by: user.id,
      notes: notes.trim() || null
    }));

    await supabase.from('layby_history').insert(historyEntries);
  };

  const addNotes = async () => {
    // Add history entries with notes
    const historyEntries = selectedLaybyIds.map(id => ({
      layby_order_id: id,
      action_type: 'status_changed',
      action_description: 'Notes added via bulk action',
      performed_by: user.id,
      notes: notes.trim()
    }));

    await supabase.from('layby_history').insert(historyEntries);
  };

  const resetForm = () => {
    setSelectedAction("");
    setNewStatus("");
    setPriorityLevel("");
    setNotes("");
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "update_status": return <CheckCircle className="w-4 h-4" />;
      case "update_priority": return <AlertTriangle className="w-4 h-4" />;
      case "send_reminders": return <Mail className="w-4 h-4" />;
      case "add_notes": return <Bell className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Actions - {selectedLaybyIds.length} Selected</DialogTitle>
          <DialogDescription>
            Perform bulk operations on multiple layby orders including status updates, reminders, and notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Layby Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Layby Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedLaybys.map(layby => (
                  <div key={layby.id} className="flex items-center justify-between text-sm">
                    <span>{layby.layby_number} - {layby.customer_name}</span>
                    <Badge variant={layby.status === 'active' ? 'default' : 
                                  layby.status === 'completed' ? 'secondary' : 
                                  layby.status === 'overdue' ? 'destructive' : 'outline'}>
                      {layby.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="action">Select Action</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_status">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Update Status
                    </div>
                  </SelectItem>
                  <SelectItem value="update_priority">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Update Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="send_reminders">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send Payment Reminders
                    </div>
                  </SelectItem>
                  <SelectItem value="add_notes">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Add Notes
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields */}
            {selectedAction === "update_status" && (
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === "update_priority" && (
              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priorityLevel} onValueChange={setPriorityLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedAction === "add_notes" || selectedAction === "send_reminders") && (
              <div>
                <Label htmlFor="notes">
                  {selectedAction === "add_notes" ? "Notes" : "Additional Message (Optional)"}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={selectedAction === "add_notes" ? 
                    "Enter notes to add to selected layby orders..." :
                    "Optional additional message for reminders..."}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={loading || !selectedAction}
              className="bg-gradient-primary text-white"
            >
              {loading ? "Processing..." : `Apply to ${selectedLaybyIds.length} Orders`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
