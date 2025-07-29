import { useState, useEffect, useCallback } from 'react';
import { useCurrentStore } from '@/stores/storeStore';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

export interface DashboardWidget {
  id: string;
  name: string;
  type: 'metric' | 'chart' | 'list' | 'action';
  icon: string;
  enabled: boolean;
  position: { row: number; col: number; width: number; height: number };
  config?: Record<string, any>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  refreshInterval: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Layout',
  theme: 'auto',
  compactMode: true,
  refreshInterval: 300,
  isDefault: true,
  widgets: [
    {
      id: 'revenue-metric',
      name: 'Total Revenue',
      type: 'metric',
      icon: 'DollarSign',
      enabled: true,
      position: { row: 0, col: 0, width: 1, height: 1 }
    },
    {
      id: 'orders-metric',
      name: 'Total Orders',
      type: 'metric',
      icon: 'ShoppingCart',
      enabled: true,
      position: { row: 0, col: 1, width: 1, height: 1 }
    },
    {
      id: 'customers-metric',
      name: 'Total Customers',
      type: 'metric',
      icon: 'Users',
      enabled: true,
      position: { row: 0, col: 2, width: 1, height: 1 }
    },
    {
      id: 'products-metric',
      name: 'Total Products',
      type: 'metric',
      icon: 'Package',
      enabled: true,
      position: { row: 0, col: 3, width: 1, height: 1 }
    },
    {
      id: 'revenue-chart',
      name: 'Revenue Trend',
      type: 'chart',
      icon: 'TrendingUp',
      enabled: true,
      position: { row: 1, col: 0, width: 2, height: 2 }
    },
    {
      id: 'category-chart',
      name: 'Sales by Category',
      type: 'chart',
      icon: 'PieChart',
      enabled: true,
      position: { row: 1, col: 2, width: 1, height: 2 }
    },
    {
      id: 'recent-transactions',
      name: 'Recent Transactions',
      type: 'list',
      icon: 'BarChart3',
      enabled: true,
      position: { row: 2, col: 0, width: 3, height: 1 }
    }
  ]
};

export function useDashboardLayout() {
  const currentStore = useCurrentStore();
  const { from } = useSupabaseClient();
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved layouts from database
  const loadLayouts = useCallback(async () => {
    if (!currentStore?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Try to load from database first
      const { data: layouts, error: dbError } = await from('dashboard_layouts')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('updated_at', { ascending: false });

      if (dbError) {
        console.warn('Failed to load layouts from database:', dbError);
        // Fall back to localStorage
        loadFromLocalStorage();
        return;
      }

      if (layouts && layouts.length > 0) {
        const parsedLayouts = layouts.map(layout => ({
          ...layout,
          widgets: JSON.parse(layout.widgets || '[]')
        }));
        
        setSavedLayouts(parsedLayouts);
        
        // Set the most recently used layout as current
        const activeLayout = parsedLayouts.find(l => l.is_active) || parsedLayouts[0];
        if (activeLayout) {
          setCurrentLayout(activeLayout);
        }
      } else {
        // No saved layouts, use default and save it
        setSavedLayouts([DEFAULT_LAYOUT]);
        setCurrentLayout(DEFAULT_LAYOUT);
        await saveLayout(DEFAULT_LAYOUT);
      }
    } catch (err) {
      console.error('Error loading dashboard layouts:', err);
      setError('Failed to load dashboard layouts');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id, from]);

  // Fallback to localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(`dashboard-layout-${currentStore?.id}`);
      if (stored) {
        const layout = JSON.parse(stored);
        setCurrentLayout(layout);
        setSavedLayouts([layout]);
      } else {
        setCurrentLayout(DEFAULT_LAYOUT);
        setSavedLayouts([DEFAULT_LAYOUT]);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setCurrentLayout(DEFAULT_LAYOUT);
      setSavedLayouts([DEFAULT_LAYOUT]);
    }
  }, [currentStore?.id]);

  // Save layout to database and localStorage
  const saveLayout = useCallback(async (layout: DashboardLayout) => {
    if (!currentStore?.id) return;

    try {
      const layoutData = {
        id: layout.id,
        store_id: currentStore.id,
        name: layout.name,
        widgets: JSON.stringify(layout.widgets),
        theme: layout.theme,
        compact_mode: layout.compactMode,
        refresh_interval: layout.refreshInterval,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      // First, mark all other layouts as inactive
      await from('dashboard_layouts')
        .update({ is_active: false })
        .eq('store_id', currentStore.id);

      // Then save/update the current layout
      const { error: saveError } = await from('dashboard_layouts')
        .upsert(layoutData);

      if (saveError) {
        console.warn('Failed to save to database:', saveError);
        // Fall back to localStorage
        localStorage.setItem(
          `dashboard-layout-${currentStore.id}`,
          JSON.stringify(layout)
        );
      }

      // Update local state
      setCurrentLayout(layout);
      setSavedLayouts(prev => {
        const existing = prev.find(l => l.id === layout.id);
        if (existing) {
          return prev.map(l => l.id === layout.id ? layout : l);
        } else {
          return [...prev, layout];
        }
      });

    } catch (err) {
      console.error('Error saving dashboard layout:', err);
      setError('Failed to save dashboard layout');
      
      // Fall back to localStorage
      try {
        localStorage.setItem(
          `dashboard-layout-${currentStore.id}`,
          JSON.stringify(layout)
        );
      } catch (localErr) {
        console.error('Failed to save to localStorage:', localErr);
      }
    }
  }, [currentStore?.id, from]);

  // Delete a saved layout
  const deleteLayout = useCallback(async (layoutId: string) => {
    if (!currentStore?.id || layoutId === 'default') return;

    try {
      const { error: deleteError } = await from('dashboard_layouts')
        .delete()
        .eq('id', layoutId)
        .eq('store_id', currentStore.id);

      if (deleteError) {
        console.warn('Failed to delete from database:', deleteError);
      }

      // Update local state
      setSavedLayouts(prev => prev.filter(l => l.id !== layoutId));
      
      // If we deleted the current layout, switch to default
      if (currentLayout.id === layoutId) {
        setCurrentLayout(DEFAULT_LAYOUT);
      }

    } catch (err) {
      console.error('Error deleting dashboard layout:', err);
      setError('Failed to delete dashboard layout');
    }
  }, [currentStore?.id, currentLayout.id, from]);

  // Switch to a different layout
  const switchLayout = useCallback(async (layoutId: string) => {
    const layout = savedLayouts.find(l => l.id === layoutId);
    if (layout) {
      await saveLayout({ ...layout, id: layout.id });
    }
  }, [savedLayouts, saveLayout]);

  // Create a new layout based on current
  const createLayout = useCallback((name: string) => {
    const newLayout: DashboardLayout = {
      ...currentLayout,
      id: `layout-${Date.now()}`,
      name,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newLayout;
  }, [currentLayout]);

  // Reset to default layout
  const resetToDefault = useCallback(async () => {
    await saveLayout(DEFAULT_LAYOUT);
  }, [saveLayout]);

  // Load layouts when store changes
  useEffect(() => {
    if (currentStore?.id) {
      loadLayouts();
    }
  }, [currentStore?.id, loadLayouts]);

  return {
    currentLayout,
    savedLayouts,
    loading,
    error,
    saveLayout,
    deleteLayout,
    switchLayout,
    createLayout,
    resetToDefault,
    setCurrentLayout
  };
}
