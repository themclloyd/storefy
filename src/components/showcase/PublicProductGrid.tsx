import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Plus, Heart, Star, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/taxUtils";
import { useShowcaseCartStore } from "@/stores/showcaseCartStore";
import { useState } from "react";

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
  const { addToCart } = useShowcaseCartStore();
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  const formatPrice = (price: number) => {
    return formatCurrency(price, storeCurrency);
  };

  const handleQuickAddToCart = (e: React.MouseEvent, product: PublicProduct) => {
    e.stopPropagation(); // Prevent opening the product modal

    if (product.stock_quantity <= 0) {
      return;
    }

    addToCart(
      product.product_id,
      product.product_name,
      product.price,
      product.stock_quantity,
      {}, // No variants for quick add
      0,  // No variant adjustments
      product.image_url,
      1   // Default quantity of 1
    );
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 5) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className={`grid gap-4 ${
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
      }`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <Skeleton className={viewMode === 'grid' ? "h-48" : "h-32"} />
            <div className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Always use grid view for the template
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock_quantity);
        const isWishlisted = wishlistItems.has(product.product_id);

        return (
          <div
            key={product.product_id}
            className="group bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
            onClick={() => onProductClick(product)}
          >
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-50 p-4">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                <Package className="w-16 h-16 text-gray-400" />
              </div>

              {/* Wishlist Button */}
              <button
                onClick={(e) => toggleWishlist(product.product_id, e)}
                className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Heart
                  className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                />
              </button>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {product.product_name}
              </h3>

              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-500 ml-1">(121)</span>
              </div>

              {/* Price */}
              {product.show_price_publicly && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.price * 1.2)}
                  </span>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors duration-200"
                onClick={(e) => handleQuickAddToCart(e, product)}
                disabled={product.stock_quantity <= 0}
              >
                {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

}
