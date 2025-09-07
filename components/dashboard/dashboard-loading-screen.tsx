"use client"

import { useEffect, useState } from "react"

interface LoadingStep {
  id: string
  label: string
  duration: number
}

const loadingSteps: LoadingStep[] = [
  { id: 'auth', label: 'Authenticating user...', duration: 1000 },
  { id: 'bookings', label: 'Loading your bookings...', duration: 1500 },
  { id: 'services', label: 'Fetching available services...', duration: 800 },
  { id: 'stats', label: 'Calculating statistics...', duration: 700 },
  { id: 'complete', label: 'Dashboard ready!', duration: 500 }
]

export function DashboardLoadingScreen() {
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let progressInterval: NodeJS.Timeout
    let stepTimeout: NodeJS.Timeout
    
    const animateProgress = () => {
      const totalSteps = loadingSteps.length
      const targetProgress = ((currentStepIndex + 1) / totalSteps) * 100
      
      // Animate progress bar
      progressInterval = setInterval(() => {
        setCurrentProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(progressInterval)
            
            // Move to next step after a brief pause
            if (currentStepIndex < totalSteps - 1) {
              stepTimeout = setTimeout(() => {
                setCurrentStepIndex(prev => prev + 1)
              }, 200)
            } else {
              // Mark as complete
              setTimeout(() => {
                setIsComplete(true)
              }, 300)
            }
            
            return targetProgress
          }
          return prev + 2
        })
      }, 50)
    }

    animateProgress()

    return () => {
      clearInterval(progressInterval)
      clearTimeout(stepTimeout)
    }
  }, [currentStepIndex])

  const currentStep = loadingSteps[currentStepIndex]
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100 p-8">
      {/* Logo and Brand */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/handshake.png" 
            alt="ProLiink Connect Logo" 
            className="w-16 h-16 rounded-xl object-cover shadow-2xl"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          ProL<span className="text-blue-400">ii</span>nk Connect
        </h1>
        <p className="text-gray-400 text-lg">Client Dashboard</p>
      </div>

      {/* Circular Progress */}
      <div className="progress-container mb-8">
        <div className="progress-circle relative flex justify-center items-center">
          <svg className="progress-ring w-32 h-32 transform -rotate-90" width="120" height="120">
            {/* Background circle */}
            <circle 
              className="progress-ring-circle-bg" 
              stroke="rgb(55, 65, 81)" 
              strokeWidth="8" 
              fill="transparent" 
              r={radius} 
              cx="60" 
              cy="60"
              opacity="0.3"
            />
            {/* Progress circle */}
            <circle 
              className="progress-ring-circle transition-all duration-500 ease-out" 
              stroke="url(#progressGradient)" 
              strokeWidth="8" 
              fill="transparent" 
              r={radius} 
              cx="60" 
              cy="60"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Progress text */}
          <div className="progress-text absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-100">
              {Math.round(currentProgress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Loading Steps */}
      <div className="text-center mb-8 min-h-[60px] flex flex-col justify-center">
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-200 mb-2">
            {currentStep?.label}
          </p>
          
          {/* Step indicators */}
          <div className="flex justify-center space-x-2">
            {loadingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStepIndex
                    ? 'bg-purple-500 scale-110'
                    : 'bg-gray-600 scale-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Animated loading dots */}
        {!isComplete && (
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>

      {/* Additional loading elements */}
      <div className="text-center text-gray-500 text-sm max-w-md">
        <p className="mb-2">Setting up your personalized dashboard experience</p>
        <div className="flex justify-center items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
            <span>Secure Connection</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
            <span>Real-time Updates</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
            <span>Optimized Performance</span>
          </div>
        </div>
      </div>

      {/* Completion animation */}
      {isComplete && (
        <div className="mt-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 font-semibold">Welcome to your dashboard!</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .progress-ring-circle {
          transition: stroke-dashoffset 0.5s ease-in-out;
        }
        
        /* Pulsing animation for the progress ring */
        .progress-ring-circle {
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4));
        }
        
        /* Smooth scaling animation for step indicators */
        .step-indicator {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  )
}