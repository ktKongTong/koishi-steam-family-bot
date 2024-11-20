import { $Fetch, createFetch, FetchOptions } from 'ofetch'
import { NotFoundError } from './error'

export const rofetch = createFetch({
  defaults: {
    retryStatusCodes: [400, 408, 409, 425, 429, 500, 502, 503, 504],
    retry: 3,
    retryDelay: 800,
  },
}).create({
  onResponseError({ request, response, options }) {
    if (response.status === 404) {
      throw new NotFoundError()
    }
  },
  onRequestError({ request, error }) {},
})

export type ExtendFetchOptions = {
  form?: Record<string, any>
  json?: Record<string, any>
  searchParams?: Record<string, any>
  cache?: boolean
} & FetchOptions

export class Fetch {
  private options?: FetchOptions
  private ofetchInstance: $Fetch
  constructor(fetchInstance?: $Fetch, options?: FetchOptions) {
    this.options = options
    this.ofetchInstance = fetchInstance ?? rofetch
  }
  private async fetch(request: string, options?: ExtendFetchOptions) {
    if (options?.json && !options.body) {
      options.body = options.json
      delete options.json
    }
    if (options?.form && !options.body) {
      options.body = new URLSearchParams(
        options.form as Record<string, string>
      ).toString()
      if (!options.headers) {
        options.headers = {}
      }
      options.headers = {
        ...options.headers,
        'content-type': 'application/x-www-form-urlencoded',
      }
      delete options.form
    }

    if (options?.searchParams) {
      request += '?' + new URLSearchParams(options.searchParams).toString()
      delete options.searchParams
    }
    const res = await this.ofetchInstance(request, {
      ...this.options,
      ...options,
    }).catch((e) => {
      if (e instanceof NotFoundError) return null
      throw e
    })
    return res
  }
  get<T extends any = any>(
    request: string,
    options?: ExtendFetchOptions
  ): Promise<T> {
    return this.fetch(request, { ...options, method: 'GET' }) as Promise<T>
  }
  post<T extends any = any>(
    request: string,
    options?: ExtendFetchOptions
  ): Promise<T> {
    return this.fetch(request, { ...options, method: 'POST' }) as Promise<T>
  }
  put<T extends any = any>(
    request: string,
    options?: ExtendFetchOptions
  ): Promise<T> {
    return this.fetch(request, { ...options, method: 'PUT' }) as Promise<T>
  }
  patch<T extends any = any>(
    request: string,
    options?: ExtendFetchOptions
  ): Promise<T> {
    return this.fetch(request, { ...options, method: 'PATCH' }) as Promise<T>
  }
  delete<T extends any = any>(
    request: string,
    options?: ExtendFetchOptions
  ): Promise<T> {
    return this.fetch(request, { ...options, method: 'DELETE' }) as Promise<T>
  }
  head(request: string, options?: ExtendFetchOptions) {
    return this.fetch(request, { ...options, method: 'HEAD' })
  }

  extend(options: FetchOptions) {
    return new Fetch(this.ofetchInstance, { ...this.options, ...options })
  }
  baseUrl(url: string) {
    return this.extend({ baseURL: url })
  }
}

export { createFetch } from 'ofetch'
