const { PrismaClient } = require('@prisma/client')

async function changeUserRole() {
  const prisma = new PrismaClient()
  
  try {
    // Change molemo@proliinkconnect.co.za from CLIENT to PROVIDER
    const user = await prisma.user.update({
      where: { email: 'molemo@proliinkconnect.co.za' },
      data: { role: 'PROVIDER' }
    })
    
    console.log('✅ User role updated successfully!')
    console.log('👤 User:', {
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified
    })
    
  } catch (error) {
    console.error('❌ Error updating user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

changeUserRole()


