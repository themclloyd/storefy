import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Mail, MapPin, Store, ArrowLeft, Grid, List, Filter, ExternalLink, Sparkles, Star } from "lucide-react";
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
        .rpc('get_public_store_info' as any, { store_identifier: storeIdentifier });

      if (error) throw error;

      if (!data || (data as any[]).length === 0) {
        toast.error('Store not found or showcase is not enabled');
        navigate('/');
        return;
      }

      const storeData = (data as any[])[0];
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
        .rpc('get_public_products' as any, {
          store_identifier: storeIdentifier,
          category_filter: categoryFilter,
          search_query: searchFilter
        });

      if (error) throw error;

      setProducts((data as any[]) || []);

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
        .rpc('get_public_categories' as any, { store_identifier: storeIdentifier });

      if (error) throw error;

      setCategories((data as any[]) || []);

    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updatePageMeta = () => {
    if (!store) return;

    document.title = store.showcase_seo_title || `${store.name} - Product Catalog`;

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-2xl" />
              <div className="flex-1 text-center md:text-left space-y-4">
                <Skeleton className="h-12 w-64 mx-auto md:mx-0" />
                <Skeleton className="h-6 w-96 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 py-8 -mt-8 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 w-24 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-lg">
              <Store className="w-12 h-12 text-slate-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-xl">×</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Store Not Found
          </h1>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            The store you're looking for doesn't exist or has disabled their public showcase.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const colors = getThemeColors();

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Mobile-Optimized Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              {store.showcase_logo_url && (
                <img
                  src={store.showcase_logo_url}
                  alt={`${store.name} logo`}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-md"
                />
              )}
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">
                  {store.name}
                </h1>
                <p className="text-xs text-gray-500 hidden md:block">Premium Store</p>
              </div>
            </div>

            {/* Actions - Mobile Optimized */}
            <div className="flex items-center gap-2">
              {/* Contact Actions - Desktop Only */}
              <div className="hidden lg:flex items-center gap-2">
                {shouldShowContactInfo('phone') && store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                    onClick={() => trackContactClick('phone')}
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden xl:inline">{store.phone}</span>
                  </a>
                )}
                {shouldShowContactInfo('email') && store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all duration-200"
                    style={{ backgroundColor: colors.primary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.primary}E6`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary;
                    }}
                    onClick={() => trackContactClick('email')}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Contact</span>
                  </a>
                )}
              </div>

              {/* Mobile Contact Button */}
              <div className="lg:hidden">
                {shouldShowContactInfo('phone') && store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                    style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                    onClick={() => trackContactClick('phone')}
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Clean Mobile-Optimized Hero Banner */}
      {store.showcase_banner_url && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src={store.showcase_banner_url}
            alt={`${store.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>

          {/* Hero Content */}
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-4 text-center text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">Store Open</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {store.name}
              </h2>

              {store.showcase_description && (
                <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl mx-auto">
                  {store.showcase_description}
                </p>
              )}

              {/* CTA Button */}
              <Button
                className="px-6 py-3 text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
                style={{ backgroundColor: colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primary}E6`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }}
              >
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Store Info Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-900">Free Delivery</div>
            </div>

            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-gray-900">24/7 Support</div>
            </div>

            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-900">Secure</div>
            </div>

            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Store className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-semibold text-gray-900">{store.product_count} Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Product Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Our Products
          </h3>
          <p className="text-gray-600">
            Explore our collection of {store.product_count} products
          </p>
        </div>

        {/* Mobile-Optimized Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 border-gray-300 rounded-lg focus:border-2 transition-colors"
              style={{
                borderColor: searchQuery ? colors.primary : undefined,
                '--tw-ring-color': `${colors.primary}20`
              } as any}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
              >
                ×
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 border-gray-300 rounded-lg">
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
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-12 px-4 rounded-none border-0 ${
                  viewMode === 'grid' ? 'text-white' : 'text-gray-600'
                }`}
                style={viewMode === 'grid' ? { backgroundColor: colors.primary } : {}}
              >
                <Grid className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-12 px-4 rounded-none border-0 border-l border-gray-300 ${
                  viewMode === 'list' ? 'text-white' : 'text-gray-600'
                }`}
                style={viewMode === 'list' ? { backgroundColor: colors.primary } : {}}
              >
                <List className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">List</span>
              </Button>
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
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-lg">
                <Store className="w-12 h-12 text-slate-400" />
              </div>
              {searchQuery || selectedCategory !== 'all' ? (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Search className="w-4 h-4 text-blue-500" />
                </div>
              ) : null}
            </div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              No Products Found
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                : 'This store hasn\'t added any public products yet. Check back soon for new arrivals!'
              }
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-6 rounded-full px-6"
              >
                Clear Filters
              </Button>
            )}
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

      {/* Clean Simple Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          {/* Store Contact Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {store.showcase_logo_url && (
                <img
                  src={store.showcase_logo_url}
                  alt={`${store.name} logo`}
                  className="w-12 h-12 rounded-lg"
                />
              )}
              <h3 className="text-2xl font-bold">{store.name}</h3>
            </div>

            {store.showcase_description && (
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                {store.showcase_description}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              {shouldShowContactInfo('phone') && store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => trackContactClick('phone')}
                >
                  <Phone className="w-5 h-5" />
                  <span>{store.phone}</span>
                </a>
              )}

              {shouldShowContactInfo('email') && store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => trackContactClick('email')}
                >
                  <Mail className="w-5 h-5" />
                  <span>Contact Us</span>
                </a>
              )}

              {shouldShowContactInfo('address') && store.address && (
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-5 h-5" />
                  <span>{store.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Storefy Branding */}
          <div className="text-center border-t border-gray-700 pt-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold">Storefy</span>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Powered by Storefy - Modern Retail Management System
            </p>

            <a
              href="https://storefy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.primary}E6`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
              }}
            >
              <span>Create Your Store</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-gray-500 text-xs">
                © 2025 Storefy. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
