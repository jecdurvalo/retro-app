import { supabase } from '@/lib/supabase'

export const RITUALS_STORAGE_KEY = 'leadership-rituals'
export const MONTHLY_CLOSE_STORAGE_KEY = 'leadership-monthly-close'
/** Rituals and the monthly close normally live in Supabase (tables `leadership_rituals`
 * and `leadership_monthly_close`). These keys hold pre-existing local data to migrate
 * once Supabase works, and also double as a fallback store whenever Supabase is
 * unreachable (e.g. table not created yet). */
const RITUALS_MIGRATION_FLAG_KEY = 'leadership-rituals-migrated-to-supabase'
const MONTHLY_CLOSE_MIGRATION_FLAG_KEY = 'leadership-monthly-close-migrated-to-supabase'

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

function readLocalRituals(): LeadershipRitual[] {
  if (typeof window === 'undefined') return initialRituals.map(item => ({ ...item, outputs: [...item.outputs] }))
  try {
    const value = JSON.parse(localStorage.getItem(RITUALS_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value : initialRituals
  } catch {
    return initialRituals
  }
}

function writeLocalRituals(items: LeadershipRitual[]) {
  if (typeof window !== 'undefined') localStorage.setItem(RITUALS_STORAGE_KEY, JSON.stringify(items))
}

export async function loadRituals(): Promise<LeadershipRitual[]> {
  const { data, error } = await supabase.from('leadership_rituals').select('id, data')

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalRituals()
  }

  const rituals = (data ?? []).map(row => row.data as LeadershipRitual)
  if (rituals.length > 0) return rituals

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(RITUALS_MIGRATION_FLAG_KEY)) {
    const legacy = readLocalRituals()
    window.localStorage.setItem(RITUALS_MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveRituals(legacy)
      return legacy
    }
  }

  return rituals
}

export async function saveRituals(items: LeadershipRitual[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeLocalRituals(items)

  if (items.length === 0) {
    await supabase.from('leadership_rituals').delete().neq('id', '')
    return
  }

  const now = new Date().toISOString()
  await supabase
    .from('leadership_rituals')
    .upsert(items.map(item => ({ id: item.id, data: item, updated_at: now })), { onConflict: 'id' })

  const ids = items.map(item => item.id)
  await supabase.from('leadership_rituals').delete().not('id', 'in', `(${ids.join(',')})`)
}

function readLocalMonthlyClose(): MonthlyClose {
  if (typeof window === 'undefined') return initialMonthlyClose
  try {
    return JSON.parse(localStorage.getItem(MONTHLY_CLOSE_STORAGE_KEY) || 'null') || initialMonthlyClose
  } catch {
    return initialMonthlyClose
  }
}

function writeLocalMonthlyClose(item: MonthlyClose) {
  if (typeof window !== 'undefined') localStorage.setItem(MONTHLY_CLOSE_STORAGE_KEY, JSON.stringify(item))
}

export async function loadMonthlyClose(): Promise<MonthlyClose> {
  const { data, error } = await supabase
    .from('leadership_monthly_close')
    .select('data')
    .eq('singleton', true)
    .maybeSingle()

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalMonthlyClose()
  }

  const item = data?.data as Partial<MonthlyClose> | undefined
  if (item && item.updatedAt) return { ...initialMonthlyClose, ...item }

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(MONTHLY_CLOSE_MIGRATION_FLAG_KEY)) {
    const legacy = readLocalMonthlyClose()
    window.localStorage.setItem(MONTHLY_CLOSE_MIGRATION_FLAG_KEY, '1')
    if (legacy && legacy.updatedAt) {
      await saveMonthlyClose(legacy)
      return legacy
    }
  }

  return initialMonthlyClose
}

export async function saveMonthlyClose(item: MonthlyClose) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeLocalMonthlyClose(item)

  await supabase
    .from('leadership_monthly_close')
    .upsert({ singleton: true, data: item, updated_at: new Date().toISOString() }, { onConflict: 'singleton' })
}
