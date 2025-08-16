import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching orders (mock data for now)...')
    
    // Return empty array for now since orders table may not exist in SQLite
    // TODO: Implement proper orders table and data fetching
    const orders: any[] = []
    
    console.log(`✅ API: Successfully returned ${orders.length} orders`)
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error('❌ API: Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}