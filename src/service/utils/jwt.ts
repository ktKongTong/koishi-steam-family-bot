import { jwtDecode as _jwtDecode, JwtPayload as _JwtPayload } from 'jwt-decode'

type JwtPayload = _JwtPayload

export function jwtDecode(token: string): JwtPayload {
  return _jwtDecode(token)
}

// export function __jwtDecode(token:string): JwtPayload {
//   return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
// }
