# Schema Validation Guide

## Overview
This guide describes the automated schema validation system implemented to maintain database integrity and catch potential issues early.

## 🔍 Validation Checks

### 1. Service Categories
- Validates all service categories
- Checks for active/inactive status
- Verifies service associations
- Identifies categories without services

### 2. Orphaned Records
- Services without categories
- Bookings without providers/services/clients
- Payments without bookings
- Providers without user accounts

### 3. Status Distributions
- Provider status distribution
- Booking status distribution
- Payment status verification
- User account status

## 🔧 Automatic Fixes

The system can automatically fix common issues:

1. **Orphaned Services**
   - Assigns to default "Cleaning Services" category
   - Logs the reassignment

2. **Orphaned Bookings**
   - Marks as CANCELLED
   - Preserves data for audit purposes

3. **Invalid Payments**
   - Marks as FAILED
   - Maintains transaction history

4. **Provider Records**
   - Marks providers without users as SUSPENDED
   - Preserves provider data

## 📊 Reports

Reports are generated in the `reports/` directory:
- `schema-validation-{timestamp}.json`: Validation results
- `daily-schema-health-{timestamp}.json`: Daily health checks

### Report Structure
```json
{
  "timestamp": "ISO-8601 date",
  "results": {
    "serviceCategories": {
      "total": number,
      "active": number,
      "withServices": number
    },
    "providerStatus": {
      "PENDING": number,
      "APPROVED": number,
      "REJECTED": number,
      "SUSPENDED": number
    },
    // ... other metrics
  },
  "issues": ["List of identified issues"],
  "summary": {
    "totalIssues": number,
    "status": "✅ PASSED" | "⚠️ ISSUES FOUND"
  }
}
```

## 🕐 Scheduled Validation

- Runs daily at midnight
- Automatically attempts to fix issues
- Generates comprehensive reports
- Maintains audit trail

## 📝 Usage

### Running Manual Validation
```bash
# Run validation check
npm run validate-schema

# Run validation with automatic fixes
npm run fix-schema

# Start scheduled validation
npm run schedule-validation
```

### Adding to package.json
```json
{
  "scripts": {
    "validate-schema": "tsx scripts/validate-schema.ts",
    "fix-schema": "tsx scripts/fix-schema-issues.ts",
    "schedule-validation": "tsx scripts/schedule-schema-validation.ts"
  }
}
```

## ⚠️ Important Notes

1. **Before Running Fixes:**
   - Always run validation first
   - Review the validation report
   - Backup critical data if needed

2. **Production Considerations:**
   - Schedule validations during low-traffic periods
   - Monitor fix operations closely
   - Keep validation reports for auditing

3. **Custom Fixes:**
   - Some issues may require manual intervention
   - Document any manual fixes in the reports
   - Update validation scripts for new edge cases

## 🔄 Maintenance

1. **Regular Tasks:**
   - Review daily validation reports
   - Monitor fix success rates
   - Update scripts for new requirements

2. **Monthly Review:**
   - Analyze common issues
   - Update automatic fix strategies
   - Optimize validation rules

3. **Documentation:**
   - Keep this guide updated
   - Document new validation cases
   - Maintain fix operation logs
