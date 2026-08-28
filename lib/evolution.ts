// lib/evolution.ts - Evidências, focos e compromissos do ciclo de desenvolvimento de liderança
import { supabase } from '@/lib/supabase'

export const evolutionAreas = ['Modelo de gestão', 'Desenvolvimento do time', 'Exposição estratégica', 'Governança e decisões'] as const
export const leadershipPrinciples = ['Time melhor que você', 'Care to Dare', 'Assuma o front', 'HQA', 'Cultura', 'Eficiência'] as const
export type EvolutionArea = (typeof evolutionAreas)[number]
export type LeadershipPrinciple = (typeof leadershipPrinciples)[number]

function uid(prefix: string) {
  return typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

/** All four pieces of evolution data live in a single Supabase row (table
 * `leadership_evolution`, `singleton = true`), one jsonb column each. This reads
 * the whole row so each load/save can touch only its own column without
 * clobbering the others. */
async function readEvolutionRow() {
  const { data, error } = await supabase
    .from('leadership_evolution')
    .select('evidences, focuses, commitments, cycle')
    .eq('singleton', true)
    .maybeSingle()
  if (error) return null
  return data
}

async function upsertEvolutionColumn(column: 'evidences' | 'focuses' | 'commitments' | 'cycle', value: unknown) {
  const row = await readEvolutionRow()
  await supabase.from('leadership_evolution').upsert(
    {
      singleton: true,
      evidences: row?.evidences ?? [],
      focuses: row?.focuses ?? [],
      commitments: row?.commitments ?? [],
      cycle: row?.cycle ?? {},
      [column]: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'singleton' },
  )
}

// === EVIDÊNCIAS DE EVOLUÇÃO ===
export type EvolutionEvidence = {
  id: string
  description: string
  date: string
  area: EvolutionArea
  principle: LeadershipPrinciple
  frontId: string
  personId: string
  tag: string
  decision: string
  ritual: string
  learning: string
}

export const EVOLUTION_EVIDENCE_KEY = 'evolution-evidences'
// Legacy keys used before evidences and reads/writes were unified onto one key.
const LEGACY_EVIDENCE_KEYS = ['retro_sync_evidences', 'leadership-evolution-evidence']
const EVIDENCE_MIGRATION_FLAG_KEY = 'evolution-evidences-migrated-to-supabase'

export function createEmptyEvidence(): EvolutionEvidence {
  return {
    id: uid('evidence'),
    description: '',
    date: new Date().toISOString().slice(0, 10),
    area: 'Modelo de gestão',
    principle: 'Assuma o front',
    frontId: '',
    personId: '',
    tag: '',
    decision: '',
    ritual: '',
    learning: '',
  }
}

function normalizeEvidence(raw: Partial<EvolutionEvidence>): EvolutionEvidence {
  return { ...createEmptyEvidence(), ...raw, tag: raw.tag ?? '' }
}

/** Local fallback/migration source: whichever legacy key (if any) still has data,
 * unified onto EVOLUTION_EVIDENCE_KEY — same logic this file always used. */
function readLocalEvidences(): EvolutionEvidence[] {
  const current = readJson<EvolutionEvidence[] | null>(EVOLUTION_EVIDENCE_KEY, null)
  if (current) return current.map(normalizeEvidence)

  for (const key of LEGACY_EVIDENCE_KEYS) {
    const legacy = readJson<EvolutionEvidence[] | null>(key, null)
    if (legacy && legacy.length > 0) {
      const migrated = legacy.map(normalizeEvidence)
      writeJson(EVOLUTION_EVIDENCE_KEY, migrated)
      return migrated
    }
  }
  return []
}

export async function loadEvidences(): Promise<EvolutionEvidence[]> {
  const row = await readEvolutionRow()

  if (!row) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalEvidences()
  }

  const evidences = ((row.evidences as EvolutionEvidence[] | null) ?? []).map(normalizeEvidence)
  if (evidences.length > 0) return evidences

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(EVIDENCE_MIGRATION_FLAG_KEY)) {
    const legacy = readLocalEvidences()
    window.localStorage.setItem(EVIDENCE_MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveEvidences(legacy)
      return legacy
    }
  }

  return evidences
}

export async function saveEvidences(items: EvolutionEvidence[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeJson(EVOLUTION_EVIDENCE_KEY, items)
  await upsertEvolutionColumn('evidences', items)
}

// === FOCOS ATUAIS (priorizados) ===
export const focusPriorities = ['Alta', 'Média', 'Baixa'] as const
export type FocusPriority = (typeof focusPriorities)[number]

export type EvolutionFocus = {
  id: string
  title: string
  description: string
  priority: FocusPriority
  done: boolean
  createdAt: string
  updatedAt: string
}

export const EVOLUTION_FOCUS_KEY = 'evolution-focuses'
const FOCUS_MIGRATION_FLAG_KEY = 'evolution-focuses-migrated-to-supabase'

export function createEmptyFocus(overrides: Partial<EvolutionFocus> = {}): EvolutionFocus {
  const now = new Date().toISOString()
  return {
    id: uid('focus'),
    title: '',
    description: '',
    priority: 'Média',
    done: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

const defaultFocuses: EvolutionFocus[] = [
  createEmptyFocus({
    title: 'Critérios de decisão ainda ficam muito implícitos',
    description: 'Transforme contexto em critérios claros para o time decidir sem depender de validação a cada passo.',
    priority: 'Alta',
  }),
  createEmptyFocus({
    title: 'Cobrança tende a aparecer tarde',
    description: 'Use checkpoints curtos de frente, FCA e task para cobrar antes do atraso virar surpresa.',
    priority: 'Média',
  }),
  createEmptyFocus({
    title: 'Desenvolvimento precisa virar evidência',
    description: 'Conecte 1:1s, PDIs e temas da retro a fatos observáveis de evolução do time.',
    priority: 'Média',
  }),
]

function readLocalFocuses(): EvolutionFocus[] {
  const current = readJson<EvolutionFocus[] | null>(EVOLUTION_FOCUS_KEY, null)
  if (current) return current
  writeJson(EVOLUTION_FOCUS_KEY, defaultFocuses)
  return defaultFocuses
}

export async function loadFocuses(): Promise<EvolutionFocus[]> {
  const row = await readEvolutionRow()

  if (!row) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalFocuses()
  }

  const focuses = row.focuses as EvolutionFocus[] | null
  if (focuses && focuses.length > 0) return focuses

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(FOCUS_MIGRATION_FLAG_KEY)) {
    const legacy = readLocalFocuses()
    window.localStorage.setItem(FOCUS_MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveFocuses(legacy)
      return legacy
    }
  }

  return focuses ?? defaultFocuses
}

export async function saveFocuses(items: EvolutionFocus[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeJson(EVOLUTION_FOCUS_KEY, items)
  await upsertEvolutionColumn('focuses', items)
}

// === COMPROMISSOS DO CICLO (checklist) ===
export type EvolutionCommitment = {
  id: string
  text: string
  done: boolean
  createdAt: string
}

export const EVOLUTION_COMMITMENTS_KEY = 'evolution-commitments'
const COMMITMENTS_MIGRATION_FLAG_KEY = 'evolution-commitments-migrated-to-supabase'

export function createEmptyCommitment(text = ''): EvolutionCommitment {
  return { id: uid('commitment'), text, done: false, createdAt: new Date().toISOString() }
}

const defaultCommitments: EvolutionCommitment[] = [
  createEmptyCommitment('Toda frente ativa precisa ter dono, próximo passo e checkpoint.'),
  createEmptyCommitment('Todo ponto relevante da retro deve virar frente, task, FCA, decisão ou evidência de desenvolvimento.'),
  createEmptyCommitment('Todo FCA aberto deve ter ação corretiva, responsável e prazo.'),
]

function readLocalCommitments(): EvolutionCommitment[] {
  const current = readJson<EvolutionCommitment[] | null>(EVOLUTION_COMMITMENTS_KEY, null)
  if (current) return current
  writeJson(EVOLUTION_COMMITMENTS_KEY, defaultCommitments)
  return defaultCommitments
}

export async function loadCommitments(): Promise<EvolutionCommitment[]> {
  const row = await readEvolutionRow()

  if (!row) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalCommitments()
  }

  const commitments = row.commitments as EvolutionCommitment[] | null
  if (commitments && commitments.length > 0) return commitments

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(COMMITMENTS_MIGRATION_FLAG_KEY)) {
    const legacy = readLocalCommitments()
    window.localStorage.setItem(COMMITMENTS_MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveCommitments(legacy)
      return legacy
    }
  }

  return commitments ?? defaultCommitments
}

export async function saveCommitments(items: EvolutionCommitment[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeJson(EVOLUTION_COMMITMENTS_KEY, items)
  await upsertEvolutionColumn('commitments', items)
}

// === CICLO ATUAL ===
export type EvolutionCycle = {
  label: string
  startDate: string
  endDate: string
}

export const EVOLUTION_CYCLE_KEY = 'evolution-cycle'
const CYCLE_MIGRATION_FLAG_KEY = 'evolution-cycle-migrated-to-supabase'

function defaultCycle(): EvolutionCycle {
  const now = new Date()
  const isFirstHalf = now.getMonth() < 6
  const year = now.getFullYear()
  return isFirstHalf
    ? { label: `Ciclo H1 ${year}`, startDate: `${year}-01-01`, endDate: `${year}-06-30` }
    : { label: `Ciclo H2 ${year}`, startDate: `${year}-07-01`, endDate: `${year}-12-31` }
}

function readLocalCycle(): EvolutionCycle {
  const current = readJson<EvolutionCycle | null>(EVOLUTION_CYCLE_KEY, null)
  if (current) return current
  const created = defaultCycle()
  writeJson(EVOLUTION_CYCLE_KEY, created)
  return created
}

export async function loadCycle(): Promise<EvolutionCycle> {
  const row = await readEvolutionRow()

  if (!row) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalCycle()
  }

  const cycle = row.cycle as Partial<EvolutionCycle> | null
  if (cycle && cycle.startDate && cycle.endDate) return cycle as EvolutionCycle

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(CYCLE_MIGRATION_FLAG_KEY)) {
    const legacy = readLocalCycle()
    window.localStorage.setItem(CYCLE_MIGRATION_FLAG_KEY, '1')
    if (legacy) {
      await saveCycle(legacy)
      return legacy
    }
  }

  return defaultCycle()
}

export async function saveCycle(cycle: EvolutionCycle) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeJson(EVOLUTION_CYCLE_KEY, cycle)
  await upsertEvolutionColumn('cycle', cycle)
}

export function cycleProgress(cycle: EvolutionCycle, today = new Date()) {
  const start = new Date(`${cycle.startDate}T00:00:00`).getTime()
  const end = new Date(`${cycle.endDate}T23:59:59`).getTime()
  const now = today.getTime()
  if (!(end > start)) return { percent: 0, daysRemaining: 0, daysTotal: 0 }
  const percent = Math.round(Math.max(0, Math.min(1, (now - start) / (end - start))) * 100)
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
  const daysTotal = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return { percent, daysRemaining, daysTotal }
}
