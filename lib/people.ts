export const PEOPLE_STORAGE_KEY = 'leadership-people'

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

export function loadPeople(): LeadershipPerson[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(PEOPLE_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value.map(normalizePerson) : []
  } catch { return [] }
}

export function savePeople(people: LeadershipPerson[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people))
}
