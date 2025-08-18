"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("signIn")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { signIn, signUp, resetPasswordForEmail, user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user && !loading) {
      // Check if user is admin and redirect accordingly
      if (user.email === "gkcksdmn@gmail.com") {
        router.push("/admin")
      } else {
        router.push("/") // Redirect to home if already logged in
      }
    }
  }, [user, loading, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError(null)
    setResetPasswordMessage(null)
    const { error } = await signIn(email, password)
    if (error) {
      setSignInError(error.message)
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Signed In",
        description: "You have successfully signed in.",
      })
      // Check if user is admin and redirect accordingly
      if (email === "gkcksdmn@gmail.com") {
        router.push("/admin")
      } else {
        router.push("/")
      }
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError(null)
    setResetPasswordMessage(null)
    if (password !== confirmPassword) {
      setSignUpError("Passwords do not match.")
      toast({
        title: "Sign Up Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }
    const { error } = await signUp(email, password, firstName, lastName)
    if (error) {
      setSignUpError(error.message)
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to confirm your account.",
      })
      // Optionally redirect to a confirmation message page or home
      router.push("/")
    }
  }

  const handleForgotPassword = async () => {
    setSignInError(null)
    setSignUpError(null)
    setResetPasswordMessage(null)
    if (!email) {
      setSignInError("Please enter your email to reset password.")
      toast({
        title: "Forgot Password Error",
        description: "Please enter your email to reset password.",
        variant: "destructive",
      })
      return
    }
    const { error } = await resetPasswordForEmail(email)
    if (error) {
      setSignInError(error.message)
      toast({
        title: "Forgot Password Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setResetPasswordMessage("Password reset email sent. Check your inbox!")
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for instructions to reset your password.",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-yellow-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center mb-8">
        <Image src="/images/gkicks-new-logo.png" alt="GKicks Logo" width={100} height={100} className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Welcome to GKicks</h1>
        <p className="text-gray-400">Your premium sneaker destination</p>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <div className="flex mb-6 border-b border-gray-700">
          <Button
            variant="ghost"
            className={`flex-1 py-3 text-lg font-semibold rounded-t-lg ${
              activeTab === "signIn"
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-yellow-300"
            }`}
            onClick={() => setActiveTab("signIn")}
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 py-3 text-lg font-semibold rounded-t-lg ${
              activeTab === "signUp"
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-yellow-300"
            }`}
            onClick={() => setActiveTab("signUp")}
          >
            Sign Up
          </Button>
        </div>

        {activeTab === "signIn" && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <h2 className="text-xl font-bold text-yellow-400">Sign In</h2>
            <p className="text-gray-400 text-sm">Enter your credentials to access your account</p>

            <div>
              <label htmlFor="signInEmail" className="block text-sm font-medium text-yellow-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="signInEmail"
                  type="email"
                  placeholder="your@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signInPassword" className="block text-sm font-medium text-yellow-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="signInPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              <Button
                variant="link"
                className="text-sm text-yellow-400 hover:text-yellow-300 mt-2 p-0 h-auto"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </Button>
            </div>

            {signInError && <p className="text-red-500 text-sm">{signInError}</p>}
            {resetPasswordMessage && <p className="text-green-500 text-sm">{resetPasswordMessage}</p>}

            <Button
              type="submit"
              className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Sign In
            </Button>
          </form>
        )}

        {activeTab === "signUp" && (
          <form onSubmit={handleSignUp} className="space-y-6">
            <h2 className="text-xl font-bold text-yellow-400">Sign Up</h2>
            <p className="text-gray-400 text-sm">Create your account to get started</p>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-yellow-400 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-yellow-400 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signUpEmail" className="block text-sm font-medium text-yellow-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="signUpEmail"
                  type="email"
                  placeholder="your@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signUpPassword" className="block text-sm font-medium text-yellow-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="signUpPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-yellow-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {signUpError && <p className="text-red-500 text-sm">{signUpError}</p>}

            <Button
              type="submit"
              className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Sign Up
            </Button>
          </form>
        )}
      </div>

      <p className="text-gray-500 text-xs mt-6 text-center">
        By continuing, you agree to our{" "}
        <Link href="#" className="text-yellow-400 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-yellow-400 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}
