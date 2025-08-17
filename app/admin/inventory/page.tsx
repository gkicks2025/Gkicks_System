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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAdmin } from "@/contexts/admin-context"
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  Loader2,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
  ImageIcon,
  PlusCircle,
  RefreshCw
} from "lucide-react"

interface Product {
  id: number
  name: string
  subtitle?: string
  sku?: string
  category: string
  brand: string
  price: number
  originalPrice?: number
  image?: string
  image_url?: string
  gallery_images?: string[]
  description?: string
  is_new?: boolean
  is_sale?: boolean
  is_active: boolean
  low_stock_threshold?: number
  colors?: string[]
  sizes?: string[]
  variants?: Record<string, Record<string, number>>
  model_3d_url?: string // 3D model file URL
  model_3d_filename?: string // 3D model filename
  status?: string
}

export default function InventoryPage() {
  const { toast } = useToast()
  const { state: adminState, isAdmin } = useAdmin()
  
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploading3DModel, setUploading3DModel] = useState(false)

  // Form state for add/edit product
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    subtitle: "",
    sku: "",
    category: "",
    brand: "",
    price: 0,
    originalPrice: 0,
    description: "",
    is_new: false,
    is_sale: false,
    is_active: true,
    low_stock_threshold: 10,
    colors: [],
    sizes: [],
    variants: {},
    model_3d_url: "",
    model_3d_filename: "",
    status: "Active"
  })

  const [selectedImages, setSelectedImages] = useState<File[]>([])  
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])
  const [selected3DModel, setSelected3DModel] = useState<File | File[] | null>(null)
  const [remove3DModel, setRemove3DModel] = useState(false)
  const [colorInput, setColorInput] = useState("")
  const [sizeInput, setSizeInput] = useState("")
  
  // Check admin authentication and redirect if not authenticated
  useEffect(() => {
    console.log('🔍 Admin State:', adminState)
    console.log('🔍 Is Authenticated:', adminState.isAuthenticated)
    console.log('🔍 Admin User:', adminState.user)
    const token = localStorage.getItem('auth_token')
    console.log('🔍 Token in localStorage:', token)
    
    if (!adminState.isLoading && !adminState.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in as admin to access inventory management",
        variant: "destructive",
      })
      // Redirect to admin login page
      window.location.href = '/admin/login'
    }
  }, [adminState, toast])

  const categories = ["Men", "Women", "Kids", "Unisex"]
  const brands = ["Nike", "Adidas", "Converse", "New Balance", "ASICS"]
  const commonSizes = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"]

  const loadProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        // API returns products array directly, not wrapped in { products: [] }
        setProducts(Array.isArray(data) ? data : [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount only if authenticated
  useEffect(() => {
    if (adminState.isAuthenticated) {
      loadProducts()
    }
  }, [adminState.isAuthenticated])

  // Show loading spinner while checking authentication
  if (adminState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    )
  }

  if (!adminState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Required</h1>
          <p className="text-gray-300 mb-4">You need to be logged in as an admin to access this page.</p>
          <a href="/admin/login" className="text-yellow-400 hover:underline">Go to Admin Login</a>
        </div>
      </div>
    )
  }

  // Handle image upload
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files`, file)
    })

    const response = await fetch('/api/upload-product-images', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Image upload error:', errorData)
      throw new Error(errorData.error || 'Failed to upload images')
    }

    const data = await response.json()
    return data.urls
  }

  // Handle 3D model upload (single file or multiple files)
  const upload3DModel = async (files: File | File[]): Promise<string> => {
    const formData = new FormData()
    
    // Handle both single file and array of files
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('files', file)
      })
    } else {
      formData.append('files', files)
    }

    const response = await fetch('/api/upload-3d-models', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload 3D model')
    }

    const data = await response.json()
    return data.urls[0] // API returns array, get first URL
  }

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setUploadingImages(true)
      setUploading3DModel(true)

      let imageUrl = currentProduct?.image_url || formData.image
      let galleryImages: string[] = currentProduct?.gallery_images || []
      let model3DUrl = formData.model_3d_url

      // Remove images marked for deletion
      if (imagesToRemove.length > 0) {
        galleryImages = galleryImages.filter(imageUrl => !imagesToRemove.includes(imageUrl))
      }

      // Upload images if selected
      if (selectedImages.length > 0) {
        const imageUrls = await uploadImages(selectedImages)
        // If no main image exists, use first uploaded image as main image
        if (!imageUrl) {
          imageUrl = imageUrls[0]
        }
        // Append new images to existing gallery images instead of replacing
        galleryImages = [...galleryImages, ...imageUrls]
      }

      // Handle 3D model removal or upload
      if (remove3DModel) {
        model3DUrl = undefined // Remove the 3D model
      } else if (selected3DModel) {
        model3DUrl = await upload3DModel(selected3DModel)
      }

      const productData = {
        ...formData,
        short_description: formData.subtitle, // Map subtitle to short_description for API
        image_url: imageUrl,
        gallery_images: galleryImages,
        model_3d_url: model3DUrl,
        model_3d_filename: selected3DModel ? 
          (Array.isArray(selected3DModel) ? selected3DModel.map(f => f.name).join(', ') : selected3DModel.name) : 
          (remove3DModel ? undefined : formData.model_3d_filename),
        price: Number(formData.price),
        original_price: Number(formData.originalPrice),
        stock_quantity: Number(formData.low_stock_threshold),
      }

      const url = currentProduct ? `/api/products/${currentProduct.id}` : '/api/products'
      const method = currentProduct ? 'PUT' : 'POST'

      const token = localStorage.getItem('auth_token')
      console.log('Token being sent:', token ? `Token exists (length: ${token.length})` : 'No token found')
      console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'N/A')
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Product ${currentProduct ? 'updated' : 'created'} successfully`,
        })
        setIsAddDialogOpen(false)
        setIsEditDialogOpen(false)
        resetForm()
        loadProducts()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error Response:', errorData)
        
        // Handle JWT token issues
        if (response.status === 401) {
          localStorage.removeItem('auth_token')
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          })
          window.location.href = '/admin/login'
          return
        }
        
        throw new Error(errorData.error || `Failed to save product (${response.status})`)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploadingImages(false)
      setUploading3DModel(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      subtitle: "",
      sku: "",
      category: "",
      brand: "",
      price: 0,
      originalPrice: 0,
      description: "",
      is_new: false,
      is_sale: false,
      is_active: true,
      low_stock_threshold: 10,
      colors: [],
      sizes: [],
      variants: {},
      model_3d_url: "",
      model_3d_filename: ""
    })
    setSelectedImages([])
    setImagesToRemove([])
    setSelected3DModel(null)
    setRemove3DModel(false)
    setCurrentProduct(null)
    setColorInput("")
    setSizeInput("")
  }

  const handleEdit = (product: Product) => {
    setCurrentProduct(product)
    setFormData(product)
    setSelectedImages([]) // Clear selected images for edit mode
    setImagesToRemove([]) // Clear images to remove for edit mode
    setRemove3DModel(false) // Clear 3D model removal state for edit mode
    setIsEditDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      const token = localStorage.getItem('auth_token') // ✅ Already correct
      console.log('🔍 Debug - Token from localStorage:', token)
      console.log('🔍 Debug - Token type:', typeof token)
      console.log('🔍 Debug - Token length:', token?.length)
      
      if (!token || token === 'null' || token === 'undefined') {
        toast({
          title: "Authentication Error",
          description: "Please log in again to delete products",
          variant: "destructive",
        })
        return
      }
      
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        loadProducts()
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const addColor = () => {
    if (colorInput.trim() && !formData.colors?.includes(colorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), colorInput.trim()]
      }))
      setColorInput("")
    }
  }

  const removeColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors?.filter(c => c !== color) || []
    }))
  }

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...(prev.sizes || []), sizeInput.trim()]
      }))
      setSizeInput("")
    }
  }

  const removeSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes?.filter(s => s !== size) || []
    }))
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">Product Inventory</h1>
          <p className="text-gray-400">Manage your product stock levels and details</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetForm()
              setIsAddDialogOpen(true)
            }}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-300">Product</TableHead>
                <TableHead className="text-gray-300">Category</TableHead>
                <TableHead className="text-gray-300">Brand</TableHead>
                <TableHead className="text-gray-300">Price</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">3D Model</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-gray-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium text-white">{product.name}</div>
                        {product.subtitle && (
                          <div className="text-sm text-gray-400">{product.subtitle}</div>
                        )}
                        {product.sku && (
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{product.category}</TableCell>
                  <TableCell className="text-gray-300">{product.brand}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex flex-col">
                      <span className="font-medium">${product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={product.status === 'Active' ? "default" : "secondary"}>
                        {product.status || 'Active'}
                      </Badge>
                      {product.is_new && <Badge variant="outline">New</Badge>}
                      {product.is_sale && <Badge className="bg-red-600">Sale</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.model_3d_url ? (
                      <Badge className="bg-blue-600">3D Available</Badge>
                    ) : (
                      <Badge variant="outline">No 3D Model</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProductToDelete(product)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Add New Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new product with all necessary details including 3D model support.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-gray-300">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter product subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-gray-300">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter SKU"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-gray-300">Brand *</Label>
                  <Select
                    value={formData.brand}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-300">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice" className="text-gray-300">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              {/* Colors Section */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Available Colors</h4>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      placeholder="Enter color name"
                      className="bg-gray-800 border-gray-700"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (colorInput.trim() && !formData.colors?.includes(colorInput.trim())) {
                            setFormData(prev => ({
                              ...prev,
                              colors: [...(prev.colors || []), colorInput.trim()]
                            }))
                            setColorInput("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (colorInput.trim() && !formData.colors?.includes(colorInput.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            colors: [...(prev.colors || []), colorInput.trim()]
                          }))
                          setColorInput("")
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.colors && formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                          <span className="text-gray-300">{color}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                colors: prev.colors?.filter(c => c !== color) || []
                              }))
                            }}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes Section */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Available Sizes</h4>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="Enter size (e.g., 8.5, 9, 10)"
                      className="bg-gray-800 border-gray-700"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
                            setFormData(prev => ({
                              ...prev,
                              sizes: [...(prev.sizes || []), sizeInput.trim()]
                            }))
                            setSizeInput("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            sizes: [...(prev.sizes || []), sizeInput.trim()]
                          }))
                          setSizeInput("")
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Quick Add Common Sizes */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Quick add common sizes:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (!formData.sizes?.includes(size)) {
                              setFormData(prev => ({
                                ...prev,
                                sizes: [...(prev.sizes || []), size]
                              }))
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            formData.sizes?.includes(size)
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          disabled={formData.sizes?.includes(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {formData.sizes && formData.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.sizes.map((size, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                          <span className="text-gray-300">{size}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                sizes: prev.sizes?.filter(s => s !== size) || []
                              }))
                            }}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media and Assets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Media & Assets</h3>
              
              {/* Product Images */}
              <div className="space-y-2">
                <Label className="text-gray-300">Product Images</Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Images
                        </>
                      )}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        console.log('Files selected:', files.length, files.map(f => f.name))
                        if (files.length > 5) {
                          toast({
                            title: "Error",
                            description: "You can only upload up to 5 images",
                            variant: "destructive",
                          })
                          return
                        }
                        setSelectedImages(files)
                        console.log('Selected images state updated:', files.length)
                      }}
                    />
                    <p className="text-sm text-gray-400">
                      Drag and drop your images here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Images: JPG, PNG, WebP, GIF (Max. 5 images, 10MB each) • Recommended size: 800x800px
                    </p>
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-green-400">
                        {selectedImages.length} image(s) selected
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImages(prev => prev.filter((_, i) => i !== index))
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                          </div>
                        ))}
                        {selectedImages.length < 5 && (
                          <div 
                            className="aspect-square bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                            onClick={() => document.getElementById('image-upload')?.click()}
                          >
                            <div className="text-center">
                              <Plus className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                              <p className="text-xs text-gray-500">Add More</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3D Model Upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">3D Model (OBJ File)</Label>
                <div className="border-2 border-dashed border-blue-700 rounded-lg p-6 text-center bg-blue-900/10">
                  <div className="mx-auto h-12 w-12 text-blue-400 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                      onClick={() => document.getElementById('model-upload')?.click()}
                      disabled={uploading3DModel}
                    >
                      {uploading3DModel ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload 3D Model
                        </>
                      )}
                    </Button>
                    <input
                      id="model-upload"
                      type="file"
                      accept=".obj,.mtl,.zip,.fbx,.gltf,.glb"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          // For multiple files, we'll handle them as an array
                          const fileArray = Array.from(files)
                          setSelected3DModel(fileArray.length === 1 ? fileArray[0] : fileArray)
                        }
                      }}
                    />
                    <p className="text-sm text-blue-300">
                      Upload OBJ files with optional MTL materials, or ZIP archives containing OBJ+MTL+textures
                    </p>
                    <p className="text-xs text-blue-400">
                      3D Models: OBJ, FBX, GLTF, GLB (Max. 50MB) • Recommended: OBJ with MTL
                    </p>
                  </div>
                  {selected3DModel && (
                    <div className="mt-4">
                      <p className="text-sm text-green-400">
                        Selected: {Array.isArray(selected3DModel) ? 
                          selected3DModel.map(f => f.name).join(', ') : 
                          selected3DModel.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Options */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Product Options</h4>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_new"
                      checked={formData.is_new}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: !!checked }))}
                    />
                    <Label htmlFor="is_new" className="text-gray-300">New Product</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_sale"
                      checked={formData.is_sale}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sale: !!checked }))}
                    />
                    <Label htmlFor="is_sale" className="text-gray-300">On Sale</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                    />
                    <Label htmlFor="is_active" className="text-gray-300">Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold" className="text-gray-300">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700"
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-300">Status</Label>
                  <Select
                    value={formData.status || 'Active'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.category || !formData.brand || uploadingImages || uploading3DModel}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {uploadingImages || uploading3DModel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Edit Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update product information and inventory details
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form content as Add Dialog but with edit context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-gray-300">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-subtitle" className="text-gray-300">Subtitle</Label>
                <Input
                  id="edit-subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter product subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-sku" className="text-gray-300">SKU</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter SKU"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="text-gray-300">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-brand" className="text-gray-300">Brand *</Label>
                  <Select
                    value={formData.brand}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-gray-300">Price *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-originalPrice" className="text-gray-300">Original Price</Label>
                  <Input
                    id="edit-originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              {/* Colors Section */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Available Colors</h4>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      placeholder="Enter color name"
                      className="bg-gray-800 border-gray-700"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (colorInput.trim() && !formData.colors?.includes(colorInput.trim())) {
                            setFormData(prev => ({
                              ...prev,
                              colors: [...(prev.colors || []), colorInput.trim()]
                            }))
                            setColorInput("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (colorInput.trim() && !formData.colors?.includes(colorInput.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            colors: [...(prev.colors || []), colorInput.trim()]
                          }))
                          setColorInput("")
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.colors && formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                          <span className="text-gray-300">{color}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                colors: prev.colors?.filter(c => c !== color) || []
                              }))
                            }}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes Section */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Available Sizes</h4>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="Enter size (e.g., 8.5, 9, 10)"
                      className="bg-gray-800 border-gray-700"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
                            setFormData(prev => ({
                              ...prev,
                              sizes: [...(prev.sizes || []), sizeInput.trim()]
                            }))
                            setSizeInput("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            sizes: [...(prev.sizes || []), sizeInput.trim()]
                          }))
                          setSizeInput("")
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Quick Add Common Sizes */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Quick add common sizes:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (!formData.sizes?.includes(size)) {
                              setFormData(prev => ({
                                ...prev,
                                sizes: [...(prev.sizes || []), size]
                              }))
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            formData.sizes?.includes(size)
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          disabled={formData.sizes?.includes(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {formData.sizes && formData.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.sizes.map((size, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
                          <span className="text-gray-300">{size}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                sizes: prev.sizes?.filter(s => s !== size) || []
                              }))
                            }}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media and Assets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Media & Assets</h3>
              
              {/* Current Image */}
              {formData.image && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Current Image</Label>
                  <img
                    src={formData.image}
                    alt="Current product image"
                    className="w-32 h-32 object-cover rounded border border-gray-700"
                  />
                </div>
              )}
              
              {/* Existing Gallery Images */}
              {currentProduct?.gallery_images && currentProduct.gallery_images.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Current Gallery Images ({currentProduct.gallery_images.filter(imageUrl => !imagesToRemove.includes(imageUrl)).length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {currentProduct.gallery_images.filter(imageUrl => !imagesToRemove.includes(imageUrl)).map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                          <img
                            src={imageUrl}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=100&width=100"
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImagesToRemove(prev => [...prev, imageUrl])
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">These images will be preserved when you upload new ones</p>
                </div>
              )}
              
              {/* Product Images */}
              <div className="space-y-2">
                <Label className="text-gray-300">Update Product Images</Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('edit-image-upload')?.click()}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload New Images
                        </>
                      )}
                    </Button>
                    <input
                      id="edit-image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 5) {
                          toast({
                            title: "Error",
                            description: "You can only upload up to 5 images",
                            variant: "destructive",
                          })
                          return
                        }
                        setSelectedImages(files)
                      }}
                    />
                    <p className="text-sm text-gray-400">
                      Upload new images to add to existing gallery
                    </p>
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-green-400">
                        {selectedImages.length} new image(s) selected to add
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImages(prev => prev.filter((_, i) => i !== index))
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <p className="text-xs text-gray-400 mt-1 truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current 3D Model */}
              {formData.model_3d_url && !remove3DModel && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Current 3D Model</Label>
                  <div className="relative group p-3 bg-blue-900/20 border border-blue-700 rounded">
                    <p className="text-sm text-blue-300">3D Model: {formData.model_3d_url.split('/').pop()}</p>
                    <button
                      type="button"
                      onClick={() => setRemove3DModel(true)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Remove 3D model"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Removed 3D Model Notice */}
              {remove3DModel && formData.model_3d_url && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Current 3D Model</Label>
                  <div className="p-3 bg-red-900/20 border border-red-700 rounded">
                    <p className="text-sm text-red-300">3D Model marked for removal: {formData.model_3d_url.split('/').pop()}</p>
                    <button
                      type="button"
                      onClick={() => setRemove3DModel(false)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Undo removal
                    </button>
                  </div>
                </div>
              )}

              {/* 3D Model Upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Update 3D Model (OBJ File)</Label>
                <div className="border-2 border-dashed border-blue-700 rounded-lg p-6 text-center bg-blue-900/10">
                  <div className="mx-auto h-12 w-12 text-blue-400 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                      onClick={() => document.getElementById('edit-model-upload')?.click()}
                      disabled={uploading3DModel}
                    >
                      {uploading3DModel ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload New 3D Model
                        </>
                      )}
                    </Button>
                    <input
                      id="edit-model-upload"
                      type="file"
                      accept=".obj,.mtl,.zip,.fbx,.gltf,.glb"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          // For multiple files, we'll handle them as an array
                          const fileArray = Array.from(files)
                          setSelected3DModel(fileArray.length === 1 ? fileArray[0] : fileArray)
                        }
                      }}
                    />
                    <p className="text-sm text-blue-300">
                      {formData.model_3d_url && !remove3DModel 
                        ? "Upload new 3D model to replace current one" 
                        : "Upload 3D model for this product"}
                    </p>
                  </div>
                  {selected3DModel && (
                    <div className="mt-4">
                      <p className="text-sm text-green-400">
                        New model selected: {Array.isArray(selected3DModel) ? 
                          selected3DModel.map(f => f.name).join(', ') : 
                          selected3DModel.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Options */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Product Options</h4>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_is_new"
                      checked={formData.is_new}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: !!checked }))}
                    />
                    <Label htmlFor="edit_is_new" className="text-gray-300">New Product</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_is_sale"
                      checked={formData.is_sale}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sale: !!checked }))}
                    />
                    <Label htmlFor="edit_is_sale" className="text-gray-300">On Sale</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit_is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                    />
                    <Label htmlFor="edit_is_active" className="text-gray-300">Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_low_stock_threshold" className="text-gray-300">Low Stock Threshold</Label>
                  <Input
                    id="edit_low_stock_threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-800 border-gray-700"
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_status" className="text-gray-300">Status</Label>
                  <Select
                    value={formData.status || 'Active'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.category || !formData.brand || uploadingImages || uploading3DModel}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {uploadingImages || uploading3DModel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
