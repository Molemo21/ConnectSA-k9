import { formatBookingDate, parseBookingTime, calculateBookingDuration, isBookingTimeValid, getBookingStatusColor, formatBookingAddress } from '@/lib/date-utils'

describe('Date Utils', () => {
  describe('formatBookingDate', () => {
    it('should format booking date correctly', () => {
      const date = new Date('2024-12-25T14:30:00Z')
      const formatted = formatBookingDate(date)
      expect(formatted).toMatch(/25 Dec 2024/)
    })

    it('should handle different date formats', () => {
      const date = new Date('2024-01-01T09:00:00Z')
      const formatted = formatBookingDate(date)
      expect(formatted).toMatch(/1 Jan 2024/)
    })
  })

  describe('parseBookingTime', () => {
    it('should parse booking time correctly', () => {
      const time = '14:30'
      const parsed = parseBookingTime(time)
      expect(parsed.getHours()).toBe(14)
      expect(parsed.getMinutes()).toBe(30)
    })

    it('should handle 24-hour format', () => {
      const time = '09:15'
      const parsed = parseBookingTime(time)
      expect(parsed.getHours()).toBe(9)
      expect(parsed.getMinutes()).toBe(15)
    })

    it('should handle midnight', () => {
      const time = '00:00'
      const parsed = parseBookingTime(time)
      expect(parsed.getHours()).toBe(0)
      expect(parsed.getMinutes()).toBe(0)
    })
  })

  describe('calculateBookingDuration', () => {
    it('should calculate duration correctly', () => {
      const start = new Date('2024-12-25T14:00:00Z')
      const end = new Date('2024-12-25T16:00:00Z')
      const duration = calculateBookingDuration(start, end)
      expect(duration).toBe(2) // 2 hours
    })

    it('should handle same start and end time', () => {
      const time = new Date('2024-12-25T14:00:00Z')
      const duration = calculateBookingDuration(time, time)
      expect(duration).toBe(0)
    })

    it('should handle negative duration', () => {
      const start = new Date('2024-12-25T16:00:00Z')
      const end = new Date('2024-12-25T14:00:00Z')
      const duration = calculateBookingDuration(start, end)
      expect(duration).toBe(-2)
    })
  })

  describe('isBookingTimeValid', () => {
    it('should validate booking time within business hours', () => {
      const time = new Date('2024-12-25T14:00:00Z')
      expect(isBookingTimeValid(time)).toBe(true)
    })

    it('should reject booking time outside business hours', () => {
      const earlyTime = new Date('2024-12-25T05:00:00Z')
      const lateTime = new Date('2024-12-25T23:00:00Z')
      
      expect(isBookingTimeValid(earlyTime)).toBe(false)
      expect(isBookingTimeValid(lateTime)).toBe(false)
    })

    it('should reject weekend bookings', () => {
      const saturday = new Date('2024-12-21T14:00:00Z') // Saturday
      const sunday = new Date('2024-12-22T14:00:00Z') // Sunday
      
      expect(isBookingTimeValid(saturday)).toBe(false)
      expect(isBookingTimeValid(sunday)).toBe(false)
    })
  })

  describe('getBookingStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getBookingStatusColor('PENDING')).toBe('yellow')
      expect(getBookingStatusColor('CONFIRMED')).toBe('green')
      expect(getBookingStatusColor('IN_PROGRESS')).toBe('blue')
      expect(getBookingStatusColor('COMPLETED')).toBe('green')
      expect(getBookingStatusColor('CANCELLED')).toBe('red')
    })

    it('should return default color for unknown status', () => {
      expect(getBookingStatusColor('UNKNOWN_STATUS')).toBe('gray')
    })
  })

  describe('formatBookingAddress', () => {
    it('should format address correctly', () => {
      const address = '123 Test Street, Cape Town, Western Cape, 8001'
      const formatted = formatBookingAddress(address)
      expect(formatted).toContain('123 Test Street')
      expect(formatted).toContain('Cape Town')
    })

    it('should handle short addresses', () => {
      const address = '123 Test Street'
      const formatted = formatBookingAddress(address)
      expect(formatted).toBe('123 Test Street')
    })

    it('should handle empty address', () => {
      const formatted = formatBookingAddress('')
      expect(formatted).toBe('Address not provided')
    })
  })
})
