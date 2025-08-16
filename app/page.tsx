"use client"

import { useState, useEffect } from "react"
import { Hero } from "@/components/hero"
import { ProductGrid } from "@/components/product-grid"
import { useSearchParams } from "next/navigation"
import type { Product } from "@/lib/product-data"
import { fetchProductsFromAPI, saveProducts } from "@/lib/product-data"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    async function syncProducts() {
      console.log('🔍 HomePage: Starting to fetch products...')
      const syncedProducts = await fetchProductsFromAPI()
      console.log('📦 HomePage: Fetched products:', syncedProducts.length, 'items')
      console.log('📋 HomePage: First product:', syncedProducts[0])
      setProducts(syncedProducts)
      // Save products to localStorage for other parts of the application
      saveProducts(syncedProducts)
    }
    syncProducts()
  }, [])

  useEffect(() => {
    const search = searchParams.get("search")
    if (search) {
      setSearchQuery(search)
    } else {
      setSearchQuery("")
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <main>
        {!searchQuery && <Hero />}
        <ProductGrid products={products} searchQuery={searchQuery} />
      </main>
    </div>
  )
}
