#!/usr/bin/env node

/**
 * Debug Provider Action Buttons
 * 
 * This script checks why some pending providers don't show Approve/Reject buttons
 */

console.log('🔍 Debugging Provider Action Buttons Issue...')

console.log('\n📊 Your Provider Data:')
console.log('Provider                    Status    Should Show Buttons?')
console.log('─────────────────────────────────────────────────────────')

const providers = [
  { name: 'asiphe', status: 'PENDING', businessName: 'Nakin Traders' },
  { name: 'Noxolo Mjaks', status: 'PENDING', businessName: 'N/A' },
  { name: 'Zenande', status: 'PENDING', businessName: 'N/A' },
  { name: 'bubele', status: 'PENDING', businessName: 'N/A' },
  { name: 'Noxolo', status: 'PENDING', businessName: 'Nakin Traders' },
  { name: 'Sechaba Thomas Nakin', status: 'PENDING', businessName: 'Nakin Traders' },
  { name: 'Dodo Adonis', status: 'APPROVED', businessName: "John's services" },
  { name: 'Thabang Nakin', status: 'APPROVED', businessName: "John's services" },
  { name: 'Keitumetse Faith Seroto', status: 'APPROVED', businessName: 'N/A' }
]

providers.forEach(provider => {
  const shouldShowButtons = provider.status === 'PENDING'
  const buttonStatus = shouldShowButtons ? '✅ YES' : '❌ NO'
  console.log(`${provider.name.padEnd(25)} ${provider.status.padEnd(8)} ${buttonStatus}`)
})

console.log('\n🎯 Analysis:')
console.log('- All PENDING providers should show Approve/Reject buttons')
console.log('- APPROVED providers should show Suspend button')
console.log('- If buttons are missing, it could be:')
console.log('  1. Data not loading correctly')
console.log('  2. Component not rendering properly')
console.log('  3. CSS/styling issue hiding buttons')
console.log('  4. JavaScript error preventing rendering')

console.log('\n🔧 Possible Issues:')
console.log('1. **Data Loading:** Check if provider.status is correctly set to "PENDING"')
console.log('2. **Component Logic:** Verify getActionButtons() function is working')
console.log('3. **Rendering:** Check if buttons are rendered but hidden by CSS')
console.log('4. **State Management:** Ensure provider data is properly passed to component')

console.log('\n✅ Expected Behavior:')
console.log('- asiphe (PENDING) → Should show Approve + Reject buttons')
console.log('- Noxolo Mjaks (PENDING) → Should show Approve + Reject buttons')
console.log('- Zenande (PENDING) → Should show Approve + Reject buttons')
console.log('- bubele (PENDING) → Should show Approve + Reject buttons')
console.log('- Noxolo (PENDING) → Should show Approve + Reject buttons')
console.log('- Sechaba Thomas Nakin (PENDING) → Should show Approve + Reject buttons')

console.log('\n🚀 Next Steps:')
console.log('1. Check browser console for JavaScript errors')
console.log('2. Inspect the HTML to see if buttons are rendered')
console.log('3. Verify provider data in the component')
console.log('4. Check CSS for any display: none rules')
