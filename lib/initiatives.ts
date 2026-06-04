export const INITIATIVE_STORAGE_KEY = 'retro-management-initiatives'
export const INITIATIVES_UPDATED_EVENT = 'retro-initiatives-updated'
export const INITIATIVES_STORAGE_VERSION = 1

export const initiativeTypes = [
  'project',
  'hot_topic',
  'process',
  'risk',
  'continuous_improvement',
  'tech_ask',
] as const

export type InitiativeType = (typeof initiativeTypes)[number]

export const initiativeStatuses = [
  'not_started',
  'in_progress',
  'at_risk',
  'blocked',
  'completed',
  'paused',
] as const

export type InitiativeStatus = (typeof initiativeStatuses)[number]

export const initiativeCriticalities = ['high', 'medium', 'low'] as const

export type InitiativeCriticality = (typeof initiativeCriticalities)[number]

export type Initiative = {
  id: string
  title: string
  description: string
  type: InitiativeType
  status: InitiativeStatus
  criticality: InitiativeCriticality
  owner: string
  involvedPeople: string[]
  area: string
  startDate: string
  nextMilestone: string
  targetDate: string
  nextStep: string
  currentRisk: string
  decisionNeeded: string
  expectedEvidence: string
  sourceLink: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

type InitiativesStorage = {
  version: number
  initiatives: Initiative[]
}

export const initiativeTypeLabels: Record<InitiativeType, string> = {
  project: 'Projeto',
  'hot_topic': 'Tema quente',
  process: 'Processo',
  risk: 'Risco',
  'continuous_improvement': 'Melhoria contínua',
  'tech_ask': 'Tech ask',
}

export const initiativeStatusLabels: Record<InitiativeStatus, string> = {
  'not_started': 'Não iniciado',
  'in_progress': 'Em andamento',
  'at_risk': 'Em risco',
  blocked: 'Bloqueado',
  completed: 'Concluído',
  paused: 'Pausado',
}

export const initiativeCriticalityLabels: Record<InitiativeCriticality, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export const initialInitiatives: Initiative[] = [
  {
    id: 'initiative-onboarding',
    title: 'Redesenho do onboarding de clientes',
    description: 'Reduzir o tempo até o primeiro valor percebido e os chamados nos primeiros 30 dias.',
    type: 'project',
    status: 'in_progress',
    criticality: 'high',
    owner: 'Marina Costa',
    involvedPeople: ['Rafael Lima', 'Bianca Souza', 'Time de CS'],
    area: 'Produto & Customer Success',
    startDate: '2026-04-07',
    nextMilestone: 'Piloto com 10 novos clientes',
    targetDate: '2026-07-31',
    nextStep: 'Validar a nova jornada com CS e selecionar os clientes do piloto.',
    currentRisk: 'Capacidade limitada de instrumentação dos eventos da jornada.',
    decisionNeeded: 'Priorizar dois eventos de produto no próximo ciclo de engenharia.',
    expectedEvidence: 'Redução de 25% no tempo até ativação e de 20% nos chamados iniciais.',
    sourceLink: '/management?source=retro-q1-customer-journey',
    createdAt: '2026-04-07T12:00:00.000Z',
    updatedAt: '2026-06-02T15:30:00.000Z',
  },
  {
    id: 'initiative-data-reliability',
    title: 'Confiabilidade dos indicadores executivos',
    description: 'Eliminar divergências recorrentes entre os painéis usados nas reuniões de gestão.',
    type: 'risk',
    status: 'blocked',
    criticality: 'high',
    owner: 'Diego Martins',
    involvedPeople: ['Ana Ribeiro', 'Time de Dados', 'Financeiro'],
    area: 'Dados & Operações',
    startDate: '2026-03-18',
    nextMilestone: 'Definição da fonte oficial de receita líquida',
    targetDate: '2026-06-20',
    nextStep: 'Levar as duas definições divergentes para decisão no comitê executivo.',
    currentRisk: 'Decisões comerciais seguem sendo tomadas com números inconsistentes.',
    decisionNeeded: 'Escolher a regra oficial de reconhecimento de receita líquida.',
    expectedEvidence: 'Painel executivo com reconciliação automática e variação inferior a 1%.',
    sourceLink: '/management?source=fca-metricas-receita',
    createdAt: '2026-03-18T14:00:00.000Z',
    updatedAt: '2026-06-03T18:10:00.000Z',
  },
  {
    id: 'initiative-support-sla',
    title: 'Recuperação do SLA de suporte',
    description: 'Estabilizar a fila crítica e recuperar previsibilidade no atendimento.',
    type: 'hot_topic',
    status: 'at_risk',
    criticality: 'high',
    owner: 'Camila Freitas',
    involvedPeople: ['Lucas Nunes', 'Engenharia de Plataforma'],
    area: 'Suporte & Tecnologia',
    startDate: '2026-05-12',
    nextMilestone: 'Fila crítica abaixo de 20 chamados',
    targetDate: '2026-06-14',
    nextStep: '',
    currentRisk: 'A entrada semanal de chamados críticos ainda supera a capacidade de resolução.',
    decisionNeeded: 'Definir reforço temporário de engenharia por duas semanas.',
    expectedEvidence: 'SLA crítico acima de 90% por quatro semanas consecutivas.',
    sourceLink: '/management?source=retro-support-may',
    createdAt: '2026-05-12T13:00:00.000Z',
    updatedAt: '2026-06-04T11:20:00.000Z',
  },
  {
    id: 'initiative-pricing',
    title: 'Revisão de pacotes e pricing',
    description: 'Simplificar a oferta comercial e melhorar margem nas novas vendas.',
    type: 'project',
    status: 'not_started',
    criticality: 'medium',
    owner: '',
    involvedPeople: ['Comercial', 'Financeiro', 'Produto'],
    area: 'Receita',
    startDate: '',
    nextMilestone: 'Hipóteses e guardrails aprovados',
    targetDate: '2026-08-28',
    nextStep: 'Definir sponsor e dono operacional para iniciar o diagnóstico.',
    currentRisk: 'Sem dono claro, a revisão pode perder a janela do planejamento do segundo semestre.',
    decisionNeeded: 'Nomear responsável principal e sponsor executivo.',
    expectedEvidence: 'Nova oferta validada com clientes e margem projetada por pacote.',
    sourceLink: '',
    createdAt: '2026-05-27T16:00:00.000Z',
    updatedAt: '2026-05-27T16:00:00.000Z',
  },
  {
    id: 'initiative-release-process',
    title: 'Ritual leve de prontidão para releases',
    description: 'Padronizar checagens essenciais antes de lançamentos com impacto em clientes.',
    type: 'process',
    status: 'completed',
    criticality: 'medium',
    owner: 'Felipe Rocha',
    involvedPeople: ['Produto', 'Engenharia', 'Suporte'],
    area: 'Produto & Engenharia',
    startDate: '2026-04-14',
    nextMilestone: 'Revisão de efetividade após 30 dias',
    targetDate: '2026-05-29',
    nextStep: 'Medir aderência e ajustar o checklist após o primeiro mês.',
    currentRisk: '',
    decisionNeeded: '',
    expectedEvidence: '100% dos releases relevantes com checklist e plano de comunicação.',
    sourceLink: '/management?source=fca-release-incidents',
    completedAt: '2026-06-01',
    createdAt: '2026-04-14T17:00:00.000Z',
    updatedAt: '2026-06-01T19:00:00.000Z',
  },
  {
    id: 'initiative-observability',
    title: 'Observabilidade da jornada de pagamento',
    description: 'Dar visibilidade ponta a ponta sobre falhas e degradações na conversão.',
    type: 'tech_ask',
    status: 'paused',
    criticality: 'low',
    owner: 'João Azevedo',
    involvedPeople: ['Time de Plataforma', 'Produto Pagamentos'],
    area: 'Tecnologia',
    startDate: '2026-05-05',
    nextMilestone: 'Mapa de eventos críticos',
    targetDate: '2026-09-15',
    nextStep: 'Retomar após a estabilização do SLA de suporte.',
    currentRisk: 'Pausa prolongada mantém diagnóstico de incidentes dependente de análise manual.',
    decisionNeeded: '',
    expectedEvidence: 'Alertas acionáveis e redução de 40% no tempo médio de diagnóstico.',
    sourceLink: '',
    createdAt: '2026-05-05T14:00:00.000Z',
    updatedAt: '2026-05-30T10:00:00.000Z',
  },
]

const initiativeTypeSet = new Set<string>(initiativeTypes)
const initiativeStatusSet = new Set<string>(initiativeStatuses)
const initiativeCriticalitySet = new Set<string>(initiativeCriticalities)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function readEnum<T extends string>(value: unknown, allowed: Set<string>, fallback: T) {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : fallback
}

function normalizeInitiative(value: unknown, index: number): Initiative | null {
  if (!isRecord(value)) return null

  const title = readString(value.title).trim()
  if (!title) return null

  const id = readString(value.id).trim() || `initiative-${index + 1}`
  const createdAt = readString(value.createdAt) || new Date(0).toISOString()

  return {
    id,
    title,
    description: readString(value.description),
    type: readEnum<InitiativeType>(value.type, initiativeTypeSet, 'project'),
    status: readEnum<InitiativeStatus>(value.status, initiativeStatusSet, 'not_started'),
    criticality: readEnum<InitiativeCriticality>(value.criticality, initiativeCriticalitySet, 'medium'),
    owner: readString(value.owner),
    involvedPeople: readStringArray(value.involvedPeople),
    area: readString(value.area),
    startDate: readString(value.startDate),
    nextMilestone: readString(value.nextMilestone),
    targetDate: readString(value.targetDate),
    nextStep: readString(value.nextStep),
    currentRisk: readString(value.currentRisk),
    decisionNeeded: readString(value.decisionNeeded),
    expectedEvidence: readString(value.expectedEvidence),
    sourceLink: readString(value.sourceLink),
    ...(readString(value.completedAt) ? { completedAt: readString(value.completedAt) } : {}),
    createdAt,
    updatedAt: readString(value.updatedAt, createdAt),
  }
}

function cloneInitialInitiatives() {
  return initialInitiatives.map(initiative => ({
    ...initiative,
    involvedPeople: [...initiative.involvedPeople],
  }))
}

export function createEmptyInitiative(): Initiative {
  const now = new Date().toISOString()
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `initiative-${Date.now()}`

  return {
    id,
    title: 'Nova iniciativa',
    description: '',
    type: 'project',
    status: 'not_started',
    criticality: 'medium',
    owner: '',
    involvedPeople: [],
    area: '',
    startDate: '',
    nextMilestone: '',
    targetDate: '',
    nextStep: '',
    currentRisk: '',
    decisionNeeded: '',
    expectedEvidence: '',
    sourceLink: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function loadInitiatives(): Initiative[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(INITIATIVE_STORAGE_KEY)
    if (!stored) return cloneInitialInitiatives()

    const parsed: unknown = JSON.parse(stored)
    const rawInitiatives = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.initiatives)
        ? parsed.initiatives
        : null

    if (!rawInitiatives) return cloneInitialInitiatives()

    return rawInitiatives
      .map(normalizeInitiative)
      .filter((initiative): initiative is Initiative => initiative !== null)
  } catch {
    return cloneInitialInitiatives()
  }
}

export function saveInitiatives(initiatives: Initiative[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storage: InitiativesStorage = {
      version: INITIATIVES_STORAGE_VERSION,
      initiatives,
    }

    window.localStorage.setItem(INITIATIVE_STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch {
    return false
  }
}
