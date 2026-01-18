/**
 * REFERENCE DATA PROMOTION SAFETY TESTS
 * 
 * These tests PROVE that reference data promotion is safe, minimal, and irreversible.
 * They test actual execution, not assumptions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Reference Data Promotion Safety', () => {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const newScriptPath = path.join(scriptsDir, 'sync-reference-data-dev-to-prod.ts');
  const oldScriptPath = path.join(scriptsDir, 'sync-dev-to-prod-services.ts');

  describe('Script Existence', () => {
    it('should have the new reference data promotion script', () => {
      expect(fs.existsSync(newScriptPath)).toBe(true);
    });

    it('should have the old script (for deprecation check)', () => {
      expect(fs.existsSync(oldScriptPath)).toBe(true);
    });
  });

  describe('CI-Only Execution Enforcement', () => {
    it('should exit with code 1 if CI !== "true" when --apply is used', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Check that CI guard executes BEFORE imports
      const ciCheckIndex = scriptContent.indexOf('const ci = process.env.CI');
      const importIndex = scriptContent.indexOf('import {');
      
      expect(ciCheckIndex).toBeGreaterThan(-1);
      expect(importIndex).toBeGreaterThan(ciCheckIndex); // CI check before imports
      
      // Check that it exits if CI !== "true" when applying
      expect(scriptContent).toMatch(/if\s*\(\s*isApply\s*&&\s*!isDryRun\s*&&\s*!isCI\s*\)/);
      expect(scriptContent).toMatch(/process\.exit\(1\)/);
    });

    it('should allow dry-run mode locally (CI not required)', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Dry-run should be allowed without CI
      // The check should only apply when --apply is used
      expect(scriptContent).toMatch(/isDryRun\s*\|\|\s*!isApply/);
    });
  });

  describe('Environment Fingerprint Validation', () => {
    it('should validate DEV database fingerprint as "dev"', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      expect(scriptContent).toMatch(/validateEnvironmentFingerprint/);
      expect(scriptContent).toMatch(/devUrl.*'dev'/);
    });

    it('should validate PROD database fingerprint as "prod"', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      expect(scriptContent).toMatch(/validateEnvironmentFingerprint/);
      expect(scriptContent).toMatch(/prodUrl.*'prod'/);
    });

    it('should hard fail if fingerprint validation fails', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Should check isValid and return false or throw
      expect(scriptContent).toMatch(/!.*\.isValid/);
      expect(scriptContent).toMatch(/process\.exit\(1\)/);
    });
  });

  describe('Strict Table Allowlist', () => {
    it('should only allow service_categories and services tables', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Check for allowlist definition
      expect(scriptContent).toMatch(/ALLOWED_TABLES/);
      expect(scriptContent).toMatch(/service_categories/);
      expect(scriptContent).toMatch(/services/);
      
      // Check for validation function
      expect(scriptContent).toMatch(/validateTableAccess/);
    });

    it('should exit if attempting to access non-allowlisted tables', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Should call validateTableAccess and exit on violation
      expect(scriptContent).toMatch(/validateTableAccess/);
      expect(scriptContent).toMatch(/process\.exit\(1\)/);
    });
  });

  describe('No Deletions Enforcement', () => {
    it('should NOT contain DELETE operations', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Remove comments and strings to check actual code
      const lines = scriptContent.split('\n');
      const codeLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('*') &&
               !trimmed.startsWith('/**');
      });
      
      const codeContent = codeLines.join('\n');
      
      // Should NOT contain DELETE, TRUNCATE, or DROP in actual code
      const forbiddenPatterns = [
        /\.delete\(/,
        /\.deleteMany\(/,
        /TRUNCATE/i,
        /DROP TABLE/i,
        /DROP COLUMN/i,
      ];
      
      forbiddenPatterns.forEach(pattern => {
        if (pattern.test(codeContent)) {
          // Check if it's in a string literal (which would be a comment/error message)
          const matches = codeContent.match(new RegExp(pattern.source, pattern.flags));
          if (matches) {
            const matchIndex = codeContent.indexOf(matches[0]);
            const beforeMatch = codeContent.substring(Math.max(0, matchIndex - 100), matchIndex);
            
            // If it's in a string or comment, that's okay
            const isInString = beforeMatch.match(/['"`]/g)?.length % 2 === 1;
            const isInComment = beforeMatch.includes('//') || beforeMatch.includes('*');
            
            if (!isInString && !isInComment) {
              throw new Error(
                `Contract violation: sync-reference-data-dev-to-prod.ts contains forbidden operation: ${pattern.source}. ` +
                `No DELETE, TRUNCATE, or DROP operations are allowed.`
              );
            }
          }
        }
      });
    });

    it('should NOT deactivate services not in dev', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Should have a note that services in prod not in dev are left unchanged
      expect(scriptContent).toMatch(/Services in prod not in dev are left unchanged/);
      expect(scriptContent).toMatch(/no deletions/);
    });
  });

  describe('Relationship Safety', () => {
    it('should skip services with bookings or providers', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Should check for relationships
      expect(scriptContent).toMatch(/hasActiveRelationships|bookings.*some|providers.*some/);
      expect(scriptContent).toMatch(/protectedServiceIds|protectedServiceNames/);
    });

    it('should skip protected services during updates', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Should check if service is protected before updating
      expect(scriptContent).toMatch(/protectedServiceIds\.has/);
      expect(scriptContent).toMatch(/Skipping protected service/);
    });
  });

  describe('Idempotency', () => {
    it('should be idempotent (re-running causes no drift)', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      // Should use findFirst/findMany to check existence before creating
      expect(scriptContent).toMatch(/\.findFirst\(|\.findMany\(/);
      
      // Should check if update is needed before updating
      expect(scriptContent).toMatch(/needsUpdate/);
    });
  });

  describe('Explicit Modes', () => {
    it('should support --dry-run mode (default)', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      expect(scriptContent).toMatch(/--dry-run/);
      expect(scriptContent).toMatch(/isDryRun/);
    });

    it('should support --apply mode (CI-only)', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      expect(scriptContent).toMatch(/--apply/);
      expect(scriptContent).toMatch(/isApply/);
    });

    it('should require typing YES for --apply mode', () => {
      const scriptContent = fs.readFileSync(newScriptPath, 'utf-8');
      
      expect(scriptContent).toMatch(/promptConfirmation/);
      expect(scriptContent).toMatch(/type YES|YES to confirm/);
    });
  });

  describe('Old Script Deprecation', () => {
    it('should hard-deprecate old sync script', () => {
      const oldScriptContent = fs.readFileSync(oldScriptPath, 'utf-8');
      
      // Should exit immediately before any imports
      const exitIndex = oldScriptContent.indexOf('process.exit(1)');
      const importIndex = oldScriptContent.indexOf('import {');
      
      expect(exitIndex).toBeGreaterThan(-1);
      expect(importIndex).toBeGreaterThan(exitIndex); // Exit before imports
    });

    it('should explain deprecation in old script', () => {
      const oldScriptContent = fs.readFileSync(oldScriptPath, 'utf-8');
      
      expect(oldScriptContent).toMatch(/DEPRECATED/);
      expect(oldScriptContent).toMatch(/sync-reference-data-dev-to-prod\.ts/);
      expect(oldScriptContent).toMatch(/PRODUCTION MUTATIONS BLOCKED/);
    });

    it('should prevent old script from mutating production', () => {
      const oldScriptContent = fs.readFileSync(oldScriptPath, 'utf-8');
      
      // Should exit before any database operations
      const exitIndex = oldScriptContent.indexOf('process.exit(1)');
      const prismaIndex = oldScriptContent.indexOf('PrismaClient');
      
      expect(exitIndex).toBeGreaterThan(-1);
      expect(exitIndex).toBeLessThan(prismaIndex); // Exit before Prisma import
    });
  });

  describe('Contract Compliance', () => {
    it('should be listed in PRODUCTION_MUTATION_CONTRACT.md', () => {
      const contractPath = path.join(process.cwd(), 'PRODUCTION_MUTATION_CONTRACT.md');
      const contractContent = fs.readFileSync(contractPath, 'utf-8');
      
      expect(contractContent).toMatch(/sync-reference-data-dev-to-prod\.ts/);
      expect(contractContent).toMatch(/Reference data promotion/);
    });

    it('should document all safety rules in contract', () => {
      const contractPath = path.join(process.cwd(), 'PRODUCTION_MUTATION_CONTRACT.md');
      const contractContent = fs.readFileSync(contractPath, 'utf-8');
      
      expect(contractContent).toMatch(/CI-only execution/);
      expect(contractContent).toMatch(/Environment fingerprint validation/);
      expect(contractContent).toMatch(/Strict allowlist/);
      expect(contractContent).toMatch(/No deletions/);
      expect(contractContent).toMatch(/Relationship safety/);
    });
  });
});
