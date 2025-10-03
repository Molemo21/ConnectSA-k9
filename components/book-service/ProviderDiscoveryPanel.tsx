"use client"

import React from "react"
import { ProviderDiscovery } from "@/components/provider-discovery/provider-discovery"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  form: { serviceId: string; date: string; time: string; address: string; notes?: string }
  onProviderSelected: (providerId: string) => void
  onBack: () => void
  onLoginSuccess?: () => void
  onCancelBooking?: () => void
}

export function ProviderDiscoveryPanel({ form, onProviderSelected, onBack, onLoginSuccess, onCancelBooking }: Props) {
  return (
    <div className="animate-fade-in">
      <ProviderDiscovery
        serviceId={form.serviceId}
        date={form.date}
        time={form.time}
        address={form.address}
        notes={form.notes}
        onProviderSelected={onProviderSelected}
        onBack={onBack}
        onLoginSuccess={onLoginSuccess}
        onCancelBooking={onCancelBooking}
      />
    </div>
  )
}


