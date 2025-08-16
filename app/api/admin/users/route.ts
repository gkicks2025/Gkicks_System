import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching users (mock data for now)...')
    
    // Return empty array for now since users table may not exist in SQLite
    // TODO: Implement proper users table and data fetching
    const users: any[] = []
    
    console.log(`✅ API: Successfully returned ${users.length} users`)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('❌ API: Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}