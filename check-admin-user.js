const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAndFixAdminUser() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'gkicks_user',
      password: 'GKicks2024!SecurePass',
      database: 'gkicks'
    });

    console.log('✅ Connected to MySQL database');

    // Check if admin_users table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'admin_users'"
    );

    if (tables.length === 0) {
      console.log('❌ admin_users table does not exist. Creating it...');
      
      // Create admin_users table
      await connection.execute(`
        CREATE TABLE admin_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('admin', 'staff') DEFAULT 'admin',
          is_active BOOLEAN DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ admin_users table created');
    }

    // Check if admin user exists
    const [adminUsers] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ?',
      ['gkcksdmn@gmail.com']
    );

    if (adminUsers.length === 0) {
      console.log('❌ Admin user does not exist. Creating it...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Insert admin user
      await connection.execute(
        'INSERT INTO admin_users (email, password_hash, role, is_active) VALUES (?, ?, ?, ?)',
        ['gkcksdmn@gmail.com', hashedPassword, 'admin', 1]
      );
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user exists');
      console.log('Admin user details:', {
        id: adminUsers[0].id,
        email: adminUsers[0].email,
        role: adminUsers[0].role,
        is_active: adminUsers[0].is_active
      });
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(
        'UPDATE admin_users SET password_hash = ? WHERE email = ?',
        [hashedPassword, 'gkcksdmn@gmail.com']
      );
      
      console.log('✅ Admin password updated');
    }

    // Test password verification
    const [testUser] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ?',
      ['gkcksdmn@gmail.com']
    );
    
    if (testUser.length > 0) {
      const isValidPassword = await bcrypt.compare('admin123', testUser[0].password_hash);
      console.log('🔍 Password verification test:', isValidPassword ? '✅ PASS' : '❌ FAIL');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

checkAndFixAdminUser();