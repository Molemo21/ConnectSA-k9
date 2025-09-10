"use client"

import { useSafeTime } from "@/hooks/use-safe-time"

interface SafeTimeDisplayProps {
  date: Date | string
  format?: 'time' | 'date' | 'datetime'
  className?: string
}

export function SafeTimeDisplay({ date, format = 'date', className }: SafeTimeDisplayProps) {
  const formattedTime = useSafeTime(date, format)
  
  return (
    <span className={className}>
      {formattedTime}
    </span>
  )
}

interface SafeDateDisplayProps {
  date: Date | string
  className?: string
}

export function SafeDateDisplay({ date, className }: SafeDateDisplayProps) {
  return <SafeTimeDisplay date={date} format="date" className={className} />
}

interface SafeTimeOnlyDisplayProps {
  date: Date | string
  className?: string
}

export function SafeTimeOnlyDisplay({ date, className }: SafeTimeOnlyDisplayProps) {
  return <SafeTimeDisplay date={date} format="time" className={className} />
}
