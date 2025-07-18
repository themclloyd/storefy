import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, Package, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/taxUtils";

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

interface PublicProductGridProps {
  products: PublicProduct[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  onProductClick: (product: PublicProduct) => void;
  themeColors: {
    primary: string;
    secondary: string;
  };
  storeCurrency?: string;
}

export function PublicProductGrid({
  products,
  loading,
  viewMode,
  onProductClick,
  themeColors,
  storeCurrency = 'USD'
}: PublicProductGridProps) {

  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 5) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className={viewMode === 'grid' ? "h-48" : "h-32"} />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock_quantity);
          
          return (
            <Card 
              key={product.product_id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onProductClick(product)}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Product Image */}
                  <div className="w-32 h-32 flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-muted flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{product.product_name}</h3>
                        {product.category_name && (
                          <Badge variant="outline" className="text-xs mb-2">
                            {product.category_name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        {product.show_price_publicly && (
                          <div className="text-xl font-bold" style={{ color: themeColors.primary }}>
                            {formatPrice(product.price)}
                          </div>
                        )}
                        {product.show_stock_publicly && (
                          <Badge variant={stockStatus.variant} className="text-xs mt-1">
                            {stockStatus.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {(product.public_description || product.product_description) && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.public_description || product.product_description}
                      </p>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock_quantity);
        
        return (
          <Card 
            key={product.product_id} 
            className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => onProductClick(product)}
          >
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 bg-muted flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              
              {/* Stock Badge */}
              {product.show_stock_publicly && (
                <div className="absolute top-2 right-2">
                  <Badge variant={stockStatus.variant} className="text-xs">
                    {stockStatus.label}
                  </Badge>
                </div>
              )}
              
              {/* Category Badge */}
              {product.category_name && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="text-xs bg-white/90 backdrop-blur-sm">
                    {product.category_name}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <CardContent className="p-4">
              <h3 className="font-semibold text-base mb-2 line-clamp-1">
                {product.product_name}
              </h3>
              
              {(product.public_description || product.product_description) && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {product.public_description || product.product_description}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                {product.show_price_publicly ? (
                  <div className="text-lg font-bold" style={{ color: themeColors.primary }}>
                    {formatPrice(product.price)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Contact for price
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
