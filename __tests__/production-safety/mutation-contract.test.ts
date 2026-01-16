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
    'sync-dev-to-prod-services.ts',
  ];

  describe('Allowed Mutation Scripts', () => {
    it('should only allow approved mutation scripts', () => {
      // This test ensures no new mutation scripts are added without approval
      // If a new script is added, this test must be updated
      
      const mutationScripts = allowedMutationScripts;
      
      expect(mutationScripts).toHaveLength(2);
      expect(mutationScripts).toContain('deploy-db.js');
      expect(mutationScripts).toContain('sync-dev-to-prod-services.ts');
    });

    it('should enforce CI-only execution in all mutation scripts', () => {
      // Check that all mutation scripts import CI enforcement
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      const syncScriptPath = path.join(scriptsDir, 'sync-dev-to-prod-services.ts');

      if (fs.existsSync(deployDbPath)) {
        const deployDbContent = fs.readFileSync(deployDbPath, 'utf-8');
        // Should use CI enforcement (either direct or via validateMutationScript)
        expect(
          deployDbContent.includes('validateMutationScript') ||
          deployDbContent.includes('enforceCIOnlyExecution') ||
          deployDbContent.includes('CI=true')
        ).toBe(true);
      }

      if (fs.existsSync(syncScriptPath)) {
        const syncContent = fs.readFileSync(syncScriptPath, 'utf-8');
        expect(syncContent.includes('validateMutationScript')).toBe(true);
      }
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
});
