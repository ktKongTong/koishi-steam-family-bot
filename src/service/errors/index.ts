type ServiceError = any

export interface TokenInvalidError extends ServiceError {
  steamId: string
}
const TokenInvalidError = new Error('')
