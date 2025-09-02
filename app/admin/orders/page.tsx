"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAdmin } from "@/contexts/admin-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { type Order } from "@/lib/admin-data"
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Filter, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


export default function AdminOrdersPage() {
  const { state } = useAdmin()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null)
  const { toast } = useToast()

  // Check authentication
  useEffect(() => {
    if (state.isLoading) return // Still loading
    
    if (!state.isAuthenticated || !state.user) {
      toast({
        title: "Access Denied",
        description: "Admin authentication required. Redirecting to login...",
        variant: "destructive",
      })
      router.push('/admin/login')
      return
    }
  }, [state.isAuthenticated, state.isLoading, state.user, router, toast])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/orders', {
      credentials: 'include'
    })
      if (response.ok) {
        const allOrders = await response.json()
        setOrders(allOrders || [])
        console.log("Loaded orders:", allOrders)
      } else {
        throw new Error('Failed to fetch orders')
      }
    } catch (error) {
      console.error("Error loading orders:", error)
      setOrders([])
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    // Listen for new orders from the orders context
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gkicks-orders") {
        loadOrders()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Handle highlight parameter from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (highlightId) {
      setHighlightOrderId(highlightId)
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightOrderId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    // Filter orders based on search term and status
    let filtered = orders

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(searchLower) ||
          order.customerEmail?.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower),
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders((prevOrders) => prevOrders.map((order) => (order.id === orderId ? updatedOrder : order)))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updatedOrder)
        }
        toast({
          title: "Order Updated",
          description: `Order status changed to ${newStatus}`,
        })
      } else {
        throw new Error('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    console.log('🗑️ Frontend: Delete button clicked for order:', orderId)
    
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      console.log('🚫 Frontend: User cancelled deletion')
      return
    }

    console.log('✅ Frontend: User confirmed deletion, proceeding...')

    try {
      // Get JWT token from localStorage for admin authentication
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      console.log('🔑 Frontend: JWT token found:', !!token)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      console.log('📡 Frontend: Making DELETE request to:', `/api/admin/orders/${orderId}`)
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers,
      })
      
      console.log('📡 Frontend: Response status:', response.status)
      
      if (response.ok) {
        console.log('✅ Frontend: Delete successful, updating UI')
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))
        toast({
          title: "Order Deleted",
          description: "Order has been successfully deleted",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Frontend: Delete failed:', response.status, errorData)
        
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in as an admin to delete orders. Go to /admin/login",
            variant: "destructive",
          })
        } else if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to delete orders",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorData.error || `Failed to delete order (${response.status})`,
            variant: "destructive",
          })
        }
        console.error('Delete order error:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ Frontend: Network error deleting order:', error)
      toast({
        title: "Network Error",
        description: "Unable to connect to server. Please check your connection.",
        variant: "destructive",
      })
    }
  }



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "processing":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "shipped":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      case "delivered":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "cancelled":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Show loading while checking authentication
  if (state.isLoading) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="text-muted-foreground">Checking authentication...</div>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!state.isAuthenticated || !state.user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">Orders Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders from G-Kicks</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="outline">
            {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders by customer name, email, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-input border-border text-foreground">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Customer Orders</CardTitle>
          <CardDescription className="text-muted-foreground">
            {filteredOrders.length === 0 && orders.length === 0
              ? "No orders found - orders will appear here when customers make purchases"
              : filteredOrders.length === 0
                ? "No orders match your filters"
                : `Showing ${filteredOrders.length} of ${orders.length} orders`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {orders.length === 0 ? "No customer orders yet" : "No orders found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {orders.length === 0
                  ? "Customer orders from the G-Kicks website will appear here"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {searchTerm || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-all duration-300 bg-card ${
                    highlightOrderId === order.id.toString() 
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg ring-2 ring-yellow-400/50' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-foreground">#{index + 1}</h3>
                          <p className="text-sm text-muted-foreground">{order.customerName || "Unknown Customer"}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail || "No email"}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-sm text-muted-foreground">
                            {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at || order.orderDate).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(order.total)}</p>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
                            <DialogHeader>
                            <DialogTitle className="text-foreground">Order Details - #{filteredOrders.findIndex(order => order.id === selectedOrder?.id) + 1}</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Order placed on{" "}
                              {selectedOrder &&
                                new Date(selectedOrder.created_at || selectedOrder.orderDate).toLocaleDateString("en-PH", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Customer Info */}
                              <div>
                                <h4 className="font-medium mb-2 text-foreground">Customer Information</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-foreground">
                                    <strong>Name:</strong> {selectedOrder.customerName || "Unknown Customer"}
                                  </p>
                                  <p className="text-foreground">
                                    <strong>Email:</strong> {selectedOrder.customerEmail || "No email provided"}
                                  </p>
                                </div>
                              </div>

                              {/* Shipping Address */}
                              <div>
                                <h4 className="font-medium mb-2 text-foreground">Shipping Address</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                  {selectedOrder.shippingAddress ? (
                                    <>
                                      <p className="text-foreground">{selectedOrder.shippingAddress.fullName || 'N/A'}</p>
                                      <p className="text-foreground">{selectedOrder.shippingAddress.street || 'N/A'}</p>
                                      <p className="text-foreground">
                                        {selectedOrder.shippingAddress.city || 'N/A'}, {selectedOrder.shippingAddress.province || 'N/A'}{" "}
                                        {selectedOrder.shippingAddress.zipCode || 'N/A'}
                                      </p>
                                      <p className="text-foreground">Philippines</p>
                                      {selectedOrder.shippingAddress.phone && (
                                        <p className="text-foreground">
                                          <strong>Phone:</strong> {selectedOrder.shippingAddress.phone}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-foreground text-muted-foreground">No shipping address available</p>
                                  )}
                                </div>
                              </div>

                              {/* Order Items */}
                              <div>
                                <h4 className="font-medium mb-2 text-foreground">Order Items</h4>
                                <div className="space-y-2">
                                  {(selectedOrder.items || []).map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <img
                                          src={item.image || "/placeholder.svg"}
                                          alt={item.name}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                        <div>
                                          <p className="font-medium text-foreground">{item.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            Size: {item.size} | Color: {item.color}
                                          </p>
                                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Summary */}
                              <div>
                                <h4 className="font-medium mb-2 text-foreground">Order Summary</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-foreground">Total:</span>
                                    <span className="font-bold text-lg text-foreground">{formatCurrency(selectedOrder.total)}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-foreground">Payment Method:</span>
                                    <span className="text-foreground">{selectedOrder.paymentMethod}</span>
                                  </div>
                                  {selectedOrder.payment_screenshot && (selectedOrder.paymentMethod === "GCash" || selectedOrder.paymentMethod === "Maya") && (
                                    <div className="mt-3">
                                      <span className="text-foreground font-medium">Payment Screenshot:</span>
                                      <div className="mt-2 border rounded-lg overflow-hidden max-w-sm">
                                        <img 
                                          src={selectedOrder.payment_screenshot} 
                                          alt="Payment Screenshot" 
                                          className="w-full h-auto max-h-64 object-contain"
                                          onClick={() => window.open(selectedOrder.payment_screenshot, '_blank')}
                                          style={{ cursor: 'pointer' }}
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
                                    </div>
                                  )}
                                  {selectedOrder.trackingNumber && (
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-foreground">Tracking Number:</span>
                                      <span className="font-mono text-foreground">{selectedOrder.trackingNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Update */}
                              <div>
                                <h4 className="font-medium mb-2 text-foreground">Update Order Status</h4>
                                <div className="flex flex-wrap gap-2">
                                  {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(
                                    (status) => (
                                      <Button
                                        key={status}
                                        variant={selectedOrder.status === status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleStatusUpdate(selectedOrder.id, status as Order["status"])}
                                        className="flex items-center gap-1"
                                      >
                                        {getStatusIcon(status)}
                                        {status}
                                      </Button>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteOrder(order.id)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
