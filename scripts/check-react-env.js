// Script to check React environment configuration
console.log('🔍 React Environment Check');
console.log('========================');

// Check if we're in development mode
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);

// Check React version
try {
  const React = require('react');
  console.log('React version:', React.version);
} catch (error) {
  console.log('React not found:', error.message);
}

// Check if we have source maps enabled
console.log('Source maps enabled:', process.env.NEXT_PUBLIC_SOURCE_MAPS === 'true');

// Check webpack configuration
console.log('Webpack devtool:', process.env.NODE_ENV === 'development' ? 'eval-source-map' : 'production');

console.log('========================');
console.log('✅ Environment check complete');
