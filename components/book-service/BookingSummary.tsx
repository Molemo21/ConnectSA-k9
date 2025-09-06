"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BookingSummaryProps {
  service?: { name: string; category: string; description?: string }
  date?: string
  time?: string
  address?: string
}

export function BookingSummary({ service, date, time, address }: BookingSummaryProps) {
  return (
    <div className="space-y-6 lg:sticky lg:top-24 self-start" aria-label="Booking summary">
      {service && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Selected Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.category}</p>
              </div>
              {service.description && (
                <div className="text-sm text-gray-600">
                  <p>{service.description}</p>
                </div>
              )}
              {(date || time || address) && (
                <div className="pt-2 border-t border-gray-100">
                  <ul className="text-sm text-gray-700 space-y-1">
                    {date && time && (
                      <li>
                        <span className="font-medium text-gray-900">When:</span> {date} • {time}
                      </li>
                    )}
                    {address && (
                      <li>
                        <span className="font-medium text-gray-900">Where:</span> {address}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Booking Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm list-disc list-inside text-gray-700">
            <li>Book at least 24 hours in advance for best availability</li>
            <li>Provide accurate address for better service matching</li>
            <li>Include specific details in notes for better service quality</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}


