/**
 * Tests for render-safe utilities
 * Ensures safe rendering patterns prevent React error #185
 */

import { renderSafe, renderError, safeGet, safeMap } from '@/lib/render-safe';

describe('renderSafe', () => {
  it('should handle null and undefined values', () => {
    expect(renderSafe(null)).toBe('—');
    expect(renderSafe(undefined)).toBe('—');
  });

  it('should handle primitive types', () => {
    expect(renderSafe('hello')).toBe('hello');
    expect(renderSafe(42)).toBe(42);
    expect(renderSafe(true)).toBe(true);
    expect(renderSafe(false)).toBe(false);
  });

  it('should handle arrays', () => {
    const result = renderSafe(['a', 'b', 'c']);
    expect(result).toBeDefined();
    // Should return JSX elements for arrays
    expect(Array.isArray(result)).toBe(false);
  });

  it('should handle objects with message property', () => {
    const errorObj = { message: 'Test error' };
    expect(renderSafe(errorObj)).toBe('Test error');
  });

  it('should handle objects with toString method', () => {
    const obj = {
      toString: () => 'Custom string'
    };
    expect(renderSafe(obj)).toBe('Custom string');
  });

  it('should handle plain objects', () => {
    const obj = { key: 'value' };
    const result = renderSafe(obj);
    expect(typeof result).toBe('string');
    expect(result).toContain('key');
    expect(result).toContain('value');
  });

  it('should handle nested objects safely', () => {
    const nestedObj = {
      level1: {
        level2: {
          value: 'test'
        }
      }
    };
    const result = renderSafe(nestedObj);
    expect(typeof result).toBe('string');
    expect(result).toContain('test');
  });
});

describe('renderError', () => {
  it('should handle null and undefined', () => {
    expect(renderError(null)).toBe('Unknown error');
    expect(renderError(undefined)).toBe('Unknown error');
  });

  it('should handle string errors', () => {
    expect(renderError('Test error')).toBe('Test error');
  });

  it('should handle Error objects', () => {
    const error = new Error('Test error');
    expect(renderError(error)).toBe('Test error');
  });

  it('should handle API error responses', () => {
    const apiError = { error: 'API error message' };
    expect(renderError(apiError)).toBe('API error message');
  });

  it('should handle validation errors', () => {
    const validationError = { details: 'Validation failed' };
    expect(renderError(validationError)).toBe('Validation failed');
  });

  it('should handle objects with toString', () => {
    const obj = {
      toString: () => 'Custom error'
    };
    expect(renderError(obj)).toBe('Custom error');
  });

  it('should fallback to unknown error for invalid objects', () => {
    const invalidObj = { someProperty: 'value' };
    expect(renderError(invalidObj)).toBe('Unknown error');
  });
});

describe('safeGet', () => {
  it('should return fallback for null/undefined objects', () => {
    expect(safeGet(null, 'path', 'fallback')).toBe('fallback');
    expect(safeGet(undefined, 'path', 'fallback')).toBe('fallback');
  });

  it('should return fallback for non-objects', () => {
    expect(safeGet('string', 'path', 'fallback')).toBe('fallback');
    expect(safeGet(42, 'path', 'fallback')).toBe('fallback');
  });

  it('should access nested properties safely', () => {
    const obj = {
      level1: {
        level2: {
          value: 'test'
        }
      }
    };
    expect(safeGet(obj, 'level1.level2.value', 'fallback')).toBe('test');
  });

  it('should return fallback for missing properties', () => {
    const obj = { existing: 'value' };
    expect(safeGet(obj, 'missing.property', 'fallback')).toBe('fallback');
  });

  it('should handle partial paths', () => {
    const obj = {
      level1: {
        level2: 'value'
      }
    };
    expect(safeGet(obj, 'level1.level2.missing', 'fallback')).toBe('fallback');
  });
});

describe('safeMap', () => {
  it('should return fallback for non-arrays', () => {
    expect(safeMap(null, (item) => item, [])).toEqual([]);
    expect(safeMap(undefined, (item) => item, [])).toEqual([]);
    expect(safeMap('string', (item) => item, [])).toEqual([]);
  });

  it('should return fallback for empty arrays', () => {
    expect(safeMap([], (item) => item, ['fallback'])).toEqual(['fallback']);
  });

  it('should map valid arrays', () => {
    const result = safeMap([1, 2, 3], (item) => item * 2, []);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should filter out null/undefined items', () => {
    const result = safeMap([1, null, 3, undefined, 5], (item) => item, []);
    expect(result).toEqual([1, 3, 5]);
  });

  it('should handle mixed valid/invalid items', () => {
    const result = safeMap([1, null, 'valid', undefined], (item) => item, []);
    expect(result).toEqual([1, 'valid']);
  });

  it('should use default fallback when not provided', () => {
    expect(safeMap(null, (item) => item)).toEqual([]);
    expect(safeMap([], (item) => item)).toEqual([]);
  });
});
