import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Standardized category mapping
const CATEGORY_MAPPING: Record<string, string> = {
  // Hair services
  'Hair': 'Beauty & Personal Care',
  'hair': 'Beauty & Personal Care',
  
  // Beauty services
  'Beauty': 'Beauty & Personal Care',
  'beauty': 'Beauty & Personal Care',
  'Makeup': 'Beauty & Personal Care',
  'makeup': 'Beauty & Personal Care',
  'Nails': 'Beauty & Personal Care',
  'nails': 'Beauty & Personal Care',
  
  // Home services
  'Home & Garden': 'Home & Garden',
  'Home Improvement': 'Home & Garden',
  'Outdoor': 'Home & Garden',
  'Maintenance': 'Home & Garden',
  'Cleaning': 'Home & Garden',
  
  // Other services
  'Logistics': 'Transportation & Logistics',
  'Transportation': 'Transportation & Logistics',
  
  // Keep existing standardized categories
  'Beauty & Personal Care': 'Beauty & Personal Care',
  'Home & Garden': 'Home & Garden',
  'Transportation & Logistics': 'Transportation & Logistics'
}

// Standardized service names
const SERVICE_NAME_MAPPING: Record<string, string> = {
  'Garden Services': 'Garden',
  'Garden': 'Garden',
  'House Cleaning': 'House Cleaning',
  'Electrical Work': 'Electrical Work',
  'Plumbing': 'Plumbing',
  'Painting': 'Painting',
  'Moving Services': 'Moving Services',
  'Haircut': 'Haircut',
  'Barbering': 'Barbering',
  'Braiding': 'Braiding',
  'Weave Installation': 'Weave Installation',
  'Eyelash Extensions': 'Eyelash Extensions',
  'Facial': 'Facial',
  'Waxing': 'Waxing',
  'Bridal Makeup': 'Bridal Makeup',
  'Makeup Application': 'Makeup Application',
  'Manicure': 'Manicure',
  'Pedicure': 'Pedicure',
  'Nail Extensions': 'Nail Extensions'
}

interface ServiceWithCounts {
  id: string
  name: string
  category: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    providers: number
    bookings: number
  }
}

async function main() {
  console.log('🎯 Starting service category standardization...\n')

  try {
    // Step 1: Get all services with their usage counts
    console.log('📊 Analyzing current services...')
    const allServices = await prisma.service.findMany({
      include: {
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { category: 'asc' }
      ]
    })

    console.log(`Found ${allServices.length} total services`)

    // Step 2: Analyze current categories
    const currentCategories = new Map<string, number>()
    for (const service of allServices) {
      const count = currentCategories.get(service.category) || 0
      currentCategories.set(service.category, count + 1)
    }

    console.log('\n📋 Current Categories:')
    for (const [category, count] of currentCategories) {
      console.log(`   ${category}: ${count} services`)
    }

    // Step 3: Plan standardization
    console.log('\n🔄 Planning standardization...')
    
    const servicesToUpdate: Array<{
      service: ServiceWithCounts
      oldCategory: string
      newCategory: string
      oldName: string
      newName: string
    }> = []

    for (const service of allServices) {
      const newCategory = CATEGORY_MAPPING[service.category] || service.category
      const newName = SERVICE_NAME_MAPPING[service.name] || service.name
      
      if (newCategory !== service.category || newName !== service.name) {
        servicesToUpdate.push({
          service,
          oldCategory: service.category,
          newCategory,
          oldName: service.name,
          newName
        })
      }
    }

    if (servicesToUpdate.length === 0) {
      console.log('\n✅ All services are already standardized!')
      return
    }

    console.log(`\n📝 Services to update: ${servicesToUpdate.length}`)
    
    // Group by category changes
    const categoryChanges = new Map<string, string[]>()
    const nameChanges = new Map<string, string[]>()
    
    for (const update of servicesToUpdate) {
      if (update.oldCategory !== update.newCategory) {
        const key = `${update.oldCategory} → ${update.newCategory}`
        if (!categoryChanges.has(key)) {
          categoryChanges.set(key, [])
        }
        categoryChanges.get(key)!.push(update.service.name)
      }
      
      if (update.oldName !== update.newName) {
        const key = `${update.oldName} → ${update.newName}`
        if (!nameChanges.has(key)) {
          nameChanges.set(key, [])
        }
        nameChanges.get(key)!.push(update.service.id)
      }
    }

    // Display planned changes
    if (categoryChanges.size > 0) {
      console.log('\n🔄 Category Changes:')
      for (const [change, services] of categoryChanges) {
        console.log(`   ${change}: ${services.length} services`)
      }
    }

    if (nameChanges.size > 0) {
      console.log('\n✏️  Name Changes:')
      for (const [change, serviceIds] of nameChanges) {
        console.log(`   ${change}: ${serviceIds.length} services`)
      }
    }

    // Step 4: Execute updates (if not dry run)
    const isDryRun = process.argv.includes('--dry-run')
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made')
      console.log('\n📋 Summary of changes that would be made:')
      for (const update of servicesToUpdate) {
        console.log(`   • ${update.service.id}:`)
        if (update.oldCategory !== update.newCategory) {
          console.log(`     Category: ${update.oldCategory} → ${update.newCategory}`)
        }
        if (update.oldName !== update.newName) {
          console.log(`     Name: ${update.oldName} → ${update.newName}`)
        }
      }
      
      console.log('\n🚀 To execute the actual changes, run:')
      console.log('   npx tsx scripts/standardize-service-categories.ts')
      return
    }

    console.log('\n🚀 Executing standardization...')
    
    let updatedCount = 0
    for (const update of servicesToUpdate) {
      try {
        await prisma.service.update({
          where: { id: update.service.id },
          data: {
            name: update.newName,
            category: update.newCategory,
            updatedAt: new Date()
          }
        })
        
        console.log(`   ✅ Updated ${update.service.id}:`)
        if (update.oldCategory !== update.newCategory) {
          console.log(`      Category: ${update.oldCategory} → ${update.newCategory}`)
        }
        if (update.oldName !== update.newName) {
          console.log(`      Name: ${update.oldName} → ${update.newName}`)
        }
        
        updatedCount++
      } catch (error) {
        console.error(`   ❌ Failed to update ${update.service.id}:`, error)
      }
    }

    // Step 5: Verify results
    console.log('\n🔍 Verifying standardization results...')
    const finalServices = await prisma.service.findMany({
      include: {
        _count: {
          select: {
            providers: true,
            bookings: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    const finalCategories = new Map<string, number>()
    for (const service of finalServices) {
      const count = finalCategories.get(service.category) || 0
      finalCategories.set(service.category, count + 1)
    }

    console.log('\n📋 Final Categories:')
    for (const [category, count] of finalCategories) {
      console.log(`   ${category}: ${count} services`)
    }

    console.log(`\n✅ Standardization Complete!`)
    console.log(`   Services updated: ${updatedCount}`)
    console.log(`   Final service count: ${finalServices.length}`)

  } catch (error) {
    console.error('\n❌ Error during standardization:', error)
    throw error
  }
}

// Safety check - require confirmation for production
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--dry-run')) {
  console.log('⚠️  WARNING: Running in production mode!')
  console.log('   Please ensure you have a backup before proceeding.')
  console.log('   Add --dry-run flag to see what would change without making changes.')
  
  if (!process.argv.includes('--force')) {
    console.log('\n❌ Standardization aborted. Use --force to proceed in production.')
    process.exit(1)
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
