-- CreateTable
CREATE TABLE "mutation_audit_log" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "capability" TEXT NOT NULL,
    "capability_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "environment" TEXT NOT NULL,
    "environment_fingerprint" TEXT NOT NULL,
    "executor_type" TEXT NOT NULL,
    "executor_id" TEXT NOT NULL,
    "executor_reference" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutation_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mutation_audit_log_capability_idx" ON "mutation_audit_log"("capability");

-- CreateIndex
CREATE INDEX "mutation_audit_log_status_idx" ON "mutation_audit_log"("status");

-- CreateIndex
CREATE INDEX "mutation_audit_log_started_at_idx" ON "mutation_audit_log"("started_at" DESC);

-- CreateIndex
CREATE INDEX "mutation_audit_log_environment_idx" ON "mutation_audit_log"("environment");

-- CreateIndex
CREATE INDEX "mutation_audit_log_environment_fingerprint_idx" ON "mutation_audit_log"("environment_fingerprint");

-- CreateIndex
CREATE INDEX "mutation_audit_log_executor_id_idx" ON "mutation_audit_log"("executor_id");
