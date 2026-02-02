import { prisma } from "../lib/prisma"

async function cleanupUnverifiedUsers() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
  const users = await prisma.user.findMany({
    where: {
      emailVerified: false,
      createdAt: { lte: cutoff },
    },
    select: { id: true },
  })
  const userIds = users.map(u => u.id)
  if (userIds.length === 0) {
    console.log("No unverified users to delete.")
    return
  }
  // Delete related provider profiles
  await prisma.provider.deleteMany({ where: { userId: { in: userIds } } })
  // Delete verification tokens
  await prisma.verificationToken.deleteMany({ where: { userId: { in: userIds } } })
  // Delete users
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  console.log(`Deleted ${userIds.length} unverified users (and related data) older than 48 hours.`)
}

cleanupUnverifiedUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) }) 