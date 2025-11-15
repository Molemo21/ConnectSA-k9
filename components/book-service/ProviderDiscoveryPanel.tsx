"use client"

import React from "react"
import { ProviderDiscovery } from "@/components/provider-discovery/provider-discovery"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  form: { 
    serviceId: string
    date: string
    time: string
    address: string
    notes?: string
    paymentMethod: "ONLINE" | "CASH"
    selectedProviderId?: string | null
    selectedCatalogueItemId?: string | null
  }
  onProviderSelected?: (providerId: string) => void
  onPackageSelected?: (providerId: string, catalogueItemId: string, providerData?: any, packageData?: any) => void
  onBack: () => void
  onLoginSuccess?: () => void
  onCancelBooking?: () => void
}

export function ProviderDiscoveryPanel({ form, onProviderSelected, onPackageSelected, onBack, onLoginSuccess, onCancelBooking }: Props) {
  return (
    <div className="animate-fade-in">
      <ProviderDiscovery
        serviceId={form.serviceId}
        date={form.date}
        time={form.time}
        address={form.address}
        notes={form.notes}
        paymentMethod={form.paymentMethod}
        onProviderSelected={onProviderSelected}
        onPackageSelected={onPackageSelected}
        onBack={onBack}
        onLoginSuccess={onLoginSuccess}
        onCancelBooking={onCancelBooking}
      />
    </div>
  )
}



