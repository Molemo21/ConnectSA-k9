"use client"

import * as React from "react"

interface SimpleToast {
  id: string
  message: string
  type?: 'success' | 'error' | 'info'
}

interface SimpleToasterProps {
  toasts?: SimpleToast[]
}

export function SimpleToaster({ toasts = [] }: SimpleToasterProps) {
  if (!toasts || toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg max-w-sm ${
            toast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
} 