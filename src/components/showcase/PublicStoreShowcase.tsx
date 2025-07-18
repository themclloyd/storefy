import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Mail, MapPin, Store, ArrowLeft, Grid, List, Filter, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PublicProductGrid } from "./PublicProductGrid";
import { PublicProductModal } from "./PublicProductModal";
import { trackShowcaseView, trackProductClick, trackContactClick } from "@/lib/analytics-tracker";

interface PublicStore {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  store_code?: string;
  currency?: string;
  showcase_slug?: string;
  showcase_theme?: any;
  showcase_description?: string;
  showcase_logo_url?: string;
  showcase_banner_url?: string;
  showcase_contact_info?: any;
  showcase_seo_title?: string;
  showcase_seo_description?: string;
  product_count: number;
  category_count: number;
}

interface PublicProduct {
  product_id: string;
  product_name: string;
  product_description?: string;
  public_description?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_name?: string;
  category_id?: string;
  show_stock_publicly: boolean;
  show_price_publicly: boolean;
  created_at: string;
}

interface PublicCategory {
  category_id: string;
  category_name: string;
  product_count: number;
}

export function PublicStoreShowcase() {
  const { storeId, storeCode, storeSlug } = useParams<{ storeId?: string; storeCode?: string; storeSlug?: string }>();
  const navigate = useNavigate();
  
  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Product modal
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const storeIdentifier = storeId || storeCode || storeSlug;

  useEffect(() => {
    if (storeIdentifier) {
      fetchStoreInfo();

      // Track showcase view
      trackShowcaseView(storeIdentifier, document.referrer);
    }
  }, [storeIdentifier]);

  useEffect(() => {
    if (store) {
      fetchProducts();
      fetchCategories();
      updatePageMeta();
    }
  }, [store, selectedCategory, searchQuery]);

  const fetchStoreInfo = async () => {
    if (!storeIdentifier) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_public_store_info', { store_identifier: storeIdentifier });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Store not found or showcase is not enabled');
        navigate('/');
        return;
      }

      const storeData = data[0];
      setStore({
        id: storeData.store_id,
        name: storeData.store_name,
        address: storeData.store_address,
        phone: storeData.store_phone,
        email: storeData.store_email,
        store_code: storeData.store_code,
        currency: storeData.store_currency || 'USD',
        showcase_slug: storeData.showcase_slug,
        showcase_theme: storeData.showcase_theme,
        showcase_description: storeData.showcase_description,
        showcase_logo_url: storeData.showcase_logo_url,
        showcase_banner_url: storeData.showcase_banner_url,
        showcase_contact_info: storeData.showcase_contact_info,
        showcase_seo_title: storeData.showcase_seo_title,
        showcase_seo_description: storeData.showcase_seo_description,
        product_count: storeData.product_count,
        category_count: storeData.category_count
      });

      // Set view mode from theme
      if (storeData.showcase_theme?.layout) {
        setViewMode(storeData.showcase_theme.layout === 'list' ? 'list' : 'grid');
      }

    } catch (error) {
      console.error('Error fetching store info:', error);
      toast.error('Failed to load store information');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!storeIdentifier) return;

    try {
      setProductsLoading(true);
      
      const categoryFilter = selectedCategory === 'all' ? null : selectedCategory;
      const searchFilter = searchQuery.trim() || null;

      const { data, error } = await supabase
        .rpc('get_public_products', {
          store_identifier: storeIdentifier,
          category_filter: categoryFilter,
          search_query: searchFilter
        });

      if (error) throw error;

      setProducts(data || []);

    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!storeIdentifier) return;

    try {
      const { data, error } = await supabase
        .rpc('get_public_categories', { store_identifier: storeIdentifier });

      if (error) throw error;

      setCategories(data || []);

    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updatePageMeta = () => {
    if (!store) return;

    // Update page title
    document.title = store.showcase_seo_title || `${store.name} - Product Catalog`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        store.showcase_seo_description || 
        store.showcase_description || 
        `Browse products from ${store.name}`
      );
    }
  };

  const handleProductClick = (product: PublicProduct) => {
    setSelectedProduct(product);
    setShowProductModal(true);

    // Track product click
    if (storeIdentifier) {
      trackProductClick(storeIdentifier, product.product_id);
    }
  };

  const getThemeColors = () => {
    const theme = store?.showcase_theme;
    return {
      primary: theme?.primaryColor || '#3b82f6',
      secondary: theme?.secondaryColor || '#1e40af'
    };
  };

  const shouldShowContactInfo = (type: 'phone' | 'email' | 'address') => {
    const contactInfo = store?.showcase_contact_info;
    if (!contactInfo) return true; // Default to showing all
    
    switch (type) {
      case 'phone': return contactInfo.showPhone !== false;
      case 'email': return contactInfo.showEmail !== false;
      case 'address': return contactInfo.showAddress !== false;
      default: return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The store you're looking for doesn't exist or has disabled public showcase.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const colors = getThemeColors();

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Banner Section */}
      <div 
        className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
        style={{ 
          background: store.showcase_banner_url 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${store.showcase_banner_url})`
            : `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            {store.showcase_logo_url && (
              <img
                src={store.showcase_logo_url}
                alt={`${store.name} logo`}
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover bg-white/10 backdrop-blur-sm"
              />
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{store.name}</h1>
              {store.showcase_description && (
                <p className="text-base md:text-lg opacity-90 mb-4">{store.showcase_description}</p>
              )}

              {/* Contact Information */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm justify-center md:justify-start">
                {shouldShowContactInfo('phone') && store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity justify-center md:justify-start"
                    onClick={() => storeIdentifier && trackContactClick(storeIdentifier)}
                  >
                    <Phone className="w-4 h-4" />
                    {store.phone}
                  </a>
                )}
                {shouldShowContactInfo('email') && store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity justify-center md:justify-start"
                    onClick={() => storeIdentifier && trackContactClick(storeIdentifier)}
                  >
                    <Mail className="w-4 h-4" />
                    {store.email}
                  </a>
                )}
                {shouldShowContactInfo('address') && store.address && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <MapPin className="w-4 h-4" />
                    <span className="text-center md:text-left">{store.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats and Filters */}
        <div className="space-y-4 mb-8">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
            <Badge variant="outline" className="text-sm">
              {store.product_count} Products
            </Badge>
            <Badge variant="outline" className="text-sm">
              {store.category_count} Categories
            </Badge>
          </div>

          {/* Filters */}
          <div className="space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-64"
              />
            </div>

            {/* Category Filter and View Mode */}
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.category_id} value={category.category_name}>
                      {category.category_name} ({category.product_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-md p-1 flex-shrink-0">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <PublicProductGrid
          products={products}
          loading={productsLoading}
          viewMode={viewMode}
          onProductClick={handleProductClick}
          themeColors={colors}
          storeCurrency={store.currency}
        />

        {/* Empty State */}
        {!productsLoading && products.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'This store hasn\'t added any public products yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <PublicProductModal
          product={selectedProduct}
          open={showProductModal}
          onOpenChange={setShowProductModal}
          storeInfo={store}
          themeColors={colors}
          storeCurrency={store.currency}
        />
      )}

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by <strong>Storefy</strong> - Unified Retail Management System</p>
            <p className="mt-2">
              <a 
                href="https://storefy.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Create your own store <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
