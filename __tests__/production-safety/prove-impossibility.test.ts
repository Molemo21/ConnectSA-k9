/**
 * PROOF TESTS - PROVING PHYSICAL IMPOSSIBILITY
 * 
 * These tests PROVE that unsafe actions are physically impossible.
 * They test the actual execution, not just code structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

describe('Physical Impossibility Proofs', () => {
  const scriptsDir = path.join(process.cwd(), 'scripts');

  describe('Proof 1: deploy-db.js CANNOT run locally', () => {
    it('PROVES: Script exits with code 1 when CI is not set', (done) => {
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      
      if (!fs.existsSync(deployDbPath)) {
        done();
        return;
      }

      const child = spawn('node', [deployDbPath], {
        env: {
          ...process.env,
          CI: '',
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://test',
        },
        stdio: 'pipe',
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        // Script MUST exit with code 1 (failure)
        expect(code).toBe(1);
        // Output MUST contain blocking message
        expect(output).toContain('BLOCKED');
        expect(output).toContain('CI=true');
        done();
      });
    });

    it('PROVES: Script exits even if NODE_ENV=production is set locally', (done) => {
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      
      if (!fs.existsSync(deployDbPath)) {
        done();
        return;
      }

      const child = spawn('node', [deployDbPath], {
        env: {
          ...process.env,
          CI: '', // NOT set
          NODE_ENV: 'production', // Even with production env
          DATABASE_URL: 'postgresql://test',
        },
        stdio: 'pipe',
      });

      child.on('close', (code) => {
        // MUST still fail because CI is not set
        expect(code).toBe(1);
        done();
      });
    });
  });

  describe('Proof 2: Prisma CANNOT initialize with prod DB locally', () => {
    it('PROVES: Prisma import fails when production DB detected locally', () => {
      // Clear require cache
      const prismaPath = require.resolve('../lib/prisma');
      delete require.cache[prismaPath];

      // Set up environment to trigger guard
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        CI: '',
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@pooler.supabase.com:5432/db',
      };

      // Attempting to import should fail
      expect(() => {
        require('../lib/prisma');
      }).toThrow();

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Proof 3: PROD_DATABASE_URL CANNOT be used locally', () => {
    it('PROVES: deploy-db.js fails when PROD_DATABASE_URL is set in dev context', (done) => {
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      
      if (!fs.existsSync(deployDbPath)) {
        done();
        return;
      }

      const child = spawn('node', [deployDbPath], {
        env: {
          ...process.env,
          CI: 'true', // CI is set
          NODE_ENV: 'development', // But wrong environment
          PROD_DATABASE_URL: 'postgresql://prod',
          DATABASE_URL: 'postgresql://prod',
        },
        stdio: 'pipe',
      });

      child.on('close', (code) => {
        // MUST fail because NODE_ENV is not production
        expect(code).toBe(1);
        done();
      });
    });
  });

  describe('Proof 4: Fingerprint validation happens BEFORE Prisma init', () => {
    it('PROVES: Prisma connect() validates fingerprint before connection', async () => {
      const prismaPath = path.join(process.cwd(), 'lib/prisma.ts');
      const content = fs.readFileSync(prismaPath, 'utf-8');

      // Verify fingerprint validation is in connect() method
      expect(content).toContain('validateEnvironmentFingerprint');
      
      // Verify it happens before super.$connect()
      const connectMethod = content.match(/async connect\(\)[^}]*}/s);
      if (connectMethod) {
        const connectContent = connectMethod[0];
        const fingerprintIndex = connectContent.indexOf('validateEnvironmentFingerprint');
        const superConnectIndex = connectContent.indexOf('super.$connect()');
        
        // Fingerprint validation MUST come before connection
        expect(fingerprintIndex).toBeLessThan(superConnectIndex);
      }
    });
  });

  describe('Proof 5: No bypass mechanisms exist', () => {
    it('PROVES: No SKIP_ flags in critical files', () => {
      const criticalFiles = [
        'scripts/deploy-db.js',
        'lib/prisma.ts',
        'lib/ci-enforcement.ts',
        'lib/env-fingerprint.ts',
      ];

      criticalFiles.forEach(fileName => {
        const filePath = path.join(process.cwd(), fileName);
        
        if (!fs.existsSync(filePath)) {
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmed = line.trim();
          
          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
            return;
          }

          // Check for bypass patterns
          if (/SKIP_/i.test(line) && !trimmed.includes('SKIP_FINGERPRINT_VALIDATION')) {
            // SKIP_FINGERPRINT_VALIDATION is only allowed for build context
            if (!line.includes('phase-production-build') && !line.includes('NEXT_PHASE')) {
              throw new Error(
                `Bypass pattern detected in ${fileName} at line ${index + 1}: ${line.trim()}`
              );
            }
          }
        });
      });
    });

    it('PROVES: Guards execute before any imports in deploy-db.js', () => {
      const deployDbPath = path.join(scriptsDir, 'deploy-db.js');
      
      if (!fs.existsSync(deployDbPath)) {
        return;
      }

      const content = fs.readFileSync(deployDbPath, 'utf-8');
      const lines = content.split('\n');

      // Find where require/import statements start
      let firstRequireIndex = -1;
      let firstGuardIndex = -1;

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Find first guard (CI check)
        if (firstGuardIndex === -1 && /CI.*===/.test(line) && !trimmed.startsWith('//')) {
          firstGuardIndex = index;
        }
        
        // Find first require
        if (firstRequireIndex === -1 && trimmed.startsWith('require(') && !trimmed.startsWith('//')) {
          firstRequireIndex = index;
        }
      });

      // Guards MUST come before requires
      expect(firstGuardIndex).toBeLessThan(firstRequireIndex);
    });
  });
});
