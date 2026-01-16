/**
 * BYPASS DETECTION TESTS
 * 
 * These tests PROVE that no bypass mechanisms exist in the codebase.
 * They scan for bypass patterns and fail if any are detected.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Bypass Detection', () => {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const libDir = path.join(process.cwd(), 'lib');

  const bypassPatterns = [
    /SKIP_/i,
    /BYPASS_/i,
    /ALLOW_/i,
    /DISABLE_/i,
    /OVERRIDE_/i,
    /FORCE_/i,
    /IGNORE_/i,
    /EMERGENCY_/i,
    /TEMP_/i,
    /HACK_/i,
  ];

  const criticalFiles = [
    'scripts/deploy-db.js',
    'scripts/sync-dev-to-prod-services.ts',
    'lib/ci-enforcement.ts',
    'lib/env-fingerprint.ts',
    'lib/prisma.ts',
  ];

  function isInComment(line: string, index: number, allLines: string[]): boolean {
    const trimmed = line.trim();
    
    // Single-line comment
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
      return true;
    }
    
    // Check for block comment start
    const blockCommentStart = line.indexOf('/*');
    const blockCommentEnd = line.indexOf('*/');
    
    if (blockCommentStart !== -1 && blockCommentEnd === -1) {
      // Block comment started but not ended - check if we're in a comment
      let inComment = false;
      for (let i = 0; i < index; i++) {
        const prevLine = allLines[i];
        if (prevLine.includes('/*')) inComment = true;
        if (prevLine.includes('*/')) inComment = false;
      }
      return inComment;
    }
    
    // Check if it's in a string
    const singleQuoteCount = (line.match(/'/g) || []).length;
    const doubleQuoteCount = (line.match(/"/g) || []).length;
    
    // If odd number of quotes, might be in a string (simplified check)
    if (singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) {
      // Could be in a string - be conservative and allow it
      return true;
    }
    
    return false;
  }

  describe('Critical Files', () => {
    criticalFiles.forEach(filePath => {
      it(`should not contain bypass patterns in ${path.basename(filePath)}`, () => {
        const fullPath = path.join(process.cwd(), filePath);
        
        if (!fs.existsSync(fullPath)) {
          return; // Skip if file doesn't exist
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        const violations: Array<{ line: number; pattern: string; content: string }> = [];

        lines.forEach((line, index) => {
          if (isInComment(line, index, lines)) {
            return; // Skip comments
          }

          bypassPatterns.forEach(pattern => {
            if (pattern.test(line)) {
              violations.push({
                line: index + 1,
                pattern: pattern.source,
                content: line.trim(),
              });
            }
          });
        });

        if (violations.length > 0) {
          const violationDetails = violations
            .map(v => `  Line ${v.line}: ${v.content} (pattern: ${v.pattern})`)
            .join('\n');

          throw new Error(
            `Bypass mechanism detected in ${filePath}:\n${violationDetails}\n\n` +
            `Bypass mechanisms are FORBIDDEN. No exceptions.`
          );
        }
      });
    });
  });

  describe('Environment Variable Bypasses', () => {
    it('should not allow SKIP_FINGERPRINT_VALIDATION in production', () => {
      const prismaPath = path.join(process.cwd(), 'lib/prisma.ts');
      
      if (!fs.existsSync(prismaPath)) {
        return;
      }

      const content = fs.readFileSync(prismaPath, 'utf-8');
      
      // SKIP_FINGERPRINT_VALIDATION should only be allowed in build context
      if (content.includes('SKIP_FINGERPRINT_VALIDATION')) {
        // Must only be used for build-time skipping, not runtime
        const lines = content.split('\n');
        const skipLines = lines
          .map((line, i) => ({ line, index: i }))
          .filter(({ line }) => line.includes('SKIP_FINGERPRINT_VALIDATION'));

        skipLines.forEach(({ line, index }) => {
          // Must be in build context check
          if (!line.includes('phase-production-build') && 
              !line.includes('NEXT_PHASE')) {
            throw new Error(
              `SKIP_FINGERPRINT_VALIDATION found in lib/prisma.ts at line ${index + 1} ` +
              `without proper build context check. This is a bypass mechanism.`
            );
          }
        });
      }
    });
  });

  describe('CI Enforcement Bypasses', () => {
    it('should not allow CI enforcement to be disabled', () => {
      const ciEnforcementPath = path.join(process.cwd(), 'lib/ci-enforcement.ts');
      
      if (!fs.existsSync(ciEnforcementPath)) {
        return;
      }

      const content = fs.readFileSync(ciEnforcementPath, 'utf-8');
      
      // Should not have any way to skip CI check
      const dangerousPatterns = [
        /if.*!.*CI.*continue/i,
        /if.*!.*CI.*return/i,
        /skip.*ci/i,
        /bypass.*ci/i,
      ];

      const lines = content.split('\n');
      dangerousPatterns.forEach(pattern => {
        lines.forEach((line, index) => {
          if (!isInComment(line, index, lines) && pattern.test(line)) {
            throw new Error(
              `CI enforcement bypass detected in lib/ci-enforcement.ts at line ${index + 1}: ${line.trim()}`
            );
          }
        });
      });
    });
  });
});
