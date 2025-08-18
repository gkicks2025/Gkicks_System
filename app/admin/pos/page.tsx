"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Minus, ShoppingCart, CreditCard, QrCode, Receipt, Trash2 } from "lucide-react"
import {
  getInventoryData,
  checkStock,
  updateStock,
  getDailySales,
  updateDailySales,
  type ProductInventory,
} from "@/lib/admin-data"
import { toast } from "sonner"

interface DailySale {
  amount: number;
  // any other properties, e.g. date, id, etc.
}
interface Sale {
  amount: number;
  // Add any other properties that your sales object has, if needed
}

interface CartItem {
  productId: number;
  name: string
  brand: string
  price: number
  color: string
  size: string
  quantity: number
  image: string

}

interface Transaction {
  id: string
  items: CartItem[]
  total: number
  paymentMethod: string
  timestamp: string
  customerName?: string
}

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [inventory, setInventory] = useState<ProductInventory[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [customerName, setCustomerName] = useState("")
  const [amountPaid, setAmountPaid] = useState(0)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [dailySales, setDailySales] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stockMap, setStockMap] = useState<Record<string, number>>({});


  const sizes = ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]

  
  useEffect(() => {
  async function fetchStocks() {
    if (!selectedProduct || !selectedColor) {
      setStockMap({});
      return;
    }
    const sizes = getAvailableSizes(selectedProduct, selectedColor);
    const stocks: Record<string, number> = {};
    for (const size of sizes) {
      const stock = await getCurrentStock(selectedProduct, selectedColor, selectedSize);
      stocks[size] = stock;
    }
    setStockMap(stocks);
  }
  fetchStocks();
}, [selectedProduct, selectedColor]);

  useEffect(() => {
    loadDailySales()
    refreshInventory()
    loadDailySales()
    loadTransactions()
  }, [])

  const refreshInventory = () => {
    try {
      const data = getInventoryData()
      if (Array.isArray(data)) {
        // Filter only active products with stock
        const activeProducts = data.filter((product) => {
          if (!product || product.isActive === false) return false
          return getTotalStock(product) > 0
        })
        setInventory(activeProducts)
      } else {
        console.warn("Invalid inventory data received:", data)
        setInventory([])
      }
    } catch (error) {
      console.error("Error refreshing inventory:", error)
      setInventory([])
      toast.error("Failed to load inventory data")
    }
  }
    
    const loadDailySales = async () => {
    try {
      const salesArray: Sale[] = await getDailySales();
      const totalSales = salesArray.reduce((sum, sale) => sum + sale.amount, 0); // example to get total
      setDailySales(totalSales);
    } catch (error) {
      console.error("Error loading daily sales:", error);
      setDailySales(0);
    }
  }




  const loadTransactions = () => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("pos-transactions")
        if (stored) {
          const parsedTransactions = JSON.parse(stored)
          if (Array.isArray(parsedTransactions)) {
            setTransactions(parsedTransactions)
          }
        }
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
      setTransactions([])
    }
  }

  const saveTransaction = (transaction: Transaction) => {
    try {
      if (typeof window !== "undefined") {
        const updatedTransactions = [transaction, ...transactions].slice(0, 100) // Keep last 100 transactions
        setTransactions(updatedTransactions)
        window.localStorage.setItem("pos-transactions", JSON.stringify(updatedTransactions))
      }
    } catch (error) {
      console.error("Error saving transaction:", error)
    }
  }

  const filteredInventory = inventory.filter((product) => {
    if (!product) return false

    const searchMatch =
      !searchQuery ||
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))

    return searchMatch
  })

  const getTotalStock = (product: ProductInventory): number => {
    if (!product?.variants) return 0

    return Object.values(product.variants).reduce((total, variant) => {
      if (!variant?.sizes) return total
      return total + Object.values(variant.sizes).reduce((sum, qty) => sum + (typeof qty === "number" ? qty : 0), 0)
    }, 0)
  }

  const getAvailableColors = (product: ProductInventory): string[] => {
    if (!product?.variants) return []

    return Object.keys(product.variants ?? {}).filter((color) => {
      const variant = product.variants?.[color]
      if (!variant?.sizes) return false
      // Check if any size has stock > 0
      return Object.values(variant.sizes).some((stock) => typeof stock === "number" && stock > 0)
    })

  }

  const getAvailableSizes = (product: ProductInventory, color: string): string[] => {
    if (!product?.variants?.[color]?.sizes) return []

    return Object.entries(product.variants[color].sizes)
      .filter(([, stock]) => typeof stock === "number" && stock > 0)
      .map(([size]) => size)
      .sort((a, b) => Number(a) - Number(b))
  }

  const getCurrentStock = async (product: ProductInventory, color: string, size: string): Promise<number> => {
  try {
    return await checkStock(product.id, color, size)
  } catch (error) {
    console.error("Error getting current stock:", error)
    return 0
  }
}


  const openProductDialog = (product: ProductInventory) => {
    setSelectedProduct(product)
    setSelectedColor("")
    setSelectedSize("")
    setIsProductDialogOpen(true)
  }

  const addToCart = () => {
    if (!selectedProduct || !selectedColor || !selectedSize) {
      toast.error("Please select color and size")
      return
    }
    async function myFunction() {
    const stock = await getCurrentStock(selectedProduct!, selectedColor, selectedSize)
      if (stock <= 0) {
        toast.error("Product is out of stock")
        return
      }
}

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === selectedProduct.id && item.color === selectedColor && item.size === selectedSize,
    )

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedCart = [...cart]
      // Make sure the function is async:
        const updateQuantity = async () => {
          // Await the async function to get a number
          const stock = await getCurrentStock(selectedProduct, selectedColor, selectedSize);

          if (updatedCart[existingItemIndex].quantity < stock) {
            updatedCart[existingItemIndex].quantity += 1;
            setCart(updatedCart);
            toast.success("Quantity updated in cart");
          } else {
            toast.error("Cannot add more than available stock");
          }
        };


    } else {
      // Add new item to cart
      const newItem: CartItem = {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        brand: selectedProduct.brand,
        price: selectedProduct.price,
        color: selectedColor,
        size: selectedSize,
        quantity: 1,
        image: `/images/${selectedProduct.name.toLowerCase().replace(/\s+/g, "-")}.png`,
      }

      setCart([...cart, newItem])
      toast.success("Added to cart")
    }

    setIsProductDialogOpen(false)
    setSelectedProduct(null)
    setSelectedColor("")
    setSelectedSize("")
  }



  const updateCartItemQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }
    
    const item = cart[index]
    const stock = await getCurrentStock(
      inventory.find((p) => p.id === Number(item.productId))!,
      item.color,
      item.size
    );

    if (newQuantity > stock) {
      toast.error("Cannot exceed available stock");
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    await updateStock(
      inventory.find((p) => p.id === Number(item.productId))?.id ?? 0,
      item.color,
      item.size,
      newQuantity
    );
  }

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
    toast.success("Removed from cart")
  }

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartItemCount = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const processCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (paymentMethod === "cash" && amountPaid < getCartTotal()) {
      toast.error("Insufficient payment amount")
      return
    }

    try {
      // Update inventory stock
      cart.forEach((item) => {
       updateStock(item.productId, item.color, item.size, -item.quantity)

      })

      // Create transaction
      const transaction: Transaction = {
        id: `TXN-${Date.now()}`,
        items: [...cart],
        total: getCartTotal(),
        paymentMethod,
        timestamp: new Date().toISOString(),
        customerName: customerName || undefined,
      }

      // Update daily sales
      const newDailySales = dailySales + getCartTotal()
      updateDailySales()
      setDailySales(newDailySales)

      // Save transaction
      saveTransaction(transaction)
      setLastTransaction(transaction)

      // Clear cart and form
      setCart([])
      setCustomerName("")
      setAmountPaid(0)
      setPaymentMethod("cash")
      setIsCheckoutDialogOpen(false)
      setIsReceiptDialogOpen(true)

      // Refresh inventory
      refreshInventory()

      toast.success("Transaction completed successfully")
    } catch (error) {
      console.error("Error processing checkout:", error)
      toast.error("Failed to process transaction")
    }
  }

  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getChange = (): number => {
    return Math.max(0, amountPaid - getCartTotal())
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Point of Sale</h1>
              <p className="text-lg text-muted-foreground mt-2">Process sales and manage transactions</p>
            </div>
            <div className="flex items-center gap-6">
              <Card className="p-4 bg-card border-border">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily Sales</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(dailySales)}</p>
                </div>
              </Card>
              <Card className="p-4 bg-card border-border">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transactions.length}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-foreground">Products</CardTitle>
                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-lg">No products available</p>
                      <p className="text-sm">Check inventory or adjust search terms</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredInventory.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow bg-card border-border hover:border-yellow-400"
                          onClick={() => openProductDialog(product)}
                        >
                          <CardContent className="p-4">
                            <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                              <img
                                src={
                                  (product.gallery_images && product.gallery_images.length > 0 
                                    ? product.gallery_images[0] 
                                    : product.image_url) || 
                                  `/images/${product.name?.toLowerCase().replace(/\s+/g, "-")}.png`
                                }
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                                {product.is_new && <Badge className="bg-green-500 text-xs">New</Badge>}
                                {product.is_sale && <Badge className="bg-red-500 text-xs">Sale</Badge>}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{product.brand}</p>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-lg font-bold text-foreground">
                          {formatCurrency(product.price)}
                        </p>
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                      {formatCurrency(product.originalPrice)}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                >
                                  Stock: {getTotalStock(product)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {getAvailableColors(product)
                                  .slice(0, 3)
                                  .map((color) => (
                                    <div
                                      key={color}
                                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500"
                                      style={{
                                        backgroundColor:
                                          color === "black"
                                            ? "#000000"
                                            : color === "white"
                                              ? "#ffffff"
                                              : color === "red"
                                                ? "#ef4444"
                                                : color === "blue"
                                                  ? "#3b82f6"
                                                  : color === "green"
                                                    ? "#10b981"
                                                    : color === "gray"
                                                      ? "#6b7280"
                                                      : color === "pink"
                                                        ? "#ec4899"
                                                        : color === "brown"
                                                          ? "#a3a3a3"
                                                          : "#d1d5db",
                                      }}
                                      title={color}
                                    />
                                  ))}
                                {getAvailableColors(product).length > 3 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{getAvailableColors(product).length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-foreground">Cart ({getCartItemCount()})</CardTitle>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCart([])}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.productId}-${item.color}-${item.size}`}
                          className="border border-border rounded-lg p-3 bg-muted"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-foreground">{item.name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {item.brand} • {item.color} • Size {item.size}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(index)}
                              className="h-6 w-6 p-0 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                                className="h-6 w-6 p-0 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center text-foreground">
                          {item.quantity}
                        </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                                className="h-6 w-6 p-0 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {cart.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-foreground">Total:</span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(getCartTotal())}
                    </span>
                    </div>
                    <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Checkout
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Checkout</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="customer-name" className="text-foreground">
              Customer Name (Optional)
            </Label>
                            <Input
                              id="customer-name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Enter customer name"
                              className="bg-background border-border text-foreground placeholder-muted-foreground"
                            />
                          </div>
                          <div>
                            <Label htmlFor="payment-method" className="text-foreground">
                Payment Method
              </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger className="bg-background border-border text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                <SelectItem
                                  value="cash"
                                  className="text-foreground hover:bg-accent"
                                >
                                  Cash
                                </SelectItem>
                                <SelectItem
                                  value="gcash"
                                  className="text-foreground hover:bg-accent"
                                >
                                  GCash
                                </SelectItem>
                                <SelectItem
                                  value="maya"
                                  className="text-foreground hover:bg-accent"
                                >
                                  Maya
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {paymentMethod === "cash" && (
                            <div>
                              <Label htmlFor="amount-paid" className="text-foreground">
                                Amount Paid
                              </Label>
                              <Input
                                id="amount-paid"
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(Number(e.target.value))}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="bg-background border-border text-foreground placeholder-muted-foreground"
                              />
                              {amountPaid > 0 && (
                                <div className="mt-2 text-sm text-foreground">
                                  <p>Total: {formatCurrency(getCartTotal())}</p>
                                  <p>Change: {formatCurrency(getChange())}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {(paymentMethod === "gcash" || paymentMethod === "maya") && (
                            <div className="text-center py-4">
                              <QrCode className="h-24 w-24 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">Show QR code to customer</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(getCartTotal())}
                              </p>
                            </div>
                          )}
                          <div className="pt-4 border-t border-border">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-semibold text-foreground">Total Amount:</span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(getCartTotal())}
              </span>
                            </div>
                            <Button
                              onClick={processCheckout}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                              size="lg"
                            >
                              <Receipt className="h-5 w-5 mr-2" />
                              Complete Transaction
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 10).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="border border-border rounded-lg p-3 bg-muted"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-foreground">{transaction.id}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {formatDate(transaction.timestamp)}
                              </p>
                              {transaction.customerName && (
                                <p className="text-xs text-gray-600 dark:text-gray-300">{transaction.customerName}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                  {formatCurrency(transaction.total)}
                </p>
                              <Badge
                                variant="outline"
                                className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                              >
                                {transaction.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {transaction.items.length} item{transaction.items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Selection Dialog */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Select Product Options</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={
                        (selectedProduct.gallery_images && selectedProduct.gallery_images.length > 0 
                          ? selectedProduct.gallery_images[0] 
                          : selectedProduct.image_url) || 
                        `/images/${selectedProduct.name?.toLowerCase().replace(/\s+/g, "-")}.png`
                      }
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground">{selectedProduct.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{selectedProduct.brand}</p>
                    <p className="text-2xl font-bold mt-2 text-foreground">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                    {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                      <p className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        {formatCurrency(selectedProduct.originalPrice)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium text-foreground">Available Colors</Label>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {getAvailableColors(selectedProduct).map((color) => (
                      <Button
                        key={color}
                        variant={selectedColor === color ? "default" : "outline"}
                        onClick={() => {
                          setSelectedColor(color)
                          setSelectedSize("") // Reset size when color changes
                        }}
                        className={`h-12 justify-start ${
                          selectedColor === color
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 mr-2"
                          style={{
                            backgroundColor:
                              color === "black"
                                ? "#000000"
                                : color === "white"
                                  ? "#ffffff"
                                  : color === "red"
                                    ? "#ef4444"
                                    : color === "blue"
                                      ? "#3b82f6"
                                      : color === "green"
                                        ? "#10b981"
                                        : color === "gray"
                                          ? "#6b7280"
                                          : color === "pink"
                                            ? "#ec4899"
                                            : color === "brown"
                                              ? "#a3a3a3"
                                              : "#d1d5db",
                          }}
                        />
                        <span className="capitalize">{color}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedColor && (
                  <div>
                    <Label className="text-base font-medium text-foreground">Available Sizes</Label>
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {getAvailableSizes(selectedProduct, selectedColor).map((size) => {
                          const stock = stockMap[size] ?? 0; // default to 0 if not loaded yet

                          return (
                            <Button
                              key={size}
                              variant={selectedSize === size ? "default" : "outline"}
                              onClick={() => setSelectedSize(size)}
                              disabled={stock <= 0}
                              className={`h-12 ${
                                selectedSize === size
                                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-medium">{size}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{stock}</div>
                              </div>
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {selectedColor && selectedSize && (
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">
                          {selectedProduct.name} - {selectedColor} - Size {selectedSize}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {getCurrentStock(selectedProduct, selectedColor, selectedSize)}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(selectedProduct.price)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsProductDialogOpen(false)}
                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addToCart}
                    disabled={!selectedColor || !selectedSize}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Transaction Receipt</DialogTitle>
            </DialogHeader>
            {lastTransaction && (
              <div className="space-y-4">
                <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                  <h3 className="text-lg font-semibold text-foreground">GKicks Store</h3>
                  <p className="text-sm text-muted-foreground">Transaction Receipt</p>
                  <p className="text-xs text-muted-foreground">{formatDate(lastTransaction.timestamp)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono text-foreground">{lastTransaction.id}</span>
                  </div>
                  {lastTransaction.customerName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="text-foreground">{lastTransaction.customerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="capitalize text-foreground">{lastTransaction.paymentMethod}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {lastTransaction.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {item.color} • Size {item.size} • Qty: {item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">{formatCurrency(lastTransaction.total)}</span>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">Thank you for your purchase!</p>
                </div>

                <Button
                  onClick={() => setIsReceiptDialogOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
