export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://retro-app.vercel.app'
).replace(/\/$/, '')

export const TEAM_JOIN_URL = `${PUBLIC_SITE_URL}/team`
