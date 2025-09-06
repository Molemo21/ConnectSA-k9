"use client"

import React from "react"
import { ProviderDiscovery } from "@/components/provider-discovery/provider-discovery"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  form: { serviceId: string; date: string; time: string; address: string; notes?: string }
  onProviderSelected: (providerId: string) => void
  onBack: () => void
}

export function ProviderDiscoveryPanel({ form, onProviderSelected, onBack }: Props) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl">Choose Your Provider</CardTitle>
        <CardDescription>Review available providers and select the best fit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <ProviderDiscovery
            serviceId={form.serviceId}
            date={form.date}
            time={form.time}
            address={form.address}
            notes={form.notes}
            onProviderSelected={onProviderSelected}
            onBack={onBack}
          />
        </div>
      </CardContent>
    </Card>
  )
}


