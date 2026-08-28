import { supabase } from '@/lib/supabase'

export const PEOPLE_STORAGE_KEY = 'leadership-people'
/** People normally live in Supabase (table `leadership_people`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const MIGRATION_FLAG_KEY = 'leadership-people-migrated-to-supabase'

export const attentionTypes = ['Dar autonomia', 'Desafiar', 'Cuidar', 'Desenvolver', 'Monitorar carga'] as const
export type AttentionType = (typeof attentionTypes)[number]

export const careerMoments = [
  'Consolidação no cargo',
  'Preparação próximo nível',
  'Mudança de escopo',
  'Alta performance',
  'Recuperação',
] as const
export type CareerMoment = (typeof careerMoments)[number]

export const projectRoles = ['Protagonismo', 'Contribuição', 'Stretch assignment'] as const
export type ProjectRole = (typeof projectRoles)[number]

export type NoteEntry = {
  id: string
  text: string
  createdAt: string
}

export type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

export type OneOnOneEntry = {
  id: string
  date: string
  notes: string
}

export type PDI = {
  title: string
  status: 'Ativo' | 'Em revisão' | 'Sem PDI'
  goals: string
  nextStep: string
  updatedAt: string
}

export type LeadershipPerson = {
  id: string
  name: string
  role: string
  relationship: 'Liderado direto' | 'Time negócios'
  /** Free-text "Contexto" — what helps understand the current moment. */
  moment: string
  /** "Visão da liderança" — narrative summary written by the leader. */
  visionSummary: string
  careerMoment: CareerMoment
  startDate: string
  leaderName: string
  nextLeap: string
  nextLeapEvidence: ChecklistItem[]
  leaderActions: ChecklistItem[]
  frontIds: string[]
  projectRoles: Record<string, ProjectRole>
  nextOneOnOne: string
  oneOnOnes: OneOnOneEntry[]
  attention: AttentionType
  pdi: PDI
  notes: NoteEntry[]
  feedback: NoteEntry[]
  risks: string[]
  levers: string[]
  updatedAt: string
}

export function createEmptyPerson(overrides: Partial<LeadershipPerson> = {}): LeadershipPerson {
  return {
    id: `person-${Date.now()}`,
    name: '',
    role: '',
    relationship: 'Liderado direto',
    moment: '',
    visionSummary: '',
    careerMoment: 'Consolidação no cargo',
    startDate: '',
    leaderName: 'Joana Durvalo',
    nextLeap: '',
    nextLeapEvidence: [],
    leaderActions: [],
    frontIds: [],
    projectRoles: {},
    nextOneOnOne: '',
    oneOnOnes: [],
    attention: 'Desenvolver',
    pdi: {
      title: '',
      status: 'Sem PDI',
      goals: '',
      nextStep: '',
      updatedAt: new Date().toISOString(),
    },
    notes: [],
    feedback: [],
    risks: [],
    levers: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/** Backfills fields that may be missing on records saved before this data model
 * grew (older localStorage entries), so the UI never has to guard every access. */
function normalizePerson(raw: Partial<LeadershipPerson>): LeadershipPerson {
  const empty = createEmptyPerson()
  return {
    ...empty,
    ...raw,
    pdi: { ...empty.pdi, ...raw.pdi },
    nextLeapEvidence: raw.nextLeapEvidence ?? [],
    leaderActions: raw.leaderActions ?? [],
    projectRoles: raw.projectRoles ?? {},
    oneOnOnes: raw.oneOnOnes ?? [],
    frontIds: raw.frontIds ?? [],
    notes: raw.notes ?? [],
    feedback: raw.feedback ?? [],
    risks: raw.risks ?? [],
    levers: raw.levers ?? [],
  }
}

export function tenureLabel(startDate: string): string {
  if (!startDate) return 'Não informado'
  const start = new Date(`${startDate}T12:00:00`)
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 0) return 'Não informado'
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (years === 0) return `${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}`
  if (remMonths === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}`
}

export function newChecklistItem(text: string): ChecklistItem {
  return { id: `item-${Date.now()}-${Math.random()}`, text, done: false }
}

export const initialPeople: LeadershipPerson[] = []

function readLocalPeople(): LeadershipPerson[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(PEOPLE_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value.map(normalizePerson) : []
  } catch {
    return []
  }
}

function writeLocalPeople(people: LeadershipPerson[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people))
}

export async function loadPeople(): Promise<LeadershipPerson[]> {
  const { data, error } = await supabase.from('leadership_people').select('id, data')

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalPeople()
  }

  const people = (data ?? []).map(row => normalizePerson(row.data as Partial<LeadershipPerson>))
  if (people.length > 0) return people

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(MIGRATION_FLAG_KEY)) {
    const legacy = readLocalPeople()
    window.localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await savePeople(legacy)
      return legacy
    }
  }

  return people
}

export async function savePeople(people: LeadershipPerson[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeLocalPeople(people)

  if (people.length === 0) {
    await supabase.from('leadership_people').delete().neq('id', '')
    return
  }

  const now = new Date().toISOString()
  await supabase
    .from('leadership_people')
    .upsert(people.map(person => ({ id: person.id, data: person, updated_at: now })), { onConflict: 'id' })

  const ids = people.map(person => person.id)
  await supabase.from('leadership_people').delete().not('id', 'in', `(${ids.join(',')})`)
}
