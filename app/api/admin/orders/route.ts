import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching orders from MySQL database...')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch orders from MySQL database
    const orders = await executeQuery(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(oi.id) as item_count,
        SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `)
    
    const ordersArray = Array.isArray(orders) ? orders : []
    console.log(`✅ API: Successfully returned ${ordersArray.length} orders`)
    
    return NextResponse.json(ordersArray)
  } catch (error) {
    console.error('❌ API: Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId, status } = await request.json()
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    // Update order status
    await executeQuery(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    )

    console.log(`✅ API: Updated order ${orderId} status to ${status}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ API: Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}