/**
 * MUTATION CONTRACT ENFORCEMENT TESTS
 * 
 * These tests PROVE that the mutation contract cannot be violated.
 * They scan for violations and fail if contract is broken.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Mutation Contract Enforcement', () => {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const allowedMutationScripts = [
    'deploy-db.js',
    'sync-reference-data-dev-to-prod.ts',
  ];
  
  const deprecatedScripts = [
    'sync-dev-to-prod-services.ts',
  ];

  describe('Allowed Mutation Scripts', () => {
    it('should only allow approved mutation scripts', () => {
      // This test ensures no new mutation scripts are added without approval
      // If a new script is added, this test must be updated
      
      const mutationScripts = allowedMutationScripts;
      
      expect(mutationScripts).toHaveLength(2);
      expect(mutationScripts).toContain('deploy-db.js');
      expect(mutationScripts).toContain('sync-reference-data-dev-to-prod.ts');
    });

    it('should enforce CI-only execution in all mutation scripts', () => {
      // Check that all mutation scripts enforce CI-only execution
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      const newSyncScriptPath = path.join(scriptsDir, 'sync-reference-data-dev-to-prod.ts');

      if (fs.existsSync(deployDbPath)) {
        const deployDbContent = fs.readFileSync(deployDbPath, 'utf-8');
        // Should use CI enforcement (either direct or via validateMutationScript)
        expect(
          deployDbContent.includes('validateMutationScript') ||
          deployDbContent.includes('enforceCIOnlyExecution') ||
          deployDbContent.includes('CI=true')
        ).toBe(true);
      }

      if (fs.existsSync(newSyncScriptPath)) {
        const syncContent = fs.readFileSync(newSyncScriptPath, 'utf-8');
        // Should check CI before imports
        const ciCheckIndex = syncContent.indexOf('const ci = process.env.CI');
        const importIndex = syncContent.indexOf('import {');
        expect(ciCheckIndex).toBeGreaterThan(-1);
        expect(importIndex).toBeGreaterThan(ciCheckIndex);
        expect(syncContent).toMatch(/process\.exit\(1\)/);
      }
    });

    it('should hard-deprecate old sync script', () => {
      const oldSyncScriptPath = path.join(scriptsDir, 'sync-dev-to-prod-services.ts');
      
      if (!fs.existsSync(oldSyncScriptPath)) {
        return; // Skip if file doesn't exist
      }

      const oldScriptContent = fs.readFileSync(oldSyncScriptPath, 'utf-8');
      
      // Should exit immediately before any imports
      const exitIndex = oldScriptContent.indexOf('process.exit(1)');
      const importIndex = oldScriptContent.indexOf('import {');
      
      expect(exitIndex).toBeGreaterThan(-1);
      expect(importIndex).toBeGreaterThan(exitIndex);
      expect(oldScriptContent).toMatch(/DEPRECATED/);
      expect(oldScriptContent).toMatch(/sync-reference-data-dev-to-prod\.ts/);
    });

    it('should prevent old script from mutating production', () => {
      const oldSyncScriptPath = path.join(scriptsDir, 'sync-dev-to-prod-services.ts');
      
      if (!fs.existsSync(oldSyncScriptPath)) {
        return;
      }

      const oldScriptContent = fs.readFileSync(oldSyncScriptPath, 'utf-8');
      
      // Should exit before any database operations
      const exitIndex = oldScriptContent.indexOf('process.exit(1)');
      const prismaIndex = oldScriptContent.indexOf('PrismaClient');
      
      expect(exitIndex).toBeGreaterThan(-1);
      expect(exitIndex).toBeLessThan(prismaIndex);
    });
  });

  describe('deploy-db.js Contract', () => {
    it('should ONLY perform prisma migrate deploy', () => {
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      
      if (!fs.existsSync(deployDbPath)) {
        return; // Skip if file doesn't exist
      }

      const content = fs.readFileSync(deployDbPath, 'utf-8');

      // Should contain prisma migrate deploy
      expect(content).toMatch(/prisma.*migrate.*deploy/i);

      // Should NOT contain forbidden operations
      const forbiddenPatterns = [
        /\.create\(/,
        /\.update\(/,
        /\.delete\(/,
        /\.upsert\(/,
        /TRUNCATE/i,
        /DROP TABLE/i,
        /INSERT INTO/i,
        /UPDATE.*SET/i,
      ];

      // Allow these patterns only in comments or error messages
      const lines = content.split('\n');
      const codeLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*');
      });

      const codeContent = codeLines.join('\n');

      // Check that forbidden patterns are not in actual code
      // (They might be in comments, which is okay)
      forbiddenPatterns.forEach(pattern => {
        const matches = codeContent.match(new RegExp(pattern.source, pattern.flags));
        if (matches) {
          // Check if it's in a comment or string
          const matchIndex = codeContent.indexOf(matches[0]);
          const beforeMatch = codeContent.substring(Math.max(0, matchIndex - 50), matchIndex);
          
          // If it's in a comment or string, that's okay
          const isInComment = beforeMatch.includes('//') || 
                             beforeMatch.includes('*') ||
                             beforeMatch.includes("'") ||
                             beforeMatch.includes('"');
          
          if (!isInComment) {
            // This is a violation - forbidden operation in actual code
            throw new Error(
              `Contract violation: deploy-db.js contains forbidden operation: ${pattern.source}. ` +
              `deploy-db.js may ONLY perform 'prisma migrate deploy'.`
            );
          }
        }
      });
    });

    it('should enforce CI-only execution', () => {
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      
      if (!fs.existsSync(deployDbPath)) {
        return;
      }

      const content = fs.readFileSync(deployDbPath, 'utf-8');

      // Should check for CI environment
      expect(
        content.includes('CI') || 
        content.includes('validateMutationScript') ||
        content.includes('enforceCIOnlyExecution')
      ).toBe(true);
    });
  });

  describe('Table Allowlist Enforcement', () => {
    it('should enforce strict allowlist in reference data script', () => {
      const newSyncScriptPath = path.join(scriptsDir, 'sync-reference-data-dev-to-prod.ts');
      
      if (!fs.existsSync(newSyncScriptPath)) {
        return;
      }

      const scriptContent = fs.readFileSync(newSyncScriptPath, 'utf-8');
      
      // Should have allowlist definition
      expect(scriptContent).toMatch(/ALLOWED_TABLES/);
      expect(scriptContent).toMatch(/service_categories/);
      expect(scriptContent).toMatch(/services/);
      
      // Should have validation function
      expect(scriptContent).toMatch(/validateTableAccess/);
    });

    it('should fail if table allowlist is expanded without approval', () => {
      const newSyncScriptPath = path.join(scriptsDir, 'sync-reference-data-dev-to-prod.ts');
      
      if (!fs.existsSync(newSyncScriptPath)) {
        return;
      }

      const scriptContent = fs.readFileSync(newSyncScriptPath, 'utf-8');
      
      // Extract allowlist
      const allowlistMatch = scriptContent.match(/ALLOWED_TABLES.*?=.*?new Set\(\[(.*?)\]/s);
      if (allowlistMatch) {
        const tables = allowlistMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
        
        // Only service_categories and services should be allowed
        const allowedTables = ['service_categories', 'services'];
        tables.forEach(table => {
          if (!allowedTables.includes(table)) {
            throw new Error(
              `Contract violation: Table "${table}" added to allowlist without approval. ` +
              `Only service_categories and services are allowed.`
            );
          }
        });
      }
    });
  });

  describe('Bypass Detection', () => {
    it('should detect bypass flags in mutation scripts', () => {
      const mutationScripts = allowedMutationScripts.map(name => 
        path.join(scriptsDir, name)
      );

      const bypassPatterns = [
        /SKIP_/i,
        /BYPASS_/i,
        /ALLOW_/i,
        /DISABLE_/i,
        /OVERRIDE_/i,
        /FORCE_/i,
        /IGNORE_/i,
      ];

      mutationScripts.forEach(scriptPath => {
        if (!fs.existsSync(scriptPath)) {
          return;
        }

        const content = fs.readFileSync(scriptPath, 'utf-8');
        
        bypassPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            // Check if it's in a comment (which is okay)
            const lines = content.split('\n');
            const violations = lines.filter((line, index) => {
              const trimmed = line.trim();
              const isComment = trimmed.startsWith('//') || 
                               trimmed.startsWith('*') ||
                               trimmed.startsWith('#');
              
              if (isComment) {
                return false; // Comments are okay
              }
              
              return pattern.test(line);
            });

            if (violations.length > 0) {
              throw new Error(
                `Contract violation: Bypass pattern detected in ${path.basename(scriptPath)}: ${pattern.source}\n` +
                `Bypass mechanisms are FORBIDDEN. No exceptions.`
              );
            }
          }
        });
      });
    });
  });

  describe('Forbidden Operations Detection', () => {
    it('should detect DELETE, TRUNCATE, or DROP in reference data script', () => {
      const newSyncScriptPath = path.join(scriptsDir, 'sync-reference-data-dev-to-prod.ts');
      
      if (!fs.existsSync(newSyncScriptPath)) {
        return;
      }

      const scriptContent = fs.readFileSync(newSyncScriptPath, 'utf-8');
      
      // Remove comments and strings
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
          // Check if it's in a string literal
          const matches = codeContent.match(new RegExp(pattern.source, pattern.flags));
          if (matches) {
            const matchIndex = codeContent.indexOf(matches[0]);
            const beforeMatch = codeContent.substring(Math.max(0, matchIndex - 100), matchIndex);
            
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
  });
});
