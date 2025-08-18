import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gkicks_shop',
}

export async function POST(request: NextRequest) {
  try {
    const user = await request.json()
    
    const connection = await mysql.createConnection(dbConfig)
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [user.email]
    )
    
    if ((existingUsers as any[]).length === 0) {
      // Insert new user
      await connection.execute(
        'INSERT INTO users (email, first_name, last_name, avatar_url, is_admin, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          user.email,
          user.firstName,
          user.lastName,
          user.avatar,
          user.role === 'admin' ? 1 : 0
        ]
      )
    } else {
      // Update existing user
      await connection.execute(
        'UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, updated_at = NOW() WHERE email = ?',
        [user.firstName, user.lastName, user.avatar, user.email]
      )
    }
    
    await connection.end()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing user:', error)
    return NextResponse.json(
      { error: 'Failed to store user' },
      { status: 500 }
    )
  }
}