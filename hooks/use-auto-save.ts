import { useEffect, useRef, useCallback } from 'react'
import { useToast } from './use-toast'

interface UseAutoSaveOptions<T> {
  data: T
  onSave: (data: T) => Promise<void>
  saveInterval?: number // milliseconds
  localStorageKey?: string
  enableLocalStorage?: boolean
}

export function useAutoSave<T>({
  data,
  onSave,
  saveInterval = 5000, // 5 seconds
  localStorageKey = 'provider-onboarding-draft',
  enableLocalStorage = true
}: UseAutoSaveOptions<T>) {
  const { toast } = useToast()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedDataRef = useRef<string>('')
  const isSavingRef = useRef(false)

  // Save to localStorage
  const saveToLocalStorage = useCallback((data: T) => {
    if (!enableLocalStorage) return
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [localStorageKey, enableLocalStorage])

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    if (!enableLocalStorage) return null
    try {
      const saved = localStorage.getItem(localStorageKey)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
      return null
    }
  }, [localStorageKey, enableLocalStorage])

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    if (!enableLocalStorage) return
    try {
      localStorage.removeItem(localStorageKey)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }, [localStorageKey, enableLocalStorage])

  // Save data to API
  const saveToAPI = useCallback(async (data: T) => {
    if (isSavingRef.current) return
    
    try {
      isSavingRef.current = true
      await onSave(data)
      lastSavedDataRef.current = JSON.stringify(data)
      saveToLocalStorage(data)
      
      // Show subtle success indicator
      toast({
        title: "Progress saved",
        description: "Your progress has been automatically saved",
        duration: 2000,
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
      // Don't show error toast for auto-save failures to avoid spam
    } finally {
      isSavingRef.current = false
    }
  }, [onSave, saveToLocalStorage, toast])

  // Debounced save function
  const debouncedSave = useCallback((data: T) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      const currentDataString = JSON.stringify(data)
      if (currentDataString !== lastSavedDataRef.current) {
        saveToAPI(data)
      }
    }, saveInterval)
  }, [saveInterval, saveToAPI])

  // Auto-save effect
  useEffect(() => {
    const currentDataString = JSON.stringify(data)
    
    // Only save if data has actually changed
    if (currentDataString !== lastSavedDataRef.current) {
      debouncedSave(data)
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, debouncedSave])

  // Manual save function
  const manualSave = useCallback(async () => {
    await saveToAPI(data)
  }, [data, saveToAPI])

  return {
    loadFromLocalStorage,
    clearLocalStorage,
    manualSave,
    isSaving: isSavingRef.current
  }
}
