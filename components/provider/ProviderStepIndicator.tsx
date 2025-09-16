"use client"

import { CheckCircle } from "lucide-react"

type Step = 'PERSONAL' | 'SERVICES' | 'DOCUMENTS' | 'BANKING' | 'REVIEW' | 'SUBMIT'

interface ProviderStepIndicatorProps {
  step: Step
  completedSteps?: Step[]
}

export function ProviderStepIndicator({ step, completedSteps = [] }: ProviderStepIndicatorProps) {
  const steps = [
    { id: 'PERSONAL', label: 'Personal Info', icon: '👤' },
    { id: 'SERVICES', label: 'Services', icon: '🔧' },
    { id: 'DOCUMENTS', label: 'Documents', icon: '📄' },
    { id: 'BANKING', label: 'Banking', icon: '🏦' },
    { id: 'REVIEW', label: 'Review', icon: '✅' },
    { id: 'SUBMIT', label: 'Submit', icon: '🚀' },
  ] as const

  const currentIndex = steps.findIndex(s => s.id === step)

  return (
    <div className="flex items-center justify-center sm:justify-start space-x-2 overflow-x-auto py-6 px-4" aria-label="Provider onboarding steps">
      {steps.map((s, idx) => {
        const isCompleted = completedSteps.includes(s.id as Step)
        const isCurrent = s.id === step
        const isPast = idx < currentIndex
        
        return (
          <div key={s.id} className="flex items-center flex-shrink-0 group">
            <div
              className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 transform hover:scale-110 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' 
                  : isCurrent 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ring-4 ring-blue-200/50 shadow-lg shadow-blue-500/25 animate-pulse' 
                    : isPast
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md'
                      : 'bg-white/20 text-white/60 border-2 border-white/30 backdrop-blur-sm'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 animate-bounce" />
              ) : (
                <span className="text-lg group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
              )}
              
              {/* Glow effect for current step */}
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
              )}
            </div>
            
            <span className={`ml-3 text-sm sm:text-base font-bold transition-all duration-300 drop-shadow-lg ${
              isCompleted 
                ? 'text-green-300' 
                : isCurrent 
                  ? 'text-white' 
                  : isPast
                    ? 'text-white/90'
                    : 'text-white/70'
            }`}>
              {s.label}
            </span>
            
            {idx < steps.length - 1 && (
              <div className={`mx-4 h-1 w-12 sm:w-16 rounded-full transition-all duration-500 ${
                isCompleted || isPast 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25' 
                  : 'bg-white/20'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
