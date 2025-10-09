import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceSelector } from '@/components/ui/service-selector';
import { SERVICES } from '@/config/services';

// Mock service data
const mockServices = SERVICES.map((service, index) => ({
  id: `service_${index}`,
  name: service.name,
  description: service.description || '',
  category: 'CLEANING',
  basePrice: service.basePrice || 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}));

describe('ServiceSelector Component', () => {
  const defaultProps = {
    services: mockServices,
    selectedServices: [],
    onServiceToggle: jest.fn(),
    maxSelections: 10,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all cleaning services', () => {
    render(<ServiceSelector {...defaultProps} />);

    // Check if all services are rendered
    mockServices.forEach(service => {
      expect(screen.getByText(service.name)).toBeInTheDocument();
      if (service.description) {
        expect(screen.getByText(service.description)).toBeInTheDocument();
      }
      if (service.basePrice) {
        expect(screen.getByText(`R${service.basePrice}`)).toBeInTheDocument();
      }
    });
  });

  it('handles service selection', () => {
    render(<ServiceSelector {...defaultProps} />);
    
    // Click the first service
    const firstService = mockServices[0];
    const serviceElement = screen.getByText(firstService.name);
    fireEvent.click(serviceElement);

    // Check if onServiceToggle was called with correct ID
    expect(defaultProps.onServiceToggle).toHaveBeenCalledWith(firstService.id);
  });

  it('respects maxSelections limit', () => {
    const maxSelections = 2;
    const selectedServices = [mockServices[0].id, mockServices[1].id]; // Already selected 2 services

    render(
      <ServiceSelector 
        {...defaultProps}
        selectedServices={selectedServices}
        maxSelections={maxSelections}
      />
    );

    // Try to select a third service
    const thirdService = mockServices[2];
    const serviceElement = screen.getByText(thirdService.name);
    fireEvent.click(serviceElement);

    // Check that onServiceToggle wasn't called
    expect(defaultProps.onServiceToggle).not.toHaveBeenCalled();
  });

  it('handles search functionality', () => {
    render(<ServiceSelector {...defaultProps} />);

    // Get the search input
    const searchInput = screen.getByPlaceholderText('Search services...');

    // Search for a specific service
    fireEvent.change(searchInput, { target: { value: mockServices[0].name } });

    // Should show the searched service
    expect(screen.getByText(mockServices[0].name)).toBeInTheDocument();

    // Other services should not be visible
    mockServices.slice(1).forEach(service => {
      expect(screen.queryByText(service.name)).not.toBeInTheDocument();
    });
  });

  it('shows no results message when search has no matches', () => {
    render(<ServiceSelector {...defaultProps} />);

    // Search for non-existent service
    const searchInput = screen.getByPlaceholderText('Search services...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent service' } });

    // Should show no results message
    expect(screen.getByText('No services found matching "nonexistent service"')).toBeInTheDocument();
  });

  it('disables service selection when disabled prop is true', () => {
    render(<ServiceSelector {...defaultProps} disabled={true} />);

    // Click a service
    const firstService = mockServices[0];
    const serviceElement = screen.getByText(firstService.name);
    fireEvent.click(serviceElement);

    // Check that onServiceToggle wasn't called
    expect(defaultProps.onServiceToggle).not.toHaveBeenCalled();
  });

  it('shows selected services with different styling', () => {
    const selectedServices = [mockServices[0].id];
    render(
      <ServiceSelector 
        {...defaultProps}
        selectedServices={selectedServices}
      />
    );

    // Get the selected service element
    const selectedServiceElement = screen.getByText(mockServices[0].name).closest('div');
    expect(selectedServiceElement).toHaveClass('border-primary');
  });
});
