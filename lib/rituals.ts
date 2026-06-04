export const RITUALS_STORAGE_KEY = 'leadership-rituals'
export const MONTHLY_CLOSE_STORAGE_KEY = 'leadership-monthly-close'

export const ritualTypes = ['Checkpoint de frente', '1:1', 'Retro mensal', 'Sync com liderança', 'Revisão de decisões', 'Fechamento mensal'] as const
export const ritualCadences = ['Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Pontual'] as const
export type RitualType = (typeof ritualTypes)[number]

export type LeadershipRitual = {
  id: string
  name: string
  type: RitualType
  cadence: (typeof ritualCadences)[number]
  nextDate: string
  purpose: string
  preparation: string
  frontId: string
  personId: string
  outputs: string[]
  createdAt: string
}

export type MonthlyClose = {
  progress: number
  checklist: { label: string; done: boolean }[]
  improved: string
  worsened: string
  stalled: string
  leadershipAction: string
  nextSteps: string[]
  updatedAt: string
}

export const initialRituals: LeadershipRitual[] = []

export const initialMonthlyClose: MonthlyClose = {
  progress: 0,
  checklist: [
    { label: 'Revisar frentes críticas', done: false },
    { label: 'Consolidar decisões do mês', done: false },
    { label: 'Registrar evolução das pessoas', done: false },
    { label: 'Definir focos do próximo ciclo', done: false },
  ],
  improved: '',
  worsened: '',
  stalled: '',
  leadershipAction: '',
  nextSteps: [],
  updatedAt: '',
}

export function createEmptyRitual(): LeadershipRitual {
  return { id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `ritual-${Date.now()}`, name: 'Novo ritual', type: 'Checkpoint de frente', cadence: 'Semanal', nextDate: '', purpose: '', preparation: '', frontId: '', personId: '', outputs: [], createdAt: new Date().toISOString() }
}

export function loadRituals(): LeadershipRitual[] {
  if (typeof window === 'undefined') return initialRituals.map(item => ({ ...item, outputs: [...item.outputs] }))
  try { const value = JSON.parse(localStorage.getItem(RITUALS_STORAGE_KEY) || 'null'); return Array.isArray(value) ? value : initialRituals } catch { return initialRituals }
}
export function saveRituals(items: LeadershipRitual[]) { if (typeof window !== 'undefined') localStorage.setItem(RITUALS_STORAGE_KEY, JSON.stringify(items)) }
export function loadMonthlyClose(): MonthlyClose {
  if (typeof window === 'undefined') return initialMonthlyClose
  try { return JSON.parse(localStorage.getItem(MONTHLY_CLOSE_STORAGE_KEY) || 'null') || initialMonthlyClose } catch { return initialMonthlyClose }
}
export function saveMonthlyClose(item: MonthlyClose) { if (typeof window !== 'undefined') localStorage.setItem(MONTHLY_CLOSE_STORAGE_KEY, JSON.stringify(item)) }
