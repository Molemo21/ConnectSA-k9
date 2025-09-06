-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_SUSPENDED', 'USER_UNSUSPENDED', 'USER_DELETED', 'USER_ROLE_CHANGED', 'PROVIDER_APPROVED', 'PROVIDER_REJECTED', 'PROVIDER_SUSPENDED', 'PROVIDER_UNSUSPENDED', 'PAYMENT_RELEASED', 'PAYMENT_REFUNDED', 'BOOKING_CANCELLED', 'DISPUTE_RESOLVED', 'SYSTEM_MAINTENANCE');

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
