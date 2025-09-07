"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { Eye, EyeOff } from "lucide-react"

export default function AuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [showForgotEmailModal, setShowForgotEmailModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && !loading) {
      // Only redirect if user is already logged in when visiting the auth page
      // Don't redirect during the login process as that's handled in handleSubmit
      if (user.email === "gkcksdmn@gmail.com") {
        window.location.href = "/admin"
      } else if (user.email === "gkicksstaff@gmail.com") {
        window.location.href = "/admin/orders"
      } else {
        window.location.href = "/"
      }
    }
  }, [user, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (isSignUp && (!firstName || !lastName)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login'
      const body = isSignUp 
        ? { email, password, firstName, lastName }
        : { email, password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        // Store auth token first
        if (data.token) {
          localStorage.setItem('auth_token', data.token)
        }
        
        toast({
          title: "Success",
          description: isSignUp ? "Account created successfully!" : "Signed in successfully!",
        })
        
        // Immediate redirect based on user role using window.location for instant navigation
        if (data.user?.email === "gkcksdmn@gmail.com") {
          window.location.href = "/admin"
        } else if (data.user?.email === "gkicksstaff@gmail.com") {
          window.location.href = "/admin/orders"
        } else {
          window.location.href = "/"
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Authentication failed. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Authentication error:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotSuccess(null)
    setForgotLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setForgotSuccess(data.message)
        setForgotEmail('')
      } else {
        setForgotError(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      setForgotError('An error occurred. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-yellow-400">Loading...</p>
      </div>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-4">
      <div className="text-center mb-8">
        <Image 
          src={isDark ? "/images/gkicks-transparent-logo.png" : "/images/gkicks-main-logo.png"} 
          alt="GKicks Logo" 
          width={100} 
          height={100} 
          className="mx-auto mb-4" 
        />
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Welcome to GKicks</h1>
        <p className="text-gray-400">Your premium sneaker destination</p>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">{isSignUp ? "Create Account" : "Sign In"}</h2>
          <p className="text-gray-400 text-sm">
            {isSignUp ? "Create your account to get started" : "Sign in with your account to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                  placeholder="First name"
                  required={isSignUp}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                  placeholder="Last name"
                  required={isSignUp}
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Gmail account
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? "Please wait..." : (isSignUp ? "Create account" : "Next")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Create one"}
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowForgotEmailModal(true)}
              className="text-blue-400 hover:text-blue-300 text-sm underline bg-transparent border-none cursor-pointer"
            >
              Forgot email?
            </button>
          </div>
        )}


      </div>

      {/* Forgot Email Modal */}
      {showForgotEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Reset Your Password</h3>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-gray-300 text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  required
                />
              </div>
              {forgotError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{forgotError}</p>
                </div>
              )}
              {forgotSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{forgotSuccess}</p>
                </div>
              )}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-sm">
                  💡 <strong>Note:</strong> If an account exists with this email, you'll receive a password reset link.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForgotEmailModal(false)
                    setForgotEmail('')
                    setForgotError(null)
                    setForgotSuccess(null)
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {forgotLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
