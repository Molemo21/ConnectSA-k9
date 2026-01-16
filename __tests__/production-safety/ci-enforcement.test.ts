/**
 * CI-ONLY EXECUTION ENFORCEMENT TESTS
 * 
 * These tests PROVE that production mutation scripts cannot run outside CI.
 * They test the actual enforcement mechanisms, not assumptions.
 */

import { 
  enforceCIOnlyExecution, 
  blockProductionDatabaseLocally,
  validateMutationScript,
  type MutationScript 
} from '../../lib/ci-enforcement';

describe('CI-Only Execution Enforcement', () => {
  const originalEnv = process.env;
  const originalExit = process.exit;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    // Mock process.exit to prevent test suite from exiting
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exit = originalExit;
  });

  describe('enforceCIOnlyExecution', () => {
    it('should FAIL when CI is not set', () => {
      delete process.env.CI;
      process.env.NODE_ENV = 'production';

      expect(() => {
        enforceCIOnlyExecution('deploy-db');
      }).toThrow();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should FAIL when CI is false', () => {
      process.env.CI = 'false';
      process.env.NODE_ENV = 'production';

      expect(() => {
        enforceCIOnlyExecution('deploy-db');
      }).toThrow();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should FAIL when CI is empty string', () => {
      process.env.CI = '';
      process.env.NODE_ENV = 'production';

      expect(() => {
        enforceCIOnlyExecution('deploy-db');
      }).toThrow();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should PASS when CI is "true"', () => {
      process.env.CI = 'true';
      process.env.NODE_ENV = 'production';

      // Should not throw
      expect(() => {
        enforceCIOnlyExecution('deploy-db');
      }).not.toThrow();
    });

    it('should PASS when CI is "1"', () => {
      process.env.CI = '1';
      process.env.NODE_ENV = 'production';

      expect(() => {
        enforceCIOnlyExecution('deploy-db');
      }).not.toThrow();
    });

    it('should FAIL when NODE_ENV is not production', () => {
      process.env.CI = 'true';
      process.env.NODE_ENV = 'development';

      expect(() => {
        enforceCIOnlyExecution('deploy-db');
      }).toThrow();

      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('blockProductionDatabaseLocally', () => {
    const prodDbUrl = 'postgresql://user:pass@pooler.supabase.com:5432/db';

    it('should BLOCK production database in non-CI, non-production context', () => {
      delete process.env.CI;
      process.env.NODE_ENV = 'development';

      expect(() => {
        blockProductionDatabaseLocally(prodDbUrl);
      }).toThrow('Production database access blocked in local context');
    });

    it('should ALLOW production database in CI context', () => {
      process.env.CI = 'true';
      process.env.NODE_ENV = 'production';

      expect(() => {
        blockProductionDatabaseLocally(prodDbUrl);
      }).not.toThrow();
    });

    it('should ALLOW non-production database locally', () => {
      delete process.env.CI;
      process.env.NODE_ENV = 'development';
      const devDbUrl = 'postgresql://user:pass@localhost:5432/devdb';

      expect(() => {
        blockProductionDatabaseLocally(devDbUrl);
      }).not.toThrow();
    });
  });

  describe('validateMutationScript', () => {
    it('should FAIL when CI is not set', () => {
      delete process.env.CI;
      process.env.NODE_ENV = 'production';

      expect(() => {
        validateMutationScript('deploy-db');
      }).toThrow();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should PASS when all conditions are met', () => {
      process.env.CI = 'true';
      process.env.NODE_ENV = 'production';

      expect(() => {
        validateMutationScript('deploy-db');
      }).not.toThrow();
    });

    it('should BLOCK production database URL in wrong context', () => {
      process.env.CI = 'true';
      process.env.NODE_ENV = 'development';
      const prodDbUrl = 'postgresql://user:pass@pooler.supabase.com:5432/db';

      expect(() => {
        validateMutationScript('deploy-db', prodDbUrl);
      }).toThrow();
    });
  });
});
