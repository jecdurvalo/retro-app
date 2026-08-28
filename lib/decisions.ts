import { supabase } from '@/lib/supabase'

export const DECISIONS_STORAGE_KEY = 'leadership-decisions'
/** Decisions normally live in Supabase (table `leadership_decisions`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const MIGRATION_FLAG_KEY = 'leadership-decisions-migrated-to-supabase'

export const decisionStatuses = ['Pendente', 'Em alinhamento', 'Decidida', 'Escalada'] as const
export type DecisionStatus = (typeof decisionStatuses)[number]

export type LeadershipDecision = {
  id: string
  title: string
  context: string
  tradeOff: string
  owner: string
  stakeholders: string[]
  frontIds: string[]
  hqa: boolean
  hqaNote: string
  nextCheckpoint: string
  noCheckpointReason: string
  status: DecisionStatus
  createdAt: string
  updatedAt: string
}

export const initialDecisions: LeadershipDecision[] = []

function cloneDecision(decision: LeadershipDecision): LeadershipDecision {
  return { ...decision, stakeholders: [...decision.stakeholders], frontIds: [...decision.frontIds] }
}

export function createEmptyDecision(): LeadershipDecision {
  const now = new Date().toISOString()
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `decision-${Date.now()}`,
    title: 'Nova decisão',
    context: '',
    tradeOff: '',
    owner: '',
    stakeholders: [],
    frontIds: [],
    hqa: false,
    hqaNote: '',
    nextCheckpoint: '',
    noCheckpointReason: '',
    status: 'Pendente',
    createdAt: now,
    updatedAt: now,
  }
}

function readLocalDecisions(): LeadershipDecision[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DECISIONS_STORAGE_KEY) || 'null')
    return Array.isArray(parsed) ? parsed.map(cloneDecision) : []
  } catch {
    return []
  }
}

function writeLocalDecisions(decisions: LeadershipDecision[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(decisions))
}

export async function loadDecisions(): Promise<LeadershipDecision[]> {
  const { data, error } = await supabase.from('leadership_decisions').select('id, data')

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalDecisions()
  }

  const decisions = (data ?? []).map(row => cloneDecision(row.data as LeadershipDecision))
  if (decisions.length > 0) return decisions

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(MIGRATION_FLAG_KEY)) {
    const legacy = readLocalDecisions()
    window.localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveDecisions(legacy)
      return legacy
    }
  }

  return decisions
}

export async function saveDecisions(decisions: LeadershipDecision[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeLocalDecisions(decisions)

  if (decisions.length === 0) {
    await supabase.from('leadership_decisions').delete().neq('id', '')
    return
  }

  const now = new Date().toISOString()
  await supabase
    .from('leadership_decisions')
    .upsert(decisions.map(decision => ({ id: decision.id, data: decision, updated_at: now })), { onConflict: 'id' })

  const ids = decisions.map(decision => decision.id)
  await supabase.from('leadership_decisions').delete().not('id', 'in', `(${ids.join(',')})`)
}
