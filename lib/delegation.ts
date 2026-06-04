export const DELEGATION_STORAGE_KEY = 'retro-management-delegation-board'
export const DELEGATION_STORAGE_VERSION = 1

export const responsibilityTypes = [
  'execution',
  'analysis',
  'communication',
  'stakeholder',
  'decision',
  'monitoring',
  'documentation',
] as const

export type ResponsibilityType = (typeof responsibilityTypes)[number]

export const autonomyLevels = [1, 2, 3, 4, 5] as const

export type AutonomyLevel = (typeof autonomyLevels)[number]

export type DelegationItem = {
  id: string
  title: string
  responsible: string
  initiativeId: string
  responsibilityType: ResponsibilityType
  autonomyLevel: AutonomyLevel
  expectedOutcome: string
  successCriteria: string
  checkInFrequency: string
  nextCheckIn: string
  warningSigns: string
  leadershipFeedback: string
  observedEvolution: string
  createdAt: string
  updatedAt: string
}

type DelegationStorage = {
  version: number
  items: DelegationItem[]
}

export const responsibilityTypeLabels: Record<ResponsibilityType, string> = {
  execution: 'Execução',
  analysis: 'Análise',
  communication: 'Comunicação',
  stakeholder: 'Stakeholder',
  decision: 'Decisão',
  monitoring: 'Monitoramento',
  documentation: 'Documentação',
}

export const autonomyLevelLabels: Record<AutonomyLevel, string> = {
  1: 'Executar com orientação próxima',
  2: 'Propor caminho e validar',
  3: 'Tocar com check-in periódico',
  4: 'Liderar ponta a ponta',
  5: 'Ensinar outras pessoas',
}

export const initialDelegationItems: DelegationItem[] = [
  {
    id: 'delegation-onboarding-pilot',
    title: 'Liderar piloto da nova jornada de onboarding',
    responsible: 'Bianca Souza',
    initiativeId: 'initiative-onboarding',
    responsibilityType: 'execution',
    autonomyLevel: 4,
    expectedOutcome: 'Conduzir o piloto com 10 novos clientes e consolidar aprendizados.',
    successCriteria: 'Piloto concluído, feedback documentado e plano de ajustes priorizado.',
    checkInFrequency: 'Semanal',
    nextCheckIn: '2026-06-09',
    warningSigns: 'Baixa adesão de CS ou menos de oito clientes confirmados para o piloto.',
    leadershipFeedback: 'Manter foco nas evidências de ativação e evitar ampliar o escopo.',
    observedEvolution: 'Passou a antecipar dependências e conduzir alinhamentos com autonomia.',
    createdAt: '2026-05-12T13:00:00.000Z',
    updatedAt: '2026-06-02T15:30:00.000Z',
  },
  {
    id: 'delegation-data-reconciliation',
    title: 'Preparar recomendação para a regra oficial de receita',
    responsible: 'Ana Ribeiro',
    initiativeId: 'initiative-data-reliability',
    responsibilityType: 'analysis',
    autonomyLevel: 3,
    expectedOutcome: 'Apresentar uma recomendação objetiva com impactos e riscos das alternativas.',
    successCriteria: 'Comitê recebe análise reconciliada e consegue tomar a decisão na reunião.',
    checkInFrequency: 'Duas vezes por semana',
    nextCheckIn: '2026-06-06',
    warningSigns: 'Novas divergências sem fonte identificada ou ausência de validação do Financeiro.',
    leadershipFeedback: 'Explicitar a recomendação principal antes de detalhar as alternativas.',
    observedEvolution: 'Ganhou clareza na comunicação executiva e pede validação apenas nos pontos críticos.',
    createdAt: '2026-05-20T14:00:00.000Z',
    updatedAt: '2026-06-03T18:10:00.000Z',
  },
  {
    id: 'delegation-support-recovery',
    title: 'Coordenar plano de recuperação do SLA crítico',
    responsible: 'Lucas Nunes',
    initiativeId: 'initiative-support-sla',
    responsibilityType: 'stakeholder',
    autonomyLevel: 3,
    expectedOutcome: 'Alinhar Suporte e Engenharia em uma rotina única de recuperação da fila crítica.',
    successCriteria: 'Fila crítica abaixo de 20 chamados e SLA acima de 90% por duas semanas.',
    checkInFrequency: 'A cada 2 dias',
    nextCheckIn: '2026-06-05',
    warningSigns: 'Entrada de chamados supera resoluções ou incidentes sem responsável técnico.',
    leadershipFeedback: 'Escalar cedo conflitos de capacidade que dependam de priorização executiva.',
    observedEvolution: 'Começou a conduzir acordos entre áreas sem depender da gestora em cada interação.',
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-06-04T11:20:00.000Z',
  },
  {
    id: 'delegation-release-adoption',
    title: 'Monitorar adoção do ritual de prontidão para releases',
    responsible: 'Felipe Rocha',
    initiativeId: 'initiative-release-process',
    responsibilityType: 'monitoring',
    autonomyLevel: 5,
    expectedOutcome: 'Garantir adoção consistente e transferir a rotina para os líderes de engenharia.',
    successCriteria: '100% dos releases relevantes avaliados e dois líderes aptos a conduzir o ritual.',
    checkInFrequency: 'Mensal',
    nextCheckIn: '2026-07-01',
    warningSigns: 'Releases relevantes sem checklist ou dependência recorrente de uma única pessoa.',
    leadershipFeedback: 'Concentrar o próximo ciclo em formar multiplicadores.',
    observedEvolution: 'Já opera como referência e ensina outras pessoas a manter o processo.',
    createdAt: '2026-04-18T17:00:00.000Z',
    updatedAt: '2026-06-01T19:00:00.000Z',
  },
  {
    id: 'delegation-observability-map',
    title: 'Documentar mapa de eventos críticos de pagamento',
    responsible: 'João Azevedo',
    initiativeId: 'initiative-observability',
    responsibilityType: 'documentation',
    autonomyLevel: 2,
    expectedOutcome: 'Produzir o mapa mínimo necessário para retomar a iniciativa com clareza.',
    successCriteria: 'Eventos críticos, donos e lacunas de instrumentação documentados e validados.',
    checkInFrequency: 'Quinzenal',
    nextCheckIn: '2026-06-15',
    warningSigns: 'Documento sem validação de Produto Pagamentos ou escopo crescendo além do mínimo.',
    leadershipFeedback: 'Propor uma primeira versão enxuta antes de buscar cobertura completa.',
    observedEvolution: 'Está estruturando melhor as propostas antes de pedir direcionamento.',
    createdAt: '2026-05-19T14:00:00.000Z',
    updatedAt: '2026-05-30T10:00:00.000Z',
  },
]

const responsibilityTypeSet = new Set<string>(responsibilityTypes)
const autonomyLevelSet = new Set<number>(autonomyLevels)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function readResponsibilityType(value: unknown): ResponsibilityType {
  return typeof value === 'string' && responsibilityTypeSet.has(value)
    ? (value as ResponsibilityType)
    : 'execution'
}

function readAutonomyLevel(value: unknown): AutonomyLevel {
  return typeof value === 'number' && autonomyLevelSet.has(value)
    ? (value as AutonomyLevel)
    : 1
}

function normalizeDelegationItem(value: unknown, index: number): DelegationItem | null {
  if (!isRecord(value)) return null

  const title = readString(value.title).trim()
  if (!title) return null

  const id = readString(value.id).trim() || `delegation-${index + 1}`
  const createdAt = readString(value.createdAt) || new Date(0).toISOString()

  return {
    id,
    title,
    responsible: readString(value.responsible),
    initiativeId: readString(value.initiativeId),
    responsibilityType: readResponsibilityType(value.responsibilityType),
    autonomyLevel: readAutonomyLevel(value.autonomyLevel),
    expectedOutcome: readString(value.expectedOutcome),
    successCriteria: readString(value.successCriteria),
    checkInFrequency: readString(value.checkInFrequency),
    nextCheckIn: readString(value.nextCheckIn),
    warningSigns: readString(value.warningSigns),
    leadershipFeedback: readString(value.leadershipFeedback),
    observedEvolution: readString(value.observedEvolution),
    createdAt,
    updatedAt: readString(value.updatedAt, createdAt),
  }
}

function cloneInitialDelegationItems() {
  return initialDelegationItems.map(item => ({ ...item }))
}

export function createEmptyDelegationItem(): DelegationItem {
  const now = new Date().toISOString()
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `delegation-${Date.now()}`

  return {
    id,
    title: 'Nova responsabilidade',
    responsible: '',
    initiativeId: '',
    responsibilityType: 'execution',
    autonomyLevel: 1,
    expectedOutcome: '',
    successCriteria: '',
    checkInFrequency: '',
    nextCheckIn: '',
    warningSigns: '',
    leadershipFeedback: '',
    observedEvolution: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function loadDelegationItems(): DelegationItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(DELEGATION_STORAGE_KEY)
    if (!stored) return cloneInitialDelegationItems()

    const parsed: unknown = JSON.parse(stored)
    const rawItems = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.items)
        ? parsed.items
        : null

    if (!rawItems) return cloneInitialDelegationItems()

    return rawItems
      .map(normalizeDelegationItem)
      .filter((item): item is DelegationItem => item !== null)
  } catch {
    return cloneInitialDelegationItems()
  }
}

export function saveDelegationItems(items: DelegationItem[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storage: DelegationStorage = {
      version: DELEGATION_STORAGE_VERSION,
      items,
    }

    window.localStorage.setItem(DELEGATION_STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch {
    return false
  }
}
