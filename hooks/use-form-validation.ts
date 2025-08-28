import { useState, useEffect, useCallback, useRef } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

interface ValidationRules {
  [fieldName: string]: ValidationRule
}

interface ValidationErrors {
  [fieldName: string]: string | null
}

export function useFormValidation<T extends Record<string, any>>(
  data: T,
  rules: ValidationRules,
  debounceMs: number = 500
) {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const debounceRef = useRef<NodeJS.Timeout>()

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rule = rules[fieldName]
    if (!rule) return null

    // Required check
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.minLength} characters`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${rule.maxLength} characters`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${rule.max}`
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) return customError
    }

    return null
  }, [rules])

  // Validate all fields
  const validateAll = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {}
    
    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName])
      if (error) {
        newErrors[fieldName] = error
      }
    })

    return newErrors
  }, [rules, data, validateField])

  // Debounced validation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const newErrors = validateAll()
      setErrors(newErrors)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [data, validateAll, debounceMs])

  // Mark field as touched
  const markTouched = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }, [])

  // Mark all fields as touched
  const markAllTouched = useCallback(() => {
    const allTouched: Record<string, boolean> = {}
    Object.keys(rules).forEach(fieldName => {
      allTouched[fieldName] = true
    })
    setTouched(allTouched)
  }, [rules])

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0

  // Get error for a specific field
  const getFieldError = useCallback((fieldName: string): string | null => {
    return touched[fieldName] ? errors[fieldName] || null : null
  }, [errors, touched])

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return touched[fieldName] && !!errors[fieldName]
  }, [errors, touched])

  return {
    errors,
    touched,
    isValid,
    getFieldError,
    hasFieldError,
    markTouched,
    markAllTouched,
    validateAll
  }
}
