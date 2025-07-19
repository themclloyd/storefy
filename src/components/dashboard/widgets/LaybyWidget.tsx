import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Plus,
  Eye,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/stores/storeStore';
import { supabase } from '@/integrations/supabase/client';

interface LaybyWidgetProps {
  onViewMore: () => void;
}

interface LaybyData {
  activeLaybys: number;
  laybyValue: number;
  overdueLaybys: number;
  recentLaybys: Array<{
    id: string;
    customer: string;
    totalAmount: number;
    balanceRemaining: number;
    dueDate: string;
    status: 'active' | 'overdue' | 'partial';
  }>;
}

export function LaybyWidget({ onViewMore }: LaybyWidgetProps) {
  const currentStore = useCurrentStore();
  const [loading, setLoading] = useState(true);
  const [laybyData, setLaybyData] = useState<LaybyData>({
    activeLaybys: 0,
    laybyValue: 0,
    overdueLaybys: 0,
    recentLaybys: []
  });

  useEffect(() => {
    if (currentStore) {
      fetchLaybyData();
    }
  }, [currentStore]);

  const fetchLaybyData = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      // Fetch layby orders
      const { data: laybys } = await supabase
        .from('layby_orders')
        .select(`
          id,
          total_amount,
          balance_remaining,
          due_date,
          status,
          customers (name)
        `)
        .eq('store_id', currentStore.id)
        .in('status', ['active', 'partial'])
        .order('created_at', { ascending: false });

      if (!laybys || laybys.length === 0) {
        setLaybyData({
          activeLaybys: 0,
          laybyValue: 0,
          overdueLaybys: 0,
          recentLaybys: []
        });
        setLoading(false);
        return;
      }

      // Calculate layby metrics
      const activeLaybys = laybys.length;
      const laybyValue = laybys.reduce((sum, layby) => sum + Number(layby.balance_remaining), 0);

      // Check for overdue laybys
      const today = new Date().toISOString().split('T')[0];
      const overdueLaybys = laybys.filter(layby =>
        layby.due_date && layby.due_date < today && layby.balance_remaining > 0
      ).length;

      // Format recent laybys
      const recentLaybys = laybys.slice(0, 3).map(layby => {
        let status = layby.status;

        // Check if overdue
        if (layby.due_date && layby.due_date < today && layby.balance_remaining > 0) {
          status = 'overdue';
        }

        return {
          id: layby.id,
          customer: layby.customers?.name || 'Unknown Customer',
          totalAmount: Number(layby.total_amount),
          balanceRemaining: Number(layby.balance_remaining),
          dueDate: layby.due_date,
          status
        };
      });

      setLaybyData({
        activeLaybys,
        laybyValue,
        overdueLaybys,
        recentLaybys
      });
    } catch (error) {
      console.error('Error fetching layby data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="text-xs bg-success/10 text-success">Active</Badge>;
      case 'overdue':
        return <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">Overdue</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">Partial</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Layby Overview</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            Layby Overview
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewMore}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Layby Metrics */}
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {laybyData.activeLaybys}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Laybys</span>
              {laybyData.overdueLaybys > 0 && (
                <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                  {laybyData.overdueLaybys} overdue
                </Badge>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(laybyData.laybyValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Laybys */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Recent Laybys</h4>
            {laybyData.overdueLaybys > 0 && (
              <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {laybyData.overdueLaybys} need attention
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            {laybyData.recentLaybys.slice(0, 3).map((layby) => (
              <div key={layby.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{layby.customer}</span>
                    {getStatusBadge(layby.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(layby.balanceRemaining)} remaining • Due {formatDate(layby.dueDate)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(layby.totalAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Process Payment
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <Eye className="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
