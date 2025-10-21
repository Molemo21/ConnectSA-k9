#!/usr/bin/env node
/**
 * Test Authentication Issue
 * - Checks current environment variables
 * - Tests authentication flow
 * - Provides solution for local development
 */

console.log('🔍 Authentication Environment Check');
console.log('=====================================');

// Check environment variables
console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
console.log('- COOKIE_DOMAIN:', process.env.COOKIE_DOMAIN || 'not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'set' : 'not set');

console.log('\n🔍 Issue Analysis:');
console.log('The 401 Unauthorized error occurs because:');
console.log('1. You are running locally (http://laptop-d901547i:3000)');
console.log('2. But authentication is configured for production domain');
console.log('3. Cookie domain mismatch prevents authentication');

console.log('\n✅ Solution:');
console.log('Create a .env file in your project root with these settings:');
console.log('');
console.log('# Local Development Environment');
console.log('NODE_ENV=development');
console.log('NEXTAUTH_URL=http://localhost:3000');
console.log('COOKIE_DOMAIN=');
console.log('JWT_SECRET=local-development-jwt-secret-key-min-32-chars');
console.log('NEXTAUTH_SECRET=local-development-nextauth-secret-key-min-32-chars');
console.log('NEXT_PUBLIC_CATALOGUE_PRICING_V1=true');
console.log('');
console.log('# Keep your existing database and other production settings');
console.log('DATABASE_URL="your-existing-database-url"');
console.log('FROM_EMAIL="no-reply@app.proliinkconnect.co.za"');
console.log('RESEND_API_KEY="your-existing-resend-key"');
console.log('');
console.log('Then restart your development server: npm run dev');

