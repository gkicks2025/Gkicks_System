import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { User } from "@/contexts/auth-context"
import { executeQuery } from "@/lib/database/mysql"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        // Map NextAuth session to our User interface
        let role: 'admin' | 'staff' | 'customer' = 'customer' // Default role for all users
        
        // Only gkcksdmn@gmail.com gets admin privileges
        if (session.user.email === 'gkcksdmn@gmail.com') {
          role = 'admin'
        }
        // All other users are regular customers
        
        const user: User = {
          id: token.sub || '',
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          role: role,
          avatar: session.user.image || '',
        }
        
        console.log('🔍 Auth: User session created -', user.email, 'role:', user.role)
        
        // Store user in database if needed
        await storeUserInDatabase(user)
        
        // Override session.user with our User type
        ;(session as any).user = user
      }
      return session
    },
  },
  pages: {
    signIn: '/auth',
  },
  session: {
    strategy: 'jwt',
  },
}

// Function to store user in database
async function storeUserInDatabase(user: User) {
  try {
    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [user.email]
    ) as any[]
    
    if (existingUsers.length === 0) {
      // Insert new user
      await executeQuery(
        'INSERT INTO users (email, first_name, last_name, avatar_url, is_admin) VALUES (?, ?, ?, ?, ?)',
        [
          user.email,
          user.firstName,
          user.lastName,
          user.avatar,
          user.role === 'admin' ? 1 : 0
        ]
      )
      console.log('✅ Auth: New user stored in database:', user.email)
    } else {
      // Update existing user (including admin status)
      await executeQuery(
        'UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, is_admin = ? WHERE email = ?',
        [user.firstName, user.lastName, user.avatar, user.role === 'admin' ? 1 : 0, user.email]
      )
      console.log('✅ Auth: User updated in database:', user.email)
    }
  } catch (error) {
    console.error('❌ Auth: Error storing user in database:', error)
  }
}