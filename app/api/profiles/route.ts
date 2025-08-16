import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { executeQuery } from '@/lib/database/mysql'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string }
    return { id: decoded.userId, email: decoded.email }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 API: Fetching profile for user:', user.id, '- timestamp:', new Date().toISOString())
    
    // Fetch profile from database
    const profileQuery = 'SELECT * FROM profiles WHERE id = ?'
    const profiles = await executeQuery(profileQuery, [user.id])
    
    console.log('📊 API: Raw profile data from DB:', profiles)
    
    let profile
    if (profiles.length > 0) {
      const dbProfile = profiles[0]
      console.log('📋 API: Processing profile:', {
        id: dbProfile.id,
        first_name: dbProfile.first_name,
        last_name: dbProfile.last_name,
        phone: dbProfile.phone,
        preferences: dbProfile.preferences
      })
      
      // Check if existing profile has empty first_name/last_name and update from users table
      if (!dbProfile.first_name || !dbProfile.last_name) {
        console.log('🔄 Profile has empty name fields, updating from users table')
        
        // Fetch user data from users table
        const userQuery = 'SELECT first_name, last_name, avatar_url FROM users WHERE id = ?'
        const userData = await executeQuery(userQuery, [user.id])
        
        if (userData.length > 0) {
          const userFirstName = userData[0].first_name || ''
          const userLastName = userData[0].last_name || ''
          const userAvatarUrl = userData[0].avatar_url || ''
          
          // Update profile with user data
          const updateQuery = `
            UPDATE profiles 
            SET first_name = ?, last_name = ?, avatar_url = ?, updated_at = NOW()
            WHERE id = ?
          `
          
          await executeQuery(updateQuery, [
            userFirstName,
            userLastName,
            userAvatarUrl || dbProfile.avatar_url,
            user.id
          ])
          
          console.log('✅ Profile updated with user data:', {
            first_name: userFirstName,
            last_name: userLastName,
            avatar_url: userAvatarUrl || dbProfile.avatar_url
          })
          
          // Update the profile object
          dbProfile.first_name = userFirstName
          dbProfile.last_name = userLastName
          if (userAvatarUrl) {
            dbProfile.avatar_url = userAvatarUrl
          }
        }
      }
      
      // Parse preferences if it's a string
      let preferences = {
        newsletter: true,
        sms_notifications: false,
        email_notifications: true,
        preferred_language: 'en',
        currency: 'PHP'
      }
      
      if (dbProfile.preferences) {
        try {
          preferences = typeof dbProfile.preferences === 'string' 
            ? JSON.parse(dbProfile.preferences) 
            : dbProfile.preferences
        } catch (e) {
          console.warn('Failed to parse preferences, using defaults')
        }
      }
      
      profile = {
        id: dbProfile.id,
        first_name: dbProfile.first_name || '',
        last_name: dbProfile.last_name || '',
        phone: dbProfile.phone || '',
        birthdate: dbProfile.birthdate || '',
        gender: dbProfile.gender || '',
        bio: dbProfile.bio || '',
        avatar_url: dbProfile.avatar_url || '',
        preferences
      }
      
      console.log('✨ API: Final profile object:', profile)
    } else {
      // Fetch user data from users table to use as defaults
      const userQuery = 'SELECT first_name, last_name, avatar_url FROM users WHERE id = ?'
      const users = await executeQuery(userQuery, [user.id])
      
      let userFirstName = ''
      let userLastName = ''
      let userAvatarUrl = ''
      
      if (users.length > 0) {
        const userData = users[0]
        userFirstName = userData.first_name || ''
        userLastName = userData.last_name || ''
        userAvatarUrl = userData.avatar_url || ''
        console.log('📋 API: Using user data as defaults:', { userFirstName, userLastName, userAvatarUrl })
      }
      
      // Create default profile if none exists
      const defaultProfile = {
        id: user.id,
        first_name: userFirstName,
        last_name: userLastName,
        phone: '',
        birthdate: null,
        gender: '',
        bio: '',
        avatar_url: userAvatarUrl,
        preferences: JSON.stringify({
          newsletter: true,
          sms_notifications: false,
          email_notifications: true,
          preferred_language: 'en',
          currency: 'PHP'
        })
      }
      
      const insertQuery = `
        INSERT INTO profiles (id, first_name, last_name, phone, birthdate, gender, bio, avatar_url, preferences)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      await executeQuery(insertQuery, [
        defaultProfile.id,
        defaultProfile.first_name,
        defaultProfile.last_name,
        defaultProfile.phone,
        defaultProfile.birthdate,
        defaultProfile.gender,
        defaultProfile.bio,
        defaultProfile.avatar_url,
        defaultProfile.preferences
      ])
      
      profile = {
        id: user.id,
        first_name: userFirstName,
        last_name: userLastName,
        phone: '',
        birthdate: '',
        gender: '',
        bio: '',
        avatar_url: userAvatarUrl,
        preferences: JSON.parse(defaultProfile.preferences)
      }
    }
    
    console.log('✅ API: Successfully fetched profile')
    return NextResponse.json(profile)

  } catch (error) {
    console.error('❌ API: Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('🔍 API: Updating profile for user:', user.id, 'with data:', body)
    console.log('📝 API: Update data received:', {
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      birthdate: body.birthdate,
      gender: body.gender,
      bio: body.bio,
      avatar_url: body.avatar_url,
      preferences: body.preferences
    })

    // Update profile in database
    const updateQuery = `
      UPDATE profiles 
      SET first_name = ?, last_name = ?, phone = ?, birthdate = ?, gender = ?, bio = ?, avatar_url = ?, preferences = ?
      WHERE id = ?`
    
    const preferencesString = typeof body.preferences === 'object' 
      ? JSON.stringify(body.preferences) 
      : body.preferences
    
    const updateParams = [
      body.first_name || '',
      body.last_name || '',
      body.phone || '',
      body.birthdate || null,
      body.gender || '',
      body.bio || '',
      body.avatar_url || '',
      preferencesString || JSON.stringify({
        newsletter: true,
        sms_notifications: false,
        email_notifications: true,
        preferred_language: 'en',
        currency: 'PHP'
      }),
      user.id
    ]
    
    console.log('💾 API: Executing update with params:', updateParams)
    
    const result = await executeQuery(updateQuery, updateParams)
    
    console.log('✅ API: Update result:', result)

    console.log('✅ API: Successfully updated profile')
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        ...body
      }
    })

  } catch (error) {
    console.error('❌ API: Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}