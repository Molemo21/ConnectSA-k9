"use client"

import dynamic from "next/dynamic"

const Toaster = dynamic(() => import("@/components/ui/toaster").then(mod => ({ default: mod.Toaster })), {
  ssr: false,
  loading: () => null,
  onError: (error) => {
    console.error("Failed to load Toaster component:", error)
  }
})

export function ToasterWrapper() {
  return <Toaster />
} 