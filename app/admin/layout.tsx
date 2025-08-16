"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
      return
    }

    if (!loading && user) {
      // Check if user has admin or staff access
      const hasAdminAccess = user.email === "gkcksdmn@gmail.com"
      const hasStaffAccess = user.email === "gkicksstaff@gmail.com"

      if (!hasAdminAccess && !hasStaffAccess) {
        router.push("/")
        return
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <AdminHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
