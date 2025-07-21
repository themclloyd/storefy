import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Settings, Package, Search, Filter } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/taxUtils";
import { generateShowcaseUrl } from "@/lib/showcase-utils";
import {
  useSettingsStore,
  useShowcaseSettings,
  useShowcaseAnalytics,
  useShowcaseLoading,
  useShowcaseSaving
} from "@/stores/settingsStore";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  is_public: boolean;
  show_price_publicly: boolean;
  show_stock_publicly: boolean;
  stock_quantity: number;
  public_description?: string;
  category_name?: string;
}

interface AnalyticsData {
  total_views: number;
  total_shares: number;
  total_product_clicks: number;
  total_contact_clicks: number;
  most_clicked_product_id?: string;
  most_clicked_product_name?: string;
  most_clicked_product_clicks: number;
  views_this_month: number;
  views_today: number;
}

export function ShowcaseManagementView() {
  const currentStore = useCurrentStore();

  // Use Zustand store for showcase settings
  const showcaseSettings = useShowcaseSettings();
  const showcaseAnalytics = useShowcaseAnalytics();
  const showcaseLoading = useShowcaseLoading();
  const showcaseSaving = useShowcaseSaving();
  const loadShowcaseSettings = useSettingsStore(state => state.loadShowcaseSettings);
  const loadShowcaseAnalytics = useSettingsStore(state => state.loadShowcaseAnalytics);
  const toggleShowcase = useSettingsStore(state => state.toggleShowcase);

  // Local state for products and analytics (not in settings store)
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    if (currentStore?.id) {
      loadShowcaseSettings(currentStore.id);
      loadShowcaseAnalytics(currentStore.id);
      loadProducts();
      loadAnalytics();
    }
  }, [currentStore?.id, loadShowcaseSettings, loadShowcaseAnalytics]);



  const loadProducts = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          image_url,
          is_public,
          show_price_publicly,
          show_stock_publicly,
          stock_quantity,
          public_description,
          categories (name)
        `)
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const formattedProducts = (data || []).map(product => ({
        ...product,
        category_name: product.categories?.name,
        is_public: product.is_public ?? false,
        show_price_publicly: product.show_price_publicly ?? true,
        show_stock_publicly: product.show_stock_publicly ?? false
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!currentStore) return;

    try {
      setAnalyticsLoading(true);

      // Get analytics data directly from the table for now
      const { data: analyticsData, error } = await supabase
        .from('showcase_analytics')
        .select('*')
        .eq('store_id', currentStore.id);

      if (error) throw error;

      // Calculate analytics summary
      const totalViews = analyticsData?.filter(a => a.event_type === 'view').length || 0;
      const totalShares = analyticsData?.filter(a => a.event_type === 'share').length || 0;
      const totalProductClicks = analyticsData?.filter(a => a.event_type === 'product_click').length || 0;
      const totalContactClicks = analyticsData?.filter(a => a.event_type === 'contact_click').length || 0;

      // Views this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const viewsThisMonth = analyticsData?.filter(a =>
        a.event_type === 'view' && new Date(a.created_at) >= thisMonth
      ).length || 0;

      // Views today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const viewsToday = analyticsData?.filter(a =>
        a.event_type === 'view' && new Date(a.created_at) >= today
      ).length || 0;

      // Most clicked product
      const productClicks = analyticsData?.filter(a => a.event_type === 'product_click' && a.product_id) || [];
      const clickCounts: { [key: string]: number } = {};
      productClicks.forEach(click => {
        if (click.product_id) {
          clickCounts[click.product_id] = (clickCounts[click.product_id] || 0) + 1;
        }
      });

      const mostClickedProductId = Object.keys(clickCounts).reduce((a, b) =>
        clickCounts[a] > clickCounts[b] ? a : b, ''
      );
      const mostClickedProductClicks = mostClickedProductId ? clickCounts[mostClickedProductId] : 0;

      // Get most clicked product name
      let mostClickedProductName = '';
      if (mostClickedProductId) {
        const product = products.find(p => p.id === mostClickedProductId);
        mostClickedProductName = product?.name || 'Unknown Product';
      }

      setAnalytics({
        total_views: totalViews,
        total_shares: totalShares,
        total_product_clicks: totalProductClicks,
        total_contact_clicks: totalContactClicks,
        most_clicked_product_id: mostClickedProductId || undefined,
        most_clicked_product_name: mostClickedProductName || undefined,
        most_clicked_product_clicks: mostClickedProductClicks,
        views_this_month: viewsThisMonth,
        views_today: viewsToday
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set default analytics on error
      setAnalytics({
        total_views: 0,
        total_shares: 0,
        total_product_clicks: 0,
        total_contact_clicks: 0,
        most_clicked_product_clicks: 0,
        views_this_month: 0,
        views_today: 0
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const toggleProductPublic = async (productId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_public: isPublic })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_public: isPublic } : p
      ));

      toast.success(isPublic ? 'Product added to showcase' : 'Product removed from showcase');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const getShowcaseUrl = () => {
    if (!currentStore) return '';
    return generateShowcaseUrl({
      showcase_slug: showcaseSettings.showcaseSlug,
      store_code: currentStore.store_code,
      id: currentStore.id
    });
  };



  const handleToggleShowcase = async (enabled: boolean) => {
    if (!currentStore?.id) return;
    await toggleShowcase(currentStore.id, enabled);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPublic === 'all' || 
      (filterPublic === 'public' && product.is_public) ||
      (filterPublic === 'private' && !product.is_public);
    
    return matchesSearch && matchesFilter;
  });

  const publicProductsCount = products.filter(p => p.is_public).length;
  const totalProducts = products.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Visibility</h1>
            <p className="text-muted-foreground">Choose which products to display in your public showcase</p>
          </div>
        </div>

        <div className="flex gap-2">
          {showcaseSettings.enableShowcase && (
            <Button
              variant="outline"
              onClick={() => window.open(getShowcaseUrl(), '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Showcase Settings
          </Button>
        </div>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsLoading ? "..." : analytics?.total_views || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsLoading ? "..." : analytics?.views_today || 0} today
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsLoading ? "..." : analytics?.total_product_clicks || 0}
              </div>
              <p className="text-sm text-muted-foreground">Product Clicks</p>
              <p className="text-xs text-muted-foreground mt-1">
                Customer interest
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsLoading ? "..." : analytics?.total_shares || 0}
              </div>
              <p className="text-sm text-muted-foreground">Shares</p>
              <p className="text-xs text-muted-foreground mt-1">
                Social engagement
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{publicProductsCount}</div>
              <p className="text-sm text-muted-foreground">Public Products</p>
              <Badge variant={showcaseSettings.enableShowcase ? "default" : "secondary"} className="text-xs mt-1">
                {showcaseSettings.enableShowcase ? "Live" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Clicked Product */}
      {analytics?.most_clicked_product_name && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Most Popular Product</h3>
                <p className="text-muted-foreground">{analytics.most_clicked_product_name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{analytics.most_clicked_product_clicks}</div>
                <p className="text-sm text-muted-foreground">clicks this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Showcase Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="showcase-enabled" className="text-base font-medium">Enable Public Showcase</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to browse your products publicly
              </p>
            </div>
            <Switch
              id="showcase-enabled"
              checked={showcaseSettings.enableShowcase}
              onCheckedChange={handleToggleShowcase}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Visibility
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Control which products appear in your public showcase
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterPublic === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPublic('all')}
              >
                All ({totalProducts})
              </Button>
              <Button
                variant={filterPublic === 'public' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPublic('public')}
              >
                Public ({publicProductsCount})
              </Button>
              <Button
                variant={filterPublic === 'private' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterPublic('private')}
              >
                Private ({totalProducts - publicProductsCount})
              </Button>
            </div>
          </div>

          {/* Products List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'Add products to your inventory to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{formatCurrency(product.price, currentStore?.currency || 'USD')}</Badge>
                      {product.category_name && (
                        <Badge variant="outline">{product.category_name}</Badge>
                      )}
                      <Badge variant={product.is_public ? "default" : "secondary"}>
                        {product.is_public ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`public-${product.id}`} className="text-sm">
                      Show in showcase
                    </Label>
                    <Switch
                      id={`public-${product.id}`}
                      checked={product.is_public}
                      onCheckedChange={(checked) => toggleProductPublic(product.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
