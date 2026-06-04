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
  createdAt: string
  updatedAt: string
}

export const initialFronts: ManagementFront[] = [
  {
    id: 'front-onboarding',
    name: 'Redesenho do onboarding de clientes',
    description: 'Reduzir o tempo até o primeiro valor percebido e os chamados iniciais.',
    type: 'Projeto',
    owner: 'Marina Costa',
    involvedPeople: ['Rafael Lima', 'Bianca Souza'],
    stakeholders: ['Customer Success', 'Produto'],
    temperature: 'Atenção',
    status: 'Em andamento',
    origin: 'Planejamento',
    managerIntervention: 'Alinhar stakeholders',
    nextCheckpoint: '2026-06-09',
    nextStep: 'Validar a nova jornada e selecionar clientes para o piloto.',
    risks: ['Capacidade limitada para instrumentar eventos'],
    relatedDecisions: ['Priorizar eventos de produto no próximo ciclo'],
    relatedTasks: ['Selecionar clientes do piloto'],
    evidence: ['Mapa da jornada revisado'],
    createdAt: '2026-04-07T12:00:00.000Z',
    updatedAt: '2026-06-02T15:30:00.000Z',
  },
  {
    id: 'front-data',
    name: 'Confiabilidade dos indicadores executivos',
    description: 'Eliminar divergências entre os painéis usados nas reuniões de gestão.',
    type: 'Risco',
    owner: 'Diego Martins',
    involvedPeople: ['Ana Ribeiro'],
    stakeholders: ['Financeiro', 'Dados', 'Diretoria Comercial'],
    temperature: 'Crítica',
    status: 'Bloqueada',
    origin: 'Reunião',
    managerIntervention: 'Decidir',
    nextCheckpoint: '2026-06-06',
    nextStep: 'Levar as definições divergentes para decisão no comitê.',
    risks: ['Decisões comerciais com números inconsistentes'],
    relatedDecisions: ['Definir regra oficial de receita líquida'],
    relatedTasks: ['Preparar reconciliação financeira'],
    evidence: ['Divergência documentada em dois painéis'],
    createdAt: '2026-03-18T14:00:00.000Z',
    updatedAt: '2026-05-21T18:10:00.000Z',
  },
  {
    id: 'front-support',
    name: 'Recuperação do SLA de suporte',
    description: 'Estabilizar a fila crítica e recuperar previsibilidade no atendimento.',
    type: 'Melhoria',
    owner: 'Camila Freitas',
    involvedPeople: ['Lucas Nunes'],
    stakeholders: ['Suporte', 'Engenharia de Plataforma'],
    temperature: 'Crítica',
    status: 'Em andamento',
    origin: 'Retro',
    managerIntervention: 'Desbloquear',
    nextCheckpoint: '2026-06-05',
    nextStep: 'Definir reforço temporário de engenharia por duas semanas.',
    risks: ['Entrada de chamados supera a capacidade de resolução'],
    relatedDecisions: ['Alocação temporária de engenharia'],
    relatedTasks: ['Consolidar fila crítica'],
    evidence: ['SLA crítico abaixo da meta'],
    createdAt: '2026-05-12T13:00:00.000Z',
    updatedAt: '2026-06-04T11:20:00.000Z',
  },
  {
    id: 'front-pricing',
    name: 'Revisão de pacotes e pricing',
    description: 'Simplificar a oferta comercial e melhorar margem nas novas vendas.',
    type: 'Oportunidade',
    owner: '',
    involvedPeople: ['Comercial', 'Financeiro', 'Produto'],
    stakeholders: ['Diretoria Comercial'],
    temperature: 'Atenção',
    status: 'Não iniciada',
    origin: 'Planejamento',
    managerIntervention: 'Desenvolver dono',
    nextCheckpoint: '',
    nextStep: 'Definir sponsor e dono operacional.',
    risks: ['Perder a janela do planejamento do semestre'],
    relatedDecisions: ['Nomear responsável principal'],
    relatedTasks: [],
    evidence: [],
    createdAt: '2026-05-27T16:00:00.000Z',
    updatedAt: '2026-05-27T16:00:00.000Z',
  },
  {
    id: 'front-development',
    name: 'Evolução de autonomia da liderança de operações',
    description: 'Ampliar autonomia para conduzir decisões e alinhamentos entre áreas.',
    type: 'PDI',
    owner: 'Marina Costa',
    involvedPeople: ['Joana'],
    stakeholders: ['People'],
    temperature: 'Saudável',
    status: 'Em andamento',
    origin: '1:1',
    managerIntervention: 'Monitorar',
    nextCheckpoint: '2026-06-11',
    nextStep: 'Revisar evidências de decisões conduzidas com autonomia.',
    risks: [],
    relatedDecisions: [],
    relatedTasks: ['Registrar evidências do ciclo'],
    evidence: ['Três alinhamentos conduzidos sem escalonamento'],
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-06-03T12:00:00.000Z',
  },
]

function cloneFront(front: ManagementFront): ManagementFront {
  return {
    ...front,
    involvedPeople: [...front.involvedPeople],
    stakeholders: [...front.stakeholders],
    risks: [...front.risks],
    relatedDecisions: [...front.relatedDecisions],
    relatedTasks: [...front.relatedTasks],
    evidence: [...front.evidence],
  }
}

export function createEmptyFront(): ManagementFront {
  const now = new Date().toISOString()
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `front-${Date.now()}`,
    name: 'Nova frente',
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
    createdAt: now,
    updatedAt: now,
  }
}

export function loadFronts(): ManagementFront[] {
  if (typeof window === 'undefined') return initialFronts.map(cloneFront)
  try {
    const stored = window.localStorage.getItem(FRONTS_STORAGE_KEY)
    if (!stored) return initialFronts.map(cloneFront)
    const parsed = JSON.parse(stored) as ManagementFront[]
    return Array.isArray(parsed) ? parsed.map(cloneFront) : initialFronts.map(cloneFront)
  } catch {
    return initialFronts.map(cloneFront)
  }
}

export function saveFronts(fronts: ManagementFront[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FRONTS_STORAGE_KEY, JSON.stringify(fronts))
  window.dispatchEvent(new Event(FRONTS_UPDATED_EVENT))
}
