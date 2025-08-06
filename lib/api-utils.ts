import { showToast } from "./toast"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Request failed',
        response.status,
        data
      )
    }

    return {
      success: true,
      data,
      message: data.message,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    console.error('API request error:', error)
    throw new ApiError(
      'Network error. Please check your connection.',
      0
    )
  }
}

export async function handleApiCall<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  successMessage?: string,
  errorMessage?: string
): Promise<T | null> {
  try {
    const result = await apiCall()
    
    if (result.success && result.data) {
      if (successMessage) {
        showToast.success(successMessage)
      }
      return result.data
    }
    
    return null
  } catch (error) {
    if (error instanceof ApiError) {
      showToast.error(error.message || errorMessage || 'Operation failed')
    } else {
      showToast.error(errorMessage || 'Something went wrong')
    }
    return null
  }
}

export function createApiCall<T = any>(
  url: string,
  options: RequestInit = {}
) {
  return () => apiRequest<T>(url, options)
}

export function createPostApiCall<T = any>(
  url: string,
  data: any,
  options: RequestInit = {}
) {
  return () => apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
} 