import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Investigating Haircut duplicate issue...\n')

  try {
    // Step 1: Find all services with "haircut" in the name (case insensitive)
    const haircutServices = await prisma.service.findMany({
      where: {
        name: {
          contains: 'haircut',
          mode: 'insensitive'
        }
      },
      include: {
        providers: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { category: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    console.log(`📊 Found ${haircutServices.length} services with "haircut" in the name:\n`)

    if (haircutServices.length === 0) {
      console.log('✅ No haircut services found!')
      return
    }

    // Step 2: Display detailed information for each haircut service
    for (let i = 0; i < haircutServices.length; i++) {
      const service = haircutServices[i]
      console.log(`🔍 Service ${i + 1}:`)
      console.log(`   ID: ${service.id}`)
      console.log(`   Name: "${service.name}"`)
      console.log(`   Category: "${service.category}"`)
      console.log(`   Description: "${service.description}"`)
      console.log(`   Created: ${service.createdAt.toISOString()}`)
      console.log(`   Updated: ${service.updatedAt.toISOString()}`)
      console.log(`   Providers: ${service._count.providers}`)
      console.log(`   Bookings: ${service._count.bookings}`)
      
      if (service.providers.length > 0) {
        console.log(`   Provider Details:`)
        for (const ps of service.providers) {
          const provider = ps.provider
          const user = provider.user
          console.log(`     • ${user?.name || 'Unknown'} (${user?.email || 'No email'})`)
          console.log(`       Status: ${provider.status}, Rate: $${ps.customRate || 'N/A'}`)
        }
      }
      console.log('')
    }

    // Step 3: Check for exact name matches
    console.log('🔍 Checking for exact name matches...')
    const exactMatches = new Map<string, any[]>()
    
    for (const service of haircutServices) {
      const key = service.name.toLowerCase().trim()
      if (!exactMatches.has(key)) {
        exactMatches.set(key, [])
      }
      exactMatches.get(key)!.push(service)
    }

    console.log('\n📋 Exact Name Matches:')
    for (const [name, services] of exactMatches) {
      if (services.length > 1) {
        console.log(`\n   DUPLICATE FOUND: "${name}" (${services.length} services)`)
        for (const service of services) {
          console.log(`     • ID: ${service.id}`)
          console.log(`       Category: ${service.category}`)
          console.log(`       Providers: ${service._count.providers}`)
          console.log(`       Bookings: ${service._count.bookings}`)
          console.log(`       Created: ${service.createdAt.toISOString().split('T')[0]}`)
        }
      } else {
        console.log(`   ✅ Unique: "${name}"`)
      }
    }

    // Step 4: Check for similar names that might be duplicates
    console.log('\n🔍 Checking for similar names...')
    const allNames = haircutServices.map(s => s.name)
    const similarNames = new Map<string, any[]>()
    
    for (const service of haircutServices) {
      const normalizedName = service.name.toLowerCase().trim()
      const key = normalizedName.replace(/[^a-z0-9]/g, '') // Remove special chars
      
      if (!similarNames.has(key)) {
        similarNames.set(key, [])
      }
      similarNames.get(key)!.push(service)
    }

    console.log('\n📋 Similar Names (Normalized):')
    for (const [normalized, services] of similarNames) {
      if (services.length > 1) {
        console.log(`\n   POTENTIAL DUPLICATE: "${normalized}" (${services.length} services)`)
        for (const service of services) {
          console.log(`     • Original: "${service.name}"`)
          console.log(`       ID: ${service.id}`)
          console.log(`       Category: ${service.category}`)
        }
      }
    }

    // Step 5: Check for category inconsistencies
    console.log('\n🔍 Checking for category inconsistencies...')
    const categoryGroups = new Map<string, any[]>()
    
    for (const service of haircutServices) {
      const key = service.category
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, [])
      }
      categoryGroups.get(key)!.push(service)
    }

    console.log('\n📋 Category Distribution:')
    for (const [category, services] of categoryGroups) {
      console.log(`   ${category}: ${services.length} services`)
      for (const service of services) {
        console.log(`     • "${service.name}" (ID: ${service.id})`)
      }
    }

    // Step 6: Recommendations
    console.log('\n💡 Recommendations:')
    
    if (haircutServices.length > 1) {
      console.log('   1. Identify which service to keep (usually the one with most providers)')
      console.log('   2. Migrate any orphaned providers to the kept service')
      console.log('   3. Delete duplicate services')
      console.log('   4. Update any existing bookings to reference the kept service')
    } else {
      console.log('   ✅ No duplicates found - service catalog is clean!')
    }

  } catch (error) {
    console.error('\n❌ Error during investigation:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
