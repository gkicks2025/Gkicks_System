// lib/admin-data.ts
"use client";

// Removed Supabase import - using local MySQL simulator
import { products } from "@/lib/product-data"; // Import local cached products list

/** PRODUCT / INVENTORY TYPES & FUNCTIONS **/

export interface ProductInventory {
  id: number;
  name: string;
  subtitle?: string;
  sku?: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number;
  image?: string;
  description?: string;
  is_new?: boolean;
  is_sale?: boolean;
  is_active: boolean;
  low_stock_threshold?: number;
  colors?: string[]; // Array of colors
  variants?: Record<string, Record<string, number>>; // { color: { size: quantity } }
}

export async function getInventoryData() {
  // your logic here
  return [];
}

export async function getDailySales() {
  // your logic here
  return [];
}

export async function updateDailySales() {
  // your logic here
}

// Fetch all active products from local data
export async function fetchInventory(): Promise<ProductInventory[]> {
  // Use local product data for now
  return products.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    price: product.price,
    originalPrice: product.originalPrice || product.price,
    image: product.image,
    description: product.description,
    is_new: product.isNew,
    is_sale: product.isSale,
    is_active: true,
    colors: product.colors
  }));
}

// Add new product (placeholder - use MySQL simulator API)
export async function addProduct(
  product: Omit<ProductInventory, "id">
): Promise<boolean> {
  try {
    // TODO: Implement with MySQL simulator API
    console.log("Adding product:", product);
    return true;
  } catch (error) {
    console.error("Error in addProduct:", error);
    return false;
  }
}

// Update product (placeholder - use MySQL simulator API)
export async function updateProduct(
  productId: number,
  updates: Partial<ProductInventory>
): Promise<boolean> {
  try {
    // TODO: Implement with MySQL simulator API
    console.log("Updating product:", productId, updates);
    return true;
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return false;
  }
}

// Soft delete product (placeholder - use MySQL simulator API)
export async function deleteProduct(productId: number): Promise<boolean> {
  try {
    // TODO: Implement with MySQL simulator API
    console.log("Deleting product:", productId);
    await syncToHomepage();
    return true;
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return false;
  }
}

// Check stock for given product/color/size by reading variants JSON in product
export async function checkStock(
  productId: number,
  color: string,
  size: string
): Promise<number> {
  const product = products.find((p) => p.id === productId);
  if (!product || !product.variants) return 0;

  const colorVariants = product.variants[color];
  if (!colorVariants) return 0;

  return colorVariants[size] || 0;
}

// Update stock
export async function updateStock(
  productId: number,
  color: string,
  size: string,
  delta: number
): Promise<number> {
  try {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.variants) return 0;

    const colorVariants = product.variants[color] || {};
    const currentQty = colorVariants[size] || 0;
    const newQty = Math.max(0, currentQty + delta);

    const updatedVariants = {
      ...product.variants,
      [color]: {
        ...colorVariants,
        [size]: newQty,
      },
    };

    // TODO: Implement with MySQL simulator API
    console.log("Updating stock for product:", productId, color, size, delta);

    // Update local cache
    product.variants = updatedVariants;

    // Notify UI
    window.dispatchEvent(
      new CustomEvent("inventoryUpdate", {
        detail: { productId, color, size, newStock: newQty },
      })
    );

    return newQty;
  } catch (error) {
    console.error("Exception in updateStock:", error);
    return 0;
  }
}

// Sync all products to homepage localStorage (using local data)
export async function syncToHomepage(): Promise<void> {
  try {
    const products = await fetchInventory();

    window.dispatchEvent(
      new CustomEvent("adminProductsSync", {
        detail: { products },
      })
    );
  } catch (error) {
    console.error("Error syncing to homepage:", error);
  }
}


/** ORDERS TYPES & FUNCTIONS **/

export interface Order {
  id: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    image?: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  orderDate: string; // ISO string
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    province: string;
    zipCode: string;
    phone?: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
}

/**
 * Load all orders from localStorage.
 */
export function getOrders(): Order[] {
  const raw = localStorage.getItem("gkicks-orders");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Order[];
  } catch {
    console.error("Failed to parse orders JSON");
    return [];
  }
}

/**
 * Update a single order, persist back to localStorage, and emit a storage event.
 */
export function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Order | undefined {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return undefined;

  const updated = { ...orders[idx], ...updates };
  orders[idx] = updated;
  localStorage.setItem("gkicks-orders", JSON.stringify(orders));

  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "gkicks-orders",
      newValue: JSON.stringify(orders),
    })
  );
  return updated;
}
