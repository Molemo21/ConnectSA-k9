/**
 * Booking Draft Management Utility
 * 
 * Handles saving, retrieving, and managing booking drafts across authentication flows.
 * Uses both localStorage for immediate persistence and server-side storage for reliability.
 */

import { v4 as uuidv4 } from 'uuid'

export interface BookingDraft {
  id: string
  serviceId: string
  date: string
  time: string
  address: string
  notes?: string
  createdAt: string
  expiresAt: string
  userId?: string // Set after user authentication
}

export interface BookingDraftResponse {
  success: boolean
  draft?: BookingDraft
  error?: string
}

const DRAFT_EXPIRY_DAYS = 7
const LOCAL_STORAGE_KEY = 'booking_draft'
const DRAFT_ID_COOKIE = 'booking_draft_id'

/**
 * Generate a new draft ID
 */
export function generateDraftId(): string {
  return uuidv4()
}

/**
 * Set draft ID in cookie for server-side access
 */
export function setDraftIdCookie(draftId: string): void {
  if (typeof document === 'undefined') return
  
  const expires = new Date()
  expires.setDate(expires.getDate() + DRAFT_EXPIRY_DAYS)
  
  document.cookie = `${DRAFT_ID_COOKIE}=${draftId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Get draft ID from cookie
 */
export function getDraftIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const draftCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${DRAFT_ID_COOKIE}=`)
  )
  
  return draftCookie ? draftCookie.split('=')[1] : null
}

/**
 * Clear draft ID cookie
 */
export function clearDraftIdCookie(): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${DRAFT_ID_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * Save booking draft to localStorage
 */
export function saveDraftToLocalStorage(draft: BookingDraft): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft))
    console.log('📝 Draft saved to localStorage:', draft.id)
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error)
  }
}

/**
 * Get booking draft from localStorage
 */
export function getDraftFromLocalStorage(): BookingDraft | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!stored) return null
    
    const draft: BookingDraft = JSON.parse(stored)
    
    // Check if draft has expired
    if (new Date(draft.expiresAt) < new Date()) {
      console.log('⏰ Draft expired, removing from localStorage')
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      return null
    }
    
    return draft
  } catch (error) {
    console.error('Failed to get draft from localStorage:', error)
    return null
  }
}

/**
 * Clear booking draft from localStorage
 */
export function clearDraftFromLocalStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    console.log('🗑️ Draft cleared from localStorage')
  } catch (error) {
    console.error('Failed to clear draft from localStorage:', error)
  }
}

/**
 * Create a new booking draft
 */
export function createBookingDraft(bookingData: {
  serviceId: string
  date: string
  time: string
  address: string
  notes?: string
}): BookingDraft {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000))
  
  const draft: BookingDraft = {
    id: generateDraftId(),
    ...bookingData,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  }
  
  return draft
}

/**
 * Save draft to server
 */
export async function saveDraftToServer(draft: BookingDraft): Promise<BookingDraftResponse> {
  try {
    const response = await fetch('/api/bookings/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draft)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to save draft to server'
      }
    }
    
    return {
      success: true,
      draft: data.draft
    }
  } catch (error) {
    console.error('Failed to save draft to server:', error)
    return {
      success: false,
      error: 'Network error while saving draft'
    }
  }
}

/**
 * Get draft from server by ID
 */
export async function getDraftFromServer(draftId: string): Promise<BookingDraftResponse> {
  try {
    const response = await fetch(`/api/bookings/drafts/${draftId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get draft from server'
      }
    }
    
    return {
      success: true,
      draft: data.draft
    }
  } catch (error) {
    console.error('Failed to get draft from server:', error)
    return {
      success: false,
      error: 'Network error while getting draft'
    }
  }
}

/**
 * Merge draft with user after authentication
 */
export async function mergeDraftWithUser(draftId: string, userId: string): Promise<BookingDraftResponse> {
  try {
    const response = await fetch(`/api/bookings/drafts/${draftId}/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to merge draft with user'
      }
    }
    
    return {
      success: true,
      draft: data.draft
    }
  } catch (error) {
    console.error('Failed to merge draft with user:', error)
    return {
      success: false,
      error: 'Network error while merging draft'
    }
  }
}

/**
 * Delete draft from server
 */
export async function deleteDraftFromServer(draftId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/bookings/drafts/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || 'Failed to delete draft from server'
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete draft from server:', error)
    return {
      success: false,
      error: 'Network error while deleting draft'
    }
  }
}

/**
 * Save booking draft (both locally and to server)
 */
export async function saveBookingDraft(bookingData: {
  serviceId: string
  date: string
  time: string
  address: string
  notes?: string
}): Promise<BookingDraft> {
  const draft = createBookingDraft(bookingData)
  
  // Save to localStorage immediately
  saveDraftToLocalStorage(draft)
  
  // Set cookie for server-side access
  setDraftIdCookie(draft.id)
  
  // Save to server (blocking - required for cross-device compatibility)
  try {
    const serverResult = await saveDraftToServer(draft)
    if (!serverResult.success) {
      throw new Error(serverResult.error || 'Failed to save draft to server')
    }
    console.log('✅ Draft saved to server successfully')
  } catch (error) {
    console.error('❌ Failed to save draft to server:', error)
    // Clean up local storage and cookie since server save failed
    clearDraftFromLocalStorage()
    clearDraftIdCookie()
    throw new Error(`Failed to save booking draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return draft
}

/**
 * Get booking draft (try server first, fallback to localStorage)
 */
export async function getBookingDraft(draftId?: string): Promise<BookingDraft | null> {
  // If no draftId provided, try to get from cookie
  if (!draftId) {
    draftId = getDraftIdFromCookie()
  }
  
  // Try server first if we have a draftId
  if (draftId) {
    try {
      const serverResult = await getDraftFromServer(draftId)
      if (serverResult.success && serverResult.draft) {
        console.log('✅ Draft retrieved from server')
        return serverResult.draft
      }
    } catch (error) {
      console.warn('⚠️ Failed to get draft from server, trying localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  const localDraft = getDraftFromLocalStorage()
  if (localDraft) {
    console.log('✅ Draft retrieved from localStorage')
    return localDraft
  }
  
  console.log('❌ No draft found')
  return null
}

/**
 * Clear booking draft (both locally and from server)
 */
export async function clearBookingDraft(draftId?: string): Promise<void> {
  // Clear localStorage
  clearDraftFromLocalStorage()
  
  // Clear cookie
  clearDraftIdCookie()
  
  // Try to delete from server if we have a draftId
  if (draftId) {
    try {
      await deleteDraftFromServer(draftId)
      console.log('✅ Draft deleted from server')
    } catch (error) {
      console.warn('⚠️ Failed to delete draft from server:', error)
    }
  }
  
  console.log('🗑️ Draft cleared completely')
}

/**
 * Check if user has a pending draft
 */
export async function hasPendingDraft(): Promise<boolean> {
  const draft = await getBookingDraft()
  return draft !== null
}

/**
 * Get the current draft ID from cookie or localStorage
 */
export function getCurrentDraftId(): string | null {
  // Try cookie first
  const cookieDraftId = getDraftIdFromCookie()
  if (cookieDraftId) return cookieDraftId
  
  // Fallback to localStorage
  const localDraft = getDraftFromLocalStorage()
  return localDraft?.id || null
}
