/**
 * Check currency usage in database
 * Run with: node scripts/check-currency-database.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCurrency() {
  try {
    console.log('Ì¥ç Checking currency usage in database...\n')

    // Check Payment currency
    const paymentCurrencies = await prisma.payment.groupBy({
      by: ['currency'],
      _count: { id: true }
    })

    console.log('Ì≤≥ Payment Currency Distribution:')
    console.log('=================================')
    paymentCurrencies.forEach(group => {
      console.log(`${group.currency}: ${group._count.id} payments`)
    })

    // Check if any payments have USD
    const usdPayments = await prisma.payment.count({
      where: { currency: 'USD' }
    })

    const zarPayments = await prisma.payment.count({
      where: { currency: 'ZAR' }
    })

    console.log(`\nÌ≥ä Currency Breakdown:`)
    console.log(`   ZAR: ${zarPayments} payments ‚úÖ`)
    console.log(`   USD: ${usdPayments} payments ${usdPayments > 0 ? '‚ö†Ô∏è' : '‚úÖ'}`)

    // Check Transfer currency
    const transferCurrencies = await prisma.transfer.groupBy({
      by: ['currency'],
      _count: { id: true }
    })

    console.log(`\nÌ≤∏ Transfer Currency Distribution:`)
    console.log('==================================')
    transferCurrencies.forEach(group => {
      console.log(`${group.currency}: ${group._count.id} transfers`)
    })

    // Sample some payments
    const samplePayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true
      }
    })

    console.log(`\nÌ≥ã Sample Recent Payments:`)
    console.log('==========================')
    samplePayments.forEach((payment, i) => {
      console.log(`${i + 1}. Amount: ${payment.currency} ${payment.amount} | Status: ${payment.status}`)
    })

    console.log(`\n‚úÖ Database Analysis Complete!`)
    
    if (usdPayments > 0) {
      console.log(`\n‚ö†Ô∏è  WARNING: Found ${usdPayments} payments with USD currency`)
      console.log(`   These should be updated to ZAR for consistency`)
    } else {
      console.log(`\n‚úÖ All payments use ZAR currency!`)
    }

  } catch (error) {
    console.error('‚ùå Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrency()
