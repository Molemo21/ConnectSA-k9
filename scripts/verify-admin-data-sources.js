#!/usr/bin/env node

/**
 * Script to verify admin dashboard data sources
 * Checks if data is coming from database or if there's mock data
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking Admin Dashboard for Mock Data...\n')

const searchPatterns = [
  { pattern: /House Cleaning.*R250/g, name: 'House Cleaning - R250' },
  { pattern: /Plumbing Repair.*R450/g, name: 'Plumbing Repair - R450' },
  { pattern: /john\.doe@example\.com/g, name: 'john.doe@example.com' },
  { pattern: /ABC Cleaning Services/g, name: 'ABC Cleaning Services' },
  { pattern: /mockData|MOCK_DATA|mock_data/g, name: 'Mock data references' },
]

const adminFiles = [
  'components/admin/main-content-admin.tsx',
  'components/admin/mobile-admin-dashboard.tsx',
  'components/admin/mobile-admin-dashboard-v2.tsx',
  'components/admin/admin-booking-overview.tsx',
  'app/admin/dashboard/page.tsx',
  'app/admin/dashboard/bookings/page.tsx',
]

let foundMockData = false

adminFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    
    searchPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern)
      if (matches) {
        console.log(`❌ Found mock data "${name}" in ${filePath}`)
        console.log(`   Occurrences: ${matches.length}`)
        foundMockData = true
      }
    })
  } else {
    console.log(`⚠️  File not found: ${filePath}`)
  }
})

if (!foundMockData) {
  console.log('✅ No mock data found in admin dashboard files!')
  console.log('\n📊 Checking data sources:')
  
  const apiFiles = [
    'app/api/admin/stats/route.ts',
    'app/api/admin/bookings/route.ts',
    'app/api/admin/users/route.ts',
    'app/api/admin/providers/route.ts',
    'app/api/admin/payments/route.ts',
  ]
  
  apiFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      if (content.includes('db.') || content.includes('prisma.')) {
        console.log(`✅ ${filePath} - Uses database`)
      } else if (content.includes('mockData') || content.includes('MOCK_DATA')) {
        console.log(`❌ ${filePath} - Uses mock data`)
      } else {
        console.log(`⚠️  ${filePath} - Unknown data source`)
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`)
    }
  })
}

console.log('\n✨ Verification complete!')
