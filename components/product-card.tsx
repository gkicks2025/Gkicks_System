"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"




interface Product {
  id: number | string 
  name: string
  brand: string
  price: number
  originalPrice?: number
  image?: string
  image_url?: string  // <-- added this property
  rating?: number
  reviews?: number
  colors?: string[]
  colorImages?: Record<string, {
  front?: string
  side?: string
  back?: string
  sole?: string
  three_d?: string
}>
  isNew?: boolean
  isSale?: boolean
  views?: number
  category: string
  variants?: Record<string, any>
  is_new?: boolean;
  is_sale?: boolean;
}

interface ProductCardProps {    
  product: Product 
  onCartUpdate?: (count: number) => void
  onWishlistUpdate?: (count: number) => void
  onViewUpdate?: () => void
} 

export function ProductCard({ product, onViewUpdate }: ProductCardProps) {
  const router = useRouter()

  const safeProduct = {
    id: product?.id || 0,
    name: product?.name || "Unknown Product",
    brand: product?.brand || "Unknown Brand",
    price: product?.price || 0,
    originalPrice: product?.originalPrice,
    image_url: product?.image_url,  // <-- here
    image:
      product?.image ||
      `/images/${product?.name?.toLowerCase().replace(/\s+/g, "-")}.png` ||
      "/placeholder.svg?height=300&width=300",
    rating: product?.rating || 4.0,
    reviews: product?.reviews || 0,
    isNew: product?.isNew || false,
    isSale: product?.isSale || false,
    views: product?.views || 0,
    category: product?.category || "uncategorized",
  }

  const [currentViews, setCurrentViews] = useState(safeProduct.views)
  const [isHovered, setIsHovered] = useState(false)

  const handleProductClick = () => {
    router.push(`/product/${safeProduct.id}`)
  }

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/product/${safeProduct.id}`)
  }

  useEffect(() => {
    setCurrentViews(safeProduct.views)
  }, [safeProduct.views])

  useEffect(() => {
    const handleViewUpdate = (event: CustomEvent) => {
      if (event.detail.productId === safeProduct.id) {
        setCurrentViews(event.detail.newCount)
      }
    }

    window.addEventListener("viewCountUpdate", handleViewUpdate as EventListener)
    return () => window.removeEventListener("viewCountUpdate", handleViewUpdate as EventListener)
  }, [safeProduct.id])

  useEffect(() => {
    const handleProductUpdate = (event: CustomEvent) => {
      if (event.detail.productId === safeProduct.id) {
        setCurrentViews((prev) => prev)
      }
    }

    const handleProductDeleted = (event: CustomEvent) => {
      if (event.detail.productId === safeProduct.id) {
        console.log("Product deleted:", safeProduct.id)
      }
    }

    window.addEventListener("productUpdated", handleProductUpdate as EventListener)
    window.addEventListener("productDeleted", handleProductDeleted as EventListener)
    window.addEventListener("adminProductUpdated", handleProductUpdate as EventListener)

    return () => {
      window.removeEventListener("productUpdated", handleProductUpdate as EventListener)
      window.removeEventListener("productDeleted", handleProductDeleted as EventListener)
      window.removeEventListener("adminProductUpdated", handleProductUpdate as EventListener)
    }
  }, [safeProduct.id])

  if (!product) {
    return (
      <Card className="group hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">Product not available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      onClick={handleProductClick}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <div className="relative p-2">
            <div
              className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
              style={{
                border: "4px solid #facc15",
                boxShadow: isHovered
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(250, 204, 21, 0.3)"
                  : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(250, 204, 21, 0.2)",
                transition: "all 0.3s ease",
              }}
            >
              <img
                src={
                  safeProduct.image_url ||
                  safeProduct.image ||
                  "/placeholder.svg?height=300&width=300"
                }
                alt={safeProduct.name}
                className="w-full h-48 sm:h-64 object-cover transition-all duration-700"
                style={{
                  filter: isHovered ? "brightness(1.1) contrast(1.1)" : "brightness(1) contrast(1)",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=300&width=300"
                }}
              />
            </div>
          </div>

          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {safeProduct.isNew && (
              <Badge
                className="bg-green-500 hover:bg-green-600 text-xs shadow-lg transition-all duration-300 text-white"
                style={{
                  boxShadow: isHovered ? "0 8px 25px rgba(34, 197, 94, 0.4)" : "0 4px 15px rgba(34, 197, 94, 0.2)",
                }}
              >
                New
              </Badge>
            )}
            {safeProduct.isSale && (
              <Badge
                className="bg-red-500 hover:bg-red-600 text-xs shadow-lg transition-all duration-300 text-white"
                style={{
                  boxShadow: isHovered ? "0 8px 25px rgba(239, 68, 68, 0.4)" : "0 4px 15px rgba(239, 68, 68, 0.2)",
                }}
              >
                Sale
              </Badge>
            )}
          </div>
        </div>

        <div
          className="p-3 sm:p-4 space-y-2 sm:space-y-3 transition-all duration-500"
          style={{
            transform: isHovered ? "translateY(-5px)" : "translateY(0px)",
          }}
        >
          <div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {safeProduct.brand}
            </p>
            <h3
              className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-yellow-400 transition-colors line-clamp-2 cursor-pointer hover:underline"
              onClick={handleNameClick}
            >
              {safeProduct.name}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-yellow-400">
                  ₱{(safeProduct.price || 0).toLocaleString()}
                </span>
                {safeProduct.originalPrice && (
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                    ₱{safeProduct.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
