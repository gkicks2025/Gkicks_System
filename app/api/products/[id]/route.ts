import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    console.log('🔍 API: Fetching product by ID from MySQL database...', productId)
    
    const results = await executeQuery(
      `SELECT * FROM products WHERE id = ? AND is_active = 1 AND is_deleted = 0`,
      [productId]
    ) as any[]
    
    const product = results[0]

    if (!product) {
      console.log('❌ API: Product not found:', productId)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully fetched product from database:', product.name)
    
    // Parse JSON fields if they exist
    const parsedProduct = {
      ...product,
      colors: product.colors ? JSON.parse(product.colors) : [],
      color_images: product.color_images ? JSON.parse(product.color_images) : {},
      variants: product.variants ? JSON.parse(product.variants) : {}
    }

    return NextResponse.json(parsedProduct)

  } catch (error) {
    console.error('❌ API: Error fetching product by ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}