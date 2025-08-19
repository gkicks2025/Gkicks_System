import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database/mysql'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching POS inventory data from MySQL database...')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch active products with stock information
    const inventoryQuery = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.brand,
        p.price,
        p.original_price,
        p.image_url,
        p.description,
        p.is_new,
        p.is_sale,
        p.is_active,
        p.stock_quantity,
        p.colors,
        p.sizes
      FROM products p
      WHERE p.is_active = 1 AND p.stock_quantity > 0
      ORDER BY p.name ASC
    `
    
    const inventory = await executeQuery(inventoryQuery)
    
    // Format the inventory data for POS use
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const formattedInventory = inventoryArray.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category || 'Other',
      brand: product.brand || 'Unknown',
      price: parseFloat(product.price) || 0,
      originalPrice: parseFloat(product.original_price) || parseFloat(product.price) || 0,
      image: product.image_url,
      description: product.description,
      is_new: Boolean(product.is_new),
      is_sale: Boolean(product.is_sale),
      is_active: Boolean(product.is_active),
      stock_quantity: parseInt(product.stock_quantity) || 0,
      colors: product.colors ? JSON.parse(product.colors) : [],
      sizes: product.sizes ? JSON.parse(product.sizes) : []
    }))
    
    console.log(`✅ API: Successfully returned ${formattedInventory.length} inventory items`)
    
    return NextResponse.json(formattedInventory)
  } catch (error) {
    console.error('❌ API: Error fetching POS inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    )
  }
}

// PUT - Update stock quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { productId, quantity, operation } = await request.json()
    
    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }
    
    let updateQuery: string
    let params: any[]
    
    if (operation === 'set') {
      // Set absolute quantity
      updateQuery = `
        UPDATE products 
        SET stock_quantity = ?, updated_at = NOW()
        WHERE id = ?
      `
      params = [quantity, productId]
    } else if (operation === 'decrease') {
      // Decrease quantity (for sales)
      updateQuery = `
        UPDATE products 
        SET stock_quantity = GREATEST(0, stock_quantity - ?), updated_at = NOW()
        WHERE id = ? AND stock_quantity >= ?
      `
      params = [quantity, productId, quantity]
    } else {
      // Default: increase quantity
      updateQuery = `
        UPDATE products 
        SET stock_quantity = stock_quantity + ?, updated_at = NOW()
        WHERE id = ?
      `
      params = [quantity, productId]
    }
    
    const result = await executeQuery(updateQuery, params)
    
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found or insufficient stock' },
        { status: 404 }
      )
    }
    
    // Get updated stock quantity
    const [updatedProduct] = await executeQuery(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [productId]
    )
    
    return NextResponse.json({
      success: true,
      productId,
      newQuantity: updatedProduct?.stock_quantity || 0
    })
  } catch (error) {
    console.error('❌ API: Error updating stock:', error)
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}