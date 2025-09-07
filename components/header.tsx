"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  Settings,
  LogOut,
  Shield,
  Calculator,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"

interface HeaderProps {
  onSearch?: (query: string) => void
  cartCount?: number
  wishlistCount?: number
}

export function Header({ onSearch }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { user, signOut, loading: authLoading } = useAuth()
  const cartContext = useCart()
  const wishlistContext = useWishlist()
  const router = useRouter()

  const cartItems = cartContext?.state?.items || []
  const wishlistItems = wishlistContext?.state?.items || []
  
  const cartCount = cartItems.length > 0 ? cartItems.reduce((total, item) => total + (item.quantity || 0), 0) : 0
  const wishlistCount = wishlistItems.length

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    }
    setIsMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const hasAdminAccess = () => {
    if (!user) return false
    return user.role === "admin" || user.email === "gkcksdmn@gmail.com"
  }

  const hasStaffAccess = () => {
    if (!user) return false
    return user.role === "staff" || user.email === "gkicksstaff@gmail.com"
  }

  const getUserDisplayName = () => {
    if (user?.role === "admin" || user?.email === "gkcksdmn@gmail.com") return "ADMIN GKICKS"
    if (user?.role === "staff" || user?.email === "gkicksstaff@gmail.com") return "STAFF GKICKS"
    return user?.firstName || user?.email?.split("@")[0] || "User"
  }

  if (!mounted) {
    // Avoid hydration mismatch
    return null
  }

  const isDark = resolvedTheme === "dark"
  const textColorClass = isDark ? "text-yellow-400" : "text-black"
  const iconColorClass = isDark ? "text-yellow-400" : "text-black"

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 mr-4 sm:mr-8">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center">
              <Image
              src="/images/kicks-logo.jpeg"
              alt="GKICKS"
              width={32}
              height={32}
              className="object-contain"
            />
            </div>
            <span className={`text-lg sm:text-xl font-bold select-none ${textColorClass}`}>G-Kicks</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden lg:flex items-center space-x-6 xl:space-x-8 font-medium text-sm ${textColorClass}`}>
            <Link href="/men" className="hover:text-yellow-400 transition-colors px-2 py-1 rounded-md">
              Men
            </Link>
            <Link href="/women" className="hover:text-yellow-400 transition-colors px-2 py-1 rounded-md">
              Women
            </Link>
            <Link href="/kids" className="hover:text-yellow-400 transition-colors px-2 py-1 rounded-md">
              Kids
            </Link>
            <Link href="/sale" className="hover:text-yellow-400 transition-colors px-2 py-1 rounded-md">
              Sale
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden xl:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconColorClass}`} />
              <Input
                type="search"
                placeholder="Search shoes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  onSearch?.(e.target.value)
                }}
                className="pl-10 pr-4 bg-muted/50 h-9"
              />
            </form>
          </div>

          {/* Mobile Search Bar - visible on mobile only */}
          <div className="flex-1 max-w-xs mx-2 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconColorClass}`} />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  onSearch?.(e.target.value)
                }}
                className="pl-10 pr-4 bg-muted/50 h-9 text-sm"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`hidden md:flex hover:text-yellow-400 ${iconColorClass} h-8 w-8 p-0`}
            >
              <Sun className={`h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
              <Moon className={`absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="sm" asChild className={`relative hover:text-yellow-400 ${iconColorClass} h-8 w-8 p-0 hidden md:flex`}>
              <Link href="/wishlist">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
                    {wishlistCount}
                  </Badge>
                )}
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="sm" asChild className={`relative hover:text-yellow-400 ${iconColorClass} h-8 w-8 p-0 hidden md:flex`}>
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Link>
            </Button>

            {/* User Menu */}
            {user && !authLoading ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 hover:text-yellow-400 ${iconColorClass}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{getUserDisplayName()}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center text-yellow-400 font-semibold">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cart" className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Cart
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  {/* Admin Dashboard Link - Only for full admin */}
                  {hasAdminAccess() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center text-yellow-600 font-medium">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Staff Access - Limited to Orders and POS */}
                  {hasStaffAccess() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/orders" className="flex items-center text-blue-600 font-medium">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Manage Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/pos" className="flex items-center text-green-600 font-medium">
                          <Calculator className="mr-2 h-4 w-4" />
                          POS System
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : authLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold hidden md:flex">
                <Link href="/auth">Sign In</Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="sm" className={`lg:hidden hover:text-yellow-400 ${iconColorClass} h-8 w-8 p-0 ml-2`} onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t bg-background/95 backdrop-blur">
            <div className="px-4 py-4 space-y-3">

              {/* Mobile Navigation Links */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Link
                  href="/men"
                  className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Men
                </Link>
                <Link
                  href="/women"
                  className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Women
                </Link>
                <Link
                  href="/kids"
                  className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kids
                </Link>
                <Link
                  href="/sale"
                  className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sale
                </Link>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-3">
                {/* Theme Toggle */}
                {mounted && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">Theme</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                      className={`hover:text-yellow-400 ${iconColorClass} h-8 w-8 p-0`}
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </div>
                )}

                {/* Cart & Wishlist */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/cart"
                    className="flex items-center justify-center space-x-2 p-3 hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm font-medium">Cart ({cartCount})</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center justify-center space-x-2 p-3 hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-medium">Wishlist ({wishlistCount})</span>
                  </Link>
                </div>
              </div>

              {/* Mobile User Actions */}
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    
                    {/* Admin Dashboard Link - Only for full admin */}
                    {hasAdminAccess() && (
                      <Link
                        href="/admin"
                        className="flex items-center justify-center px-4 py-3 text-sm font-medium text-yellow-600 transition-colors bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    {/* Staff Access - Limited to Orders and POS */}
                    {hasStaffAccess() && (
                      <div className="space-y-2">
                        <Link
                          href="/admin/orders"
                          className="flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 transition-colors bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Manage Orders
                        </Link>
                        <Link
                          href="/admin/pos"
                          className="flex items-center justify-center px-4 py-3 text-sm font-medium text-green-600 transition-colors bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          POS System
                        </Link>
                      </div>
                    )}
                    
                    {/* Sign Out Button */}
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth"
                      className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-muted/30 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth"
                      className="flex items-center justify-center px-4 py-3 text-sm font-medium hover:text-yellow-400 transition-colors bg-primary text-primary-foreground rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
