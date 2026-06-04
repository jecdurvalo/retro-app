export const FRONTS_STORAGE_KEY = 'leadership-management-fronts'
export const FRONTS_UPDATED_EVENT = 'leadership-fronts-updated'

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
    createdAt: now,
    updatedAt: now,
  }
}

export function loadFronts(): ManagementFront[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(FRONTS_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

export function saveFronts(fronts: ManagementFront[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FRONTS_STORAGE_KEY, JSON.stringify(fronts))
  window.dispatchEvent(new Event(FRONTS_UPDATED_EVENT))
}
