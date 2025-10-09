import { describe, expect, it } from '@jest/globals';
import { getServiceSuggestions } from '@/components/book-service/service-suggestions';
import { SERVICE_SUGGESTIONS } from '@/types/services';

describe('Service Suggestions', () => {
  const commonSuggestions = [
    'Preferred time window',
    'Parking information',
    'Gate/Access code',
    'Emergency contact'
  ];

  it('returns cleaning-specific suggestions for cleaning services', () => {
    const suggestions = getServiceSuggestions('House Cleaning', 'CLEANING');
    
    // Should include all cleaning-specific suggestions
    SERVICE_SUGGESTIONS.CLEANING.forEach(suggestion => {
      expect(suggestions).toContain(suggestion);
    });

    // Should include common suggestions
    commonSuggestions.forEach(suggestion => {
      expect(suggestions).toContain(suggestion);
    });
  });

  it('returns only common suggestions for unknown categories', () => {
    const suggestions = getServiceSuggestions('Unknown Service', 'UNKNOWN');
    
    // Should only include common suggestions
    expect(suggestions).toEqual(commonSuggestions);

    // Should not include cleaning-specific suggestions
    SERVICE_SUGGESTIONS.CLEANING.forEach(suggestion => {
      expect(suggestions).not.toContain(suggestion);
    });
  });

  it('handles case-insensitive category matching', () => {
    const suggestions = getServiceSuggestions('Window Cleaning', 'cleaning');
    
    // Should still include cleaning-specific suggestions
    SERVICE_SUGGESTIONS.CLEANING.forEach(suggestion => {
      expect(suggestions).toContain(suggestion);
    });
  });

  it('handles empty or undefined inputs', () => {
    // Empty strings
    expect(() => getServiceSuggestions('', '')).not.toThrow();
    
    // Undefined values
    expect(() => getServiceSuggestions(undefined as any, undefined as any)).not.toThrow();
    
    // Should return common suggestions in both cases
    const emptySuggestions = getServiceSuggestions('', '');
    const undefinedSuggestions = getServiceSuggestions(undefined as any, undefined as any);
    
    expect(emptySuggestions).toEqual(commonSuggestions);
    expect(undefinedSuggestions).toEqual(commonSuggestions);
  });
});
