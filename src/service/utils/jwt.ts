import { jwtDecode as _jwtDecode, JwtPayload as _JwtPayload } from 'jwt-decode'

type JwtPayload = _JwtPayload

export function jwtDecode(token: string): JwtPayload {
  return _jwtDecode(token)
}
