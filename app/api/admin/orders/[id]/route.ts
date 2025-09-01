import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

interface Order extends RowDataPacket {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    const { id: orderId } = await params

    if (!status || !['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update order status
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If order is marked as delivered, automatically mark notification as viewed
    if (status === 'delivered') {
      try {
        // Get session to get admin user ID
        const session = await getServerSession(authOptions)
        if (session?.user && (session.user as any).id) {
          await db.execute(
            'INSERT IGNORE INTO notification_views (admin_user_id, order_id) VALUES (?, ?)',
            [(session.user as any).id, orderId]
          )
          console.log(`✅ Automatically marked notification as viewed for delivered order ${orderId}`)
        }
      } catch (viewError) {
        console.error('Error marking notification as viewed:', viewError)
        // Don't fail the order update if notification marking fails
      }
    }

    // Fetch updated order
    const [orders] = await db.execute<Order[]>(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    )

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]
    
    // Format the response to match the expected Order interface
    const formattedOrder = {
      id: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: [] // Items would need to be fetched separately if needed
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for JWT token in Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      token = cookies['auth-token']
    }
    
    // Also check localStorage token (for client-side requests)
    if (!token) {
      // For client-side requests, we'll rely on the session check as fallback
      const session = await getServerSession(authOptions)
      if (!session?.user?.email || session.user.email !== 'gkcksdmn@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
      }
    } else {
      // Verify JWT token
      try {
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
        const decoded = jwt.verify(token, JWT_SECRET) as any
        
        if (!decoded.userId || decoded.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
        }
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError)
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    const { id: orderId } = await params

    console.log('🗑️ API: Deleting order:', orderId)

    // First, delete order items
    await db.execute(
      'DELETE FROM order_items WHERE order_id = ?',
      [orderId]
    )

    // Then delete the order
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM orders WHERE id = ?',
      [orderId]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('✅ API: Order deleted successfully:', orderId)

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('❌ API: Error deleting order:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}