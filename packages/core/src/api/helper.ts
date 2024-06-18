import { NetReqResult } from './interface'
import { sleep } from '../utils'

type Res<Base, T> = Base extends true ? NetReqResult<T> : T

export class APIHelper<API, Base extends boolean = false> {
  constructor() {}

  private retryTime: number = 1
  private _wrapper = false
  private _onRetry: (retryTime: number, e?: any) => void = () => {}

  withRetry(times: number = 1, onRetry?: (retryTime: number, e?: any) => void) {
    this.retryTime = times
    this._onRetry = onRetry
    return this
  }

  onRetry(func: (times: number, e: any) => void) {
    this._onRetry = func
    return this
  }

  async call<T>(block: () => Promise<T>): Promise<Res<Base, T>> {
    let result: T
    let times = Math.min(this.retryTime, 3)
    let retryTime: number = 0
    const wrap = this._wrapper

    while (times > 0) {
      try {
        result = await block()
        if (wrap) {
          return NetReqResult.success(result) as Res<Base, T>
        }
        return result as Res<Base, T>
      } catch (e) {
        retryTime += 1
        if (times-- > 1) {
          this._onRetry?.(retryTime, e)
          continue
        }
        await sleep(300)
        if (wrap) {
          return NetReqResult.failed<T>(`retry times reached, ${e}`) as Res<
            Base,
            T
          >
        }
        throw Error('retry times reached', e)
      }
    }
    if (result) {
      return (wrap ? NetReqResult.success(result) : result) as Res<Base, T>
    }
    if (wrap) {
      return NetReqResult.failed<T>('unknown error') as Res<Base, T>
    }
    throw Error('unknown error')
  }

  wrapperResult(): ServiceWithAPIHelper<API, true> {
    this._wrapper = true
    return this as any
  }
}

export type ServiceWithAPIHelper<API, Wrap extends boolean = false> = Wrapped<
  API,
  Wrap
> &
  APIHelper<API, Wrap>

export type ServiceWithHelper<API, Wrap extends boolean = false> = Wrapped<
  API,
  Wrap
> & {
  helper: APIHelper<API, Wrap>
}

type Wrapping<T, I extends boolean = false> = T extends (
  ...args: infer Args
) => infer R
  ? <Wrap extends boolean = false>(
      ...args: Args
    ) => R extends Promise<infer R1>
      ? I extends true
        ? Promise<NetReqResult<R1>>
        : Wrap extends true
          ? Promise<NetReqResult<R1>>
          : Promise<R1>
      : R
  : T

type Wrapped<T, Wrap extends boolean = false> = {
  [K in keyof T]: Wrapping<T[K], Wrap>
}

export function createProxiedAPIService<T extends object>(
  instance: T
): ServiceWithAPIHelper<T> {
  ;(instance as ServiceWithHelper<T>).helper = new APIHelper()
  return new Proxy<T>(instance, {
    get(target, prop, receiver) {
      const method = target[prop]
      // target func
      if (typeof method === 'function') {
        return async function (...args: any[]) {
          const result = await (target as ServiceWithHelper<T>).helper.call(
            () => method.apply(this, args)
          )
          return result
        }
      }
      if (prop in target) {
        return Reflect.get(target, prop, receiver)
      }
      // helper func
      if (prop in (target as ServiceWithHelper<T>).helper) {
        const v = Reflect.get((target as ServiceWithHelper<T>).helper, prop)
        if (typeof v === 'function') {
          return v
        }
        return v
      }
      return undefined
    },
    set(target, property, value, receiver) {
      if (property in target) {
        return Reflect.set(target, property, value, receiver)
      }
      if (property in (target as ServiceWithHelper<T>).helper) {
        return Reflect.set(
          (target as ServiceWithHelper<T>).helper,
          property,
          value
        )
      }
      return false
    },
  }) as ServiceWithAPIHelper<T>
}
