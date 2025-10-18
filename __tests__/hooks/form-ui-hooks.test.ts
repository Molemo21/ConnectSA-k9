import { renderHook, waitFor } from '@testing-library/react'
import { useFormValidation } from '@/hooks/use-form-validation'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('Form and UI Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useFormValidation', () => {
    it('should validate form fields correctly', () => {
      const { result } = renderHook(() => useFormValidation({
        name: { required: true, minLength: 2 },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        phone: { required: true, pattern: /^\+?[\d\s-()]+$/ }
      }))

      expect(result.current.validateField).toBeDefined()
      expect(result.current.validateForm).toBeDefined()
      expect(result.current.errors).toEqual({})
    })

    it('should validate required fields', () => {
      const { result } = renderHook(() => useFormValidation({
        name: { required: true },
        email: { required: true }
      }))

      const errors = result.current.validateForm({ name: '', email: 'test@example.com' })
      
      expect(errors.name).toBe('This field is required')
      expect(errors.email).toBeUndefined()
    })

    it('should validate field patterns', () => {
      const { result } = renderHook(() => useFormValidation({
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      }))

      const errors = result.current.validateForm({ email: 'invalid-email' })
      
      expect(errors.email).toBe('Invalid format')
    })

    it('should validate minimum length', () => {
      const { result } = renderHook(() => useFormValidation({
        name: { minLength: 3 }
      }))

      const errors = result.current.validateForm({ name: 'ab' })
      
      expect(errors.name).toBe('Minimum length is 3 characters')
    })
  })

  describe('useAutoSave', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should auto-save data after delay', async () => {
      const mockSaveFunction = jest.fn().mockResolvedValue(true)
      
      const { result } = renderHook(() => useAutoSave(mockSaveFunction, 1000))

      result.current.saveData({ name: 'John Doe', email: 'john@example.com' })
      
      expect(mockSaveFunction).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockSaveFunction).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com'
        })
      })
    })

    it('should debounce multiple save calls', async () => {
      const mockSaveFunction = jest.fn().mockResolvedValue(true)
      
      const { result } = renderHook(() => useAutoSave(mockSaveFunction, 1000))

      result.current.saveData({ name: 'John' })
      result.current.saveData({ name: 'John Doe' })
      result.current.saveData({ name: 'John Doe', email: 'john@example.com' })
      
      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockSaveFunction).toHaveBeenCalledTimes(1)
        expect(mockSaveFunction).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com'
        })
      })
    })
  })

  describe('useMobile', () => {
    it('should detect mobile device', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      })

      const { result } = renderHook(() => useMobile())

      expect(result.current.isMobile).toBe(true)
    })

    it('should detect desktop device', () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      })

      const { result } = renderHook(() => useMobile())

      expect(result.current.isMobile).toBe(false)
    })

    it('should detect screen size changes', () => {
      const { result } = renderHook(() => useMobile())

      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      expect(result.current.isMobile).toBe(true)

      // Mock large screen
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
      })

      window.dispatchEvent(new Event('resize'))

      expect(result.current.isMobile).toBe(false)
    })
  })

  describe('useToast', () => {
    it('should show toast message', () => {
      const { result } = renderHook(() => useToast())

      expect(result.current.showToast).toBeDefined()
      
      result.current.showToast('Test message', 'success')
      
      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].message).toBe('Test message')
      expect(result.current.toasts[0].type).toBe('success')
    })

    it('should remove toast after duration', async () => {
      jest.useFakeTimers()
      
      const { result } = renderHook(() => useToast())

      result.current.showToast('Test message', 'success', 1000)
      expect(result.current.toasts).toHaveLength(1)

      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(0)
      })

      jest.useRealTimers()
    })

    it('should dismiss toast manually', () => {
      const { result } = renderHook(() => useToast())

      result.current.showToast('Test message', 'success')
      expect(result.current.toasts).toHaveLength(1)

      result.current.dismissToast(result.current.toasts[0].id)
      expect(result.current.toasts).toHaveLength(0)
    })
  })
})
