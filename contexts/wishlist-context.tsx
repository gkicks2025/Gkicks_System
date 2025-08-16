"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

interface WishlistItem {
  id: number
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  colors: string[]
  category: string
  addedDate: string
  sizes?: string[];
  dateAdded?: string;
  rating?: number;
}

interface WishlistState {
  items: WishlistItem[]
  itemCount: number
}

type WishlistAction =
  | { type: "ADD_ITEM"; payload: WishlistItem }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "CLEAR_WISHLIST" }
  | { type: "LOAD_WISHLIST"; payload: WishlistItem[] }

const WishlistContext = createContext<{
  state: WishlistState
  dispatch: React.Dispatch<WishlistAction>
  addToWishlist: (item: Omit<WishlistItem, "addedDate">) => void
  removeFromWishlist: (id: number) => void
  clearWishlist: () => void
  isInWishlist: (id: number) => boolean
} | null>(null)

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id)

      if (existingItemIndex >= 0) {
        // Item already exists, don't add duplicate
        return state
      }

      const newItems = [...state.items, action.payload]
      return {
        items: newItems,
        itemCount: newItems.length,
      }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      return {
        items: newItems,
        itemCount: newItems.length,
      }
    }

    case "CLEAR_WISHLIST":
      return {
        items: [],
        itemCount: 0,
      }

    case "LOAD_WISHLIST":
      return {
        items: action.payload,
        itemCount: action.payload.length,
      }

    default:
      return state
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, {
    items: [],
    itemCount: 0,
  })

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWishlist = localStorage.getItem("gkicks-wishlist")
      if (savedWishlist) {
        try {
          const wishlistItems = JSON.parse(savedWishlist)
          dispatch({ type: "LOAD_WISHLIST", payload: wishlistItems })
        } catch (error) {
          console.error("Error loading wishlist from localStorage:", error)
        }
      }
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gkicks-wishlist", JSON.stringify(state.items))
    }
  }, [state.items])

  const addToWishlist = (item: Omit<WishlistItem, "addedDate">) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        ...item,
        addedDate: new Date().toISOString(),
      },
    })
  }

  const removeFromWishlist = (id: number) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: id,
    })
  }

  const clearWishlist = () => {
    dispatch({ type: "CLEAR_WISHLIST" })
  }

  const isInWishlist = (id: number) => {
    return state.items.some((item) => item.id === id)
  }

  return (
    <WishlistContext.Provider
      value={{
        state,
        dispatch,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
