import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useScreenSize } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveIcon, touchFriendly, responsiveSpacing } from '@/lib/responsive-utils';

interface ResponsiveSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // Filter props
  showFilters?: boolean;
  filterCount?: number;
  onFilterToggle?: () => void;
  filterContent?: React.ReactNode;
  // Mobile-specific props
  mobileSearchPlaceholder?: string;
  compactMode?: boolean;
}

export function ResponsiveSearch({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  className,
  showFilters = false,
  filterCount = 0,
  onFilterToggle,
  filterContent,
  mobileSearchPlaceholder,
  compactMode = false
}: ResponsiveSearchProps) {
  const { isMobile } = useScreenSize();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Mobile compact view - just icons
  if (isMobile && compactMode) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Search Icon Button */}
        <Sheet open={showMobileSearch} onOpenChange={setShowMobileSearch}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(touchFriendly.touchTarget, "relative")}
            >
              <Search className={responsiveIcon.sm} />
              {searchValue && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-3 w-3 rounded-full p-0"
                />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="h-[200px]">
            <SheetHeader>
              <SheetTitle>Search</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={mobileSearchPlaceholder || placeholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {searchValue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSearchChange('');
                    setShowMobileSearch(false);
                  }}
                  className="mt-3 w-full"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Filter Icon Button */}
        {showFilters && (
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(touchFriendly.touchTarget, "relative")}
                onClick={onFilterToggle}
              >
                <SlidersHorizontal className={responsiveIcon.sm} />
                {filterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
                  >
                    {filterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {filterContent}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    );
  }

  // Mobile full view
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn("pl-10", touchFriendly.minTouch)}
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Button */}
        {showFilters && (
          <Button
            variant="outline"
            onClick={onFilterToggle}
            className={cn(
              "w-full justify-start gap-2",
              touchFriendly.minTouch
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {filterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Button */}
      {showFilters && (
        <Button
          variant="outline"
          onClick={onFilterToggle}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {filterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {filterCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}

// Responsive Filter Panel Component
interface ResponsiveFilterPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

export function ResponsiveFilterPanel({
  children,
  isOpen,
  onClose,
  title = "Filters",
  className
}: ResponsiveFilterPanelProps) {
  const { isMobile } = useScreenSize();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className={cn("mt-6", className)}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop - render inline
  return isOpen ? (
    <div className={cn("border rounded-lg p-4 bg-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  ) : null;
}

// Quick Search Component for compact spaces
interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function QuickSearch({ value, onChange, placeholder = "Search...", className }: QuickSearchProps) {
  const { isMobile } = useScreenSize();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isMobile && !isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={cn(touchFriendly.touchTarget, className)}
      >
        <Search className={responsiveIcon.sm} />
      </Button>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        onBlur={() => isMobile && !value && setIsExpanded(false)}
        autoFocus={isMobile && isExpanded}
      />
    </div>
  );
}
