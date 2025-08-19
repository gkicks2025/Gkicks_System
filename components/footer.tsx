"use client"

import { Facebook, MapPin, Phone, Mail, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = resolvedTheme === "dark"

  return (
    <footer className="bg-background/95 backdrop-blur border-t border-gray-300 dark:border-gray-700 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand Section */}
          <div className="text-center sm:text-left space-y-4">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <Image
                src="/images/gkicks-transparent-logo.png"
                alt="GKicks Logo"
                width={40}
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-bold text-foreground">GKicks</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your premier destination for authentic sneakers and premium footwear. Step into style with our curated
              collection of the latest and greatest kicks.
            </p>
            <div className="flex justify-center sm:justify-start space-x-4">
              <Link
               href="https://www.facebook.com/profile.php?id=100083343612520" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-300 hover:text-yellow-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/men" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Men's Shoes
                </Link>
              </li>
              <li>
                <Link href="/women" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Women's Shoes
                </Link>
              </li>
              <li>
                <Link href="/kids" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Kids' Shoes
                </Link>
              </li>
              <li>
                <Link href="/unisex" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Unisex Collection
                </Link>
              </li>
              <li>
                <Link href="/sale" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Sale Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="text-center sm:text-left space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center sm:text-left space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-center sm:justify-start space-x-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>240 Del Pilar Street,</p>
                  <p>Poblacion Dos, Cabuyao City, Laguna 4025 Cabuyao, Philippines</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">+63 956 879 8828</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">kurab1983@gmail.com</span>
              </div>
              <div className="flex items-start justify-center sm:justify-start space-x-3">
                <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p>Monday-Sunday: Always Open</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-wrap flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              © 2025 GKicks. All rights reserved. Built with passion for sneaker enthusiasts.
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                  href="/returns"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Returns & Exchanges
                </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
