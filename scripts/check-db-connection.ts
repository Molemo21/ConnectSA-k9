const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@db.qdrktzqfeewwcktgltzy.supabase.co:5432/postgres?sslmode=require"
    }
  }
})

async function checkDatabaseConnection() {
  console.log('=== Database Connection Check ===\n')

  try {
    console.log('Attempting to connect to database...')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connected;`
    console.log('Database connection successful:', result)

    // Try to get some basic counts
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.provider.count(),
      prisma.service.count(),
      prisma.booking.count()
    ])

    console.log('\nDatabase Counts:')
    console.log('Users:', counts[0])
    console.log('Providers:', counts[1])
    console.log('Services:', counts[2])
    console.log('Bookings:', counts[3])

    console.log('\n✅ All database checks passed!')

  } catch (error) {
    console.error('\n❌ Database connection error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkDatabaseConnection()
  .catch(console.error)