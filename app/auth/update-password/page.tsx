"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // If user is already logged in and not coming from a password reset link,
    // they should probably be redirected or handled differently.
    // For now, we assume this page is primarily for password reset flow.
    if (!loading && !user) {
      // If not loading and no user, it means the session might not be set yet
      // or the user is not logged in. Supabase handles session from URL hash.
      // We can add a check here if the URL contains an access_token to indicate a reset flow.
      const urlParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = urlParams.get("access_token")
      if (!accessToken) {
        // If no access token, and not logged in, redirect to auth page
        // router.push("/auth");
      }
    }
  }, [user, loading, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.")
      toast({
        title: "Password Update Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.")
      toast({
        title: "Password Update Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update password')
        toast({
          title: "Password Update Error",
          description: data.error || 'Failed to update password',
          variant: "destructive",
        })
      } else {
        setSuccessMessage("Your password has been updated successfully!")
        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully!",
        })
        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          router.push("/auth")
        }, 2000)
      }
    } catch (error) {
      setError('An error occurred while updating password')
      toast({
        title: "Password Update Error",
        description: 'An error occurred while updating password',
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Reset Your Password</h1>
        <p className="text-gray-400">Enter your new password below.</p>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-yellow-400 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-yellow-400 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="confirmNewPassword"
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              >
                {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

          <Button
            type="submit"
            className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 py-3 rounded-md text-lg font-semibold transition-colors"
          >
            Set New Password
          </Button>
        </form>
      </div>
    </div>
  )
}
