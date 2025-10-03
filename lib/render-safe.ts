/**
 * Safe rendering utility to prevent React error #185
 * Ensures all values are valid React nodes before rendering
 */

export function renderSafe(value: any): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '—';
  }

  // Handle primitive types (safe to render directly)
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  // Handle arrays - join as comma-separated string
  if (Array.isArray(value)) {
    return value.map(item => renderSafe(item)).join(', ');
  }

  // Handle objects
  if (typeof value === 'object') {
    // If it has a message property (Error-like objects)
    if (value.message && typeof value.message === 'string') {
      return value.message;
    }

    // If it has a toString method
    if (typeof value.toString === 'function') {
      try {
        const stringValue = value.toString();
        if (stringValue !== '[object Object]') {
          return stringValue;
        }
      } catch (e) {
        // Fall through to JSON.stringify
      }
    }

    // For debugging purposes, show JSON representation
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return '[Object]';
    }
  }

  // Fallback for any other type
  return String(value);
}

/**
 * Safe error message rendering
 * Handles various error object shapes
 */
export function renderError(error: any): string {
  if (error === null || error === undefined) {
    return 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    // Error objects
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }

    // API error responses
    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    // Validation errors
    if (error.details && typeof error.details === 'string') {
      return error.details;
    }

    // Try toString as last resort
    if (typeof error.toString === 'function') {
      try {
        const stringValue = error.toString();
        if (stringValue !== '[object Object]') {
          return stringValue;
        }
      } catch (e) {
        // Fall through
      }
    }
  }

  return 'Unknown error';
}

/**
 * Safe property access with fallback
 * Prevents undefined property access errors
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : fallback;
}

/**
 * Safe array access with validation
 * Ensures array exists and has valid items before mapping
 */
export function safeMap<T, U>(
  array: T[] | undefined | null,
  mapper: (item: T, index: number) => U,
  fallback: U[] = []
): U[] {
  if (!Array.isArray(array) || array.length === 0) {
    return fallback;
  }

  return array
    .filter((item, index) => {
      // Filter out invalid items
      if (item === null || item === undefined) {
        console.warn(`Array item at index ${index} is null/undefined, skipping`);
        return false;
      }
      return true;
    })
    .map(mapper);
}
