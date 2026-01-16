/**
 * ENVIRONMENT FINGERPRINT VALIDATION TESTS
 * 
 * These tests PROVE that environment fingerprinting prevents misconfiguration.
 * They test actual validation logic, not assumptions.
 */

import { 
  validateEnvironmentFingerprint,
  initializeEnvironmentFingerprint,
  getExpectedEnvironment,
  type Environment 
} from '../../lib/env-fingerprint';

// Mock Prisma Client for testing
jest.mock('@prisma/client', () => {
  const mockQueryRaw = jest.fn();
  const mockExecuteRaw = jest.fn();
  const mockDisconnect = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $queryRaw: mockQueryRaw,
      $executeRaw: mockExecuteRaw,
      $disconnect: mockDisconnect,
    })),
  };
});

describe('Environment Fingerprint Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getExpectedEnvironment', () => {
    it('should return "prod" when PROD_DATABASE_URL matches DATABASE_URL', () => {
      process.env.PROD_DATABASE_URL = 'postgresql://prod';
      process.env.DATABASE_URL = 'postgresql://prod';
      
      expect(getExpectedEnvironment()).toBe('prod');
    });

    it('should return "dev" when DEV_DATABASE_URL matches DATABASE_URL', () => {
      process.env.DEV_DATABASE_URL = 'postgresql://dev';
      process.env.DATABASE_URL = 'postgresql://dev';
      
      expect(getExpectedEnvironment()).toBe('dev');
    });

    it('should return "prod" when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.PROD_DATABASE_URL;
      delete process.env.DEV_DATABASE_URL;
      
      expect(getExpectedEnvironment()).toBe('prod');
    });

    it('should return "dev" when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.PROD_DATABASE_URL;
      delete process.env.DEV_DATABASE_URL;
      
      expect(getExpectedEnvironment()).toBe('dev');
    });

    it('should return "staging" when NODE_ENV is staging', () => {
      process.env.NODE_ENV = 'staging';
      
      expect(getExpectedEnvironment()).toBe('staging');
    });
  });

  describe('validateEnvironmentFingerprint', () => {
    let mockQueryRaw: jest.Mock;
    let mockDisconnect: jest.Mock;

    beforeEach(() => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockQueryRaw = mockPrisma.$queryRaw;
      mockDisconnect = mockPrisma.$disconnect;
    });

    it('should FAIL when database_metadata table does not exist', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ exists: false }]);

      const result = await validateEnvironmentFingerprint('postgresql://test', 'prod');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('database_metadata table does not exist');
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should FAIL when fingerprint record is missing', async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ exists: true }]) // Table exists
        .mockResolvedValueOnce([]); // No fingerprint record

      const result = await validateEnvironmentFingerprint('postgresql://test', 'prod');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no fingerprint record');
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should FAIL when environment mismatch', async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ exists: true }]) // Table exists
        .mockResolvedValueOnce([{
          id: 'singleton',
          environment: 'dev',
          fingerprint: 'test-fingerprint'
        }]);

      const result = await validateEnvironmentFingerprint('postgresql://test', 'prod');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('MISCONFIGURATION');
      expect(result.environment).toBe('dev');
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should FAIL when fingerprint is corrupted', async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ exists: true }]) // Table exists
        .mockResolvedValueOnce([{
          id: 'singleton',
          environment: 'prod',
          fingerprint: '' // Empty fingerprint
        }]);

      const result = await validateEnvironmentFingerprint('postgresql://test', 'prod');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('corrupted');
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should PASS when fingerprint is valid', async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ exists: true }]) // Table exists
        .mockResolvedValueOnce([{
          id: 'singleton',
          environment: 'prod',
          fingerprint: 'prod-1234567890-abc123'
        }]);

      const result = await validateEnvironmentFingerprint('postgresql://test', 'prod');

      expect(result.isValid).toBe(true);
      expect(result.environment).toBe('prod');
      expect(result.error).toBeNull();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
