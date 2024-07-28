import { jwtDecode as _jwtDecode, JwtPayload as _JwtPayload } from 'jwt-decode'
import { now } from 'lodash'

type JwtPayload = _JwtPayload

export function jwtDecode(token: string): JwtPayload {
  return _jwtDecode(token)
}

export function tokenNeedRefresh(token: string): boolean {
  try {
    const res = jwtDecode(token)
    const nt = now()
    return (res.exp - 900) * 1000 < nt
  } catch (e) {
    return true
  }
}
