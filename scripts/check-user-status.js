const { PrismaClient } = require('@prisma/client')

async function checkUserStatus() {
  console.log('🔍 Checking user status...')
  
  const prisma = new PrismaClient()
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('👥 All users:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name})`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Email Verified: ${user.emailVerified}`)
      console.log(`   Active: ${user.isActive}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log('')
    })
    
    // Check for PROVIDER users
    const providerUsers = users.filter(user => user.role === 'PROVIDER')
    console.log(`🔧 Provider users: ${providerUsers.length}`)
    
    if (providerUsers.length === 0) {
      console.log('❌ No provider users found!')
      console.log('💡 You need to either:')
      console.log('   1. Sign up as a new user with PROVIDER role, OR')
      console.log('   2. Update an existing user to PROVIDER role')
    } else {
      console.log('✅ Provider users found:')
      providerUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - Verified: ${user.emailVerified}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserStatus()


