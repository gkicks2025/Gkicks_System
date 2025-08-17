import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    let token = request.cookies.get('auth-token')?.value
    
    // If no cookie token, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string }

    // Get user from database
    const userArray = await executeQuery(
      'SELECT id, email, first_name, last_name, avatar_url, is_admin, created_at FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[]
    if (userArray.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = userArray[0]

    console.log('🔐 Auth Me: Returning user data:', {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url
    });

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}