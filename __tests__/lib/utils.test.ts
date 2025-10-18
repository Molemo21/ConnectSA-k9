import { cn, sendEmail, generateSecureToken } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
      expect(cn('class1', false, 'class2')).toBe('class1 class2')
      expect(cn('class1', null, 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', { 'active': true, 'disabled': false })).toBe('base active')
      expect(cn('base', { 'active': false, 'disabled': true })).toBe('base disabled')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })
  })

  describe('sendEmail', () => {
    it('should log email in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      })

      expect(result).toEqual({ success: true, dev: true })
      expect(consoleSpy).toHaveBeenCalledWith('DEV EMAIL LOG:')
      expect(consoleSpy).toHaveBeenCalledWith('To:', 'test@example.com')
      expect(consoleSpy).toHaveBeenCalledWith('Subject:', 'Test Subject')
      expect(consoleSpy).toHaveBeenCalledWith('HTML:', '<p>Test HTML</p>')
      
      consoleSpy.mockRestore()
    })

    it('should handle different email formats', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await sendEmail({
        to: 'user.name+tag@domain.co.za',
        subject: 'Complex Subject',
        html: '<h1>Complex HTML</h1><p>With multiple elements</p>'
      })

      expect(consoleSpy).toHaveBeenCalledWith('To:', 'user.name+tag@domain.co.za')
      expect(consoleSpy).toHaveBeenCalledWith('Subject:', 'Complex Subject')
      
      consoleSpy.mockRestore()
    })
  })

  describe('generateSecureToken', () => {
    it('should generate tokens of default length', () => {
      const token = generateSecureToken()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex characters
    })

    it('should generate tokens of custom length', () => {
      const token = generateSecureToken(16)
      expect(typeof token).toBe('string')
      expect(token.length).toBe(32) // 16 bytes = 32 hex characters
    })

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate valid hex tokens', () => {
      const token = generateSecureToken()
      expect(token).toMatch(/^[0-9a-f]+$/)
    })

    it('should handle zero length', () => {
      const token = generateSecureToken(0)
      expect(token).toBe('')
    })
  })
})
