"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Region {
  id: string
  name: string
  flag: string
  currency: string
  currencyCode: string
}

interface CurrencyContextType {
  selectedRegion: Region
  setSelectedRegion: (region: Region) => void
  formatCurrency: (amount: number) => string
  getCurrencySymbol: () => string
}

const defaultRegion: Region = {
  id: "za",
  name: "South Africa",
  flag: "🇿🇦",
  currency: "South African Rand",
  currencyCode: "ZAR"
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedRegion, setSelectedRegion] = useState<Region>(defaultRegion)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setMounted(true)
    
    // Load saved region from localStorage on mount
    const savedRegion = localStorage.getItem('selectedRegion')
    if (savedRegion) {
      try {
        const parsedRegion = JSON.parse(savedRegion)
        setSelectedRegion(parsedRegion)
      } catch (error) {
        console.error('Error parsing saved region:', error)
      }
    }
  }, [])

  // Save region to localStorage when it changes - only on client
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('selectedRegion', JSON.stringify(selectedRegion))
  }, [selectedRegion, mounted])

  const formatCurrency = (amount: number): string => {
    const currencyCode = selectedRegion.currencyCode
    
    // Format based on currency - Only Rand supported
    switch (currencyCode) {
      case 'ZAR':
        return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      default:
        return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const getCurrencySymbol = (): string => {
    switch (selectedRegion.currencyCode) {
      case 'ZAR':
        return 'R'
      default:
        return 'R'
    }
  }

  const value: CurrencyContextType = {
    selectedRegion,
    setSelectedRegion,
    formatCurrency,
    getCurrencySymbol
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}


