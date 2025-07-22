import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign, Hash, Tag, User, Building2, AlertTriangle, TrendingUp } from "lucide-react";
import { useTax } from "@/hooks/useTax";
import { type Product } from "@/stores/inventoryStore";

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ViewProductDialog({ open, onOpenChange, product }: ViewProductDialogProps) {
  const { formatCurrency } = useTax();

  if (!product) return null;

  const getStatusColor = () => {
    if (product.stock_quantity === 0) return "bg-red-100 text-red-800 border-red-200";
    if (product.stock_quantity <= product.low_stock_threshold) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = () => {
    if (product.stock_quantity === 0) return "Out of Stock";
    if (product.stock_quantity <= product.low_stock_threshold) return "Low Stock";
    return "In Stock";
  };

  const getStockIcon = () => {
    if (product.stock_quantity === 0) return <AlertTriangle className="w-4 h-4" />;
    if (product.stock_quantity <= product.low_stock_threshold) return <AlertTriangle className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-purple-600" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                {product.description && (
                  <p className="text-gray-600 mt-2">{product.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Badge className={`${getStatusColor()} flex items-center gap-1`}>
                  {getStockIcon()}
                  {getStatusText()}
                </Badge>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-600" />
                Basic Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SKU:</span>
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                    {product.sku}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="font-semibold text-lg text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(product.cost)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Profit Margin:</span>
                  <span className="font-semibold text-blue-600">
                    {product.cost > 0 ? `${(((product.price - product.cost) / product.cost) * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                Stock Information
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <span className={`font-bold text-xl ${
                    product.stock_quantity === 0
                      ? 'text-red-600'
                      : product.stock_quantity <= product.low_stock_threshold
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {product.stock_quantity}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Low Stock Threshold:</span>
                  <span className="font-semibold text-gray-900">
                    {product.low_stock_threshold}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock Value:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(product.price * product.stock_quantity)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost Value:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(product.cost * product.stock_quantity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Category & Supplier */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                Category & Supplier
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900">
                    {product.categories?.name || 'Uncategorized'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Supplier:</span>
                  <span className="font-medium text-gray-900">
                    {product.suppliers?.name || 'No supplier'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Timestamps
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(product.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
