"use client"

import { useCurrency } from "@/contexts/currency-context"

interface CurrencyDisplayProps {
  amount: number
  className?: string
}

export function CurrencyDisplay({ amount, className = "" }: CurrencyDisplayProps) {
  const { formatCurrency } = useCurrency()
  
  return (
    <span className={className}>
      {formatCurrency(amount)}
    </span>
  )
}

// Example usage in components:
// <CurrencyDisplay amount={150.50} className="text-lg font-bold" />
// This will display: "R150.50" (if ZAR is selected) or "R150.50" (if USD is selected)


