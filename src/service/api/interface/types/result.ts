export class Result<T> {
  readonly data?: T
  readonly message?: string
  readonly success: boolean
  private constructor(success: boolean, data?: T, message?: string) {
    this.data = data
    this.message = message
    this.success = success
  }

  static failed<T>(message: string) {
    return new Result<T>(false, undefined, message)
  }
  static success<T>(data: T) {
    return new Result(true, data)
  }
  isSuccess() {
    return this.success
  }
}
