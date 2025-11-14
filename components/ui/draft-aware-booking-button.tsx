"use client"

import { useState, useEffect } from 'react'
import { LoadingButton as EnhancedButton } from './enhanced-loading-button'
import { useButtonNavigation } from '@/hooks/use-button-navigation'
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
  const { handleNavigation, buttonLoading } = useButtonNavigation()
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
        // Use navigation hook for consistent behavior
        await handleNavigation(bookingInfo.url, 'draftAwareBooking')
      }
    } catch (error) {
      console.error('Error navigating to booking:', error)
      // Fallback to regular booking page
      await handleNavigation('/book-service', 'draftAwareBooking')
    }
  }

  if (isLoading) {
    return (
      <EnhancedButton 
        variant={variant} 
        size={size} 
        className={className}
        disabled
        loading={true}
        loadingText="Loading..."
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </EnhancedButton>
    )
  }

  const displayInfo = getDraftDisplayInfo(draftStatus)
  const Icon = displayInfo.showResumeButton ? RotateCcw : Plus
  const isLoadingButton = buttonLoading === 'draftAwareBooking'

  return (
    <EnhancedButton 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleClick}
      loading={isLoadingButton}
      loadingText="Loading..."
    >
      {showIcon && <Icon className="w-4 h-4 mr-2" />}
      {children || displayInfo.showResumeButton ? displayInfo.resumeLabel : displayInfo.newBookingLabel}
    </EnhancedButton>
  )
}
