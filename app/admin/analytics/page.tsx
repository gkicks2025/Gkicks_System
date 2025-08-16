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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-yellow-400">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400">Comprehensive insights into your store performance</p>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-yellow-400">₱0.00</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="text-gray-500 dark:text-gray-500">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-yellow-400">0</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="text-gray-500 dark:text-gray-500">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-yellow-400">₱0.00</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="text-gray-500 dark:text-gray-500">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-yellow-400">0</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="text-gray-500 dark:text-gray-500">+0.0%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Monthly Revenue</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Revenue trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value) => [`₱${value}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#FBBF24" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Sales by Category</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Product category performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No sales data</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start selling to see category breakdown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Monthly Orders</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Order volume trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                />
                <Bar dataKey="orders" fill="#FBBF24" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Top Selling Products</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Best performing products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[350px]">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No sales data available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Products will appear here once orders are placed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Latest store activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Activity will appear here as your store grows
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
