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
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-gray-300 dark:border-gray-700 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Image
                src="/images/gkicks-transparent-logo.png"
                alt="GKICKS"
                width={32}
                height={32}
                className="object-contain brightness-0"
              />
            </div>
            <span className={`text-2xl font-bold select-none ${textColorClass}`}>GKICKS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center space-x-8 font-medium text-sm ${textColorClass}`}>
            <Link href="/men" className="hover:text-yellow-400 transition-colors">
              Men
            </Link>
            <Link href="/women" className="hover:text-yellow-400 transition-colors">
              Women
            </Link>
            <Link href="/kids" className="hover:text-yellow-400 transition-colors">
              Kids
            </Link>
            <Link href="/unisex" className="hover:text-yellow-400 transition-colors">
              Unisex
            </Link>
            <Link href="/sale" className="hover:text-yellow-400 transition-colors">
              Sale
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-6">
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
                className="pl-10 pr-4 bg-muted/50"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`hidden sm:flex hover:text-yellow-400 ${iconColorClass}`}
            >
              <Sun className={`h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
              <Moon className={`absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild className={`relative hover:text-yellow-400 ${iconColorClass}`}>
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
                    {wishlistCount}
                  </Badge>
                )}
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className={`relative hover:text-yellow-400 ${iconColorClass}`}>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-yellow-400 text-black">
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
              <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                <Link href="/auth">Sign In</Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className={`md:hidden hover:text-yellow-400 ${iconColorClass}`} onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconColorClass}`} />
                  <Input
                    type="search"
                    placeholder="Search shoes..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      onSearch?.(e.target.value)
                    }}
                    className="pl-10 pr-4"
                  />
                </form>
              </div>

              {/* Mobile Navigation Links */}
              <Link
                href="/men"
                className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Men
              </Link>
              <Link
                href="/women"
                className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Women
              </Link>
              <Link
                href="/kids"
                className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Kids
              </Link>
              <Link
                href="/unisex"
                className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Unisex
              </Link>
              <Link
                href="/sale"
                className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sale
              </Link>

              {/* Mobile Theme Toggle */}
              {mounted && (
                <div className="px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="w-full justify-start"
                  >
                    <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 ml-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    Toggle theme
                  </Button>
                </div>
              )}

              {/* Mobile User Actions */}
              {user && !authLoading && (
                <div className="border-t pt-2 mt-2">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-3 py-2 text-base font-medium text-yellow-400 hover:text-yellow-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/cart"
                    className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Cart
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 text-base font-medium hover:text-yellow-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
