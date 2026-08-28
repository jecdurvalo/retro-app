// lib/auth.ts - Login mockado (sem banco de dados) para proteger o cockpit.
// Qualquer tela fora de PUBLIC_PATHS (ver middleware.ts) exige login.

export const AUTH_COOKIE_NAME = 'cockpit_session'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

const DEFAULT_USERNAME = 'jecdurvalo'
const DEFAULT_PASSWORD = '0zzY@2710'

export function checkCredentials(username: string, password: string) {
  const validUser = process.env.COCKPIT_LOGIN_USER || DEFAULT_USERNAME
  const validPassword = process.env.COCKPIT_LOGIN_PASSWORD || DEFAULT_PASSWORD
  return username.trim() === validUser && password === validPassword
}
