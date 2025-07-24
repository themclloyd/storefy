import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Search, Phone, Store, ShoppingCart, Filter, Heart, Star, MapPin, Eye, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/taxUtils";
import { usePublicShowcaseStore } from "@/stores/publicShowcaseStore";
import { useShowcaseCartStore } from "@/stores/showcaseCartStore";
import { PublicProductModal } from "./PublicProductModal";
import { CartSidebar } from "./cart/CartSidebar";
import { toast } from "sonner";

export function PublicStoreShowcase() {
  const { storeSlug, storeId, storeCode } = useParams<{ storeSlug?: string; storeId?: string; storeCode?: string }>();
  const storeIdentifier = storeSlug || storeId || storeCode;
  const navigate = useNavigate();

  // Voting system state
  const [productVotes, setProductVotes] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

  // Use Zustand store directly to avoid selector issues
  const {
    store,
    products,
    categories,
    storeLoading,
    productsLoading,
    searchQuery,
    selectedCategory,
    selectedProduct,
    showProductModal,
    loadStore,
    loadProducts,
    loadCategories,
    setSearchQuery,
    setSelectedCategory,
    selectProduct,
    closeProductModal
  } = usePublicShowcaseStore();

  // Cart store
  const { addToCart, setStoreInfo } = useShowcaseCartStore();

  useEffect(() => {
    if (storeIdentifier) {
      loadStore(storeIdentifier);
      loadProducts(storeIdentifier);
      loadCategories(storeIdentifier);
    }

    // Load votes from localStorage
    const savedVotes = JSON.parse(localStorage.getItem('productVotes') || '{}');
    const savedUserVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    setProductVotes(savedVotes);
    setUserVotes(savedUserVotes);
  }, [storeIdentifier]);

  // Set store info for cart when store loads
  useEffect(() => {
    if (store) {
      setStoreInfo(store.id, store.currency || 'USD', 0); // Assuming 0% tax rate for now
    }
  }, [store, setStoreInfo]);

  // Voting functions
  const handleVote = async (productId: string) => {
    if (userVotes[productId]) {
      toast.error("You've already voted for this product!");
      return;
    }

    try {
      // Update local state immediately for better UX
      setProductVotes(prev => ({
        ...prev,
        [productId]: (prev[productId] || 0) + 1
      }));
      setUserVotes(prev => ({
        ...prev,
        [productId]: true
      }));

      // Store vote in localStorage to persist across sessions
      const existingVotes = JSON.parse(localStorage.getItem('productVotes') || '{}');
      existingVotes[productId] = (existingVotes[productId] || 0) + 1;
      localStorage.setItem('productVotes', JSON.stringify(existingVotes));

      const existingUserVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
      existingUserVotes[productId] = true;
      localStorage.setItem('userVotes', JSON.stringify(existingUserVotes));

      toast.success("Thank you for your vote!");
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("Failed to record vote");
    }
  };

  // Calculate star rating based on votes
  const getStarRating = (productId: string) => {
    const votes = productVotes[productId] || 0;
    if (votes === 0) return 0;

    // Convert votes to a 1-5 star rating
    // Every 10 votes = 1 star, max 5 stars
    const stars = Math.min(Math.ceil(votes / 10), 5);
    return stars;
  };

  // Quick add to cart function
  const handleQuickAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); // Prevent any parent click events

    if (product.stock_quantity <= 0) {
      toast.error("Product is out of stock");
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

  // Handle view product details
  const handleViewProduct = (product: any) => {
    selectProduct(product);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600 mb-4">The store you're looking for doesn't exist or is not available.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === "" ||
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.product_description && product.product_description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" ||
      product.category_name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Green Bar */}
      <div className="bg-green-700 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{store?.phone || '+00123456789'}</span>
              </div>
              <span className="hidden sm:inline">Get 50% Off on Selected Items | Shop Now</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Eng</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">{store?.name || 'Shopcart'}</span>
            </div>



            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search Product"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 border-gray-300 rounded-md bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Cart */}
            <div className="flex items-center">
              <CartSidebar
                storeIdentifier={storeIdentifier!}
                storeName={store?.name || 'Store'}
                storePhone={store?.phone}
                whatsappNumber={store?.phone}
                themeColors={{
                  primary: '#16a34a', // green-600
                  secondary: '#f3f4f6' // gray-100
                }}
              />
            </div>
          </div>
        </div>


      </nav>

      {/* Hero Banner */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-[85%] mx-auto">
          <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{backgroundColor: '#fef7ed', background: 'linear-gradient(135deg, #fef7ed 0%, #fdf2f8 50%, #f3e8ff 100%)'}}>
            <div className="px-8 py-12 lg:px-12 lg:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Hero Content */}
                <div className="space-y-6 z-10 relative">
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-gray-900">
                    {store?.showcase_description || `Welcome to ${store?.name || 'Our Store'}`}
                    <br />
                    <span className="text-green-700">Quality Products at Great Prices</span>
                  </h1>
                  <Button
                    className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => {
                      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Shop Now
                  </Button>
                </div>

                {/* Hero Image */}
                <div className="relative flex justify-center lg:justify-end items-center">
                  <div className="relative">
                    {/* Gradient circle background */}
                    <div className="absolute top-4 right-4 w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full opacity-90"></div>
                    {/* Store image or default shopping image */}
                    <div className="relative w-64 h-64 lg:w-80 lg:h-80 z-10">
                      <img
                        src={store?.showcase_banner_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&crop=center"}
                        alt={`${store?.name || 'Store'} showcase`}
                        className="w-full h-full object-cover rounded-full shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-8 left-8 w-16 h-16 bg-yellow-200 rounded-full opacity-30"></div>
            <div className="absolute bottom-8 right-16 w-12 h-12 bg-pink-200 rounded-full opacity-40"></div>
            <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-purple-200 rounded-full opacity-25"></div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Products</h2>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.category_id} value={category.category_name}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-24 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="0-50">$0-50</SelectItem>
                <SelectItem value="50-100">$50-100</SelectItem>
                <SelectItem value="100-200">$100-200</SelectItem>
                <SelectItem value="200+">$200+</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-24 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="5">5★</SelectItem>
                <SelectItem value="4">4★+</SelectItem>
                <SelectItem value="3">3★+</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-24 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-28 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="plastic">Plastic</SelectItem>
                <SelectItem value="metal">Metal</SelectItem>
                <SelectItem value="leather">Leather</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-24 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Offer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="discount">Sale</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="flex items-center gap-2 border-gray-300 h-10 px-4 text-sm rounded-full"
            >
              All Filters
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by</span>
            <Select>
              <SelectTrigger className="w-32 h-10 border-gray-300 text-sm rounded-full">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price ↑</SelectItem>
                <SelectItem value="price-high">Price ↓</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.product_id}
              className="group bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-50 p-4 overflow-hidden">
                <img
                  src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop"}
                  alt={product.product_name}
                  className="w-full h-full object-cover rounded-lg"
                />
                {/* Vote Button */}
                <button
                  onClick={() => handleVote(product.product_id)}
                  className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 ${
                    userVotes[product.product_id] ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  disabled={userVotes[product.product_id]}
                >
                  <Heart className={`w-4 h-4 transition-colors ${
                    userVotes[product.product_id]
                      ? 'text-red-500 fill-red-500'
                      : 'text-gray-400 hover:text-red-400'
                  }`} />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 bg-white">
                <h3 className="font-medium text-gray-900 mb-1 text-sm line-clamp-2">
                  {product.product_name}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                  {product.public_description || product.product_description || "Premium quality product"}
                </p>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => {
                    const starRating = getStarRating(product.product_id);
                    const isFilled = i < starRating;
                    return (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          isFilled
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    );
                  })}
                  <span className="text-xs text-gray-500 ml-1">
                    ({productVotes[product.product_id] || 0} votes)
                  </span>
                </div>

                {/* Price */}
                {product.show_price_publicly && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(product.price, store?.currency || 'USD')}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(product.price * 1.2, store?.currency || 'USD')}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Add to Cart Icon */}
                  <Button
                    onClick={(e) => handleQuickAddToCart(e, product)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-full transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                    disabled={product.stock_quantity === 0}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>

                  {/* View Details Icon */}
                  <Button
                    onClick={() => handleViewProduct(product)}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-full transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {productsLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty State */}
        {!productsLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">{store?.name || 'Store'}</span>
            </div>
            <p className="text-gray-400">
              © 2024 {store?.name || 'Store'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Product Modal */}
      {selectedProduct && (
        <PublicProductModal
          product={selectedProduct}
          open={showProductModal}
          onOpenChange={closeProductModal}
          storeInfo={store!}
          themeColors={{
            primary: '#16a34a', // green-600
            secondary: '#f3f4f6' // gray-100
          }}
          storeCurrency={store?.currency || 'USD'}
        />
      )}
    </div>
  );
}
