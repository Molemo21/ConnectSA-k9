// Script to clear authentication cookies and test JWT
const { execSync } = require('child_process');

console.log('Clearing Next.js cache...');
try {
  execSync('rmdir /s /q .next', { stdio: 'inherit' });
  console.log('Cache cleared successfully');
} catch (error) {
  console.log('Cache directory not found or already cleared');
}

console.log('Please clear your browser cookies for localhost:3000 and restart the development server');
console.log('Run: npm run dev');