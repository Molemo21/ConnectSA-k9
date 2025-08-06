export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateField(
  value: any,
  rules: ValidationRule,
  fieldName: string
): string | null {
  // Required check
  if (rules.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} is required`
  }

  if (!value) return null

  const stringValue = value.toString()

  // Min length check
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`
  }

  // Max length check
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters`
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return `${fieldName} format is invalid`
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[fieldName], fieldRules, fieldName)
    if (error) {
      errors[fieldName] = error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value.includes('@')) return 'Please enter a valid email address'
      return null
    }
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value.length < 6) return 'Password must be at least 6 characters'
      return null
    }
  },
  phone: {
    required: true,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    custom: (value: string) => {
      if (!value.match(/^[\+]?[1-9][\d]{0,15}$/)) {
        return 'Please enter a valid phone number'
      }
      return null
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (value.length < 2) return 'Name must be at least 2 characters'
      if (value.length > 50) return 'Name must be no more than 50 characters'
      return null
    }
  },
  description: {
    maxLength: 500,
    custom: (value: string) => {
      if (value && value.length > 500) {
        return 'Description must be no more than 500 characters'
      }
      return null
    }
  }
} 