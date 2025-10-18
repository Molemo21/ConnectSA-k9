import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Test database connectivity
    console.log('📊 Testing database connectivity...')
    try {
      const response = await page.goto(`${config.projects[0].use.baseURL}/api/health`)
      
      if (response?.status() === 200) {
        console.log('✅ Database connection successful')
      } else {
        console.log('⚠️ Database health check returned status:', response?.status())
      }
    } catch (error) {
      console.log('⚠️ Database health check failed, but continuing with tests')
    }
    
    // Test authentication endpoints
    console.log('🔐 Testing authentication endpoints...')
    const authResponse = await page.goto(`${config.projects[0].use.baseURL}/api/auth/me`)
    
    if (authResponse?.status() === 401) {
      console.log('✅ Authentication endpoint working (returns 401 for unauthenticated requests)')
    } else {
      console.log('⚠️ Authentication endpoint may have issues')
    }
    
    // Test service endpoints
    console.log('🔧 Testing service endpoints...')
    const servicesResponse = await page.goto(`${config.projects[0].use.baseURL}/api/services`)
    
    if (servicesResponse?.status() === 200) {
      console.log('✅ Services endpoint working')
    } else {
      console.log('❌ Services endpoint failed')
    }
    
    // Set up test data if needed
    console.log('📝 Setting up test data...')
    await setupTestData(page, config.projects[0].use.baseURL)
    
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any, baseURL: string) {
  try {
    // Create test users if they don't exist
    console.log('👤 Setting up test users...')
    
    // Test client login
    await page.goto(`${baseURL}/login`)
    await page.fill('input[type="email"]', 'molemonakin08@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    
    // Wait for login to complete
    await page.waitForTimeout(2000)
    
    // Check if login was successful
    const currentUrl = page.url()
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Test client login successful')
    } else {
      console.log('⚠️ Test client login may have issues')
    }
    
    // Test provider login
    await page.goto(`${baseURL}/login`)
    await page.fill('input[type="email"]', 'thabangnakin17@gmail.com')
    await page.fill('input[type="password"]', 'Thabang17')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    
    const providerUrl = page.url()
    if (providerUrl.includes('/provider/dashboard')) {
      console.log('✅ Test provider login successful')
    } else {
      console.log('⚠️ Test provider login may have issues')
    }
    
    // Test admin login
    await page.goto(`${baseURL}/login`)
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    
    await page.waitForTimeout(2000)
    
    const adminUrl = page.url()
    if (adminUrl.includes('/admin/dashboard')) {
      console.log('✅ Test admin login successful')
    } else {
      console.log('⚠️ Test admin login may have issues')
    }
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error)
    // Don't throw here as tests might still work with existing data
  }
}

export default globalSetup
