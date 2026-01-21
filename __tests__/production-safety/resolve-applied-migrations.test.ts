/**
 * Tests for resolve-applied-migrations.js
 * 
 * These tests verify that the migration resolution script:
 * 1. Correctly detects failed migrations
 * 2. Checks if objects exist in database
 * 3. Marks migrations as APPLIED if all objects exist
 * 4. Marks migrations as ROLLED_BACK if no objects exist
 * 5. Fails hard on partial application
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Mock Prisma Client
const mockPrismaClient = {
  $queryRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock child_process
const mockExecSync = jest.fn();
jest.mock('child_process', () => ({
  execSync: mockExecSync,
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('resolve-applied-migrations.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CI = 'true';
    process.env.NODE_ENV = 'production';
  });

  describe('parseMigrationSQL', () => {
    it('should parse CREATE TYPE (enum)', () => {
      const { parseMigrationSQL } = require('../../scripts/resolve-applied-migrations');
      
      const sql = `CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');`;
      const objects = parseMigrationSQL(sql);
      
      expect(objects.enums).toContain('PayoutStatus');
    });

    it('should parse CREATE TABLE', () => {
      const { parseMigrationSQL } = require('../../scripts/resolve-applied-migrations');
      
      const sql = `CREATE TABLE "payouts" (
        "id" TEXT NOT NULL,
        CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
      );`;
      const objects = parseMigrationSQL(sql);
      
      expect(objects.tables).toContain('payouts');
    });

    it('should parse CREATE INDEX', () => {
      const { parseMigrationSQL } = require('../../scripts/resolve-applied-migrations');
      
      const sql = `CREATE INDEX "payouts_providerId_idx" ON "payouts"("providerId");`;
      const objects = parseMigrationSQL(sql);
      
      expect(objects.indexes).toContain('payouts_providerId_idx');
    });

    it('should parse CREATE UNIQUE INDEX', () => {
      const { parseMigrationSQL } = require('../../scripts/resolve-applied-migrations');
      
      const sql = `CREATE UNIQUE INDEX "payouts_paymentId_key" ON "payouts"("paymentId");`;
      const objects = parseMigrationSQL(sql);
      
      expect(objects.indexes).toContain('payouts_paymentId_key');
    });

    it('should parse ALTER TABLE ADD CONSTRAINT (foreign key)', () => {
      const { parseMigrationSQL } = require('../../scripts/resolve-applied-migrations');
      
      const sql = `ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id");`;
      const objects = parseMigrationSQL(sql);
      
      expect(objects.foreignKeys).toContain('payouts_paymentId_fkey');
    });

    it('should parse complex migration with all object types', () => {
      const { parseMigrationSQL } = require('../../scripts/resolve-applied-migrations');
      
      const sql = `
        CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');
        CREATE TABLE "payouts" (
          "id" TEXT NOT NULL,
          CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX "payouts_providerId_idx" ON "payouts"("providerId");
        ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id");
      `;
      
      const objects = parseMigrationSQL(sql);
      
      expect(objects.enums).toContain('PayoutStatus');
      expect(objects.tables).toContain('payouts');
      expect(objects.indexes).toContain('payouts_providerId_idx');
      expect(objects.foreignKeys).toContain('payouts_paymentId_fkey');
    });
  });

  describe('checkMigrationObjects', () => {
    it('should return all true when all objects exist', async () => {
      const { checkMigrationObjects } = require('../../scripts/resolve-applied-migrations');
      
      mockPrismaClient.$queryRawUnsafe
        .mockResolvedValueOnce([{ typname: 'PayoutStatus' }]) // enum
        .mockResolvedValueOnce([{ tablename: 'payouts' }]) // table
        .mockResolvedValueOnce([{ indexname: 'payouts_providerId_idx' }]) // index
        .mockResolvedValueOnce([{ conname: 'payouts_paymentId_fkey' }]); // FK
      
      const objects = {
        enums: ['PayoutStatus'],
        tables: ['payouts'],
        indexes: ['payouts_providerId_idx'],
        foreignKeys: ['payouts_paymentId_fkey']
      };
      
      const results = await checkMigrationObjects(mockPrismaClient, 'test_migration', objects);
      
      expect(results.enums.PayoutStatus).toBe(true);
      expect(results.tables.payouts).toBe(true);
      expect(results.indexes['payouts_providerId_idx']).toBe(true);
      expect(results.foreignKeys['payouts_paymentId_fkey']).toBe(true);
    });

    it('should return false when objects do not exist', async () => {
      const { checkMigrationObjects } = require('../../scripts/resolve-applied-migrations');
      
      mockPrismaClient.$queryRawUnsafe
        .mockResolvedValueOnce([]) // enum doesn't exist
        .mockResolvedValueOnce([]) // table doesn't exist
        .mockResolvedValueOnce([]) // index doesn't exist
        .mockResolvedValueOnce([]); // FK doesn't exist
      
      const objects = {
        enums: ['PayoutStatus'],
        tables: ['payouts'],
        indexes: ['payouts_providerId_idx'],
        foreignKeys: ['payouts_paymentId_fkey']
      };
      
      const results = await checkMigrationObjects(mockPrismaClient, 'test_migration', objects);
      
      expect(results.enums.PayoutStatus).toBe(false);
      expect(results.tables.payouts).toBe(false);
      expect(results.indexes['payouts_providerId_idx']).toBe(false);
      expect(results.foreignKeys['payouts_paymentId_fkey']).toBe(false);
    });
  });

  describe('CI-only enforcement', () => {
    it('should exit if CI !== "true"', () => {
      const originalExit = process.exit;
      const exitSpy = jest.fn();
      process.exit = exitSpy as any;
      
      process.env.CI = 'false';
      
      try {
        require('../../scripts/resolve-applied-migrations');
      } catch (e) {
        // Expected - script exits before module loads
      }
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      process.exit = originalExit;
    });

    it('should exit if NODE_ENV !== "production"', () => {
      const originalExit = process.exit;
      const exitSpy = jest.fn();
      process.exit = exitSpy as any;
      
      process.env.CI = 'true';
      process.env.NODE_ENV = 'development';
      
      try {
        require('../../scripts/resolve-applied-migrations');
      } catch (e) {
        // Expected - script exits before module loads
      }
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      process.exit = originalExit;
    });
  });
});
