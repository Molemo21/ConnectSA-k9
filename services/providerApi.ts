"use client"

import { apiClient, ApiResponse } from '@/lib/api-client'

// Types
export interface Booking {
  id: string
  status: string
  serviceId: string
  clientId: string
  providerId: string
  scheduledDate: string
  scheduledTime: string
  address: string
  notes?: string
  totalAmount: number
  // Catalogue pricing fields (for accurate price display)
  bookedPrice?: number | null
  bookedCurrency?: string | null
  catalogueItemId?: string | null
  payment?: {
    id: string
    status: string
    amount: number
    method: string
  }
  createdAt: string
  updatedAt: string
}

export interface ProviderStats {
  pendingJobs: number
  confirmedJobs: number
  pendingExecutionJobs: number
  inProgressJobs: number
  completedJobs: number
  totalEarnings: number
  thisMonthEarnings: number
  averageRating: number
  totalReviews: number
}

export interface BankDetails {
  id: string
  providerId: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  branchCode: string
  accountType: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface ProviderProfile {
  id: string
  userId: string
  businessName: string
  description: string
  services: string[]
  location: string
  phoneNumber: string
  email: string
  website?: string
  isActive: boolean
  isVerified: boolean
  rating: number
  totalReviews: number
  createdAt: string
  updatedAt: string
}

// Provider API Service
export class ProviderApiService {
  // Bookings
  async getBookings(): Promise<ApiResponse<{ bookings: Booking[], stats: ProviderStats }>> {
    return apiClient.get('/api/provider/bookings')
  }

  async getBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return apiClient.get(`/api/book-service/${bookingId}`)
  }

  async acceptBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post(`/api/book-service/${bookingId}/accept`)
  }

  async declineBooking(bookingId: string, reason?: string): Promise<ApiResponse<Booking>> {
    return apiClient.post(`/api/book-service/${bookingId}/decline`, { reason })
  }

  async startJob(bookingId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post(`/api/book-service/${bookingId}/start`)
  }

  async completeJob(bookingId: string, data: { photos?: string[], notes?: string }): Promise<ApiResponse<Booking>> {
    return apiClient.post(`/api/book-service/${bookingId}/complete`, data)
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse<Booking>> {
    return apiClient.post(`/api/book-service/${bookingId}/cancel`, { reason })
  }

  // Bank Details
  async getBankDetails(providerId: string): Promise<ApiResponse<{ bankDetails: BankDetails, hasBankDetails: boolean }>> {
    return apiClient.get(`/api/provider/${providerId}/bank-details`)
  }

  async updateBankDetails(providerId: string, bankDetails: Partial<BankDetails>): Promise<ApiResponse<BankDetails>> {
    return apiClient.put(`/api/provider/${providerId}/bank-details`, bankDetails)
  }

  // Profile
  async getProfile(providerId: string): Promise<ApiResponse<ProviderProfile>> {
    return apiClient.get(`/api/provider/${providerId}`)
  }

  async updateProfile(providerId: string, profile: Partial<ProviderProfile>): Promise<ApiResponse<ProviderProfile>> {
    return apiClient.put(`/api/provider/${providerId}`, profile)
  }

  // Earnings
  async getEarnings(providerId: string, period?: string): Promise<ApiResponse<{ earnings: any[], total: number }>> {
    const params = period ? `?period=${period}` : ''
    return apiClient.get(`/api/provider/earnings${params}`)
  }

  // Reviews
  async getReviews(providerId: string): Promise<ApiResponse<{ reviews: any[], averageRating: number }>> {
    return apiClient.get(`/api/provider/reviews`)
  }

  // Settings
  async getSettings(providerId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/api/provider/settings`)
  }

  async updateSettings(providerId: string, settings: any): Promise<ApiResponse<any>> {
    return apiClient.put(`/api/provider/settings`, settings)
  }

  // Dashboard Data
  async getDashboardData(): Promise<ApiResponse<{ 
    bookings: Booking[], 
    stats: ProviderStats, 
    providerId: string,
    hasBankDetails: boolean 
  }>> {
    return apiClient.get('/api/provider/dashboard')
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string, timestamp: string }>> {
    return apiClient.get('/api/provider/health')
  }

  // Status
  async getStatus(): Promise<ApiResponse<{ status: string, isActive: boolean }>> {
    return apiClient.get('/api/provider/status')
  }

  async updateStatus(status: 'active' | 'inactive' | 'busy'): Promise<ApiResponse<{ status: string }>> {
    return apiClient.put('/api/provider/status', { status })
  }
}

// Create default instance
export const providerApi = new ProviderApiService()

// Export individual functions for convenience
export const {
  getBookings,
  getBooking,
  acceptBooking,
  declineBooking,
  startJob,
  completeJob,
  cancelBooking,
  getBankDetails,
  updateBankDetails,
  getProfile,
  updateProfile,
  getEarnings,
  getReviews,
  getSettings,
  updateSettings,
  getDashboardData,
  healthCheck,
  getStatus,
  updateStatus
} = providerApi
