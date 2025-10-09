import { ServiceCategory, SERVICE_SUGGESTIONS } from '@/types/services';

export function getServiceSuggestions(serviceName: string, category: string): string[] {
  // Common suggestions for all services
  const commonSuggestions = [
    'Preferred time window',
    'Parking information',
    'Gate/Access code',
    'Emergency contact'
  ];

  // If it's a cleaning service, add cleaning-specific suggestions
  if (category.toUpperCase() === 'CLEANING') {
    return [...SERVICE_SUGGESTIONS.CLEANING, ...commonSuggestions];
  }

  return commonSuggestions;
}
