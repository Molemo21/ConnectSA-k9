"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface FormFieldProps {
  label: string
  name: string
  type?: "text" | "email" | "password" | "tel" | "textarea" | "select" | "date" | "time"
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: { value: string; label: string }[]
  validation?: (value: string) => string | null
  className?: string
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  validation,
  className
}: FormFieldProps) {
  const [touched, setTouched] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (touched && validation) {
      const validationError = validation(value)
      setLocalError(validationError)
    }
  }, [value, touched, validation])

  const handleBlur = () => {
    setTouched(true)
  }

  const displayError = error || localError

  const inputProps = {
    id: name,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    onBlur: handleBlur,
    placeholder,
    disabled,
    className: cn(
      displayError && "border-red-500 focus:border-red-500 focus:ring-red-500",
      className
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {type === "textarea" ? (
        <Textarea {...inputProps} />
      ) : type === "select" ? (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={cn(
            displayError && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input {...inputProps} type={type} />
      )}
      
      {displayError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
} 