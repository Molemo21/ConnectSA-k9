-- CreateTable
CREATE TABLE "booking_drafts" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_drafts_userId_idx" ON "booking_drafts"("userId");

-- CreateIndex
CREATE INDEX "booking_drafts_expiresAt_idx" ON "booking_drafts"("expiresAt");
