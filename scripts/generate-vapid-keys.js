#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push Notifications
 * Run: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push')

console.log('🔑 Generating VAPID keys for Web Push Notifications...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID Keys Generated Successfully!\n')
console.log('Add these to your .env.local file:\n')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`)
console.log('📝 Note: Keep VAPID_PRIVATE_KEY secret! Never commit it to version control.\n')




