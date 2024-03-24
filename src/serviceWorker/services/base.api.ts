import { ApiError } from "./ApiError.class"
import {
  ConcurrentRequestQueue,
  ConcurrentRequestQueueConfig,
} from "./ConcurrentRequestQueue"

type Parameter = string[] | string | number | boolean | null

interface QueryParameters {
  [key: string]: Parameter
}

interface BaseAPIRequestOptions extends Partial<Request> {
  concurrentQueue?: boolean
}

interface MappingAPIParam {
  apiName: string
  valueMapFn(param: Parameter): Parameter
  removeEmpty: boolean
}

interface Headers {
  [key: string]: Omit<Parameter, "string[]">
}

interface RequestOptions {
  headers?: Headers
  queryParams?: QueryParameters
  body?: unknown
  options?: BaseAPIRequestOptions
}

/**
 * Base API class for making HTTP requests with support for concurrent requests and error handling.
 */
export class BaseApi {
  // Default options for the API requests.
  protected defaultOptions = {}
  //Concurrent request queue for managing concurrent requests.
  protected concurrentRequestQueue: ConcurrentRequestQueue
  /**
   * Constructs a new instance of the BaseApi class.
   * @param config Configuration for the concurrent request queue.
   */
  constructor(config: ConcurrentRequestQueueConfig = { timeoutMs: 5000 }) {
    this.concurrentRequestQueue = new ConcurrentRequestQueue(config)
  }
  /**
   * Handles failed API requests and constructs an appropriate ApiError.
   * @param response The response object from the failed request.
   * @returns An instance of ApiError representing the failed request.
   */
  protected onRequestFailed(response: Response) {
    const isUnauthenticated = response.status === 401
    const isUnauthorised = response.status === 403

    if (isUnauthenticated) {
      return new ApiError("Not authenticated", response)
    }

    if (isUnauthorised) {
      return new ApiError("Not authorised", response)
    }

    return new ApiError("Unknown API Error", response)
  }
  /**
   * Performs a fetch request with the provided URL, headers, and request options.
   * @param requestUrl The URL to make the request to.
   * @param headers The headers to include in the request.
   * @param reqOptions The request options.
   * @returns A Promise resolving to the response object.
   */
  protected fetch(
    requestUrl: string,
    headers: Headers,
    reqOptions: Partial<Request>
  ) {
    const authHeaders = this.getAuthHeader(reqOptions)
    return fetch(requestUrl, {
      ...reqOptions,
      headers: { ...authHeaders, source: "browser-extension", ...headers },
    })
  }
  /**
   * Performs a concurrent request using the provided URL, headers, and request options.
   * Queues the request if there are ongoing requests for the same URL.
   * @param requestUrl The URL to make the request to.
   * @param headers The headers to include in the request.
   * @param reqOptions The request options.
   * @returns A Promise resolving to the response object.
   */
  protected async concurrentRequests(
    requestUrl: string,
    headers: Headers,
    reqOptions: Partial<Request>
  ) {
    if (!this.concurrentRequestQueue.hasOnGoingRequests(requestUrl)) {
      this.concurrentRequestQueue.lockResourceByUrl(requestUrl)
      const response = await this.fetch(requestUrl, headers, reqOptions)
      this.concurrentRequestQueue.notifyOnGoingRequestQueued(
        requestUrl,
        response
      )
      return response
    } else {
      return await this.concurrentRequestQueue.waitUntilOnGoingRequestFinish(
        requestUrl
      )
    }
  }
  /**
   * Makes an API request to the specified endpoint with optional query parameters and headers.
   * @param endpoint The endpoint to make the request to.
   * @param queryParams The query parameters to include in the request.
   * @param headers The headers to include in the request.
   * @param options Additional request options.
   * @returns A Promise resolving to the response data.
   */
  protected async request(
    endpoint: string,
    requestOptions: RequestOptions = {}
  ) {
    const {
      queryParams = {},
      headers = {},
      options = { concurrentQueue: false },
    } = requestOptions
    const { concurrentQueue, ...customOptions } = options
    const updatedOptions = { ...this.defaultOptions, ...customOptions }

    try {
      const requestUrl = this.generateUrl(endpoint, queryParams)
      let response: Response
      if (concurrentQueue) {
        response = await this.concurrentRequests(
          requestUrl,
          headers,
          updatedOptions
        )
      } else {
        response = await this.fetch(requestUrl, headers, updatedOptions)
      }
      if (!response.ok) {
        return Promise.reject(this.onRequestFailed(response))
      }

      const data = await response.json()

      return Promise.resolve({
        status: response.status,
        data: data,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof ApiError) {
        return Promise.reject(error)
      }
      throw new Error(error)
    }
  }
  /**
   * Sends a GET request to the specified endpoint with optional query parameters and headers.
   * @param endpoint The endpoint to send the GET request to.
   * @param requestOptions The object containing query parameters and headers.
   * @returns A Promise resolving to the response data.
   */
  get(endpoint: string, requestOptions?: RequestOptions) {
    return this.request(endpoint, requestOptions)
  }
  /**
   * Sends a PUT request to the specified endpoint with optional query parameters, headers, and data.
   * @param endpoint The endpoint to send the PUT request to.
   * @param requestOptions The object containing query parameters, headers, body, and options.
   * @returns A Promise resolving to the response data.
   */
  put(endpoint: string, requestOptions?: RequestOptions) {
    const { body, queryParams, headers, options } = requestOptions || {}
    const updatedOptions = {
      ...options,
      method: "PUT",
      // Temporary cast conversion as RequestInfo doesn't accept strings as type
      body: JSON.stringify(body) as unknown as ReadableStream<Uint8Array>,
    }
    return this.request(endpoint, {
      queryParams,
      headers,
      options: updatedOptions,
    })
  }
  /**
   * Sends a POST request to the specified endpoint with optional query parameters, headers, and data.
   * @param endpoint The endpoint to send the POST request to.
   * @param requestOptions The object containing query parameters, headers, body, and options.
   * @returns A Promise resolving to the response data.
   */
  post(endpoint: string, requestOptions?: RequestOptions) {
    const { body, queryParams, headers, options } = requestOptions || {}
    const updatedOptions = {
      ...options,
      method: "POST",
      // Temporary cast conversion as RequestInfo doesn't accept strings as type
      body: JSON.stringify(body) as unknown as ReadableStream<Uint8Array>,
    }
    return this.request(endpoint, {
      queryParams,
      headers,
      options: updatedOptions,
    })
  }
  /**
   * Sends a PATCH request to the specified endpoint with optional query parameters, headers, and data.
   * @param endpoint The endpoint to send the POST request to.
   * @param requestOptions The object containing query parameters, headers, body, and options.
   * @returns A Promise resolving to the response data.
   */
  patch(endpoint: string, requestOptions?: RequestOptions) {
    const { body, queryParams, headers, options } = requestOptions || {}
    const updatedOptions = {
      ...options,
      method: "PATCH",
      // Temporary cast conversion as RequestInfo doesn't accept strings as type
      body: JSON.stringify(body) as unknown as ReadableStream<Uint8Array>,
    }
    return this.request(endpoint, {
      queryParams,
      headers,
      options: updatedOptions,
    })
  }
  /**
   * Sends a DELETE request to the specified endpoint with optional query parameters and headers.
   * @param endpoint The endpoint to send the POST request to.
   * @param requestOptions The object containing query parameters, headers, and options.
   * @returns A Promise resolving to the response data.
   */
  delete(endpoint: string, requestOptions?: RequestOptions) {
    const { queryParams, headers, options } = requestOptions || {}
    const updatedOptions = {
      ...options,
      method: "DELETE",
    }
    return this.request(endpoint, {
      queryParams,
      headers,
      options: updatedOptions,
    })
  }
  /**
   * Generates a URL string with the provided endpoint and query parameters.
   * @param endpoint The endpoint to include in the URL.
   * @param queryParams The query parameters to include in the URL.
   * @returns The generated URL string.
   */
  protected generateUrl(
    endpoint: string,
    queryParams: QueryParameters
  ): string {
    const url = new URL(endpoint) // Available on the background script
    if (queryParams) {
      Object.keys(queryParams).forEach((field) => {
        const value = queryParams[field]
        if (Array.isArray(value)) {
          value.forEach((parameter) => {
            url.searchParams.append(`${field}[]`, parameter as string)
          })
        } else {
          url.searchParams.append(field, value as string)
        }
      })
    }
    return url.toString()
  }
  /**
   * Maps query parameters to API names based on the provided mapping configuration.
   * @param params The query parameters to map.
   * @param mapping The mapping configuration for parameter names.
   * @returns The mapped query parameters.
   * @throws Error if the mapping configuration is invalid.
   */
  mapParamsToApiNames(
    params: QueryParameters = {},
    mapping: { [key: string]: MappingAPIParam }
  ) {
    const emptyValues: Parameter[] = ["", null]
    return Object.keys(mapping).reduce((apiParams: QueryParameters, key) => {
      const cfg = mapping[key]
      if (!params[key]) {
        return apiParams
      }

      const apiParamKey = cfg.apiName || key
      let apiParamValue = params[key]
      const hasEmptyValue = emptyValues.includes(apiParamValue)

      if (!cfg.removeEmpty || (cfg.removeEmpty && !hasEmptyValue)) {
        if (cfg.valueMapFn) {
          if (typeof cfg.valueMapFn !== "function") {
            throw new Error(
              `Expected valueMapFn to be a function in ${key} mapping config`
            )
          }
          apiParamValue = cfg.valueMapFn(apiParamValue)
        }
        apiParams[apiParamKey] = apiParamValue
      }
      return apiParams
    }, {})
  }
  /**
   * Retrieves authentication headers based on the provided request options.
   * @param requestOptions The request options.
   * @returns The authentication headers.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAuthHeader(requestOptions: Partial<Request>) {
    return {
      Authorization: "Auth",
    }
  }
}
