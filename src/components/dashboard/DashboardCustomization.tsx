import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Layout,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Palette,
  Grid,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Plus,
  X,
  GripVertical
} from 'lucide-react';
import { dashboardDesign, responsiveSpacing, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface DashboardWidget {
  id: string;
  name: string;
  type: 'metric' | 'chart' | 'list' | 'action';
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  position: { row: number; col: number; width: number; height: number };
  config?: Record<string, any>;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  refreshInterval: number;
}

interface DashboardCustomizationProps {
  currentLayout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onSaveLayout: (layout: DashboardLayout) => void;
  className?: string;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'revenue-metric',
    name: 'Total Revenue',
    type: 'metric',
    icon: DollarSign,
    enabled: true,
    position: { row: 0, col: 0, width: 1, height: 1 }
  },
  {
    id: 'orders-metric',
    name: 'Total Orders',
    type: 'metric',
    icon: ShoppingCart,
    enabled: true,
    position: { row: 0, col: 1, width: 1, height: 1 }
  },
  {
    id: 'customers-metric',
    name: 'Total Customers',
    type: 'metric',
    icon: Users,
    enabled: true,
    position: { row: 0, col: 2, width: 1, height: 1 }
  },
  {
    id: 'products-metric',
    name: 'Total Products',
    type: 'metric',
    icon: Package,
    enabled: true,
    position: { row: 0, col: 3, width: 1, height: 1 }
  },
  {
    id: 'revenue-chart',
    name: 'Revenue Trend',
    type: 'chart',
    icon: TrendingUp,
    enabled: true,
    position: { row: 1, col: 0, width: 2, height: 2 }
  },
  {
    id: 'category-chart',
    name: 'Sales by Category',
    type: 'chart',
    icon: PieChart,
    enabled: true,
    position: { row: 1, col: 2, width: 1, height: 2 }
  },
  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    type: 'metric',
    icon: AlertTriangle,
    enabled: true,
    position: { row: 2, col: 0, width: 1, height: 1 }
  },
  {
    id: 'recent-transactions',
    name: 'Recent Transactions',
    type: 'list',
    icon: BarChart3,
    enabled: true,
    position: { row: 3, col: 0, width: 3, height: 1 }
  }
];

export function DashboardCustomization({
  currentLayout,
  onLayoutChange,
  onSaveLayout,
  className
}: DashboardCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState<DashboardLayout>(currentLayout);
  const [layoutName, setLayoutName] = useState(currentLayout.name);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setEditingLayout(currentLayout);
    setLayoutName(currentLayout.name);
  }, [currentLayout]);

  const handleWidgetToggle = (widgetId: string) => {
    setEditingLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setEditingLayout(prev => ({ ...prev, theme }));
  };

  const handleCompactModeToggle = () => {
    setEditingLayout(prev => ({ ...prev, compactMode: !prev.compactMode }));
  };

  const handleRefreshIntervalChange = (interval: string) => {
    setEditingLayout(prev => ({ ...prev, refreshInterval: parseInt(interval) }));
  };

  const handleSave = () => {
    const updatedLayout = { ...editingLayout, name: layoutName };
    onLayoutChange(updatedLayout);
    onSaveLayout(updatedLayout);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetLayout: DashboardLayout = {
      ...currentLayout,
      widgets: defaultWidgets,
      theme: 'auto',
      compactMode: false,
      refreshInterval: 300
    };
    setEditingLayout(resetLayout);
  };

  const enabledWidgets = editingLayout.widgets.filter(w => w.enabled);
  const disabledWidgets = editingLayout.widgets.filter(w => !w.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            touchFriendly.minTouch,
            dashboardDesign.animations.smooth,
            className
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Customize</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Dashboard Customization
          </DialogTitle>
          <DialogDescription>
            Personalize your dashboard layout, choose which widgets to display, and save your preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layout Settings */}
          <Card className={dashboardDesign.cards.flat}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Layout Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Layout Name */}
              <div className="space-y-2">
                <Label htmlFor="layout-name">Layout Name</Label>
                <Input
                  id="layout-name"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="My Custom Dashboard"
                />
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={editingLayout.theme}
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing and use smaller components
                  </p>
                </div>
                <Switch
                  checked={editingLayout.compactMode}
                  onCheckedChange={handleCompactModeToggle}
                />
              </div>

              {/* Refresh Interval */}
              <div className="space-y-2">
                <Label>Auto Refresh Interval</Label>
                <Select
                  value={editingLayout.refreshInterval.toString()}
                  onValueChange={handleRefreshIntervalChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Widget Configuration */}
          <Card className={dashboardDesign.cards.flat}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Widget Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enabled Widgets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Enabled Widgets</h4>
                    <Badge variant="secondary">{enabledWidgets.length}</Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {enabledWidgets.map((widget) => {
                      const Icon = widget.icon;
                      return (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-primary/10">
                              <Icon className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{widget.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {widget.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWidgetToggle(widget.id)}
                              className="h-6 w-6 p-0"
                            >
                              <EyeOff className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Disabled Widgets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Available Widgets</h4>
                    <Badge variant="outline">{disabledWidgets.length}</Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {disabledWidgets.map((widget) => {
                      const Icon = widget.icon;
                      return (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-background opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-muted">
                              <Icon className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-sm">{widget.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {widget.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWidgetToggle(widget.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <div className="space-y-0.5">
              <Label>Preview Mode</Label>
              <p className="text-sm text-muted-foreground">
                See how your dashboard will look with these settings
              </p>
            </div>
            <Switch
              checked={previewMode}
              onCheckedChange={setPreviewMode}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Layout
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
