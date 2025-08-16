"use client"

import { useState, useEffect } from "react"
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
import { getOrders, updateOrder, type Order } from "@/lib/admin-data"
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Filter, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadOrders = () => {
    setIsLoading(true)
    try {
      const allOrders = getOrders()
      setOrders(allOrders)
      console.log("Loaded orders:", allOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
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

  const handleStatusUpdate = (orderId: string, newStatus: Order["status"]) => {
    const updatedOrder = updateOrder(orderId, { status: newStatus })
    if (updatedOrder) {
      setOrders((prevOrders) => prevOrders.map((order) => (order.id === orderId ? updatedOrder : order)))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder)
      }
      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to update order status",
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
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage and track customer orders from G-Kicks</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by customer name, email, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
      <Card>
        <CardHeader>
          <CardTitle>Customer Orders</CardTitle>
          <CardDescription>
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
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {orders.length === 0 ? "No customer orders yet" : "No orders found"}
              </h3>
              <p className="text-gray-500 mb-6">
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
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">#{order.id}</h3>
                          <p className="text-sm text-gray-500">{order.customerName || "Unknown Customer"}</p>
                          <p className="text-xs text-gray-400">{order.customerEmail || "No email"}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-sm text-gray-600">
                            {order.items.length} {order.items.length === 1 ? "item" : "items"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.orderDate).toLocaleDateString("en-PH", {
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
                        <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Order Details - #{selectedOrder?.id}</DialogTitle>
                            <DialogDescription>
                              Order placed on{" "}
                              {selectedOrder &&
                                new Date(selectedOrder.orderDate).toLocaleDateString("en-PH", {
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
                                <h4 className="font-medium mb-2">Customer Information</h4>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p>
                                    <strong>Name:</strong> {selectedOrder.customerName || "Unknown Customer"}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {selectedOrder.customerEmail || "No email provided"}
                                  </p>
                                </div>
                              </div>

                              {/* Shipping Address */}
                              <div>
                                <h4 className="font-medium mb-2">Shipping Address</h4>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p>{selectedOrder.shippingAddress.fullName}</p>
                                  <p>{selectedOrder.shippingAddress.street}</p>
                                  <p>
                                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province}{" "}
                                    {selectedOrder.shippingAddress.zipCode}
                                  </p>
                                  <p>Philippines</p>
                                  {selectedOrder.shippingAddress.phone && (
                                    <p>
                                      <strong>Phone:</strong> {selectedOrder.shippingAddress.phone}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Order Items */}
                              <div>
                                <h4 className="font-medium mb-2">Order Items</h4>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <img
                                          src={item.image || "/placeholder.svg"}
                                          alt={item.name}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                        <div>
                                          <p className="font-medium">{item.name}</p>
                                          <p className="text-sm text-gray-500">
                                            Size: {item.size} | Color: {item.color}
                                          </p>
                                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Summary */}
                              <div>
                                <h4 className="font-medium mb-2">Order Summary</h4>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span>Total:</span>
                                    <span className="font-bold text-lg">{formatCurrency(selectedOrder.total)}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span>Payment Method:</span>
                                    <span>{selectedOrder.paymentMethod}</span>
                                  </div>
                                  {selectedOrder.trackingNumber && (
                                    <div className="flex justify-between items-center mt-2">
                                      <span>Tracking Number:</span>
                                      <span className="font-mono">{selectedOrder.trackingNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Update */}
                              <div>
                                <h4 className="font-medium mb-2">Update Order Status</h4>
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
