export class UnexpectedError extends Error {
  constructor() {
    super('UnexpectedError')
  }
}

export class BizError extends Error {
  id: string
  params?: any
}

export class TokenInvalidError extends BizError {
  constructor(params?: any) {
    super('TokenInvalidError')
    this.name = 'TokenInvalidError'
    this.id = 'commands.slm.token.token-invalid-error'
    this.params = params
  }
}
