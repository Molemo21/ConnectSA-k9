"use client"

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Plus, RotateCcw, Loader2 } from 'lucide-react'
import { checkDraftStatus, getDraftDisplayInfo, DraftStatus } from '@/lib/dashboard-draft-utils'

interface DraftAwareBookingButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  showIcon?: boolean
  onNavigate?: (url: string, isResume: boolean) => void
}

export function DraftAwareBookingButton({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  showIcon = true,
  onNavigate
}: DraftAwareBookingButtonProps) {
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({ hasDraft: false })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDraft = async () => {
      try {
        const status = await checkDraftStatus()
        setDraftStatus(status)
      } catch (error) {
        console.error('Error checking draft status:', error)
        setDraftStatus({ hasDraft: false })
      } finally {
        setIsLoading(false)
      }
    }

    checkDraft()
  }, [])

  const handleClick = async () => {
    try {
      const { getBookingUrl } = await import('@/lib/dashboard-draft-utils')
      const bookingInfo = await getBookingUrl()
      
      if (onNavigate) {
        onNavigate(bookingInfo.url, bookingInfo.isResume)
      } else {
        window.location.href = bookingInfo.url
      }
    } catch (error) {
      console.error('Error navigating to booking:', error)
      // Fallback to regular booking page
      window.location.href = '/book-service'
    }
  }

  if (isLoading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  const displayInfo = getDraftDisplayInfo(draftStatus)
  const Icon = displayInfo.showResumeButton ? RotateCcw : Plus

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleClick}
    >
      {showIcon && <Icon className="w-4 h-4 mr-2" />}
      {children || displayInfo.showResumeButton ? displayInfo.resumeLabel : displayInfo.newBookingLabel}
    </Button>
  )
}
