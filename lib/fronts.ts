import { supabase } from '@/lib/supabase'

export const FRONTS_STORAGE_KEY = 'leadership-management-fronts'
export const FRONTS_UPDATED_EVENT = 'leadership-fronts-updated'
/** Fronts normally live in Supabase (table `leadership_fronts`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const MIGRATION_FLAG_KEY = 'leadership-fronts-migrated-to-supabase'

export const frontTypes = ['Projeto', 'Processo', 'Melhoria', 'PDI', 'Governança', 'Risco', 'Oportunidade', 'Rotina', 'Outro'] as const
export const frontTemperatures = ['Saudável', 'Atenção', 'Crítica'] as const
export const frontStatuses = ['Não iniciada', 'Em andamento', 'Bloqueada', 'Concluída', 'Arquivada'] as const
export const frontOrigins = ['Retro', 'Reunião', '1:1', 'Demanda da liderança', 'Crise', 'Planejamento', 'Outro'] as const
export const managerInterventions = ['Nenhuma', 'Monitorar', 'Desbloquear', 'Decidir', 'Alinhar stakeholders', 'Desenvolver dono'] as const

export type FrontType = (typeof frontTypes)[number]
export type FrontTemperature = (typeof frontTemperatures)[number]
export type FrontStatus = (typeof frontStatuses)[number]
export type FrontOrigin = (typeof frontOrigins)[number]
export type ManagerIntervention = (typeof managerInterventions)[number]

export const fcaStatuses = ['Em andamento', 'Concluído', 'Bloqueado'] as const
export type FcaStatus = (typeof fcaStatuses)[number]

export type FCA = {
  id: string
  fact: string
  cause: string
  action: string
  owner: string
  dueDate: string
  status: FcaStatus
  createdAt: string
  updatedAt: string
}

export function createEmptyFCA(): FCA {
  const now = new Date().toISOString()
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `fca-${Date.now()}`,
    fact: '',
    cause: '',
    action: '',
    owner: '',
    dueDate: '',
    status: 'Em andamento',
    createdAt: now,
    updatedAt: now,
  }
}

export type ManagementFront = {
  id: string
  name: string
  description: string
  type: FrontType
  owner: string
  involvedPeople: string[]
  stakeholders: string[]
  temperature: FrontTemperature
  status: FrontStatus
  origin: FrontOrigin
  managerIntervention: ManagerIntervention
  nextCheckpoint: string
  nextStep: string
  risks: string[]
  relatedDecisions: string[]
  relatedTasks: string[]
  evidence: string[]
  fcas: FCA[]
  tags: string[]
  /** Manual override (0-100) for the progress bar. When null, progress is
   * calculated automatically from FCA + linked-task completion (see frontProgress). */
  progressOverride: number | null
  createdAt: string
  updatedAt: string
}

export const initialFronts: ManagementFront[] = []

export function createEmptyFront(): ManagementFront {
  const now = new Date().toISOString()
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `front-${Date.now()}`,
    name: '',
    description: '',
    type: 'Projeto',
    owner: '',
    involvedPeople: [],
    stakeholders: [],
    temperature: 'Saudável',
    status: 'Não iniciada',
    origin: 'Outro',
    managerIntervention: 'Monitorar',
    nextCheckpoint: '',
    nextStep: '',
    risks: [],
    relatedDecisions: [],
    relatedTasks: [],
    evidence: [],
    fcas: [],
    tags: [],
    progressOverride: null,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeFront(raw: Partial<ManagementFront>): ManagementFront {
  return {
    ...createEmptyFront(),
    ...raw,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    progressOverride: typeof raw.progressOverride === 'number' ? raw.progressOverride : null,
  }
}

function readLocalFronts(): ManagementFront[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(FRONTS_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value.map(normalizeFront) : []
  } catch {
    return []
  }
}

function writeLocalFronts(fronts: ManagementFront[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FRONTS_STORAGE_KEY, JSON.stringify(fronts))
  window.dispatchEvent(new Event(FRONTS_UPDATED_EVENT))
}

export async function loadFronts(): Promise<ManagementFront[]> {
  const { data, error } = await supabase.from('leadership_fronts').select('id, data')

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalFronts()
  }

  const fronts = (data ?? []).map(row => normalizeFront(row.data as Partial<ManagementFront>))
  if (fronts.length > 0) return fronts

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(MIGRATION_FLAG_KEY)) {
    const legacy = readLocalFronts()
    window.localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveFronts(legacy)
      return legacy
    }
  }

  return fronts
}

/** Progress % for a front. Uses the manual override when set; otherwise blends
 * FCA completion and linked-task completion, falling back to a coarse estimate
 * from `status` when there's nothing yet to count. */
export function frontProgress(front: ManagementFront, tasks: { frontId: string; status: string }[]) {
  if (typeof front.progressOverride === 'number') return front.progressOverride

  const linkedTasks = tasks.filter(task => task.frontId === front.id)
  const total = front.fcas.length + linkedTasks.length
  if (total === 0) {
    if (front.status === 'Concluída') return 100
    if (front.status === 'Não iniciada') return 0
    return 10
  }
  const done = front.fcas.filter(fca => fca.status === 'Concluído').length
    + linkedTasks.filter(task => task.status === 'Concluída').length
  return Math.round((done / total) * 100)
}

/** True when the front has FCAs or linked tasks to derive progress from automatically. */
export function frontHasAutoProgressSource(front: ManagementFront, tasks: { frontId: string }[]) {
  return front.fcas.length > 0 || tasks.some(task => task.frontId === front.id)
}

export async function saveFronts(fronts: ManagementFront[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeLocalFronts(fronts)

  if (fronts.length === 0) {
    await supabase.from('leadership_fronts').delete().neq('id', '')
    return
  }

  const now = new Date().toISOString()
  await supabase
    .from('leadership_fronts')
    .upsert(fronts.map(front => ({ id: front.id, data: front, updated_at: now })), { onConflict: 'id' })

  const ids = fronts.map(front => front.id)
  await supabase.from('leadership_fronts').delete().not('id', 'in', `(${ids.join(',')})`)
}
