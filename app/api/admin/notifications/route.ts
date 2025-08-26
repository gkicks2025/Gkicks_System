import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { RowDataPacket } from 'mysql2';

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
    
    // Get count of new/pending orders (orders created in last 24 hours or with pending status)
    const newOrdersResult = await executeQuery(
      `SELECT COUNT(*) as count FROM orders 
       WHERE status IN ('pending', 'confirmed') 
       OR created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      []
    ) as RowDataPacket[];
    
    const newOrdersCount = newOrdersResult[0]?.count || 0;
    
    // Get recent orders for notification dropdown
    const recentOrdersResult = await executeQuery(
      `SELECT 
         o.id,
         o.order_number,
         COALESCE(u.first_name, 'Guest') as customer_name,
         o.total_amount,
         o.status,
         o.created_at
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('pending', 'confirmed', 'processing')
       ORDER BY o.created_at DESC
       LIMIT 10`,
      []
    ) as RowDataPacket[];
    
    const recentOrders: OrderNotification[] = recentOrdersResult.map(row => ({
      id: row.id,
      order_number: row.order_number,
      customer_name: row.customer_name,
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