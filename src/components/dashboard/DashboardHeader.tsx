import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Settings,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  MoreHorizontal,
  ChevronDown,
  Menu
} from 'lucide-react';
import { useCurrentStore } from '@/stores/storeStore';
import { useScreenSize } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboardDesign, responsiveSpacing, touchFriendly } from '@/lib/responsive-utils';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onSettingsClick?: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  customizationComponent?: React.ReactNode;
}

export function DashboardHeader({
  title = "Dashboard Overview",
  subtitle,
  onRefresh,
  onExport,
  onSettingsClick,
  isLoading = false,
  lastUpdated,
  customizationComponent
}: DashboardHeaderProps) {
  const currentStore = useCurrentStore();
  const { isMobile, isTablet } = useScreenSize();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  const quickActions = [
    { icon: TrendingUp, label: 'Analytics', action: () => {} },
    { icon: Users, label: 'Customers', action: () => {} },
    { icon: ShoppingCart, label: 'Orders', action: () => {} },
    { icon: DollarSign, label: 'Revenue', action: () => {} }
  ];

  const timePeriods = ['Today', 'This Week', 'This Month', 'Last Month', 'This Year'];

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      "border-b border-border/40",
      "px-6 py-4" // Better breathing room
    )}>
      {/* Compact Header Row */}
      <div className="flex items-center justify-between">
        {/* Left Section - Mobile Menu + Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <SidebarTrigger className="h-8 w-8 p-0" />
          )}

          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {title}
            </h1>
            {currentStore && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentStore.name}
                </Badge>
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    {lastUpdated}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Compact Actions */}
        <div className="flex items-center gap-1">
          {/* Refresh Button - Icon Only */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isLoading && "animate-spin"
            )} />
          </Button>

          {/* Export Button - Icon Only */}
          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Customization - Icon Only */}
          {customizationComponent}

          {/* Time Period - Compact */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
              >
                {selectedPeriod}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {timePeriods.map((period) => (
                <DropdownMenuItem
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={selectedPeriod === period ? "bg-muted" : ""}
                >
                  {period}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </DropdownMenuItem>
              {onSettingsClick && (
                <DropdownMenuItem onClick={onSettingsClick}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
