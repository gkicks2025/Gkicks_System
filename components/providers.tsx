"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/contexts/cart-context"
import { WishlistProvider } from "@/contexts/wishlist-context"
import { OrdersProvider } from "@/contexts/orders-context"
// SupabaseAuthProvider removed - now using MySQL-based AuthProvider
import { AdminProvider } from "@/contexts/admin-context"
import { AuthProvider } from "@/contexts/auth-context" // Adjust import path

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <WishlistProvider>
              <OrdersProvider>
                {children}
                <Toaster />
              </OrdersProvider>
            </WishlistProvider>
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
