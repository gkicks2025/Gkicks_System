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
    
    // Fetch orders with complete information
    const orders = await executeQuery(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.payment_method,
        o.payment_screenshot,
        o.subtotal,
        o.tax_amount,
        o.shipping_amount,
        o.discount_amount,
        o.total_amount as total,
        o.customer_email,
        o.shipping_address,
        o.billing_address,
        o.notes,
        o.created_at,
        o.updated_at,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `) as any[]

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        const items = await executeQuery(
          `SELECT 
            oi.id,
            oi.quantity,
            oi.price,
            oi.size,
            oi.color,
            p.name,
            p.brand,
            p.image_url as image
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?`,
          [order.id]
        ) as any[]

        // Process items with proper number conversion
        const processedItems = items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price)
        }))

        return {
          ...order,
          // Convert numeric fields to proper numbers
          subtotal: Number(order.subtotal || 0),
          tax_amount: Number(order.tax_amount || 0),
          shipping_amount: Number(order.shipping_amount || 0),
          discount_amount: Number(order.discount_amount || 0),
          total: Number(order.total || 0),
          // Parse shipping address JSON
          shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : null,
          // Add customer information
          customerName: order.first_name ? (order.last_name ? `${order.first_name} ${order.last_name}`.trim() : order.first_name) : 'Unknown Customer',
          customerEmail: order.customer_email || order.email || 'No email provided',
          // Add payment method
          paymentMethod: order.payment_method || 'Not specified',
          // Add items
          items: processedItems
        }
      })
    )
    
    console.log(`✅ API: Successfully returned ${ordersWithItems.length} orders with complete details`)
    
    return NextResponse.json(ordersWithItems)
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