'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Database, Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  rating: number;
  reviews: number;
  colors: string[];
  color_images?: { [key: string]: string };
  sizes?: string[];
  isNew: boolean;
  isSale: boolean;
  views: number;
  category: string;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  location?: string;
  is_admin: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseStats {
  totalProducts: number;
  activeProducts: number;
  categories: string[];
  brands: string[];
}

interface TableSchema {
  name: string;
  rows: number;
  structure: {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: any;
    Extra: string;
  }[];
}

interface DatabaseInfo {
  connection: string;
  database: string;
  host: string;
  port: string;
  tables: TableSchema[];
  totalRecords: number;
}

export default function MySQLAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DatabaseStats>({ totalProducts: 0, activeProducts: 0, categories: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Form state for creating/editing products
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    original_price: '',
    image_url: '',
    colors: '',
    category: 'unisex',
    stock_quantity: '',
    sku: '',
    is_active: true
  });

  // Fetch database schema information
  const fetchDatabaseSchema = async () => {
    try {
      setSchemaLoading(true);
      const response = await fetch('/api/admin/mysql/stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch database schema');
      }
      
      setDatabaseInfo(data);
    } catch (err) {
      console.error('Error fetching database schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch database schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  // Fetch products from MySQL API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products/mysql');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      // Handle the correct API response format
      const products = data.success ? data.data || [] : [];
      setProducts(products);
      setConnectionStatus('connected');
      
      // Calculate stats
      const totalProducts = products.length || 0;
      const activeProducts = products.filter((p: Product) => p.is_active).length || 0;
      const categories = [...new Set(products.map((p: Product) => p.category) || [])] as string[];
      const brands = [...new Set(products.map((p: Product) => p.brand) || [])] as string[];
      
      setStats({ totalProducts, activeProducts, categories, brands });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/real-users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      // Handle the correct API response format
      const users = data.success ? data.data || [] : [];
      setUsers(users);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Create new product
  const createProduct = async () => {
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        colors: formData.colors.split(',').map(c => c.trim()).filter(c => c),
        stock_quantity: parseInt(formData.stock_quantity) || 0
      };
      
      const response = await fetch('/api/products/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  // Update product
  const updateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const productData = {
        id: selectedProduct.id,
        ...formData,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        colors: formData.colors.split(',').map(c => c.trim()).filter(c => c),
        stock_quantity: parseInt(formData.stock_quantity) || 0
      };
      
      const response = await fetch('/api/products/mysql', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }
      
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  // Delete product
  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products/mysql?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      original_price: '',
      image_url: '',
      colors: '',
      category: 'unisex',
      stock_quantity: '',
      sku: '',
      is_active: true
    });
  };

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      image_url: product.image_url,
      colors: product.colors.join(', '),
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
      sku: product.sku,
      is_active: product.is_active
    });
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    fetchProducts();
    fetchUsers();
    fetchDatabaseSchema();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">MySQL Database Admin</h1>
            <p className="text-gray-600">GKicks Product Management</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.brands.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="structure">Database Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Table Header */}
          <div>
            <h2 className="text-xl font-semibold">Products Table</h2>
          </div>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading products...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Table Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Users Table</h2>
            <Button 
              onClick={fetchUsers} 
              disabled={usersLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
              Refresh Users
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                        </TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>
                          {user.location || (user.city && user.country ? `${user.city}, ${user.country}` : user.city || user.country || 'N/A')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                            {user.is_admin ? 'Admin' : 'Customer'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Database Schema</CardTitle>
                <Button 
                  onClick={fetchDatabaseSchema} 
                  disabled={schemaLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${schemaLoading ? 'animate-spin' : ''}`} />
                  Refresh Schema
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {schemaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading database schema...</span>
                </div>
              ) : databaseInfo ? (
                <div className="space-y-6">
                  {/* Database Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Database</div>
                      <div className="text-lg font-semibold">{databaseInfo.database}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Host</div>
                      <div className="text-lg font-semibold">{databaseInfo.host}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Tables</div>
                      <div className="text-lg font-semibold">{databaseInfo.tables.length}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Total Records</div>
                      <div className="text-lg font-semibold">{databaseInfo.totalRecords}</div>
                    </div>
                  </div>

                  {/* Tables */}
                  {databaseInfo.tables.map((table) => (
                    <div key={table.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg capitalize">{table.name} Table</h3>
                        <Badge variant="secondary">{table.rows} rows</Badge>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Null</TableHead>
                              <TableHead>Key</TableHead>
                              <TableHead>Default</TableHead>
                              <TableHead>Extra</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {table.structure.map((column, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{column.Field}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{column.Type}</Badge>
                                </TableCell>
                                <TableCell>{column.Null}</TableCell>
                                <TableCell>
                                  {column.Key && (
                                    <Badge variant={column.Key === 'PRI' ? 'default' : 'secondary'}>
                                      {column.Key}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{column.Default || 'NULL'}</TableCell>
                                <TableCell>{column.Extra}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No database schema information available</p>
                  <Button onClick={fetchDatabaseSchema} className="mt-4">
                    Load Schema
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                  
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-colors">Colors (comma-separated)</Label>
              <Input
                id="edit-colors"
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                placeholder="Black, White, Red"
              />
            </div>
            <div>
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateProduct}>
              Update Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}