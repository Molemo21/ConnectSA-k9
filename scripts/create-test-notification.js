/**
 * Quick script to create a test notification for UI testing
 * Usage: node scripts/create-test-notification.js [userId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestNotification() {
  try {
    // Get first available user (or use provided userId)
    const userId = process.argv[2];
    
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else {
      // Find first user
      user = await prisma.user.findFirst();
    }

    if (!user) {
      console.error('❌ No user found. Please create a user first or provide a userId as argument.');
      console.log('Usage: node scripts/create-test-notification.js [userId]');
      process.exit(1);
    }

    console.log(`\n🔔 Creating test notification for user: ${user.name || user.email} (${user.role})...\n`);

    // Create multiple test notifications with different types
    const testNotifications = [
      {
        userId: user.id,
        type: 'BOOKING_CREATED',
        title: 'New Booking Request',
        message: 'You have a new booking request for Plumbing Service from John Smith. Please review and respond.',
        isRead: false
      },
      {
        userId: user.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'Payment received for Cleaning Service - Booking #test123. You can now start the job!',
        isRead: false
      },
      {
        userId: user.id,
        type: 'JOB_COMPLETED',
        title: 'Job Completed',
        message: 'Your Electrical Work service has been completed! Please review the work and confirm completion to release payment.',
        isRead: true
      },
      {
        userId: user.id,
        type: 'REVIEW_SUBMITTED',
        title: 'Review Submitted',
        message: 'A 5-star review has been submitted for your service on booking #test456.',
        isRead: false
      }
    ];

    const createdNotifications = [];
    for (const notifData of testNotifications) {
      const notification = await prisma.notification.create({
        data: notifData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      createdNotifications.push(notification);
      console.log(`✅ Created: ${notification.type} - "${notification.title}"`);
    }

    console.log(`\n✨ Successfully created ${createdNotifications.length} test notifications!`);
    console.log(`\n📱 Next steps:`);
    console.log(`   1. Start your dev server: npm run dev`);
    console.log(`   2. Login as: ${user.email}`);
    console.log(`   3. Click the notification bell in the header`);
    console.log(`   4. You should see ${createdNotifications.length} notifications\n`);

  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotification();




