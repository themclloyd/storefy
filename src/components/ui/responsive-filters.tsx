import React, { useState } from 'react';
import { Filter, X, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScreenSize } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { responsiveSpacing, touchFriendly, responsiveIcon } from '@/lib/responsive-utils';

export interface FilterOption {
  id: string;
  label: string;
  value: any;
  type: 'select' | 'input' | 'range' | 'date' | 'checkbox';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterState {
  [key: string]: any;
}

interface ResponsiveFiltersProps {
  filters: FilterOption[];
  values: FilterState;
  onChange: (values: FilterState) => void;
  onReset: () => void;
  className?: string;
  title?: string;
  // Mobile behavior
  triggerButton?: React.ReactNode;
  showTrigger?: boolean;
  compactMode?: boolean;
}

export function ResponsiveFilters({
  filters,
  values,
  onChange,
  onReset,
  className,
  title = "Filters",
  triggerButton,
  showTrigger = true,
  compactMode = false
}: ResponsiveFiltersProps) {
  const { isMobile } = useScreenSize();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  // Count active filters
  const activeFilterCount = Object.values(values).filter(value => 
    value !== undefined && value !== null && value !== '' && value !== 'all'
  ).length;

  const updateFilter = (id: string, value: any) => {
    onChange({ ...values, [id]: value });
  };

  const resetFilters = () => {
    onReset();
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderFilterInput = (filter: FilterOption) => {
    const value = values[filter.id];

    switch (filter.type) {
      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => updateFilter(filter.id, val)}>
            <SelectTrigger className={cn(isMobile && touchFriendly.minTouch)}>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'input':
        return (
          <Input
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className={cn(isMobile && touchFriendly.minTouch)}
          />
        );

      case 'range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(e) => updateFilter(filter.id, { ...value, min: e.target.value })}
              min={filter.min}
              max={filter.max}
              className={cn(isMobile && touchFriendly.minTouch)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(e) => updateFilter(filter.id, { ...value, max: e.target.value })}
              min={filter.min}
              max={filter.max}
              className={cn(isMobile && touchFriendly.minTouch)}
            />
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className={cn(isMobile && touchFriendly.minTouch)}
          />
        );

      default:
        return null;
    }
  };

  const FilterContent = () => (
    <div className={cn("space-y-4", isMobile && responsiveSpacing.padding.sm)}>
      {/* Basic Filters */}
      <Collapsible
        open={expandedSections.has('basic')}
        onOpenChange={() => toggleSection('basic')}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between p-0 h-auto font-medium",
              isMobile && touchFriendly.minTouch
            )}
          >
            Basic Filters
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('basic') && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          {filters.slice(0, 3).map((filter) => (
            <div key={filter.id} className="space-y-2">
              <Label className="text-sm font-medium">{filter.label}</Label>
              {renderFilterInput(filter)}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Advanced Filters */}
      {filters.length > 3 && (
        <Collapsible
          open={expandedSections.has('advanced')}
          onOpenChange={() => toggleSection('advanced')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between p-0 h-auto font-medium",
                isMobile && touchFriendly.minTouch
              )}
            >
              Advanced Filters
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.has('advanced') && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {filters.slice(3).map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label className="text-sm font-medium">{filter.label}</Label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Filters</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(values).map(([key, value]) => {
              if (!value || value === '' || value === 'all') return null;
              const filter = filters.find(f => f.id === key);
              if (!filter) return null;

              return (
                <Badge key={key} variant="secondary" className="gap-1">
                  {filter.label}: {typeof value === 'object' ? JSON.stringify(value) : value}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter(key, '')}
                    className="h-auto p-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        onClick={resetFilters}
        className={cn(
          "w-full gap-2",
          isMobile && touchFriendly.minTouch
        )}
        disabled={activeFilterCount === 0}
      >
        <RotateCcw className="h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  );

  // Mobile Sheet View
  if (isMobile) {
    return (
      <>
        {showTrigger && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              {triggerButton || (
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2 relative",
                    compactMode ? touchFriendly.touchTarget : "w-full",
                    touchFriendly.minTouch
                  )}
                >
                  <Filter className={responsiveIcon.sm} />
                  {!compactMode && "Filters"}
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        compactMode 
                          ? "absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
                          : "ml-auto"
                      )}
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </>
    );
  }

  // Desktop Card View
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}

// Quick Filter Buttons Component
interface QuickFilterButtonsProps {
  options: { label: string; value: any; count?: number }[];
  activeValue: any;
  onChange: (value: any) => void;
  className?: string;
}

export function QuickFilterButtons({ options, activeValue, onChange, className }: QuickFilterButtonsProps) {
  const { isMobile } = useScreenSize();

  return (
    <div className={cn(
      "flex gap-2",
      isMobile ? "flex-wrap" : "flex-nowrap overflow-x-auto",
      className
    )}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={activeValue === option.value ? "default" : "outline"}
          size={isMobile ? "sm" : "default"}
          onClick={() => onChange(option.value)}
          className={cn(
            "whitespace-nowrap gap-2",
            isMobile && touchFriendly.minTouch
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {option.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
