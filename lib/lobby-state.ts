/**
 * Lobby State Management
 * 
 * Tracks when a user is in the booking lobby and manages state persistence
 * across login/logout cycles. Inspired by Uber/Airbnb patterns.
 */

export interface LobbyState {
  bookingId: string
  enteredAt: string // ISO timestamp
  status: string // Booking status when entered lobby
  serviceName?: string
  providerName?: string
}

const LOBBY_STATE_KEY = 'activeLobbyBooking'
const LOBBY_STATE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Save lobby state to localStorage
 */
export function saveLobbyState(state: LobbyState): void {
  if (typeof window === 'undefined') return

  try {
    const stateWithExpiry = {
      ...state,
      expiresAt: Date.now() + LOBBY_STATE_EXPIRY
    }
    localStorage.setItem(LOBBY_STATE_KEY, JSON.stringify(stateWithExpiry))
    console.log('💾 Lobby state saved:', state.bookingId)
  } catch (error) {
    console.error('Failed to save lobby state:', error)
  }
}

/**
 * Get lobby state from localStorage
 */
export function getLobbyState(): LobbyState | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(LOBBY_STATE_KEY)
    if (!stored) return null

    const stateWithExpiry = JSON.parse(stored)
    
    // Check if expired
    if (stateWithExpiry.expiresAt && Date.now() > stateWithExpiry.expiresAt) {
      console.log('⏰ Lobby state expired, removing')
      localStorage.removeItem(LOBBY_STATE_KEY)
      return null
    }

    // Remove expiry from returned state
    const { expiresAt, ...state } = stateWithExpiry
    return state as LobbyState
  } catch (error) {
    console.error('Failed to get lobby state:', error)
    return null
  }
}

/**
 * Clear lobby state from localStorage
 */
export function clearLobbyState(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(LOBBY_STATE_KEY)
    console.log('🗑️ Lobby state cleared')
  } catch (error) {
    console.error('Failed to clear lobby state:', error)
  }
}

/**
 * Update lobby state (e.g., when booking status changes)
 */
export function updateLobbyState(updates: Partial<LobbyState>): void {
  const current = getLobbyState()
  if (!current) return

  saveLobbyState({
    ...current,
    ...updates
  })
}

/**
 * Check if user has an active lobby state
 */
export function hasActiveLobbyState(): boolean {
  return getLobbyState() !== null
}
