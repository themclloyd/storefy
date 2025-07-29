import React, { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, ShoppingCart } from 'lucide-react';

interface DashboardEmptyStateProps {
  onViewChange: (view: string) => void;
}

/**
 * Empty state component for the Dashboard when no data is available
 */
export const DashboardEmptyState = memo(function DashboardEmptyState({
  onViewChange
}: DashboardEmptyStateProps) {
  const handleAddProducts = useCallback(() => {
    onViewChange('inventory');
  }, [onViewChange]);

  const handleStartSelling = useCallback(() => {
    onViewChange('pos');
  }, [onViewChange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome to your store! Let's get started.</p>
        </div>

        {/* Empty State Content */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Your Store Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground text-lg">
                Your store is ready! Start by adding products and making your first sale.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="text-center space-y-3">
                    <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Add Products</h3>
                      <p className="text-sm text-muted-foreground">
                        Start by adding your inventory
                      </p>
                    </div>
                    <Button onClick={handleAddProducts} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Products
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="text-center space-y-3">
                    <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Start Selling</h3>
                      <p className="text-sm text-muted-foreground">
                        Make your first sale
                      </p>
                    </div>
                    <Button onClick={handleStartSelling} variant="outline" className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Open POS
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Once you have products and sales, this dashboard will show your store's performance metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

DashboardEmptyState.displayName = 'DashboardEmptyState';
