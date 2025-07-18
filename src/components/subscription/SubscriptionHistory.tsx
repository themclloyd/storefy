import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  Loader2,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { subscriptionService, SubscriptionHistoryItem } from '@/services/subscription';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SubscriptionHistoryProps {
  subscriptionId: string;
}

export function SubscriptionHistory({ subscriptionId }: SubscriptionHistoryProps) {
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [subscriptionId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyData = await subscriptionService.getSubscriptionHistory(subscriptionId);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading subscription history:', error);
      toast.error('Failed to load subscription history');
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    try {
      setRefreshing(true);
      const historyData = await subscriptionService.getSubscriptionHistory(subscriptionId);
      setHistory(historyData);
      toast.success('History refreshed');
    } catch (error) {
      console.error('Error refreshing subscription history:', error);
      toast.error('Failed to refresh history');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (item: SubscriptionHistoryItem) => {
    switch (item.status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'upcoming':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (item: SubscriptionHistoryItem) => {
    const variant = 
      item.status === 'completed' || item.status === 'paid' ? 'default' :
      item.status === 'failed' ? 'destructive' :
      item.status === 'pending' || item.status === 'processing' ? 'secondary' :
      'outline';

    return (
      <Badge variant={variant} className="capitalize">
        {item.status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'billing_cycle':
        return <Receipt className="w-4 h-4" />;
      case 'plan_change':
        return <RefreshCw className="w-4 h-4" />;
      case 'status_change':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Subscription History
            </CardTitle>
            <CardDescription>
              View your billing and subscription activity
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshHistory}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No History Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your subscription activity will appear here once you have payments or billing events.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(item)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(item.type)}
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        {getStatusBadge(item)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {item.amount && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {formatAmount(item.amount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {item.details && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement details modal
                            toast.info('Details view coming soon');
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {item.type === 'payment' && item.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement receipt download
                            toast.info('Receipt download coming soon');
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
