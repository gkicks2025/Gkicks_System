"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Menu, X, Home, Package, ShoppingCart, BarChart3, Calculator, User, Settings, LogOut, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Removed Supabase auth - using local authentication

export function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()
  
  // Mock user data - replace with actual auth
  const user = { email: 'admin@gkicks.com' }
  const profile = { first_name: 'Admin', last_name: 'User' }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Check user role
  const isFullAdmin = user?.email === "gkcksdmn@gmail.com"
  const isStaff = user?.email === "gkicksstaff@gmail.com"

  const getUserDisplayName = () => {
    if (isFullAdmin) return "ADMIN GKICKS"
    if (isStaff) return "STAFF GKICKS"
    return profile?.first_name || user?.email?.split("@")[0] || "User"
  }

  const navigationItems = [
    { href: "/admin", icon: Home, label: "Dashboard", active: pathname === "/admin" },
    { href: "/admin/inventory", icon: Package, label: "Products", active: pathname === "/admin/inventory" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders", active: pathname === "/admin/orders" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics", active: pathname === "/admin/analytics" },
    { href: "/admin/pos", icon: Calculator, label: "POS", active: pathname === "/admin/pos" },
    { href: "/admin/ai-training", icon: Brain, label: "AI Training", active: pathname === "/admin/ai-training" },
  ]

  return (
    <header className="bg-background border-b border-border">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between items-center h-16">
          {/* Empty space for logo removal */}
          <div></div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Back to Store */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Store
              </Link>
            </Button>

            {/* User dropdown removed */}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-2">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 mr-3" />
                Back to Store
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
