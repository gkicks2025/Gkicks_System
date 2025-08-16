import mysql from 'mysql2/promise';

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gkicks',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
}

// Execute query function
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    throw error;
  }
}

// Get all products
export async function getAllProducts() {
  const query = `
    SELECT 
      id, name, brand, description, price, original_price,
      image_url, rating, reviews, colors, color_images,
      is_new, is_sale, views, category, stock_quantity,
      sku, is_active, created_at, updated_at
    FROM products 
    WHERE is_active = 1 AND is_deleted = 0
    ORDER BY created_at DESC
  `;
  
  return await executeQuery(query);
}

// Get product by ID
export async function getProductById(id: number) {
  const query = `
    SELECT 
      id, name, brand, description, price, original_price,
      image_url, rating, reviews, colors, color_images,
      is_new, is_sale, views, category, stock_quantity,
      sku, is_active, created_at, updated_at
    FROM products 
    WHERE id = ? AND is_active = 1 AND is_deleted = 0
  `;
  
  const results = await executeQuery(query, [id]) as any[];
  return results[0] || null;
}

// Insert new product
export async function insertProduct(product: any) {
  const query = `
    INSERT INTO products (
      name, brand, description, price, original_price,
      image_url, rating, reviews, colors, color_images,
      is_new, is_sale, views, category, stock_quantity,
      sku, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    product.name, product.brand, product.description,
    product.price, product.original_price, product.image_url,
    product.rating, product.reviews, JSON.stringify(product.colors),
    JSON.stringify(product.color_images), product.is_new,
    product.is_sale, product.views, product.category,
    product.stock_quantity, product.sku, product.is_active
  ];
  
  return await executeQuery(query, params);
}

// Update product
export async function updateProduct(id: number, product: any) {
  const query = `
    UPDATE products SET
      name = ?, brand = ?, description = ?, price = ?,
      original_price = ?, image_url = ?, rating = ?,
      reviews = ?, colors = ?, color_images = ?,
      is_new = ?, is_sale = ?, category = ?,
      stock_quantity = ?, sku = ?, is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const params = [
    product.name, product.brand, product.description,
    product.price, product.original_price, product.image_url,
    product.rating, product.reviews, JSON.stringify(product.colors),
    JSON.stringify(product.color_images), product.is_new,
    product.is_sale, product.category, product.stock_quantity,
    product.sku, product.is_active, id
  ];
  
  return await executeQuery(query, params);
}

// Delete product (soft delete)
export async function deleteProduct(id: number) {
  const query = `
    UPDATE products SET 
      is_deleted = 1, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  
  return await executeQuery(query, [id]);
}

export default pool;