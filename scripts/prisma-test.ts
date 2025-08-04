import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find a provider, booking, and user (adjust IDs as needed)
  const provider = await prisma.provider.findFirst();
  const booking = await prisma.booking.findFirst();
  const user = await prisma.user.findFirst();

  if (!provider || !booking || !user) {
    console.error('Missing provider, booking, or user in the database. Please ensure at least one of each exists.');
    return;
  }

  // 2. Update provider availability
  const updatedProvider = await prisma.provider.update({
    where: { id: provider.id },
    data: { available: false },
  });

  // 3. Create a proposal
  const proposal = await prisma.proposal.create({
    data: {
      bookingId: booking.id,
      providerId: provider.id,
      status: 'PENDING',
      message: 'Test proposal from script',
    },
  });

  // 4. Create a message
  const message = await prisma.message.create({
    data: {
      bookingId: booking.id,
      senderId: user.id,
      content: 'Hello from test script!',
    },
  });

  // 5. Create a notification
  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'TEST',
      content: 'This is a test notification',
    },
  });

  // 6. Read back the data
  console.log('Proposal:', proposal);
  console.log('Message:', message);
  console.log('Notification:', notification);
  console.log('Updated Provider:', updatedProvider);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 