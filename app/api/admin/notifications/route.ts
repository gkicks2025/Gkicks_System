import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface OrderNotification {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 API: Fetching admin notifications...');
    
    // Get session to identify admin user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    // Get admin user ID from database
    const adminUserResult = await executeQuery(
      'SELECT id FROM users WHERE email = ? AND is_admin = 1',
      [session.user.email]
    ) as RowDataPacket[];
    
    if (adminUserResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Not an admin' },
        { status: 401 }
      );
    }
    
    const adminUserId = adminUserResult[0].id;
    
    // Get count of new/pending orders that haven't been viewed by this admin
    const newOrdersResult = await executeQuery(
      `SELECT COUNT(*) as count FROM orders o
       LEFT JOIN notification_views nv ON o.id = nv.order_id AND nv.admin_user_id = ?
       WHERE (o.status IN ('pending', 'confirmed') 
       OR o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR))
       AND nv.id IS NULL`,
      [adminUserId]
    ) as RowDataPacket[];
    
    const newOrdersCount = newOrdersResult[0]?.count || 0;
    
    // Get recent orders for notification dropdown (only unviewed by this admin)
    const recentOrdersResult = await executeQuery(
      `SELECT 
         o.id,
         o.order_number,
         o.customer_email,
         o.total_amount,
         o.status,
         o.created_at
       FROM orders o
       LEFT JOIN notification_views nv ON o.id = nv.order_id AND nv.admin_user_id = ?
       WHERE o.status IN ('pending', 'confirmed', 'processing')
       AND nv.id IS NULL
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [adminUserId]
    ) as RowDataPacket[];
    
    const recentOrders: OrderNotification[] = recentOrdersResult.map(row => ({
      id: row.id,
      order_number: row.order_number,
      customer_name: row.customer_email || 'Unknown Customer',
      total_amount: parseFloat(row.total_amount),
      status: row.status,
      created_at: row.created_at
    }));
    
    console.log(`✅ API: Found ${newOrdersCount} new orders, ${recentOrders.length} recent orders`);
    
    return NextResponse.json({
      success: true,
      newOrdersCount,
      recentOrders
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}