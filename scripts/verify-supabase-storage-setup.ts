/**
 * Verification script for Supabase Storage setup
 * Run this to check if your Supabase Storage is configured correctly
 */

async function verifySupabaseStorageSetup() {
  console.log('🔍 Verifying Supabase Storage Setup...\n');

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables...');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars: string[] = [];
  const presentVars: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`   ❌ ${varName} - NOT SET`);
    } else {
      presentVars.push(varName);
      // Mask the key for security
      const masked = varName.includes('KEY')
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`   ✅ ${varName} - ${masked}`);
    }
  }

  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing Environment Variables:');
    missingVars.forEach((v) => console.log(`   - ${v}`));
    console.log('\n📝 Add these to your .env.local file:');
    console.log('   See SUPABASE_STORAGE_SETUP.md for instructions\n');
    return false;
  }

  // Try to connect to Supabase
  console.log('\n2️⃣ Testing Supabase Connection...');
  try {
    const { createSupabaseServerClient } = await import('../lib/supabase/client');
    const supabase = createSupabaseServerClient();

    // Test connection by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      console.log('\n💡 Tips:');
      console.log('   - Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
      console.log('   - Check your Supabase project is active\n');
      return false;
    }

    console.log(`   ✅ Connected successfully`);
    console.log(`   📦 Found ${buckets?.length || 0} bucket(s)`);

    // Check if catalogue-images bucket exists
    console.log('\n3️⃣ Checking Storage Bucket...');
    const catalogueBucket = buckets?.find((b) => b.name === 'catalogue-images');

    if (!catalogueBucket) {
      console.log('   ❌ Bucket "catalogue-images" not found');
      console.log('\n📝 Create the bucket:');
      console.log('   1. Go to Supabase Dashboard → Storage');
      console.log('   2. Click "New bucket"');
      console.log('   3. Name: catalogue-images');
      console.log('   4. Public: Yes');
      console.log('   5. Click "Create"\n');
      return false;
    }

    console.log('   ✅ Bucket "catalogue-images" exists');
    console.log(`   📊 Public: ${catalogueBucket.public ? 'Yes ✅' : 'No ❌ (should be Yes)'}`);

    if (!catalogueBucket.public) {
      console.log('\n⚠️  Bucket should be public for image display');
      console.log('   Update in Supabase Dashboard → Storage → catalogue-images → Settings\n');
    }

    // Check policies (we can't directly check, but we can try to upload a test file)
    console.log('\n4️⃣ Testing Storage Policies...');
    console.log('   ℹ️  Policies verification requires manual check');
    console.log('   See SUPABASE_STORAGE_SETUP.md for policy setup\n');

    console.log('✅ Setup Verification Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Verify storage policies are set (see SUPABASE_STORAGE_SETUP.md)');
    console.log('   2. Test upload in the app');
    console.log('   3. Verify images display in discovery\n');

    return true;
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifySupabaseStorageSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { verifySupabaseStorageSetup };

