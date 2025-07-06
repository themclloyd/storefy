import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, Percent, DollarSign, CreditCard } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

export function POSView() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  const sampleProducts = [
    { id: '1', name: 'Premium Coffee Beans', price: 24.99, sku: 'COFFEE-001' },
    { id: '2', name: 'Organic Tea Set', price: 15.99, sku: 'TEA-002' },
    { id: '3', name: 'Ceramic Mug', price: 8.99, sku: 'MUG-003' },
    { id: '4', name: 'Artisan Cookies', price: 12.99, sku: 'COOKIE-004' },
  ];

  const addToCart = (product: typeof sampleProducts[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountValue ? 
    (discountType === "percent" ? subtotal * (parseFloat(discountValue) / 100) : parseFloat(discountValue)) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Products Section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">POS System</h1>
          <p className="text-muted-foreground mt-2">Select products to add to cart</p>
        </div>

        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sampleProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border border-border rounded-lg hover:shadow-medium transition-smooth cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-foreground">{product.name}</h3>
                    <Badge variant="secondary" className="text-xs">{product.sku}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">${product.price}</p>
                  <Button className="w-full mt-2" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-6">
        <Card className="card-professional h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">${item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 0)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-foreground mb-3">Apply Discount</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={discountType === "percent" ? "default" : "outline"}
                        onClick={() => setDiscountType("percent")}
                      >
                        <Percent className="w-3 h-3 mr-1" />
                        %
                      </Button>
                      <Button
                        size="sm"
                        variant={discountType === "fixed" ? "default" : "outline"}
                        onClick={() => setDiscountType("fixed")}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        $
                      </Button>
                      <Input
                        placeholder={discountType === "percent" ? "10" : "5.00"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <Input
                      placeholder="Enter discount code (optional)"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-foreground border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button className="w-full bg-gradient-primary text-white font-medium py-3">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment - ${total.toFixed(2)}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}