import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModernBookingForm } from '@/components/book-service/ModernBookingForm'
import { SERVICE_CATEGORIES } from '@/config/service-categories'

// Mock the service API response
const mockServices = [
  {
    id: 'test-service-1',
    name: 'Haircut & Trim',
    description: 'Professional haircut service',
    category: 'HAIR_SERVICES',
    basePrice: 250,
    duration: 60,
    features: ['Consultation', 'Cut', 'Style']
  }
]

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockServices)
  })
) as jest.Mock

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: -33.9249,
        longitude: 18.4241
      }
    })
  )
}
global.navigator.geolocation = mockGeolocation

describe('ModernBookingForm', () => {
  const defaultProps = {
    value: {
      serviceId: '',
      date: '',
      time: '',
      address: '',
      notes: ''
    },
    onChange: jest.fn(),
    onNext: jest.fn(),
    onBack: jest.fn(),
    submitting: false,
    isAuthenticated: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Service Selection Step', () => {
    it('should render service categories correctly', () => {
      render(<ModernBookingForm {...defaultProps} />)
      
      // Check main categories
      Object.values(SERVICE_CATEGORIES).forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument()
      })
    })

    it('should handle service selection', async () => {
      const onChange = jest.fn()
      render(<ModernBookingForm {...defaultProps} onChange={onChange} />)

      // Select a service
      const service = mockServices[0]
      const serviceButton = await screen.findByText(service.name)
      fireEvent.click(serviceButton)

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        serviceId: service.id
      }))
    })

    it('should show service details after selection', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id
          }}
        />
      )

      const service = mockServices[0]
      await waitFor(() => {
        expect(screen.getByText(service.name)).toBeInTheDocument()
        expect(screen.getByText(service.description)).toBeInTheDocument()
        expect(screen.getByText(`R${service.basePrice}`)).toBeInTheDocument()
      })
    })
  })

  describe('Date & Time Step', () => {
    it('should validate date selection', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id
          }}
        />
      )

      // Move to date & time step
      const nextButton = screen.getByText('Continue')
      fireEvent.click(nextButton)

      // Try to continue without selecting date
      fireEvent.click(screen.getByText('Continue'))
      expect(screen.getByText('Select a date')).toBeInTheDocument()

      // Select a date
      const dateInput = screen.getByLabelText('Date')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      fireEvent.change(dateInput, {
        target: { value: tomorrow.toISOString().split('T')[0] }
      })

      expect(screen.queryByText('Select a date')).not.toBeInTheDocument()
    })

    it('should show available time slots', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id,
            date: new Date().toISOString().split('T')[0]
          }}
        />
      )

      // Move to date & time step
      fireEvent.click(screen.getByText('Continue'))

      // Check time slots
      const timeSlots = ['09:00', '09:30', '10:00', '10:30']
      timeSlots.forEach(time => {
        expect(screen.getByText(time)).toBeInTheDocument()
      })
    })
  })

  describe('Address Step', () => {
    it('should handle current location', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id,
            date: new Date().toISOString().split('T')[0],
            time: '09:00'
          }}
        />
      )

      // Move to address step
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))

      // Click use current location
      fireEvent.click(screen.getByText('Use my current location'))

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled()
      })
    })

    it('should validate address input', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id,
            date: new Date().toISOString().split('T')[0],
            time: '09:00'
          }}
        />
      )

      // Move to address step
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))

      // Try to continue without address
      fireEvent.click(screen.getByText('Continue'))
      expect(screen.getByText('Address is required')).toBeInTheDocument()

      // Enter address
      const addressInput = screen.getByPlaceholderText(/Enter your full address/i)
      fireEvent.change(addressInput, {
        target: { value: '123 Test Street, Cape Town' }
      })

      expect(screen.queryByText('Address is required')).not.toBeInTheDocument()
    })
  })

  describe('Notes Step', () => {
    it('should handle notes input', async () => {
      const onChange = jest.fn()
      render(
        <ModernBookingForm
          {...defaultProps}
          onChange={onChange}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id,
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            address: '123 Test Street, Cape Town'
          }}
        />
      )

      // Move to notes step
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))

      // Enter notes
      const notesInput = screen.getByPlaceholderText(/Any specific requirements/i)
      fireEvent.change(notesInput, {
        target: { value: 'Test booking notes' }
      })

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        notes: 'Test booking notes'
      }))
    })

    it('should enforce notes character limit', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id,
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            address: '123 Test Street, Cape Town'
          }}
        />
      )

      // Move to notes step
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))

      // Enter long notes
      const notesInput = screen.getByPlaceholderText(/Any specific requirements/i)
      const longText = 'a'.repeat(600)
      fireEvent.change(notesInput, {
        target: { value: longText }
      })

      expect(screen.getByText('500/500 characters')).toBeInTheDocument()
    })
  })

  describe('Review Step', () => {
    it('should display booking summary', async () => {
      const bookingData = {
        serviceId: mockServices[0].id,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        address: '123 Test Street, Cape Town',
        notes: 'Test booking notes'
      }

      render(
        <ModernBookingForm
          {...defaultProps}
          value={bookingData}
        />
      )

      // Move to review step
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText('Continue'))

      // Check summary
      await waitFor(() => {
        expect(screen.getByText(mockServices[0].name)).toBeInTheDocument()
        expect(screen.getByText(bookingData.date)).toBeInTheDocument()
        expect(screen.getByText(bookingData.time)).toBeInTheDocument()
        expect(screen.getByText(bookingData.address)).toBeInTheDocument()
        expect(screen.getByText(bookingData.notes)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should handle back button', async () => {
      const onBack = jest.fn()
      render(
        <ModernBookingForm
          {...defaultProps}
          onBack={onBack}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id
          }}
        />
      )

      // Move forward then back
      fireEvent.click(screen.getByText('Continue'))
      fireEvent.click(screen.getByText(/Previous/i))

      expect(screen.getByText(mockServices[0].name)).toBeInTheDocument()
    })

    it('should handle step indicators', async () => {
      render(
        <ModernBookingForm
          {...defaultProps}
          value={{
            ...defaultProps.value,
            serviceId: mockServices[0].id
          }}
        />
      )

      const steps = [
        'Choose Service',
        'Date & Time',
        'Address',
        'Notes',
        'Review'
      ]

      steps.forEach(step => {
        expect(screen.getByText(step)).toBeInTheDocument()
      })
    })
  })
})

