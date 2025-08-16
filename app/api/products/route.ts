import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/database/sqlite';
import { executeQuery as executeQueryMySQL } from '../../../lib/database/mysql';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
    return { id: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching products from SQLite database...');
    
    const query = `
      SELECT * FROM products 
      WHERE is_active = 1 AND is_deleted = 0 
      ORDER BY created_at DESC
    `;
    
    const data = await executeQuery(query);

    if (!data || data.length === 0) {
      console.log('📦 API: No products found in database');
      return NextResponse.json([]);
    }

    console.log(`✅ API: Successfully fetched ${data.length} products from database`);
    
    // Map the data to ensure it matches our Product interface
    const products = data.map((item: any) => {
      let colors = [];
      let colorImages = {};
      
      try {
        colors = item.colors ? JSON.parse(item.colors) : [];
      } catch (e) {
        console.warn('Failed to parse colors for product', item.id, ':', e);
        colors = [];
      }
      
      try {
        colorImages = item.color_images ? JSON.parse(item.color_images) : {};
      } catch (e) {
        console.warn('Failed to parse color_images for product', item.id, ':', e);
        colorImages = {};
      }
      
      return {
        id: item.id,
        name: item.name || 'Unknown Product',
        brand: item.brand || 'Unknown Brand',
        price: parseFloat(item.price) || 0,
        originalPrice: item.original_price ? parseFloat(item.original_price) : undefined,
        description: item.description || '',
        image: item.image_url || '/placeholder-product.jpg',
        rating: item.rating || 0,
        reviews: item.reviews || 0,
        colors,
        colorImages,
        isNew: Boolean(item.is_new),
        isSale: Boolean(item.is_sale),
        views: item.views || 0,
        category: item.category || 'unisex',
        isDeleted: false,
        isActive: Boolean(item.is_active),
      };
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('❌ API: Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      brand,
      price,
      original_price,
      category,
      sku,
      stock_quantity,
      image_url,
      description,
      is_active,
      colors,
      sizes
    } = body;

    // Validate required fields
    if (!name || !brand || !price || !category) {
      return NextResponse.json(
        { error: 'Name, brand, price, and category are required' },
        { status: 400 }
      );
    }

    console.log('🔄 API: Updating product:', productId);

    // Update product in MySQL database
    const updateQuery = `
      UPDATE products SET
        name = ?,
        brand = ?,
        price = ?,
        original_price = ?,
        category = ?,
        sku = ?,
        stock_quantity = ?,
        image_url = ?,
        description = ?,
        is_active = ?,
        colors = ?,
        sizes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      name,
      brand,
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      category,
      sku,
      parseInt(stock_quantity) || 0,
      image_url,
      description,
      is_active,
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      parseInt(productId)
    ];

    const result = await executeQueryMySQL(updateQuery, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Product not found or no changes made' },
        { status: 404 }
      );
    }

    console.log('✅ API: Product updated successfully:', productId);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: parseInt(productId)
    });

  } catch (error) {
    console.error('❌ API: Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}