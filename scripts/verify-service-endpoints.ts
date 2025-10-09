import { PrismaClient } from '@prisma/client'
import { SERVICES } from '../config/services'
import chalk from 'chalk'

const prisma = new PrismaClient()

async function verifyServiceEndpoints() {
  console.log(chalk.blue('\n🔍 Starting Service Endpoint Verification...\n'))

  try {
    // 1. Verify Database Services
    console.log(chalk.yellow('📊 Checking Database Services...'))
    const dbServices = await prisma.service.findMany({
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
        bookings: {
          include: {
            client: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    console.log(chalk.green(`✓ Found ${dbServices.length} services in database`))

    // 2. Verify Service Categories
    const categories = dbServices.map(s => s.category)
    const uniqueCategories = [...new Set(categories)]
    console.log(chalk.yellow('\n📑 Checking Service Categories...'))
    console.log(chalk.green(`✓ Found categories: ${uniqueCategories.join(', ')}`))

    // 3. Verify Config Sync
    console.log(chalk.yellow('\n🔄 Verifying Config Sync...'))
    const configServices = SERVICES
    const configServiceNames = new Set(configServices.map(s => s.name))
    const dbServiceNames = new Set(dbServices.map(s => s.name))

    // Find mismatches
    const onlyInConfig = [...configServiceNames].filter(x => !dbServiceNames.has(x))
    const onlyInDb = [...dbServiceNames].filter(x => !configServiceNames.has(x))

    if (onlyInConfig.length > 0) {
      console.log(chalk.red(`✗ Services in config but not in DB: ${onlyInConfig.join(', ')}`))
    }
    if (onlyInDb.length > 0) {
      console.log(chalk.red(`✗ Services in DB but not in config: ${onlyInDb.join(', ')}`))
    }
    if (onlyInConfig.length === 0 && onlyInDb.length === 0) {
      console.log(chalk.green('✓ Config and DB services are in sync'))
    }

    // 4. Verify Service Data
    console.log(chalk.yellow('\n📝 Verifying Service Data...'))
    for (const dbService of dbServices) {
      const configService = configServices.find(s => s.name === dbService.name)
      if (configService) {
        console.log(chalk.cyan(`\nChecking service: ${dbService.name}`))
        
        // Check required fields
        const checks = [
          { field: 'category', dbValue: dbService.category, configValue: configService.category },
          { field: 'basePrice', dbValue: dbService.basePrice, configValue: configService.basePrice },
          { field: 'description', dbValue: dbService.description, configValue: configService.description }
        ]

        checks.forEach(({ field, dbValue, configValue }) => {
          if (String(dbValue) !== String(configValue)) {
            console.log(chalk.red(`✗ Mismatch in ${field}:`))
            console.log(chalk.red(`  DB: ${dbValue}`))
            console.log(chalk.red(`  Config: ${configValue}`))
          } else {
            console.log(chalk.green(`✓ ${field} matches`))
          }
        })

        // Check relationships
        console.log(chalk.cyan('\nChecking relationships:'))
        console.log(chalk.green(`✓ ${dbService.providers.length} providers`))
        console.log(chalk.green(`✓ ${dbService.bookings.length} bookings`))
      }
    }

    // 5. Verify API Response Format
    console.log(chalk.yellow('\n🌐 Testing API Response Format...'))
    const response = await fetch('http://localhost:3000/api/services')
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    const apiServices = await response.json()
    
    console.log(chalk.green(`✓ API returned ${apiServices.length} services`))
    
    // Verify API response structure
    const firstService = apiServices[0]
    const requiredFields = ['id', 'name', 'description', 'category', 'basePrice']
    const missingFields = requiredFields.filter(field => !(field in firstService))
    
    if (missingFields.length > 0) {
      console.log(chalk.red(`✗ Missing required fields in API response: ${missingFields.join(', ')}`))
    } else {
      console.log(chalk.green('✓ API response contains all required fields'))
    }

    // 6. Summary
    console.log(chalk.blue('\n📊 Verification Summary:'))
    console.log(chalk.green(`✓ ${dbServices.length} total services`))
    console.log(chalk.green(`✓ ${uniqueCategories.length} service categories`))
    console.log(chalk.green(`✓ Database and config ${onlyInConfig.length + onlyInDb.length === 0 ? 'are' : 'are not'} in sync`))
    console.log(chalk.green('✓ API endpoint is responding correctly'))

  } catch (error) {
    console.error(chalk.red('\n❌ Verification failed:'))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyServiceEndpoints()
  .then(() => {
    console.log(chalk.blue('\n✨ Verification complete!\n'))
    process.exit(0)
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Script failed:'))
    console.error(error)
    process.exit(1)
  })
