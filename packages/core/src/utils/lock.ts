class MemLock {
  instance: MemLock
  get() {
    if (!this.instance) {
      this.instance = new MemLock()
    }
    return this.instance
  }
  private constructor() {}

  private keyLockMap = new Map<string, boolean>()
}
