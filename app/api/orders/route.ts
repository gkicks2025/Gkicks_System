import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { executeQuery } from '../../../lib/database/sqlite'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch (error) {
    return null
  }
}

// GET - Fetch user orders
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 API: Fetching orders for user:', user.id)
    
    const orders = await executeQuery(
      `SELECT * FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [user.id]
    )

    console.log(`✅ API: Successfully fetched ${orders.length} orders`)
    return NextResponse.json(orders)

  } catch (error) {
    console.error('❌ API: Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      items,
      total,
      customer_email,
      shipping_address,
      payment_method,
      status = 'pending'
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!total || !customer_email) {
      return NextResponse.json(
        { error: 'Total amount and customer email are required' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Creating new order for:', customer_email)

    // Generate order number
    const orderNumber = `GK${Date.now()}`

    // Create the order
    const result = await executeQuery(
      `INSERT INTO orders (
         user_id, order_number, status, total_amount, 
         shipping_address, payment_method, customer_email,
         items, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        user_id || null,
        orderNumber,
        status,
        total,
        JSON.stringify(shipping_address),
        payment_method,
        customer_email,
        JSON.stringify(items)
      ]
    )

    // Fetch the created order
    const newOrder = await executeQuery(
      `SELECT * FROM orders WHERE rowid = ?`,
      [(result as any).lastID]
    )

    const order = newOrder[0]
    // Parse JSON fields
    const parsedOrder = {
      ...order,
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      items: order.items ? JSON.parse(order.items) : []
    }

    console.log('✅ API: Successfully created order:', orderNumber)
    return NextResponse.json(parsedOrder, { status: 201 })

  } catch (error) {
    console.error('❌ API: Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, tracking_number } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Updating order status:', id, 'to:', status)

    const result = await executeQuery(
      `UPDATE orders 
       SET status = ?, tracking_number = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [status, tracking_number || null, id, user.id]
    )

    if ((result as any).changes === 0) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      )
    }

    // Fetch the updated order
    const updatedOrder = await executeQuery(
      `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
      [id, user.id]
    )

    const order = updatedOrder[0]
    const parsedOrder = {
      ...order,
      shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      items: order.items ? JSON.parse(order.items) : []
    }

    console.log('✅ API: Successfully updated order status')
    return NextResponse.json(parsedOrder)

  } catch (error) {
    console.error('❌ API: Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}