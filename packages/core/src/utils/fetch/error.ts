export class RequestError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'RequestError'
  }
}

// create request error for external request
// 404, 429, 401 ...

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class RatelimitError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'RatelimitError'
  }
}
