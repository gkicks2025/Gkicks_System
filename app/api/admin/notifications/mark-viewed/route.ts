import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using JWT token
    let token = request.cookies.get('auth-token')?.value;
    
    // If no cookie token, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('❌ Mark Viewed API: No token provided');
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.log('❌ Mark Viewed API: Invalid token');
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get admin user ID
    let adminUserId = null;
    const adminUserResult = await executeQuery(
      'SELECT id FROM admin_users WHERE email = ? AND is_active = 1',
      [decoded.email]
    ) as any[];
    
    if (adminUserResult.length > 0) {
      adminUserId = adminUserResult[0].id;
    } else {
      // Fallback: Check users table for legacy admin users
      const legacyAdminResult = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND is_admin = 1',
        [decoded.email]
      ) as any[];
      
      if (legacyAdminResult.length === 0) {
        console.log('❌ Mark Viewed API: User is not an admin:', decoded.email);
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Not an admin' },
          { status: 401 }
        );
      }
      
      adminUserId = legacyAdminResult[0].id;
    }

    const { orderIds } = await request.json();
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    console.log(`🔔 API: Marking ${orderIds.length} notifications as viewed for admin user ${adminUserId}`);
    
    // Insert viewed records for each order (using INSERT IGNORE to avoid duplicates)
    const values = orderIds.map(orderId => `(${adminUserId}, ${orderId})`).join(', ');
    
    const insertSQL = `
      INSERT IGNORE INTO notification_views (admin_user_id, order_id)
      VALUES ${values}
    `;
    
    await executeQuery(insertSQL, []);
    
    console.log(`✅ API: Successfully marked ${orderIds.length} notifications as viewed`);
    
    return NextResponse.json({
      success: true,
      message: `Marked ${orderIds.length} notifications as viewed`
    });
    
  } catch (error) {
    console.error('❌ API: Error marking notifications as viewed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as viewed' },
      { status: 500 }
    );
  }
}