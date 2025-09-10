import { useState, useEffect } from 'react'

/**
 * Hook to safely format dates/times without causing hydration mismatches
 * Returns a client-side only time string to prevent SSR/CSR differences
 */
export function useSafeTime(date: Date | string, format: 'time' | 'date' | 'datetime' = 'time') {
  const [isClient, setIsClient] = useState(false)
  const [formattedTime, setFormattedTime] = useState<string>('--:--:--')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      setFormattedTime('Invalid Date')
      return
    }

    switch (format) {
      case 'time':
        setFormattedTime(dateObj.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }))
        break
      case 'date':
        setFormattedTime(dateObj.toLocaleDateString())
        break
      case 'datetime':
        setFormattedTime(dateObj.toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))
        break
      default:
        setFormattedTime(dateObj.toLocaleTimeString())
    }
  }, [isClient, date, format])

  return formattedTime
}

/**
 * Hook for relative time formatting (e.g., "2 minutes ago")
 */
export function useRelativeTime(date: Date | string) {
  const [isClient, setIsClient] = useState(false)
  const [relativeTime, setRelativeTime] = useState<string>('--')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      setRelativeTime('Invalid Date')
      return
    }

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) {
      setRelativeTime('Just now')
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      setRelativeTime(`${minutes} minute${minutes !== 1 ? 's' : ''} ago`)
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      setRelativeTime(`${hours} hour${hours !== 1 ? 's' : ''} ago`)
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      setRelativeTime(`${days} day${days !== 1 ? 's' : ''} ago`)
    }
  }, [isClient, date])

  return relativeTime
}
