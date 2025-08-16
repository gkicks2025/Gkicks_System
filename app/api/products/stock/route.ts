import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/sqlite'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  id: number
  email: string
  is_admin: boolean
}

async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// PUT - Update product stock/variants
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
    const productId = searchParams.get('id')
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { color, size, quantity } = body

    if (!color || !size || quantity === undefined) {
      return NextResponse.json(
        { error: 'Color, size, and quantity are required' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Updating product stock:', productId, color, size, quantity)

    // Get current product data
    const productResult = await executeQuery(
      'SELECT variants, stock_quantity FROM products WHERE id = ?',
      [productId]
    )

    if (productResult.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = productResult[0]
    let variants = {}
    
    try {
      variants = product.variants ? JSON.parse(product.variants) : {}
    } catch (error) {
      console.error('Error parsing variants:', error)
      variants = {}
    }

    // Update variants
    if (!variants[color]) variants[color] = {}
    const currentStock = variants[color][size] || 0
    const newStock = Math.max(currentStock - quantity, 0)
    variants[color][size] = newStock

    // Calculate total stock
    let totalStock = 0
    Object.values(variants).forEach((sizeStocks) => {
      const stocks = sizeStocks as Record<string, number>
      totalStock += Object.values(stocks).reduce((sum, qty) => sum + qty, 0)
    })

    // Update database
    const result = await executeQuery(
      'UPDATE products SET variants = ?, stock_quantity = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [JSON.stringify(variants), totalStock, productId]
    )

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Failed to update product stock' },
        { status: 500 }
      )
    }

    console.log('✅ API: Successfully updated product stock')
    return NextResponse.json({
      success: true,
      variants,
      totalStock,
      message: 'Product stock updated successfully'
    })

  } catch (error) {
    console.error('❌ API: Error updating product stock:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}