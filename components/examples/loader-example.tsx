"use client"

import React, { useState } from "react"
import { LoadingButton } from "@/components/ui/loading-button"
import { CircularLoader } from "@/components/ui/circular-loader"
import { Button } from "@/components/ui/button"

export function LoaderExample() {
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    // Simulate async operation
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Circular Loader Examples</h2>
      
      {/* Standalone Loader */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Standalone Loader</h3>
        <div className="flex items-center space-x-4">
          <CircularLoader size="sm" color="black" />
          <CircularLoader size="md" color="blue" />
          <CircularLoader size="lg" color="gray" />
        </div>
      </div>

      {/* Loading Button Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <LoadingButton
            loading={loading}
            loadingText="Processing..."
            onClick={handleClick}
            size="sm"
            loaderColor="white"
          >
            Small Button
          </LoadingButton>

          <LoadingButton
            loading={loading}
            loadingText="Loading..."
            onClick={handleClick}
            size="md"
            variant="outline"
            loaderColor="black"
          >
            Medium Button
          </LoadingButton>

          <LoadingButton
            loading={loading}
            loadingText="Please wait..."
            onClick={handleClick}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            loaderColor="white"
          >
            Large Button
          </LoadingButton>
        </div>
      </div>

      {/* Manual Toggle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Manual Toggle</h3>
        <Button onClick={handleClick} disabled={loading}>
          {loading ? "Loading..." : "Click me"}
        </Button>
      </div>
    </div>
  )
}











