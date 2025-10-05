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
    // Check localStorage for draft ID
    const draftId = typeof window !== 'undefined' 
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith('booking_draft_id='))
          ?.split('=')[1]
      : null

    if (!draftId) {
      return { hasDraft: false }
    }

    // Get the draft data
    const draft = await getBookingDraft(draftId)
    
    if (!draft) {
      return { hasDraft: false, isExpired: true }
    }

    // Check if draft is expired
    const now = new Date()
    const expiresAt = new Date(draft.expiresAt)
    const isExpired = now > expiresAt

    return {
      hasDraft: !isExpired,
      draftId,
      draftData: draft,
      isExpired
    }
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
      url: `/booking/resume?draftId=${draftStatus.draftId}`,
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
