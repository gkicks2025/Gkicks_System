const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// MySQL connection configuration
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'gkicks_user',
  password: 'GKicks2024!SecurePass',
  database: 'gkicks'
};

const JWT_SECRET = 'Pm3ugukSzrUv3qf2U27+0fdcVsS3cqwKev/BERfeNkM=';

async function testAdminLogin() {
  let connection;
  
  try {
    console.log('🔍 Testing admin login...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Check admin user
    const [adminRows] = await connection.execute(
      'SELECT id, email, role, password_hash, is_active FROM admin_users WHERE email = ?',
      ['gkcksdmn@gmail.com']
    );
    
    if (adminRows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const admin = adminRows[0];
    console.log('✅ Admin user found:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active
    });
    
    // Verify password
    const isPasswordValid = await bcrypt.compare('admin123', admin.password_hash);
    console.log('🔐 Password verification:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isPasswordValid) {
      console.log('❌ Password verification failed');
      return;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: admin.id,
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🎫 Generated JWT token:', token.substring(0, 50) + '...');
    
    // Test token verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verification successful:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      });
      
      // Output the token for testing
      console.log('\n🔑 Use this token for testing:');
      console.log('Authorization: Bearer ' + token);
      
    } catch (tokenError) {
      console.log('❌ Token verification failed:', tokenError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testAdminLogin();