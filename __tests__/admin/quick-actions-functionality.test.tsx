/**
 * Quick Actions Functionality Tests
 * Tests that all Quick Action buttons navigate correctly and display real data
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MainContentAdmin } from '@/components/admin/main-content-admin'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock toast
jest.mock('@/lib/toast', () => ({
  showToast: jest.fn(),
}))

// Mock enhanced components
jest.mock('@/components/admin/admin-user-management-enhanced', () => ({
  AdminUserManagementEnhanced: () => <div data-testid="user-management">User Management Component</div>,
}))

jest.mock('@/components/admin/admin-provider-management-enhanced', () => ({
  AdminProviderManagementEnhanced: () => <div data-testid="provider-management">Provider Management Component</div>,
}))

jest.mock('@/components/admin/admin-payment-management', () => ({
  AdminPaymentManagement: () => <div data-testid="payment-management">Payment Management Component</div>,
}))

jest.mock('@/components/admin/admin-analytics', () => ({
  AdminAnalytics: () => <div data-testid="analytics">Analytics Component</div>,
}))

jest.mock('@/components/admin/admin-system-health', () => ({
  __esModule: true,
  default: () => <div data-testid="system-health">System Health Component</div>,
}))

describe('Admin Quick Actions Functionality', () => {
  const mockUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
  }

  const mockStats = {
    totalUsers: 18,
    totalProviders: 3,
    pendingProviders: 2,
    totalBookings: 62,
    completedBookings: 23,
    cancelledBookings: 0,
    totalRevenue: 4731,
    pendingRevenue: 0,
    escrowRevenue: 0,
    averageRating: 4.08,
    totalPayments: 51,
    pendingPayments: 1,
    escrowPayments: 27,
    completedPayments: 23,
    failedPayments: 0,
    totalPayouts: 23,
    pendingPayouts: 0,
    completedPayouts: 1,
  }

  const mockSetActiveSection = jest.fn()
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should render Overview section by default', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByText(/Welcome back, Admin User!/i)).toBeInTheDocument()
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
    expect(screen.getByText('Approve Providers')).toBeInTheDocument()
    expect(screen.getByText('View Bookings')).toBeInTheDocument()
    expect(screen.getByText('Manage Payments')).toBeInTheDocument()
  })

  it('should navigate to Users section when "Manage Users" is clicked', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    const manageUsersButton = screen.getByText('Manage Users')
    fireEvent.click(manageUsersButton)

    expect(mockSetActiveSection).toHaveBeenCalledWith('users')
  })

  it('should display User Management component when in Users section', () => {
    render(
      <MainContentAdmin
        activeSection="users"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByTestId('user-management')).toBeInTheDocument()
    expect(screen.getByText('User Management Component')).toBeInTheDocument()
  })

  it('should navigate to Providers section when "Approve Providers" is clicked', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    const approveProvidersButton = screen.getByText('Approve Providers')
    fireEvent.click(approveProvidersButton)

    expect(mockSetActiveSection).toHaveBeenCalledWith('providers')
  })

  it('should display Provider Management component when in Providers section', () => {
    render(
      <MainContentAdmin
        activeSection="providers"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByTestId('provider-management')).toBeInTheDocument()
    expect(screen.getByText('Provider Management Component')).toBeInTheDocument()
  })

  it('should navigate to Bookings section when "View Bookings" is clicked', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    const viewBookingsButton = screen.getByText('View Bookings')
    fireEvent.click(viewBookingsButton)

    expect(mockSetActiveSection).toHaveBeenCalledWith('bookings')
  })

  it('should display Booking Overview with real stats when in Bookings section', () => {
    render(
      <MainContentAdmin
        activeSection="bookings"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByText('Booking Overview')).toBeInTheDocument()
    expect(screen.getByText('62')).toBeInTheDocument() // Total bookings
    expect(screen.getByText('23')).toBeInTheDocument() // Completed bookings
  })

  it('should navigate to Payments section when "Manage Payments" is clicked', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    const managePaymentsButton = screen.getByText('Manage Payments')
    fireEvent.click(managePaymentsButton)

    expect(mockSetActiveSection).toHaveBeenCalledWith('payments')
  })

  it('should display Payment Management component when in Payments section', () => {
    render(
      <MainContentAdmin
        activeSection="payments"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByTestId('payment-management')).toBeInTheDocument()
    expect(screen.getByText('Payment Management Component')).toBeInTheDocument()
  })

  it('should display Analytics component when in Analytics section', () => {
    render(
      <MainContentAdmin
        activeSection="analytics"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByTestId('analytics')).toBeInTheDocument()
    expect(screen.getByText('Analytics Component')).toBeInTheDocument()
  })

  it('should display System Health component when in System section', () => {
    render(
      <MainContentAdmin
        activeSection="system"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByTestId('system-health')).toBeInTheDocument()
    expect(screen.getByText('System Health Component')).toBeInTheDocument()
  })

  it('should display correct revenue in Overview section', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    // Revenue should be formatted as South African Rand
    expect(screen.getByText(/R\s*4[,\s]*731/)).toBeInTheDocument()
  })

  it('should show all stats cards in Overview section', () => {
    render(
      <MainContentAdmin
        activeSection="overview"
        setActiveSection={mockSetActiveSection}
        user={mockUser}
        stats={mockStats}
        onRefresh={mockOnRefresh}
        isRefreshing={false}
      />
    )

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Total Providers')).toBeInTheDocument()
    expect(screen.getByText('Pending Providers')).toBeInTheDocument()
    expect(screen.getByText('Total Bookings')).toBeInTheDocument()
    expect(screen.getByText('Completed Bookings')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Average Rating')).toBeInTheDocument()
    expect(screen.getByText('Total Payments')).toBeInTheDocument()
  })
})
