import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database/mysql'

export async function POST(request: NextRequest) {
  try {
    let email: string
    
    try {
      const body = await request.json()
      email = body.email
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists and is admin
    const [users] = await pool.execute(
      'SELECT id, email, is_admin, created_at FROM users WHERE email = ? AND is_admin = 1',
      [email]
    )

    const userArray = users as any[]
    if (userArray.length === 0) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 403 }
      )
    }

    const user = userArray[0]

    // Return admin user data
    const adminUser = {
      id: user.id.toString(),
      email: user.email,
      role: 'admin' as const,
      permissions: ['all'], // You can customize this based on your needs
      is_active: true,
      created_at: user.created_at
    }

    return NextResponse.json({
      message: 'Admin status confirmed',
      user: adminUser
    })

  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}