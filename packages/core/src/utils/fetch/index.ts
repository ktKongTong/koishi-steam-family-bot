import { createFetch as c, Fetch } from './ofetch'
import { Logger } from '@/interface/logger'
import { NotFoundError } from './error'

const rofetch = c({
  defaults: {
    retryStatusCodes: [400, 408, 409, 425, 429, 502, 503, 504],
    retry: 2,
    retryDelay: 400,
  },
})

const ofetch = new Fetch(rofetch)

export const createFetch = (logger: Logger) => {
  return ofetch.extend({
    onRequest: (context) => {
      logger.debug(`[fetch -->] ${context.options.baseURL}${context.request}`)
    },
    onResponse: (context) => {
      logger.debug(`[fetch <--] ${context.request} ${context.response.status}`)
    },
    onResponseError: (context) => {
      if (context.response.status === 404) {
        throw new NotFoundError()
      }
      throw context.error
    },
    ignoreResponseError: false,
  })
}

export { Fetch } from './ofetch'
