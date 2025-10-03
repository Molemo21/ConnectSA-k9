"use client"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
  timeout?: number
}

class ApiClient {
  private baseURL: string
  private defaultOptions: FetchOptions

  constructor(baseURL: string = '', defaultOptions: FetchOptions = {}) {
    this.baseURL = baseURL
    this.defaultOptions = {
      retries: 3,
      retryDelay: 1000,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...defaultOptions
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async fetchWithRetry<T>(
    url: string, 
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { retries = 3, retryDelay = 1000, timeout = 10000, ...fetchOptions } = {
      ...this.defaultOptions,
      ...options
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
        
        const response = await this.fetchWithTimeout(fullUrl, fetchOptions, timeout)

        // Handle 404 gracefully
        if (response.status === 404) {
          return {
            success: false,
            message: 'Resource not found',
            error: 'NOT_FOUND'
          }
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText || `HTTP ${response.status}` }
          }

          return {
            success: false,
            message: errorData.message || `HTTP ${response.status}`,
            error: `HTTP_${response.status}`
          }
        }

        // Parse successful response
        const contentType = response.headers.get('content-type')
        let data: T

        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text() as T
        }

        return {
          success: true,
          data
        }

      } catch (error) {
        lastError = error as Error
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return {
              success: false,
              message: 'Request timeout',
              error: 'TIMEOUT'
            }
          }
          
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            // Network error - retry
            if (attempt < retries) {
              console.warn(`Network error, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${retries + 1})`)
              await this.sleep(retryDelay * Math.pow(2, attempt)) // Exponential backoff
              continue
            }
          }
        }

        // If it's the last attempt, return the error
        if (attempt === retries) {
          return {
            success: false,
            message: lastError.message || 'Unknown error',
            error: 'FETCH_ERROR'
          }
        }

        // Wait before retrying
        await this.sleep(retryDelay * Math.pow(2, attempt))
      }
    }

    return {
      success: false,
      message: lastError?.message || 'Max retries exceeded',
      error: 'MAX_RETRIES_EXCEEDED'
    }
  }

  async get<T>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, {
      ...options,
      method: 'GET'
    })
  }

  async post<T>(url: string, data?: any, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(url: string, data?: any, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T>(url: string, data?: any, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.fetchWithRetry<T>(url, {
      ...options,
      method: 'DELETE'
    })
  }
}

// Create default instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }
export type { ApiResponse, FetchOptions }
