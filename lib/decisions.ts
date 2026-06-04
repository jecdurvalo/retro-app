export const DECISIONS_STORAGE_KEY = 'leadership-decisions'

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

export function loadDecisions(): LeadershipDecision[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DECISIONS_STORAGE_KEY) || 'null')
    return Array.isArray(parsed) ? parsed.map(cloneDecision) : []
  } catch {
    return []
  }
}

export function saveDecisions(decisions: LeadershipDecision[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(decisions))
}
