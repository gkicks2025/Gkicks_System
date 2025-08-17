const { executeQuery } = require('./lib/database/mysql.ts');

async function checkVariants() {
  try {
    console.log('🔍 Checking product variants in database...');
    
    const products = await executeQuery(
      'SELECT id, name, variants FROM products WHERE id IN (1, 2, 3) AND is_active = 1',
      []
    );
    
    console.log('📦 Products and their variants:');
    products.forEach(product => {
      console.log(`\nProduct ${product.id}: ${product.name}`);
      console.log('Variants:', product.variants || 'NULL/EMPTY');
      
      if (product.variants) {
        try {
          const parsed = JSON.parse(product.variants);
          console.log('Parsed variants:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Error parsing variants JSON:', e.message);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking variants:', error);
  }
}

checkVariants();