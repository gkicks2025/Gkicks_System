import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { User } from "@/contexts/auth-context"

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
        const user: User = {
          id: token.sub || '',
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          role: session.user.email === 'gkcksdmn@gmail.com' ? 'admin' : 'customer',
          avatar: session.user.image || '',
        }
        
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
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/store-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    })
    
    if (!response.ok) {
      console.error('Failed to store user in database')
    }
  } catch (error) {
    console.error('Error storing user in database:', error)
  }
}