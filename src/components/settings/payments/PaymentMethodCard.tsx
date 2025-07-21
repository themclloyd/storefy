import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { SecureButton } from "@/components/auth/SecureAction";
import { type PaymentMethod } from "@/stores/settingsStore";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  showAccountNumbers: boolean;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void;
  onToggleAccountNumbers: () => void;
}

export function PaymentMethodCard({
  paymentMethod,
  showAccountNumbers,
  onEdit,
  onDelete,
  onToggleAccountNumbers
}: PaymentMethodCardProps) {
  const getProviderIcon = (provider: string) => {
    // You can expand this with specific icons for different providers
    return <CreditCard className="w-5 h-5" />;
  };

  const getProviderBadgeVariant = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'mpesa':
        return 'default' as const;
      case 'airtel_money':
        return 'secondary' as const;
      case 'bank':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    if (accountNumber.length <= 4) return accountNumber;
    
    const visibleStart = accountNumber.slice(0, 2);
    const visibleEnd = accountNumber.slice(-2);
    const maskedMiddle = '*'.repeat(Math.max(0, accountNumber.length - 4));
    
    return `${visibleStart}${maskedMiddle}${visibleEnd}`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getProviderIcon(paymentMethod.provider)}
              <div>
                <p className="font-medium text-foreground">{paymentMethod.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {showAccountNumbers 
                      ? paymentMethod.account_number 
                      : maskAccountNumber(paymentMethod.account_number)
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleAccountNumbers}
                    className="h-6 w-6 p-0"
                  >
                    {showAccountNumbers ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={getProviderBadgeVariant(paymentMethod.provider)}>
              {paymentMethod.provider.replace('_', ' ').toUpperCase()}
            </Badge>
            
            <Badge variant={paymentMethod.is_active ? "default" : "secondary"}>
              {paymentMethod.is_active ? 'Active' : 'Inactive'}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(paymentMethod)}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <SecureButton
                permission="manage_settings"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(paymentMethod)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </SecureButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
