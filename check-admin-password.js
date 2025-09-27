const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// MySQL connection configuration
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'gkicks_user',
  password: 'GKicks2024!SecurePass',
  database: 'gkicks'
};

async function checkAdminPassword() {
  let connection;
  
  try {
    console.log('🔍 Checking admin user password...');
    
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
      is_active: admin.is_active,
      has_password: admin.password_hash ? true : false,
      password_length: admin.password_hash ? admin.password_hash.length : 0
    });
    
    if (!admin.password_hash) {
      console.log('❌ Admin user has no password set');
      console.log('🔧 Setting password to "admin123"...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'UPDATE admin_users SET password_hash = ? WHERE id = ?',
        [hashedPassword, admin.id]
      );
      
      console.log('✅ Password set successfully');
    } else {
      console.log('✅ Admin user has password set');
      
      // Test password verification
      try {
        const isPasswordValid = await bcrypt.compare('admin123', admin.password_hash);
        console.log('🔐 Password verification for "admin123":', isPasswordValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isPasswordValid) {
          console.log('🔧 Updating password to "admin123"...');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await connection.execute(
            'UPDATE admin_users SET password_hash = ? WHERE id = ?',
            [hashedPassword, admin.id]
          );
          console.log('✅ Password updated successfully');
        }
      } catch (bcryptError) {
        console.log('❌ Password verification error:', bcryptError.message);
        console.log('🔧 Setting new password...');
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
          'UPDATE admin_users SET password_hash = ? WHERE id = ?',
          [hashedPassword, admin.id]
        );
        console.log('✅ Password set successfully');
      }
    }
    
    // Final verification
    const [updatedRows] = await connection.execute(
      'SELECT password_hash FROM admin_users WHERE email = ?',
      ['gkcksdmn@gmail.com']
    );
    
    if (updatedRows.length > 0) {
      const isValid = await bcrypt.compare('admin123', updatedRows[0].password_hash);
      console.log('🔍 Final password verification:', isValid ? '✅ PASS' : '❌ FAIL');
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

checkAdminPassword();