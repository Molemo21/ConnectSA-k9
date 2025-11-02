/**
 * Clean Next.js build directories to fix OneDrive file lock errors
 * Run this when you see "UNKNOWN: unknown error" with errno -4094
 */

const fs = require('fs');
const path = require('path');

const buildDirs = ['.next-dev', '.next', 'out'];

function cleanBuildDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`ℹ️  Directory doesn't exist: ${dirPath}`);
    return { cleaned: false, error: null };
  }

  try {
    console.log(`🧹 Cleaning: ${dirPath}...`);
    
    // Try to delete files first
    function deleteRecursive(dir) {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
          const curPath = path.join(dir, file);
          try {
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          } catch (err) {
            // Ignore errors for locked files - they'll be cleaned on next attempt
            if (err.code !== 'EACCES' && err.code !== 'EPERM' && err.code !== 'UNKNOWN') {
              console.warn(`⚠️  Could not delete: ${curPath}`);
            }
          }
        });
        try {
          fs.rmdirSync(dir);
        } catch (err) {
          if (err.code !== 'ENOTEMPTY') {
            console.warn(`⚠️  Could not remove directory: ${dir}`);
          }
        }
      }
    }

    deleteRecursive(dirPath);
    console.log(`✅ Cleaned: ${dirPath}`);
    return { cleaned: true, error: null };
  } catch (error) {
    console.error(`❌ Error cleaning ${dirPath}:`, error.message);
    return { cleaned: false, error: error.message };
  }
}

async function main() {
  console.log('🧹 Cleaning Next.js build directories...\n');
  
  const results = buildDirs.map(dir => {
    const dirPath = path.resolve(process.cwd(), dir);
    return {
      dir: dir,
      ...cleanBuildDir(dirPath)
    };
  });

  console.log('\n📊 Results:');
  results.forEach(result => {
    if (result.cleaned) {
      console.log(`  ✅ ${result.dir}`);
    } else if (result.error) {
      console.log(`  ⚠️  ${result.dir} - ${result.error}`);
    } else {
      console.log(`  ℹ️  ${result.dir} - Already clean`);
    }
  });

  console.log('\n✨ Cleanup complete! Restart your dev server.');
  console.log('\n💡 Tips to prevent this:');
  console.log('   1. Exclude .next-dev from OneDrive sync (Settings > Sync & backup > Advanced settings)');
  console.log('   2. Or move project outside OneDrive folder');
  console.log('   3. Or use NEXT_BUILD_DIR environment variable');
}

main().catch(console.error);
