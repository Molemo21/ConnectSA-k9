/**
 * Analyze currency usage throughout the codebase
 * Run with: node scripts/analyze-currency-usage.js
 */

const fs = require('fs')
const path = require('path')

const results = {
  dollarSymbols: [],
  usdReferences: [],
  zarReferences: [],
  currencyFormatting: [],
  paystackConfig: []
}

function searchInFile(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      // Check for $ symbols (but exclude template literals and regex)
      if (line.includes('$') && !line.includes('${') && !line.includes('\\$') && line.trim()) {
        if (line.match(/\$\d|price.*\$|amount.*\$|total.*\$|revenue.*\$|\$\s*\d/i)) {
          results.dollarSymbols.push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          })
        }
      }
      
      // Check for USD references
      if (line.match(/USD|dollar/i) && !line.includes('//')) {
        results.usdReferences.push({
          file: filePath,
          line: index + 1,
          content: line.trim()
        })
      }
      
      // Check for ZAR references
      if (line.match(/ZAR|rand/i)) {
        results.zarReferences.push({
          file: filePath,
          line: index + 1,
          content: line.trim()
        })
      }
      
      // Check for currency formatting
      if (line.match(/NumberFormat|currency.*format|formatCurrency/i)) {
        results.currencyFormatting.push({
          file: filePath,
          line: index + 1,
          content: line.trim()
        })
      }
    })
  } catch (error) {
    // Ignore files that can't be read
  }
}

function walkDir(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        walkDir(filePath, extensions)
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      searchInFile(filePath, [])
    }
  })
}

console.log('🔍 Analyzing currency usage in codebase...\n')

// Search in key directories
walkDir('components')
walkDir('app')
walkDir('lib')

// Print results
console.log('💵 DOLLAR SYMBOL ($) USAGE:')
console.log('===========================')
if (results.dollarSymbols.length === 0) {
  console.log('✅ No dollar symbols found')
} else {
  console.log(`⚠️  Found ${results.dollarSymbols.length} instances:\n`)
  results.dollarSymbols.slice(0, 20).forEach(item => {
    console.log(`${item.file}:${item.line}`)
    console.log(`   ${item.content}`)
    console.log('')
  })
  if (results.dollarSymbols.length > 20) {
    console.log(`... and ${results.dollarSymbols.length - 20} more`)
  }
}

console.log('\n💲 USD REFERENCES:')
console.log('==================')
if (results.usdReferences.length === 0) {
  console.log('✅ No USD references found')
} else {
  console.log(`⚠️  Found ${results.usdReferences.length} instances:\n`)
  results.usdReferences.forEach(item => {
    console.log(`${item.file}:${item.line}`)
    console.log(`   ${item.content}`)
    console.log('')
  })
}

console.log('\n🇿🇦 ZAR REFERENCES:')
console.log('==================')
console.log(`✅ Found ${results.zarReferences.length} instances (GOOD!):\n`)
results.zarReferences.slice(0, 10).forEach(item => {
  console.log(`${item.file}:${item.line}`)
  console.log(`   ${item.content}`)
  console.log('')
})
if (results.zarReferences.length > 10) {
  console.log(`... and ${results.zarReferences.length - 10} more`)
}

console.log('\n📊 CURRENCY FORMATTING:')
console.log('=======================')
console.log(`Found ${results.currencyFormatting.length} instances:\n`)
results.currencyFormatting.forEach(item => {
  console.log(`${item.file}:${item.line}`)
  console.log(`   ${item.content}`)
  console.log('')
})

console.log('\n🎯 SUMMARY:')
console.log('===========')
console.log(`Dollar symbols ($): ${results.dollarSymbols.length}`)
console.log(`USD references: ${results.usdReferences.length}`)
console.log(`ZAR references: ${results.zarReferences.length}`)
console.log(`Currency formatting: ${results.currencyFormatting.length}`)

if (results.dollarSymbols.length > 0 || results.usdReferences.length > 0) {
  console.log('\n⚠️  ACTION REQUIRED: Replace $ with R and USD with ZAR')
} else {
  console.log('\n✅ Currency usage is consistent!')
}
