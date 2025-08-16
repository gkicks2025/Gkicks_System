"use client"

import { useState, useEffect, useCallback } from "react"
import { ProductCard } from "./product-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Package, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/product-data"




interface ProductGridProps {
  products: Product[]
  searchQuery?: string
  category?: string
  onWishlistUpdate?: (change: number) => void
}

export function ProductGrid({
  products,
  searchQuery = "",
  category,
  onWishlistUpdate,
}: ProductGridProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
  const [sortBy, setSortBy] = useState("featured")
  const [filterBy, setFilterBy] = useState("all")
  const [loading, setLoading] = useState(true)
  const [productsPerPage] = useState(8)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Filter and sort products based on props and state
  const loadAndFilterProducts = useCallback(() => {
    console.log('🔍 ProductGrid: loadAndFilterProducts called with', products.length, 'products')
    let filtered = products

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query),
      )
    }

    // Category filter
    if (category && category !== "all") {
      filtered = filtered.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase(),
      )
    }

    // Additional filters
    if (filterBy === "new") {
      filtered = filtered.filter((product) => product.isNew)
    } else if (filterBy === "sale") {
      filtered = filtered.filter((product) => product.isSale)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
          return b.id - a.id
        case "featured":
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0)
          return a.name.localeCompare(b.name)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredProducts(filtered)
    setLastSyncTime(new Date())

    return filtered
  }, [products, searchQuery, category, sortBy, filterBy])

  // Initial load and reset pagination when inputs change
  useEffect(() => {
    setLoading(true)
    const filtered = loadAndFilterProducts()
    setCurrentPage(1)
    setDisplayedProducts(filtered.slice(0, productsPerPage))
    setLoading(false)
  }, [loadAndFilterProducts, productsPerPage])

  // Pagination - load more products
  const loadMoreProducts = () => {
    const nextPage = currentPage + 1
    const endIndex = nextPage * productsPerPage
    setDisplayedProducts(filteredProducts.slice(0, endIndex))
    setCurrentPage(nextPage)
  }

  const remainingProducts = filteredProducts.length - displayedProducts.length

  // Force sync button handler placeholder - just reloads filtered products here
  const handleForceSync = () => {
    setLoading(true)
    const filtered = loadAndFilterProducts()
    setDisplayedProducts(filtered.slice(0, productsPerPage * currentPage))
    setLoading(false)
  }

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-yellow-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-yellow-400 mb-2">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : category
                    ? `${category.charAt(0).toUpperCase() + category.slice(1)} Shoes`
                    : "All Shoes"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
                {displayedProducts.length < filteredProducts.length && ` (showing ${displayedProducts.length})`}
              </p>

              {/* Sync Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceSync}
                className="flex items-center gap-2 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-400 dark:text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="featured" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    Featured
                  </SelectItem>
                  <SelectItem value="name" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    Name A-Z
                  </SelectItem>
                  <SelectItem value="price-low" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-high" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="rating" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    Highest Rated
                  </SelectItem>
                  <SelectItem value="newest" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    Newest First
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sync Info */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Last synced: {lastSyncTime.toLocaleTimeString()}
          {currentPage > 1 && ` • Page ${currentPage}`}
        </div>

        {/* Additional Filters */}
        {(searchQuery || category) && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-32 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    All
                  </SelectItem>
                  <SelectItem value="new" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    New
                  </SelectItem>
                  <SelectItem value="sale" className="dark:text-gray-300 dark:hover:bg-gray-700">
                    On Sale
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="p-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center">
              <RefreshCw className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading products...</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please wait while we fetch the latest products
              </p>
            </CardContent>
          </Card>
        ) : displayedProducts.length === 0 ? (
          <Card className="p-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery
                  ? `No products match your search for "${searchQuery}"`
                  : "No products are currently available in this category"}
              </p>
              {searchQuery && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Try:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Checking your spelling
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Using different keywords
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Browsing categories
                    </Badge>
                  </div>  
                </div>
              )}
              <Button
                onClick={handleForceSync}
                className="mt-4 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Button */}
            {remainingProducts > 0 && (
              <div className="text-center mt-12">
                <Button
                  onClick={loadMoreProducts}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg dark:bg-yellow-400 dark:hover:bg-yellow-500 dark:text-black"
                >
                  Load More Products ({remainingProducts} remaining)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Product Count Summary */}
        {displayedProducts.length > 0 && remainingProducts === 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400">
              Showing all {filteredProducts.length} products
              {searchQuery && ` matching "${searchQuery}"`}
              {category && ` in ${category} category`}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
