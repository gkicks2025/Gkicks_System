"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, CheckCircle, Eye, RefreshCw } from "lucide-react"
// Removed Supabase import - using API calls instead
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  totalUsers: number
  recentOrders: any[]
  topProducts: any[]
  salesData: any[]
  categoryData: any[]
}

const COLORS = ["#FBBF24", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6"]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching dashboard data...")

      // Initialize default stats
      const dashboardStats: DashboardStats = {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        recentOrders: [],
        topProducts: [],
        salesData: [],
        categoryData: [],
      }

      // Fetch products data
      try {
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const products = await response.json()

        if (products && Array.isArray(products)) {
          console.log("Products fetched:", products.length)
          dashboardStats.totalProducts = products.length
          dashboardStats.activeProducts = products.filter((p) => p.is_active).length
          dashboardStats.lowStockProducts = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length
          dashboardStats.outOfStockProducts = products.filter((p) => p.stock_quantity === 0).length

          // Top products by stock quantity
          dashboardStats.topProducts = products
            .filter((p) => p.is_active)
            .sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0))
            .slice(0, 5)

          // Category data
          const categoryStats = products.reduce(
            (acc, product) => {
              const category = product.category || "Other"
              acc[category] = (acc[category] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          )

          dashboardStats.categoryData = Object.entries(categoryStats).map(([name, value]) => ({
            name,
            value,
          }))
        }
      } catch (error) {
        console.warn("Error fetching products:", error)
      }

      // Fetch orders data
      try {
        const ordersResponse = await fetch('/api/admin/orders')
        if (ordersResponse.ok) {
          const orders = await ordersResponse.json()
          if (orders && Array.isArray(orders)) {
            console.log("Orders fetched:", orders.length)
            dashboardStats.totalOrders = orders.length
            dashboardStats.totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
            dashboardStats.pendingOrders = orders.filter((o) => o.status === "pending").length
            dashboardStats.completedOrders = orders.filter((o) => o.status === "delivered").length
            dashboardStats.recentOrders = orders.slice(0, 10)

            // Sales data for the last 7 days
            const salesData = []
            for (let i = 6; i >= 0; i--) {
              const date = new Date()
              date.setDate(date.getDate() - i)
              const dateStr = date.toISOString().split("T")[0]

              const dayOrders = orders.filter((order) => order.created_at?.startsWith(dateStr)) || []
              const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

              salesData.push({
                date: date.toLocaleDateString("en-US", { weekday: "short" }),
                revenue: dayRevenue,
                orders: dayOrders.length,
              })
            }
            dashboardStats.salesData = salesData
          }
        }
      } catch (error) {
        console.warn("Error fetching orders:", error)
      }

      // Fetch users data
      try {
        const usersResponse = await fetch('/api/admin/users')
        if (usersResponse.ok) {
          const users = await usersResponse.json()
          if (users && Array.isArray(users)) {
            console.log("Users fetched:", users.length)
            dashboardStats.totalUsers = users.length
          }
        }
      } catch (error) {
        console.warn("Error fetching users:", error)
      }

      setStats(dashboardStats)
      console.log("Dashboard stats loaded:", dashboardStats)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-400">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">{error}</p>
            <Button onClick={fetchDashboardData} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
          <Button onClick={fetchDashboardData} className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Data
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-2">
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome to your GKicks admin dashboard</p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent text-gray-600 dark:text-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">₱{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">From {stats.totalOrders} orders</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.pendingOrders} pending, {stats.completedOrders} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Products</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.totalProducts}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.activeProducts} active, {stats.outOfStockProducts} out of stock
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Registered customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">In Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.totalProducts - stats.lowStockProducts - stats.outOfStockProducts}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Products with adequate stock</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.lowStockProducts}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Products need restocking</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.outOfStockProducts}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Products unavailable</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="bg-muted border-border">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Recent Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Top Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-yellow-500">Sales Overview</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Revenue and orders for the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-600" />
                        <XAxis dataKey="date" stroke="#6B7280" className="dark:stroke-gray-400" />
                        <YAxis stroke="#6B7280" className="dark:stroke-gray-400" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--foreground)",
                          }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#FBBF24" strokeWidth={2} />
                        <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No sales data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-yellow-500">Product Categories</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Distribution of products by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--foreground)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No category data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-yellow-500">Recent Orders</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Latest orders from customers</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-700 dark:text-gray-300">Order ID</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.recentOrders.map((order) => (
                          <TableRow key={order.id} className="border-gray-200 dark:border-gray-700">
                            <TableCell className="font-medium text-gray-700 dark:text-gray-300">#{order.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">₱{order.total_amount?.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.status === "delivered"
                                    ? "bg-green-500 text-white"
                                    : order.status === "pending"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-gray-500 text-white"
                                }
                              >
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild className="text-gray-600 dark:text-gray-400 hover:text-yellow-500">
                                <Link href={`/admin/orders`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">No orders yet</h3>
                    <p className="text-gray-600 dark:text-gray-500">Orders will appear here when customers make purchases</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-yellow-500">Top Products</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Products with highest stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-700 dark:text-gray-300">Product Name</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Brand</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Category</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Price</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Stock</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topProducts.map((product) => (
                          <TableRow key={product.id} className="border-gray-200 dark:border-gray-700">
                            <TableCell className="font-medium text-gray-700 dark:text-gray-300">{product.name}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{product.brand}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 capitalize">{product.category}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">₱{product.price?.toLocaleString()}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300">{product.stock_quantity}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  product.stock_quantity > 5
                                    ? "bg-green-500 text-white"
                                    : product.stock_quantity > 0
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-red-500 text-white"
                                }
                              >
                                {product.stock_quantity > 5
                                  ? "In Stock"
                                  : product.stock_quantity > 0
                                    ? "Low Stock"
                                    : "Out of Stock"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">No products found</h3>
                    <p className="text-gray-600 dark:text-gray-500">Products will appear here when added to inventory</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
