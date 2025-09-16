"use client"

import React from "react"

type Step = 'FORM' | 'REVIEW' | 'DISCOVERY' | 'CONFIRM'

export function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'FORM', label: 'Service Details' },
    { id: 'REVIEW', label: 'Review' },
    { id: 'DISCOVERY', label: 'Choose Provider' },
    { id: 'CONFIRM', label: 'Confirmation' },
  ]
  const currentIndex = steps.findIndex(s => s.id === step)

  return (
    <div className="flex items-center justify-center sm:justify-start space-x-2 overflow-x-auto py-2" aria-label="Booking steps">
      {steps.map((s, idx) => {
        const isCompleted = idx < currentIndex
        const isActive = idx === currentIndex
        const dotClass = isActive || isCompleted ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'
        const labelClass = isActive ? 'text-white font-semibold' : isCompleted ? 'text-white/90' : 'text-white/70'
        const connectorClass = idx < currentIndex ? 'bg-indigo-600' : 'bg-slate-300'
        return (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${dotClass}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {idx + 1}
            </div>
            <span className={`ml-2 text-xs sm:text-sm ${labelClass}`}>{s.label}</span>
            {idx < steps.length - 1 && (
              <div className={`mx-2 h-0.5 w-6 sm:w-10 ${connectorClass}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}


