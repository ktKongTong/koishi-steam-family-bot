interface ServiceError {}

export interface TokenInvalidError extends ServiceError {}
const TokenInvalidError = new Error('')
