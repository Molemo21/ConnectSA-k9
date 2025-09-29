"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

interface FullPageLoadingOverlayProps {
  isVisible: boolean
  message?: string
  subMessage?: string
}

export function FullPageLoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  subMessage = "Please wait while we prepare your experience" 
}: FullPageLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        >
          {/* Background image similar to booking page */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-zoom-in"
            style={{ backgroundImage: "url('/onboarding.jpg')" }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/70" />
          
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
              >
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2"
              >
                {message}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/80"
              >
                {subMessage}
              </motion.p>
              
              {/* Enhanced loading skeleton similar to booking page */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 space-y-4 max-w-md mx-auto"
              >
                {/* Loading skeleton bars */}
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 bg-white/5 rounded animate-pulse w-3/4 mx-auto" />
                  <div className="h-4 bg-white/10 rounded animate-pulse w-1/2 mx-auto" />
                </div>
                
                {/* Progress indicator */}
                <div className="flex justify-center space-x-2 mt-6">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
