// Re-export the database connection from prisma-robust.ts
// Note: prisma might be null in browser/Edge runtime environments
export { prisma } from './prisma-robust';
