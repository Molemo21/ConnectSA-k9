import { validateSubcategories } from '../config/services';

const result = validateSubcategories();

console.log('🔍 Validating Subcategory Definitions\n');
console.log('='.repeat(60) + '\n');

if (result.valid) {
  console.log('✅ All subcategories are valid!');
  console.log('   - All services in subcategories exist in SERVICES array');
  console.log('   - All service categories match their subcategory categories');
} else {
  console.log('❌ Validation errors found:\n');
  result.errors.forEach(e => {
    console.log(`   - ${e.subcategory}:`);
    console.log(`     Service: ${e.service}`);
    console.log(`     Error: ${e.error}\n`);
  });
  process.exit(1);
}

console.log('\n✅ Subcategory validation passed!');
