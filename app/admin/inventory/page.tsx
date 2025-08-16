"use client"

import React, { Fragment } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
  ImageIcon,
  PlusCircle,
  RefreshCw, 
} from "lucide-react"
// Removed Supabase import - now using API endpoints

interface Product {
  id: string
  name: string
  brand: string
  price: number
  original_price?: number
  category: string
  gender: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  image_url: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
  colors?: string[]
  sizes?: string[]
  variants?: Record<string, Record<string, number>>
  is_new?: boolean;
  is_sale?: boolean;
}

interface StockAlert {
  id: string
  product_name: string
  current_stock: number
  threshold: number
  status: "low" | "out"
}

interface CustomColor {
  name: string
  value: string
  hex: string
}

const AVAILABLE_COLORS = [
  { name: "Black", value: "black", hex: "#000000" },
  { name: "White", value: "white", hex: "#FFFFFF" },
  { name: "Red", value: "red", hex: "#EF4444" },
  { name: "Blue", value: "blue", hex: "#3B82F6" },
  { name: "Green", value: "green", hex: "#10B981" },
  { name: "Yellow", value: "yellow", hex: "#F59E0B" },
  { name: "Purple", value: "purple", hex: "#8B5CF6" },
  { name: "Pink", value: "pink", hex: "#EC4899" },
  { name: "Gray", value: "gray", hex: "#6B7280" },
  { name: "Brown", value: "brown", hex: "#92400E" },
  { name: "Orange", value: "orange", hex: "#F97316" },
  { name: "Navy", value: "navy", hex: "#1E3A8A" },
]

const AVAILABLE_SIZES = [
  "5",
  "5.5",
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
  "12.5",
  "13",
  "13.5",
  "14",
  "14.5",
  "15",
  "15.5",
]

export default function InventoryPage() {
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedGender, setSelectedGender] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddColorDialogOpen, setIsAddColorDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [storageSetupWarning, setStorageSetupWarning] = useState(false)
  const [customColors, setCustomColors] = useState<CustomColor[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // Custom color form
  const [newColor, setNewColor] = useState({
    name: "",
    value: "",
    hex: "#000000",
  })

  // Form data for add/edit product
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    price: "",
    original_price: "",
    category: "",
    sku: "",
    stock_quantity: "",
    low_stock_threshold: "",
    image_url: "",
    description: "",
    is_active: true,
    product_status: "none",
    colors: [] as string[],
    sizes: [] as string[],
    gender: "all",
  })

  // Load products from API
  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()

      // Transform data to match our interface
      const transformedProducts: Product[] = (data || []).map((product) => ({
        ...product,
        colors: product.colors || [],
        sizes: product.sizes || [],
        variants: product.variants || {},
      }))

      setProducts(transformedProducts)
    } catch (err) {
      console.error("Error loading products:", err)
      setError(err instanceof Error ? err.message : "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  
  // Check storage setup on component mount
  useEffect(() => {
    checkStorageSetup()
    loadProducts()
  }, [])

  const checkStorageSetup = async () => {
    // Storage setup check disabled - using local file storage
    setStorageSetupWarning(false)
  }


  // Upload image - using placeholder for now
  const uploadImage = async (file: File): Promise<string> => {
    // For now, return a placeholder URL since we don't have file upload API
    // In a real implementation, you would upload to your preferred storage service
    return "/placeholder.jpg"
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingImage(true)
      const imageUrl = await uploadImage(file)
      setFormData((prev) => ({ ...prev, image_url: imageUrl }))
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || product.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesGender = selectedGender === "all" || product.gender === selectedGender

    let matchesStock = true
    if (stockFilter === "low") {
      matchesStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0
    } else if (stockFilter === "out") {
      matchesStock = product.stock_quantity === 0
    } else if (stockFilter === "in") {
      matchesStock = product.stock_quantity > product.low_stock_threshold
    }

    return matchesSearch && matchesCategory && matchesGender && matchesStock
  })

  // Get stock alerts
  const stockAlerts: StockAlert[] = products
    .filter((product) => product.stock_quantity <= product.low_stock_threshold)
    .map((product) => ({
      id: product.id,
      product_name: product.name,
      current_stock: product.stock_quantity,
      threshold: product.low_stock_threshold,
      status: product.stock_quantity === 0 ? "out" : "low",
    }))

  // Calculate inventory stats
  const totalProducts = products.length
  const lowStockCount = products.filter((p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0).length
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0)

  const toggleRowExpansion = (productId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedRows(newExpanded)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      price: "",
      original_price: "",
      category: "",
      sku: "",
      stock_quantity: "",
      low_stock_threshold: "",
      image_url: "",
      description: "",
      is_active: true,
      product_status: "none",
      colors: [],
      sizes: [],
      gender: "all",
    })
    setEditingProduct(null)
  }

  const handleAddProduct = async () => {
    if (!formData.name || !formData.brand || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const isNew = formData.product_status === "new" || formData.product_status === "both";
      const isSale = formData.product_status === "sale" || formData.product_status === "both";
      const matchesGender = selectedGender === "all" || formData.gender === selectedGender;

      const productData = {
        name: formData.name,
        brand: formData.brand,
        price: Number.parseFloat(formData.price) || 0,
        original_price: formData.original_price ? Number.parseFloat(formData.original_price) : null,
        category: formData.category,
        sku: formData.sku || `${formData.brand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
        stock_quantity: Number.parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: Number.parseInt(formData.low_stock_threshold) || 5,
        image_url: formData.image_url || "/placeholder.svg?height=300&width=300&text=Product",
        description: formData.description || "",
        is_active: formData.is_active,
        colors: formData.colors,
        sizes: formData.sizes,
        variants: {},
      }

      // Product creation disabled - would need API endpoint
      console.log("Product data to create:", productData)
      
      // Simulate success for now
      toast({
        title: "Info",
        description: "Product creation is currently disabled. API endpoint needed.",
        variant: "default",
      })
      return


      toast({
        title: "Success",
        description: "Product added successfully!",
      })

      setIsAddDialogOpen(false)
      resetForm()
      loadProducts()
    } catch (error) {
      console.error("Add product exception:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product)
    setIsViewDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    console.log("Editing product:", product)
    setEditingProduct(product)
    let status = "none";
      if (product.is_new && product.is_sale) {
        status = "both";
      } else if (product.is_new) {
        status = "new";
      } else if (product.is_sale) {
        status = "sale";
      }
    setFormData({
      name: product.name || "",
      brand: product.brand || "",
      price: (product.price ?? 0).toString(),
      original_price: (product.original_price ?? 0).toString(),
      category: product.category || "",
      sku: product.sku || "",
      stock_quantity: (product.stock_quantity ?? 0).toString(),
      low_stock_threshold: (product.low_stock_threshold ?? 5).toString(),
      image_url: product.image_url || "",
      description: product.description || "",
      is_active: product.is_active ?? true,
      product_status: "none",
      colors: product.colors || [],
      sizes: product.sizes || [],
      gender: "all",
    })
    setIsEditDialogOpen(true)
    }
    const exportToExcel = (products: Product[]) => {
    // Map to export only necessary fields, or export all if you want
    const dataToExport = products.map((p) => ({
      ID: p.id,
      Name: p.name,
      Brand: p.brand,
      SKU: p.sku,
      Category: p.category,
      Gender: p.gender,
      Price: p.price,
      "Original Price": p.original_price ?? "",
      Stock: p.stock_quantity,
      "Low Stock Threshold": p.low_stock_threshold,
      "Is Active": p.is_active ? "Yes" : "No",
      Description: p.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "products.xlsx");
  };


  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    setIsSaving(true)
    try {
      const isNew = formData.product_status === "new" || formData.product_status === "both";
      const isSale = formData.product_status === "sale" || formData.product_status === "both";
      const matchesGender = selectedGender === "all" || formData.gender === selectedGender;
      const updatedProduct = products.find(p => p.id === editingProduct.id);
      const productData = {
        name: formData.name,
        brand: formData.brand,
        price: Number.parseFloat(formData.price) || 0,
        original_price: formData.original_price ? Number.parseFloat(formData.original_price) : null,
        category: formData.category,
        sku: formData.sku,
        stock_quantity: Number.parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: Number.parseInt(formData.low_stock_threshold) || 5,
        image_url: formData.image_url || "/placeholder.svg?height=300&width=300&text=Product",
        description: formData.description || "",
        is_active: formData.is_active,
        colors: formData.colors,
        sizes: formData.sizes,
        updated_at: new Date().toISOString(),
        variants: updatedProduct?.variants || {}, 
      }

      // Update product via API
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/products?id=${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const result = await response.json();
      console.log('✅ Product updated successfully:', result);

      toast({
        title: "Success",
        description: "Product updated successfully!",
      })

      setIsEditDialogOpen(false)
      resetForm()
      loadProducts()
    } catch (error) {
      console.error("Update product exception:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  const handleVariantStockChange = (productId: string, updatedVariants: Record<string, Record<string, number>>) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, variants: updatedVariants } : p))
    )
  }


  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return

    setIsDeleting(true)
    try {
      // Product deletion disabled - would need API endpoint
      console.log("Product to delete:", deletingProduct);
      
      // Simulate success for now
      toast({
        title: "Info",
        description: "Product deletion is currently disabled. API endpoint needed.",
        variant: "default",
      })

      setIsDeleteDialogOpen(false)
      setDeletingProduct(null)
      loadProducts()
    } catch (error) {
      console.error("Delete product exception:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getStockStatus = (product: Product) => {
    const stockQuantity = product.stock_quantity ?? 0
    const threshold = product.low_stock_threshold ?? 5

    if (stockQuantity === 0) {
      return { status: "Out", color: "bg-red-500" }
    } else if (stockQuantity <= threshold) {
      return { status: "Low", color: "bg-yellow-500" }
    } else {
      return { status: "OK", color: "bg-green-500" }
    }
  }

  const handleColorChange = (colorValue: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      colors: checked ? [...prev.colors, colorValue] : prev.colors.filter((c) => c !== colorValue),
    }))
  }

  const handleSizeChange = (size: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sizes: checked ? [...prev.sizes, size] : prev.sizes.filter((s) => s !== size),
    }))
  }

  const handleAddCustomColor = () => {
    if (!newColor.name || !newColor.value) {
      toast({
        title: "Error",
        description: "Please fill in color name and value.",
        variant: "destructive",
      })
      return
    }

    const customColor: CustomColor = {
      name: newColor.name,
      value: newColor.value.toLowerCase().replace(/\s+/g, "-"),
      hex: newColor.hex,
    }

    setCustomColors((prev) => [...prev, customColor])
    setNewColor({ name: "", value: "", hex: "#000000" })
    setIsAddColorDialogOpen(false)

    toast({
      title: "Success",
      description: "Custom color added successfully!",
    })
  }

  const getAllColors = () => {
    return [...AVAILABLE_COLORS, ...customColors]
  }

  const renderStockGrid = (product: Product, handleVariantStockChange: (productId: string, updatedVariants: Record<string, Record<string, number>>) => void) => {
    
    if (!product.variants || !product.colors) return null

    return (
      <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4">Stock Details by Color and Size</h4>
        {product.colors.map((color) => {
          const colorInfo = getAllColors().find((c) => c.value === color)
          const variants = product.variants?.[color] || {}

          return (
            <div key={color} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-600"
                  style={{ backgroundColor: colorInfo?.hex || "#666" }}
                />
                <span className="text-white font-medium capitalize">
                  {colorInfo?.name || color} ({colorInfo?.hex || "#666"})
                </span>
              </div>
              <div  className="grid gap-2 w-full"
                style={{ 
                    gridTemplateColumns: `repeat(${product.sizes?.length || 1}, minmax(80px, 1fr))`,
                    justifyContent: "stretch",
                    minWidth: "100%", }}>
                {product.sizes?.map((size)  => {
                  const stock = variants[size] || 0
                  const isLowStock = stock <= 5 && stock > 0
                  const isOutOfStock = stock === 0

                  return (
                    <div key={size} className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Size {size}</div>
                      <div
                        className={`
                          px-2 py-1 rounded text-sm font-medium
                          ${
                            isOutOfStock
                              ? "bg-red-900 text-red-200"
                              : isLowStock
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-green-900 text-green-200"
                          }
                        `}
                      >
                       <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => {
                        const newStock = parseInt(e.target.value) || 0

                        // Create a copy of variants
                        const updatedVariants = { ...product.variants }

                        if (!updatedVariants[color]) {
                          updatedVariants[color] = {}
                        }

                        // Update the stock for this color and size
                        updatedVariants[color][size] = newStock

                        // Call a function to update state in parent component or formData
                        handleVariantStockChange(product.id, updatedVariants)
                      }}
                      className={`
                        w-16 text-center rounded text-sm font-medium
                        ${
                          stock === 0
                            ? "bg-red-900 text-red-200"
                            : stock <= 5
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-green-900 text-green-200"
                        }
                      `}
                    />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading inventory...</p>
        </div>
      </div>
    )
  }
const handleSyncProducts = async () => {
  try {
    toast({
      title: "Syncing",
      description: "Syncing products to homepage...",
    })

    // Sync products to homepage by refreshing the product data
    await loadProducts();
    
    toast({
      title: "Success",
      description: "Products synced to homepage successfully!",
    })
  } catch (error) {
    console.error("Sync error:", error)
    toast({
      title: "Error",
      description: (error as Error).message || "Failed to sync products.",
      variant: "destructive",
    })
  }
}

  return (
    <div className="space-y-6 p-6">
    

      {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Product Inventory</h1>
            <p className="text-gray-400">Manage your product stock levels and details</p>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 bg-transparent"
              onClick={() => exportToExcel(filteredProducts)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 bg-transparent"
              onClick={handleSyncProducts}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Products
            </Button>

            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-white">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-500">{lowStockCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Out of Stock</p>
                <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-green-500">₱{totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white w-64"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Men">Men</SelectItem>
                <SelectItem value="Women">Women</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
                <SelectItem value="Unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-blue-400 w-12"></TableHead>
                <TableHead className="text-blue-400">Product</TableHead>
                <TableHead className="text-blue-400">Brand</TableHead> 
                <TableHead className="text-blue-400">SKU</TableHead>
                <TableHead className="text-blue-400">Category</TableHead>
                <TableHead className="text-blue-400">Price</TableHead>
                <TableHead className="text-blue-400">Stock</TableHead>
                <TableHead className="text-blue-400">Status</TableHead>
                <TableHead className="text-blue-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                const isExpanded = expandedRows.has(product.id)

                return (
                  <Fragment key={product.id}>
                    <TableRow key={product.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(product.id)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || "/placeholder.svg?height=40&width=40&text=Product"}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=40&width=40&text=Product"
                            }}
                          />
                          <div>
                            <p className="font-medium text-white">{product.name}</p>
                            <p className="text-sm text-blue-400">
                              {product.brand} {product.name}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {product.colors?.slice(0, 3).map((color) => {
                                const colorInfo = getAllColors().find((c) => c.value === color)
                                return (
                                  <div
                                    key={color}
                                    className="w-4 h-4 rounded-full border border-gray-600"
                                    style={{ backgroundColor: colorInfo?.hex || "#666" }}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{product.brand}</TableCell> 
                      <TableCell className="text-gray-300">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div>
                          <span className="font-medium">₱{product.price.toLocaleString()}</span>
                          {product.original_price && product.original_price > product.price && (
                            <div className="text-sm text-gray-500 line-through">
                              ₱{product.original_price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-medium">{product.stock_quantity}</TableCell>
                      <TableCell>
                        <Badge className={`${stockStatus.color} text-white`}>{stockStatus.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewProduct(product)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            className="text-gray-400 hover:text-yellow-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-gray-700">
                        <TableCell colSpan={9} className="p-0 w-full">
                          <div className="overflow-x-auto w-full p-4 bg-gray-900 rounded-lg"></div>
                          {renderStockGrid(product, handleVariantStockChange)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>  
          </Table>

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-300">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-300">Error loading products</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={loadProducts} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Add New Product</DialogTitle>
            <DialogDescription className="text-gray-400">Add a new product to your inventory</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Product Assets */}
              <div>
                <Label className="text-yellow-500 text-sm font-medium">Product Assets</Label>
                <div className="mt-2 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    variant="outline"
                    className="border-gray-600 hover:bg-gray-700 bg-transparent"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Files
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Drag and drop your files here, or click to browse
                    <br />
                    Images: JPG, PNG, WebP (Max: 5MB)
                    <br />
                    Recommended image size: 800x800px
                  </p>
                </div>

                {formData.image_url && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.image_url || "/placeholder.svg"}
                        alt="Product preview"
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <p className="text-white text-sm">Product image uploaded</p>
                        <p className="text-gray-400 text-xs">Ready to save</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <Label htmlFor="add-name" className="text-yellow-500">
                  Product Name *
                </Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Air Jordan 4 Retro"
                />
              </div>
              {/* Brand */}
              <div>
                <Label htmlFor="add-brand" className="text-yellow-500">
                  Brand *
                </Label>
                <Input
                  id="add-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Nike"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-yellow-500">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Kids">Kids</SelectItem>
                    <SelectItem value="Unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Product Status */}
              <div>
              <Label className="text-yellow-500">Product Status</Label>
              <Select
                value={formData.product_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, product_status: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="both">New & Sale</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

              {/* Price */}
              <div>
                <Label htmlFor="add-price" className="text-yellow-500">
                  Price (₱) *
                </Label>
                <Input
                  id="add-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="12995"
                />
              </div>
               {/* Original Price */}
              <div>
                <Label htmlFor="edit-original-price" className="text-yellow-500">
                  Original Price (₱)
                </Label>
                <Input
                  id="edit-original-price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, original_price: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              {/* Description */}
              <div>
                <Label className="text-yellow-500">Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
                  placeholder="The Air Jordan 4 Retro brings back the iconic silhouette with premium materials and classic colorways."
                />
              </div>
            </div>
            {/* Right Column */}
            <div className="space-y-4">
              {/* Available Colors */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-yellow-500">Available Colors *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddColorDialogOpen(true)}
                    className="border-gray-600 hover:bg-gray-700 bg-transparent text-xs"
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Add Color
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {getAllColors().map((color) => (
                    <div key={color.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`add-color-${color.value}`}
                        checked={formData.colors.includes(color.value)}
                        onCheckedChange={(checked) => handleColorChange(color.value, checked as boolean)}
                        className="border-gray-600"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-600"
                          style={{ backgroundColor: color.hex }}
                        />
                        <Label htmlFor={`add-color-${color.value}`} className="text-gray-300 text-sm">
                          {color.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Sizes */}
              <div>
                <Label className="text-yellow-500">Available Sizes *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {AVAILABLE_SIZES.slice(0, 22).map((size)=> (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`add-size-${size}`}
                        checked={formData.sizes.includes(size)}
                        onCheckedChange={(checked) => handleSizeChange(size, checked as boolean)}
                        className="border-gray-600"
                      />
                      <Label htmlFor={`add-size-${size}`} className="text-gray-300 text-sm">
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* SKU */}
              <div>
                <Label htmlFor="add-sku" className="text-yellow-500">
                  SKU
                </Label>
                <Input
                  id="add-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Auto-generated if empty"
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <Label htmlFor="add-stock" className="text-yellow-500">
                  Stock Quantity
                </Label>
                <Input
                  id="add-stock"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="15"
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <Label htmlFor="add-threshold" className="text-yellow-500">
                  Low Stock Threshold
                </Label>
                <Input
                  id="add-threshold"
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData((prev) => ({ ...prev, low_stock_threshold: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="10"
                />
              </div>

              {/* Variant Preview */}
              <div>
                <Label className="text-yellow-500">Variant Preview</Label>
                <div className="mt-2 p-3 bg-gray-700 rounded-lg">
                  <p className="text-white text-sm">
                    This will create {formData.colors.length} × {formData.sizes.length} ={" "}
                    {formData.colors.length * formData.sizes.length} variants
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formData.colors.length} colors selected • {formData.sizes.length} sizes selected
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={isSaving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Product Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              View detailed information about this product
            </DialogDescription>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <img
                  src={viewingProduct.image_url || "/placeholder.svg?height=200&width=200&text=Product"}
                  alt={viewingProduct.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{viewingProduct.name}</h3>
                    <p className="text-blue-400">
                      {viewingProduct.brand} {viewingProduct.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">SKU: </span>
                    <span className="text-white">{viewingProduct.sku}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Brand: </span>
                    <span className="text-white">{viewingProduct.brand}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category: </span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      {viewingProduct.category}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-400">Status: </span>
                    <Badge className={viewingProduct.is_active ? "bg-green-500" : "bg-gray-500"}>
                      {viewingProduct.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Price: </span>
                  <div className="text-2xl font-bold text-white">
                    ₱{viewingProduct.price.toLocaleString()}
                    {viewingProduct.original_price && viewingProduct.original_price > viewingProduct.price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ₱{viewingProduct.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Tags: </span>
                  <div className="flex gap-2 mt-1">
                    {viewingProduct.original_price && viewingProduct.original_price > viewingProduct.price && (
                      <Badge className="bg-red-500">Sale</Badge>
                    )}
                    <Badge className="bg-blue-500">New</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Description</h4>
                <p className="text-gray-300">{viewingProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">Available Colors</h4>
                  <div className="flex gap-2">
                    {viewingProduct.colors?.map((color) => {
                      const colorInfo = getAllColors().find((c) => c.value === color)
                      return (
                        <div key={color} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-600"
                            style={{ backgroundColor: colorInfo?.hex || "#666" }}
                          />
                          <span className="text-gray-300 capitalize">{colorInfo?.name || color}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Available Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.sizes?.map((size) => (
                      <Badge key={size} variant="outline" className="border-gray-600 text-gray-300">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Stock Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-white">{viewingProduct.stock_quantity}</div>
                    <div className="text-sm text-gray-400">Total Stock</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-yellow-500">{viewingProduct.low_stock_threshold}</div>
                    <div className="text-sm text-gray-400">Low Stock Alert</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded">
                    <div
                      className={`text-2xl font-bold ${getStockStatus(viewingProduct).status === "OK" ? "text-green-500" : getStockStatus(viewingProduct).status === "Low" ? "text-yellow-500" : "text-red-500"}`}
                    >
                      {getStockStatus(viewingProduct).status}
                    </div>
                    <div className="text-sm text-gray-400">Status</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="border-gray-600 hover:bg-gray-700"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                if (viewingProduct) handleEditProduct(viewingProduct)
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Edit Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update product information and inventory details
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Product Assets */}
              <div>
                <Label className="text-yellow-500 text-sm font-medium">Product Assets</Label>
                <div className="mt-2 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <Button
                    variant="outline"
                    className="border-gray-600 hover:bg-gray-700 bg-transparent"
                    onClick={() => document.getElementById("edit-image-upload")?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Files
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Drag and drop your files here, or click to browse
                    <br />
                    Images: JPG, PNG, WebP (Max: 5MB)
                    <br />
                    Recommended image size: 800x800px
                  </p>
                </div>

                {formData.image_url && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.image_url || "/placeholder.svg"}
                        alt="Current product image"
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <p className="text-white text-sm">Current product image</p>
                        <p className="text-gray-400 text-xs">Upload new files to replace</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <Label htmlFor="edit-name" className="text-yellow-500">
                  Product Name *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              {/* Brand */}
              <div>
                <Label htmlFor="add-brand" className="text-yellow-500">
                  Brand *
                </Label>
                <Input
                  id="add-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  placeholder="Nike"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-yellow-500">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Kids">Kids</SelectItem>
                    <SelectItem value="Unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Product Status */}
              <div>
              <Label className="text-yellow-500">Product Status</Label>
              <Select
                value={formData.product_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, product_status: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="both">New & Sale</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

              {/* Price */}
              <div>
                <Label htmlFor="edit-price" className="text-yellow-500">
                  Price (₱) *
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
               {/* Original Price */}
              <div>
                <Label htmlFor="edit-original-price" className="text-yellow-500">
                  Original Price (₱)
                </Label>
                <Input
                  id="edit-original-price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, original_price: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-yellow-500">Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Available Colors */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-yellow-500">Available Colors *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddColorDialogOpen(true)}
                    className="border-gray-600 hover:bg-gray-700 bg-transparent text-xs"
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Add Color
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {getAllColors().map((color) => (
                    <div key={color.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-color-${color.value}`}
                        checked={formData.colors.includes(color.value)}
                        onCheckedChange={(checked) => handleColorChange(color.value, checked as boolean)}
                        className="border-gray-600"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-600"
                          style={{ backgroundColor: color.hex }}
                        />
                        <Label htmlFor={`edit-color-${color.value}`} className="text-gray-300 text-sm">
                          {color.name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Sizes */}
              <div>
                <Label className="text-yellow-500">Available Sizes *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {AVAILABLE_SIZES.slice(0, 22).map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-size-${size}`}
                        checked={formData.sizes.includes(size)}
                        onCheckedChange={(checked) => handleSizeChange(size, checked as boolean)}
                        className="border-gray-600"
                      />
                      <Label htmlFor={`edit-size-${size}`} className="text-gray-300 text-sm">
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {/* SKU */}
                <div>
                  <Label htmlFor="edit-sku" className="text-yellow-500">
                    SKU
                  </Label>
                  <Input
                    id="edit-sku"
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="Auto-generated if empty"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <Label htmlFor="edit-stock" className="text-yellow-500">
                    Stock Quantity
                  </Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="15"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <Label htmlFor="edit-threshold" className="text-yellow-500">
                    Low Stock Threshold
                  </Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData((prev) => ({ ...prev, low_stock_threshold: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    placeholder="10"
                  />
                </div>
              {/* Status */}
              <div>
                <Label className="text-yellow-500">Status</Label>
                <Select
                  value={formData.is_active ? "active" : "inactive"}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, is_active: value === "active" }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Variant Preview */}
              <div>
                <Label className="text-yellow-500">Variant Preview</Label>
                <div className="mt-2 p-3 bg-gray-700 rounded-lg">
                  <p className="text-white text-sm">
                    This will create {formData.colors.length} × {formData.sizes.length} ={" "}
                    {formData.colors.length * formData.sizes.length} variants
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formData.colors.length} colors selected • {formData.sizes.length} sizes selected
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
              }}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={isSaving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone and will
              permanently remove the product from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 hover:bg-gray-700 bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Custom Color Dialog */}
      <Dialog open={isAddColorDialogOpen} onOpenChange={setIsAddColorDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Add Custom Color</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new color option that's not in the default list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="color-name" className="text-yellow-500">
                Color Name *
              </Label>
              <Input
                id="color-name"
                value={newColor.name}
                onChange={(e) => setNewColor((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="e.g., Mint Green"
              />
            </div>

            <div>
              <Label htmlFor="color-value" className="text-yellow-500">
                Color Value *
              </Label>
              <Input
                id="color-value"
                value={newColor.value}
                onChange={(e) => setNewColor((prev) => ({ ...prev, value: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                placeholder="e.g., mint-green"
              />
              <p className="text-xs text-gray-500 mt-1">Use lowercase letters, numbers, and hyphens only</p>
            </div>

            <div>
              <Label htmlFor="color-hex" className="text-yellow-500">
                Hex Color *
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color-hex"
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor((prev) => ({ ...prev, hex: e.target.value }))}
                  className="w-16 h-10 bg-gray-700 border-gray-600 rounded cursor-pointer"
                />
                <Input
                  value={newColor.hex}
                  onChange={(e) => setNewColor((prev) => ({ ...prev, hex: e.target.value }))}
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="p-3 bg-gray-700 rounded-lg">
              <p className="text-white text-sm mb-2">Preview:</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-600"
                  style={{ backgroundColor: newColor.hex }}
                />
                <span className="text-gray-300">{newColor.name || "Color Name"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddColorDialogOpen(false)
                setNewColor({ name: "", value: "", hex: "#000000" })
              }}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomColor} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              Add Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
