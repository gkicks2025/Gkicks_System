import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUserArray = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[]
    if (existingUserArray.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const insertResult = await executeQuery(
      'INSERT INTO users (email, password_hash, first_name, last_name, is_admin, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [email, hashedPassword, firstName, lastName, false]
    ) as any
    const userId = insertResult.insertId

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId, 
        email,
        role: 'user'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'user'
      },
      token
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}