import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching analytics data from MySQL database...')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get current date and calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    
    // Monthly revenue data for the last 6 months
    const monthlyRevenue = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        MONTHNAME(created_at) as month_name,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND status IN ('completed', 'delivered')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), MONTHNAME(created_at)
      ORDER BY month ASC
    `)
    
    // Daily sales for the last 30 days
    const dailySales = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status IN ('completed', 'delivered')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)
    
    // Category performance
    const categoryStats = await executeQuery(`
      SELECT 
        p.category,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.quantity) as items_sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('completed', 'delivered')
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      GROUP BY p.category
      ORDER BY revenue DESC
    `)
    
    // Top selling products
    const topProducts = await executeQuery(`
      SELECT 
        p.id,
        p.name,
        p.brand,
        p.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('completed', 'delivered')
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      GROUP BY p.id, p.name, p.brand, p.category
      ORDER BY total_sold DESC
      LIMIT 10
    `)
    
    // Customer analytics
    const customerStats = await executeQuery(`
      SELECT 
        COUNT(DISTINCT user_id) as total_customers,
        AVG(total_amount) as avg_order_value,
        COUNT(*) as total_orders
      FROM orders 
      WHERE status IN ('completed', 'delivered')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    `)
    
    // Growth metrics
    const currentMonthStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT user_id) as customers
      FROM orders 
      WHERE created_at >= ? 
        AND status IN ('completed', 'delivered')
    `, [startOfMonth.toISOString().split('T')[0]])
    
    const lastMonthStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT user_id) as customers
      FROM orders 
      WHERE created_at >= ? AND created_at <= ?
        AND status IN ('completed', 'delivered')
    `, [startOfLastMonth.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]])
    
    // Calculate growth percentages
    const currentMonthStats = Array.isArray(currentMonthStatsResult) ? currentMonthStatsResult : []
    const lastMonthStats = Array.isArray(lastMonthStatsResult) ? lastMonthStatsResult : []
    const currentMonth = currentMonthStats[0] || { orders: 0, revenue: 0, customers: 0 }
    const lastMonth = lastMonthStats[0] || { orders: 0, revenue: 0, customers: 0 }
    
    const orderGrowth = lastMonth.orders > 0 
      ? ((currentMonth.orders - lastMonth.orders) / lastMonth.orders * 100).toFixed(1)
      : '0'
    
    const revenueGrowth = lastMonth.revenue > 0 
      ? ((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue * 100).toFixed(1)
      : '0'
    
    const customerGrowth = lastMonth.customers > 0 
      ? ((currentMonth.customers - lastMonth.customers) / lastMonth.customers * 100).toFixed(1)
      : '0'
    
    const analyticsData = {
      monthlyRevenue: monthlyRevenue.map(row => ({
        month: row.month_name?.substring(0, 3) || 'N/A',
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.order_count) || 0
      })),
      dailySales: dailySales.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.orders) || 0
      })),
      categoryStats: categoryStats.map(row => ({
        name: row.category || 'Other',
        value: parseInt(row.items_sold) || 0,
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.orders) || 0
      })),
      topProducts,
      customerStats: customerStats[0] || { total_customers: 0, avg_order_value: 0, total_orders: 0 },
      growth: {
        orders: parseFloat(orderGrowth),
        revenue: parseFloat(revenueGrowth),
        customers: parseFloat(customerGrowth)
      },
      currentMonth,
      lastMonth
    }
    
    console.log(`✅ API: Successfully returned analytics data`)
    
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('❌ API: Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}