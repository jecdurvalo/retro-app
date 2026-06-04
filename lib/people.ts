export const PEOPLE_STORAGE_KEY = 'leadership-people'

export const attentionTypes = ['Dar autonomia', 'Desafiar', 'Cuidar', 'Desenvolver', 'Monitorar carga'] as const
export type AttentionType = (typeof attentionTypes)[number]

export type NoteEntry = {
  id: string
  text: string
  createdAt: string
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
  moment: string
  frontIds: string[]
  nextOneOnOne: string
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
    frontIds: [],
    nextOneOnOne: '',
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

export const initialPeople: LeadershipPerson[] = []

export function loadPeople(): LeadershipPerson[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(PEOPLE_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

export function savePeople(people: LeadershipPerson[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people))
}
