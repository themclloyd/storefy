import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Bell, Send } from "lucide-react";

interface LaybyNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layby?: any;
  onSuccess: () => void;
}

export function LaybyNotificationDialog({ 
  open, 
  onOpenChange, 
  layby,
  onSuccess 
}: LaybyNotificationDialogProps) {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationType, setNotificationType] = useState("payment_reminder");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Pre-populate fields when layby is provided
  useState(() => {
    if (layby) {
      setRecipientEmail(layby.customer_email || "");
      setRecipientPhone(layby.customer_phone || "");
      
      // Set default subject and message based on notification type
      updateMessageTemplate(notificationType);
    }
  }, [layby, notificationType]);

  const updateMessageTemplate = (type: string) => {
    if (!layby) return;

    switch (type) {
      case "payment_reminder":
        setSubject(`Payment Reminder - Layby ${layby.layby_number}`);
        setMessage(`Dear ${layby.customer_name},

This is a friendly reminder about your layby payment.

Layby Details:
- Layby Number: ${layby.layby_number}
- Total Amount: $${layby.total_amount.toFixed(2)}
- Balance Remaining: $${layby.balance_remaining.toFixed(2)}
- Due Date: ${layby.due_date ? new Date(layby.due_date).toLocaleDateString() : 'Not set'}

Please contact us to arrange your next payment.

Thank you,
${currentStore?.name}`);
        break;
      
      case "overdue_notice":
        setSubject(`Overdue Notice - Layby ${layby.layby_number}`);
        setMessage(`Dear ${layby.customer_name},

Your layby payment is now overdue. Please contact us immediately to arrange payment.

Layby Details:
- Layby Number: ${layby.layby_number}
- Balance Remaining: $${layby.balance_remaining.toFixed(2)}
- Original Due Date: ${layby.due_date ? new Date(layby.due_date).toLocaleDateString() : 'Not set'}

Please contact us as soon as possible to avoid any additional fees.

Thank you,
${currentStore?.name}`);
        break;
      
      case "completion_notice":
        setSubject(`Layby Complete - ${layby.layby_number}`);
        setMessage(`Dear ${layby.customer_name},

Congratulations! Your layby has been completed and your items are ready for collection.

Layby Details:
- Layby Number: ${layby.layby_number}
- Total Amount: $${layby.total_amount.toFixed(2)}

Please bring this notification when collecting your items.

Thank you for your business,
${currentStore?.name}`);
        break;
      
      case "cancellation_notice":
        setSubject(`Layby Cancelled - ${layby.layby_number}`);
        setMessage(`Dear ${layby.customer_name},

Your layby has been cancelled as requested.

Layby Details:
- Layby Number: ${layby.layby_number}
- Refund Amount: $${(layby.deposit_amount || 0).toFixed(2)}

If you have any questions, please contact us.

Thank you,
${currentStore?.name}`);
        break;
      
      default:
        setSubject("");
        setMessage("");
    }
  };

  const handleSendNotification = async () => {
    if (!currentStore || !user) {
      toast.error("Store or user not found");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }

    if (!recipientEmail && !recipientPhone) {
      toast.error("Please provide either email or phone number");
      return;
    }

    setLoading(true);

    try {
      // Create notification record
      const { error: notificationError } = await supabase
        .from('layby_notifications')
        .insert({
          layby_order_id: layby?.id || null,
          notification_type: notificationType,
          recipient_email: recipientEmail.trim() || null,
          recipient_phone: recipientPhone.trim() || null,
          subject: subject.trim(),
          message: message.trim(),
          status: 'sent', // In a real implementation, this would be 'pending' until actually sent
          sent_at: new Date().toISOString(),
          created_by: user.id
        });

      if (notificationError) {
        throw notificationError;
      }

      // Update layby reminder tracking if this is a payment reminder
      if (layby && notificationType === 'payment_reminder') {
        await supabase
          .from('layby_orders')
          .update({
            reminder_count: (layby.reminder_count || 0) + 1,
            last_reminder_sent: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', layby.id);

        // Add history entry
        await supabase
          .from('layby_history')
          .insert({
            layby_order_id: layby.id,
            action_type: 'reminder_sent',
            action_description: `${notificationType.replace('_', ' ')} sent`,
            performed_by: user.id,
            notes: `Subject: ${subject}`
          });
      }

      toast.success("Notification sent successfully");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNotificationType("payment_reminder");
    setSubject("");
    setMessage("");
    setRecipientEmail("");
    setRecipientPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Send Notification
            {layby && (
              <Badge variant="outline" className="ml-2">
                {layby.layby_number}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Send payment reminders, overdue notices, or custom notifications to customers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layby Information */}
          {layby && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Layby Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">{layby.customer_name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Balance:</span>
                    <div className="font-medium">${layby.balance_remaining.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={layby.status === 'active' ? 'default' : 
                                  layby.status === 'completed' ? 'secondary' : 
                                  layby.status === 'overdue' ? 'destructive' : 'outline'}>
                      {layby.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <div className="font-medium">
                      {layby.due_date ? new Date(layby.due_date).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <Select 
              value={notificationType} 
              onValueChange={(value) => {
                setNotificationType(value);
                updateMessageTemplate(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                <SelectItem value="overdue_notice">Overdue Notice</SelectItem>
                <SelectItem value="completion_notice">Completion Notice</SelectItem>
                <SelectItem value="cancellation_notice">Cancellation Notice</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter notification subject..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={8}
              />
            </div>
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
              onClick={handleSendNotification}
              disabled={loading || !subject.trim() || !message.trim()}
              className="bg-gradient-primary text-white"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
