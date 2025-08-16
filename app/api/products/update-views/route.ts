import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function POST(request: NextRequest) {
  try {
    const { productId, userId } = await request.json()

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Product ID and User ID are required' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Updating view count for product:', productId, 'user:', userId)
    
    // Update the view count for the product
    await executeQuery(
      `UPDATE products SET views = views + 1 WHERE id = ?`,
      [productId]
    )

    // Get the updated view count
    const results = await executeQuery(
      `SELECT views FROM products WHERE id = ?`,
      [productId]
    ) as any[]
    
    const product = results[0]

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully updated view count:', product.views)
    
    return NextResponse.json({
      views: product.views,
      message: 'View count updated successfully'
    })

  } catch (error) {
    console.error('❌ API: Error updating view count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}