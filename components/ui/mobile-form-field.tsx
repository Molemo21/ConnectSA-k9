"use client"

import { forwardRef, useState } from 'react'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaseFieldProps {
  label: string
  error?: string | null
  required?: boolean
  helperText?: string
  className?: string
  disabled?: boolean
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'url'
  placeholder?: string
  value: string | number
  onChange: (value: string | number) => void
  onBlur?: () => void
  onFocus?: () => void
  min?: number
  max?: number
  step?: number
  pattern?: string
  autoComplete?: string
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  rows?: number
  maxLength?: number
}

interface SelectFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

// Input Field Component
export const MobileInputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ 
    label, 
    error, 
    required, 
    helperText, 
    className,
    type = 'text',
    value,
    onChange,
    onBlur,
    onFocus,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    const inputType = type === 'password' && showPassword ? 'text' : type
    const hasError = !!error
    const hasValue = value !== undefined && value !== null && value !== ''

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.()
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.()
    }

    return (
      <div className={cn("space-y-2", className)}>
        <Label 
          htmlFor={label.toLowerCase().replace(/\s+/g, '-')} 
          className="text-sm font-medium text-gray-700 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="relative">
          <Input
            ref={ref}
            id={label.toLowerCase().replace(/\s+/g, '-')}
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              "h-12 px-4 text-base transition-all duration-200",
              "border-2 focus:ring-2 focus:ring-offset-0",
              hasError 
                ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                : isFocused 
                  ? "border-blue-500 focus:ring-blue-200" 
                  : hasValue 
                    ? "border-green-300" 
                    : "border-gray-300 hover:border-gray-400",
              disabled && "bg-gray-50 cursor-not-allowed"
            )}
            {...props}
          />
          
          {/* Password toggle for password fields */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          
          {/* Status icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : hasValue && !hasError ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
        </div>
        
        {/* Error message */}
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !hasError && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

MobileInputField.displayName = 'MobileInputField'

// Textarea Field Component
export const MobileTextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ 
    label, 
    error, 
    required, 
    helperText, 
    className,
    value,
    onChange,
    onBlur,
    onFocus,
    disabled,
    rows = 4,
    maxLength,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasError = !!error
    const hasValue = value !== undefined && value !== null && value !== ''
    const characterCount = value.length

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.()
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.()
    }

    return (
      <div className={cn("space-y-2", className)}>
        <Label 
          htmlFor={label.toLowerCase().replace(/\s+/g, '-')} 
          className="text-sm font-medium text-gray-700 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="relative">
          <Textarea
            ref={ref}
            id={label.toLowerCase().replace(/\s+/g, '-')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              "min-h-[3rem] px-4 py-3 text-base transition-all duration-200 resize-none",
              "border-2 focus:ring-2 focus:ring-offset-0",
              hasError 
                ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                : isFocused 
                  ? "border-blue-500 focus:ring-blue-200" 
                  : hasValue 
                    ? "border-green-300" 
                    : "border-gray-300 hover:border-gray-400",
              disabled && "bg-gray-50 cursor-not-allowed"
            )}
            {...props}
          />
          
          {/* Status icons */}
          <div className="absolute right-3 top-3">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : hasValue && !hasError ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
        </div>
        
        {/* Character count and max length */}
        {maxLength && (
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{characterCount} characters</span>
            <span>{maxLength - characterCount} remaining</span>
          </div>
        )}
        
        {/* Error message */}
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !hasError && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

MobileTextareaField.displayName = 'MobileTextareaField'

// Select Field Component
export const MobileSelectField = forwardRef<HTMLButtonElement, SelectFieldProps>(
  ({ 
    label, 
    error, 
    required, 
    helperText, 
    className,
    value,
    onChange,
    onBlur,
    onFocus,
    disabled,
    options,
    placeholder = "Select an option",
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const hasError = !!error
    const hasValue = value !== undefined && value !== null && value !== ''
    const selectedOption = options.find(opt => opt.value === value)

    const handleValueChange = (newValue: string) => {
      onChange(newValue)
      setIsOpen(false)
    }

    return (
      <div className={cn("space-y-2", className)}>
        <Label 
          htmlFor={label.toLowerCase().replace(/\s+/g, '-')} 
          className="text-sm font-medium text-gray-700 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="relative">
          <Select value={value} onValueChange={handleValueChange} open={isOpen} onOpenChange={setIsOpen}>
            <SelectTrigger
              ref={ref}
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
              className={cn(
                "h-12 px-4 text-base transition-all duration-200",
                "border-2 focus:ring-2 focus:ring-offset-0",
                hasError 
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                  : hasValue 
                    ? "border-green-300" 
                    : "border-gray-300 hover:border-gray-400",
                disabled && "bg-gray-50 cursor-not-allowed"
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            
            <SelectContent>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className="h-12 text-base"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Status icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : hasValue && !hasError ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
        </div>
        
        {/* Error message */}
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !hasError && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

MobileSelectField.displayName = 'MobileSelectField'
