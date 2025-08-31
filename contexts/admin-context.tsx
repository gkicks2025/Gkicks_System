"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

interface AdminUser {
  id: string
  email: string
  role: "admin" | "staff" | "cashier"
  permissions: Record<string, boolean> | { all: boolean }
  is_active: boolean
  created_at: string
}

interface AdminState {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AdminContextType {
  state: AdminState
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
  isStaff: () => boolean
  isCashier: () => boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const { user: authUser, signInWithGoogle, signOut } = useAuth()

  // Check if current authenticated user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!authUser?.email) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return
      }

      try {
        console.log("Checking admin status for:", authUser.email)

        // Check if user is admin using MySQL API
        const response = await fetch('/api/admin/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: authUser.email }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Admin user found:", data.user)
          
          // Generate JWT token for admin user
          try {
            const tokenResponse = await fetch('/api/auth/session-to-jwt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json()
              if (typeof window !== "undefined" && tokenData.token) {
                console.log('✅ Admin JWT token generated and stored')
                localStorage.setItem('auth_token', tokenData.token)
              }
            } else {
              console.error('Failed to generate admin JWT token:', tokenResponse.status)
            }
          } catch (tokenError) {
            console.error('Error generating admin JWT token:', tokenError)
          }
          
          setState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          console.log("User is not an admin")
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    checkAdminStatus()
  }, [authUser])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))
      console.log("Attempting admin login for:", email)

      // First, sign in with Google auth
      try {
        await signInWithGoogle()
      } catch (error) {
        console.error("Auth error: Login failed", error)
        setState((prev) => ({ ...prev, isLoading: false }))
        return false
      }

      // Wait for auth state to update
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if user is an admin using MySQL API
      const response = await fetch('/api/admin/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        console.error("Admin check error: User is not an admin")
        await signOut() // Sign out if not an admin
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
        return false
      }

      const data = await response.json()
      console.log("Admin login successful:", data.user)
      
      // Generate JWT token for admin user
      try {
        const tokenResponse = await fetch('/api/auth/session-to-jwt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          if (typeof window !== "undefined" && tokenData.token) {
            console.log('✅ Admin login JWT token generated and stored')
            localStorage.setItem('auth_token', tokenData.token)
          }
        } else {
          console.error('Failed to generate admin login JWT token:', tokenResponse.status)
        }
      } catch (tokenError) {
        console.error('Error generating admin login JWT token:', tokenError)
      }
      
      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
      })
      return true
    } catch (error) {
      console.error("Login error:", error)
      setState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const logout = async () => {
    try {
      // Clear JWT token from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem('auth_token')
        console.log('🗑️ Admin JWT token cleared from localStorage')
      }
      
      await signOut()
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false

    // Admin has all permissions
    if (state.user.role === "admin") return true

    // Check if permissions object has 'all' permission
    if (typeof state.user.permissions === 'object' && 'all' in state.user.permissions && state.user.permissions.all) {
      return true
    }

    // Check specific permissions in the permissions object
    if (typeof state.user.permissions === 'object' && permission in state.user.permissions) {
      return 'all' in state.user.permissions 
        ? false 
        : (state.user.permissions as Record<string, boolean>)[permission] === true
    }

    return false
  }

  const isAdmin = (): boolean => {
    return state.user?.role === "admin" || false
  }

  const isStaff = (): boolean => {
    return state.user?.role === "staff" || false
  }

  const isCashier = (): boolean => {
    return state.user?.role === "cashier" || false
  }

  const value: AdminContextType = {
    state,
    login,
    logout,
    hasPermission,
    isAdmin,
    isStaff,
    isCashier,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
