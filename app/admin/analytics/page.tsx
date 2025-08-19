"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingCart, Users, TrendingUp, Download, Calendar, Package, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

// Empty data for reset state
const monthlyRevenueData = [
  { month: "Jan", revenue: 0 },
  { month: "Feb", revenue: 0 },
  { month: "Mar", revenue: 0 },
  { month: "Apr", revenue: 0 },
  { month: "May", revenue: 0 },
  { month: "Jun", revenue: 0 },
]

const monthlyOrdersData = [
  { month: "Jan", orders: 0 },
  { month: "Feb", orders: 0 },
  { month: "Mar", revenue: 0 },
  { month: "Apr", orders: 0 },
  { month: "May", orders: 0 },
  { month: "Jun", orders: 0 },
]

const categoryData = [
  { name: "Men", value: 0, color: "#8884d8" },
  { name: "Women", value: 0, color: "#82ca9d" },
  { name: "Kids", value: 0, color: "#ffc658" },
  { name: "Unisex", value: 0, color: "#ff7300" },
]

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-yellow-500">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your store performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">₱0.00</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">₱0.00</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Monthly Revenue</CardTitle>
            <CardDescription className="text-muted-foreground">
              Revenue trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value) => [`₱${value}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Sales by Category</CardTitle>
            <CardDescription className="text-muted-foreground">Product category performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-card-foreground">No sales data</h3>
                <p className="mt-1 text-sm text-muted-foreground">Start selling to see category breakdown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Monthly Orders</CardTitle>
            <CardDescription className="text-muted-foreground">
              Order volume trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Bar dataKey="orders" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Selling Products</CardTitle>
            <CardDescription className="text-muted-foreground">
              Best performing products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-card-foreground">No sales data available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Products will appear here once orders are placed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest store activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-card-foreground">No recent activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Activity will appear here as your store grows
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
