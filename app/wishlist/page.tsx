"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWishlist } from "@/contexts/wishlist-context"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, ShoppingCart, Trash2, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function WishlistPage() {
  const { state: wishlistState, removeFromWishlist, clearWishlist } = useWishlist()
  const { addItem } = useCart()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const handleAddToCart = (item: any) => {
    const defaultSize = item.sizes?.[0] || "M"

    addItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      image: item.image,
      color: item.colors?.[0] || "Default",
      size: defaultSize,
    })

    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  const handleRemoveItem = (itemId: string) => {
    removeFromWishlist(Number(itemId))
    toast({
      title: "Removed from Wishlist",
      description: "Item has been removed from your wishlist.",
    })
  }

  const handleClearWishlist = () => {
    clearWishlist()
    toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
    })
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const handleAddSelectedToCart = () => {
    const selectedWishlistItems = wishlistState.items.filter((item) =>
      selectedItems.has(item.id.toString())
    )

    selectedWishlistItems.forEach((item) => {
      const defaultSize = item.sizes?.[0] || "M"
      addItem({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        image: item.image,
        color: item.colors?.[0] || "Default",
        size: defaultSize,
      })
    })

    toast({
      title: "Added to Cart",
      description: `${selectedItems.size} item(s) have been added to your cart.`,
    })

    setSelectedItems(new Set())
  }

  if (wishlistState.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center py-8 sm:py-12">
              <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-yellow-400 mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                Save items you love to your wishlist and shop them later.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-yellow-400 text-black hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 w-full sm:w-auto"
              >
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 -ml-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-yellow-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-yellow-400">
                My Wishlist
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                {wishlistState.items.length} {wishlistState.items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {selectedItems.size > 0 && (
                <Button
                  onClick={handleAddSelectedToCart}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add Selected to Cart ({selectedItems.size})
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 bg-transparent"
              >
                Clear Wishlist
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistState.items.map((item) => (
            <Card
              key={item.id}
              className="group relative bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id.toString())}
                    onChange={() => toggleItemSelection(item.id.toString())}
                    className="w-4 h-4 text-yellow-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-yellow-400 dark:focus:ring-yellow-500"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id.toString())}
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                    {item.dateAdded && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex-shrink-0"
                      >
                        {new Date(item.dateAdded).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  {item.brand && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.brand}</p>
                  )}

                  {item.colors && item.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {item.colors.slice(0, 4).map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-600 shadow-sm"
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        />
                      ))}
                      {item.colors.length > 4 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          +{item.colors.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {item.rating && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(item.rating ?? 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({item.rating})</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-yellow-400">
                      ₱{item.price.toLocaleString()}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-sm text-gray-500 dark:text-gray-500 line-through">
                        ₱{item.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-sm h-8"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="px-3 text-sm h-8 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-yellow-400"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {wishlistState.items.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-yellow-400"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => router.push("/cart")}
              className="bg-yellow-400 text-black hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
