/**
 * Riot API HTTP Client avec rate limiting
 *
 * Features:
 * - Automatic retry on 429 (rate limit)
 * - Request timeout (10s)
 * - Error handling (404, 403, 5xx)
 * - Type-safe responses
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface RiotClientConfig {
  apiKey: string
  timeout?: number
  maxRetries?: number
}

export class RiotApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'RiotApiError'
  }
}

export class RateLimitError extends RiotApiError {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message, 429, 'Too Many Requests')
    this.name = 'RateLimitError'
  }
}

export class RiotClient {
  private client: AxiosInstance
  private maxRetries: number

  constructor(config: RiotClientConfig) {
    if (!config.apiKey) {
      throw new Error('Riot API key is required')
    }

    this.maxRetries = config.maxRetries ?? 3

    this.client = axios.create({
      timeout: config.timeout ?? 10000,
      headers: {
        'X-Riot-Token': config.apiKey,
      },
    })
  }

  /**
   * Make a GET request with automatic retry on rate limit
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.makeRequest<T>(() => this.client.get<T>(url, config))
  }

  /**
   * Generic request handler with retry logic
   */
  private async makeRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await requestFn()
      return response.data
    } catch (error: any) {
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = this.getRetryAfter(error.response)

        if (retryCount < this.maxRetries) {
          console.warn(
            `[RiotClient] Rate limited. Waiting ${retryAfter}s before retry ${retryCount + 1}/${this.maxRetries}`
          )
          await this.sleep(retryAfter * 1000)
          return this.makeRequest(requestFn, retryCount + 1)
        }

        throw new RateLimitError('Rate limit exceeded and max retries reached', retryAfter)
      }

      // Handle other errors
      throw this.createError(error)
    }
  }

  /**
   * Extract retry-after value from response headers
   */
  private getRetryAfter(response: AxiosResponse): number {
    // Check Retry-After header first
    const retryAfterHeader = response.headers['retry-after']
    if (retryAfterHeader) {
      return parseInt(retryAfterHeader, 10)
    }

    // Fallback to default wait time
    return 2
  }

  /**
   * Create a structured error from axios error
   */
  private createError(error: any): RiotApiError {
    if (error.response) {
      // HTTP error response
      const { status, statusText, data } = error.response

      let message = `Riot API Error: ${status} ${statusText}`
      if (data?.status?.message) {
        message = `Riot API Error: ${data.status.message}`
      }

      return new RiotApiError(message, status, statusText)
    }

    if (error.request) {
      // Request made but no response
      return new RiotApiError('No response from Riot API', 0, 'Network Error')
    }

    // Something else went wrong
    return new RiotApiError(error.message || 'Unknown error', 0, 'Unknown')
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
