const { PrismaClient } = require('@prisma/client')

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  const prisma = new PrismaClient()
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test user table
    console.log('👤 Testing user table...')
    const userCount = await prisma.user.count()
    console.log(`✅ User table accessible, count: ${userCount}`)
    
    // Test provider table
    console.log('🔧 Testing provider table...')
    const providerCount = await prisma.provider.count()
    console.log(`✅ Provider table accessible, count: ${providerCount}`)
    
    // Test service table
    console.log('🛠️ Testing service table...')
    const serviceCount = await prisma.service.count()
    console.log(`✅ Service table accessible, count: ${serviceCount}`)
    
    // Test providerService table
    console.log('🔗 Testing providerService table...')
    const providerServiceCount = await prisma.providerService.count()
    console.log(`✅ ProviderService table accessible, count: ${providerServiceCount}`)
    
    // Test adminAuditLog table
    console.log('📝 Testing adminAuditLog table...')
    const auditLogCount = await prisma.adminAuditLog.count()
    console.log(`✅ AdminAuditLog table accessible, count: ${auditLogCount}`)
    
    console.log('🎉 All database tests passed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  }
}

testDatabaseConnection()


