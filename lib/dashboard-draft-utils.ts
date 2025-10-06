/**
 * Dashboard utilities for handling booking drafts
 * Provides functions to check for pending drafts and manage draft-aware navigation
 */

import { getBookingDraft } from './booking-draft'

export interface DraftStatus {
  hasDraft: boolean
  draftId?: string
  draftData?: any
  isExpired?: boolean
}

/**
 * Check if user has a pending booking draft
 */
export async function checkDraftStatus(): Promise<DraftStatus> {
  try {
    // First, check localStorage for draft ID (local device)
    const localDraftId = typeof window !== 'undefined' 
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith('booking_draft_id='))
          ?.split('=')[1]
      : null

    if (localDraftId) {
      const draft = await getBookingDraft(localDraftId)
      
      if (draft) {
        // Check if draft is expired
        const now = new Date()
        const expiresAt = new Date(draft.expiresAt)
        const isExpired = now > expiresAt

        return {
          hasDraft: !isExpired,
          draftId: localDraftId,
          draftData: draft,
          isExpired
        }
      }
    }

    // If no local draft found, check server for user's drafts (cross-device)
    try {
      const response = await fetch('/api/bookings/drafts/user-drafts', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.drafts && data.drafts.length > 0) {
          // Get the most recent draft
          const latestDraft = data.drafts[0]
          
          // Check if draft is expired
          const now = new Date()
          const expiresAt = new Date(latestDraft.expiresAt)
          const isExpired = now > expiresAt

          return {
            hasDraft: !isExpired,
            draftId: latestDraft.id,
            draftData: latestDraft,
            isExpired
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check server drafts:', error)
    }

    return { hasDraft: false }
  } catch (error) {
    console.error('Error checking draft status:', error)
    return { hasDraft: false }
  }
}

/**
 * Get the appropriate booking URL based on draft status
 */
export async function getBookingUrl(): Promise<{ url: string; isResume: boolean; label: string }> {
  const draftStatus = await checkDraftStatus()
  
  if (draftStatus.hasDraft) {
    return {
      url: `/book-service?resume=true&draftId=${draftStatus.draftId}`,
      isResume: true,
      label: 'Resume Booking'
    }
  } else {
    return {
      url: '/book-service',
      isResume: false,
      label: 'New Booking'
    }
  }
}

/**
 * Handle booking navigation with draft awareness
 */
export async function handleBookingNavigation(): Promise<void> {
  const bookingInfo = await getBookingUrl()
  window.location.href = bookingInfo.url
}

/**
 * Get draft status for dashboard display
 */
export function getDraftDisplayInfo(draftStatus: DraftStatus): {
  showResumeButton: boolean
  showNewBookingButton: boolean
  resumeLabel: string
  newBookingLabel: string
} {
  if (draftStatus.hasDraft) {
    return {
      showResumeButton: true,
      showNewBookingButton: false,
      resumeLabel: 'Resume Booking',
      newBookingLabel: 'New Booking'
    }
  } else {
    return {
      showResumeButton: false,
      showNewBookingButton: true,
      resumeLabel: 'Resume Booking',
      newBookingLabel: 'New Booking'
    }
  }
}
