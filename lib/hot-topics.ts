export const HOT_TOPICS_STORAGE_KEY = 'retro-management-hot-topics'
export const HOT_TOPICS_STORAGE_VERSION = 1

export const hotTopicTemperatures = ['monitor', 'attention', 'critical'] as const

export type HotTopicTemperature = (typeof hotTopicTemperatures)[number]

export const hotTopicImpacts = [
  'financial',
  'operational',
  'customer',
  'regulatory',
  'reputational',
  'team',
] as const

export type HotTopicImpact = (typeof hotTopicImpacts)[number]

export type HotTopic = {
  id: string
  title: string
  context: string
  whyNow: string
  temperature: HotTopicTemperature
  impacts: HotTopicImpact[]
  owner: string
  stakeholders: string[]
  lastUpdate: string
  nextAction: string
  decisionNeeded: string
  reevaluationDate: string
  containmentPlan: string
  criticalSince?: string
  initiativeId?: string
  createdAt: string
  updatedAt: string
}

type HotTopicsStorage = {
  version: number
  hotTopics: HotTopic[]
}

export const hotTopicTemperatureLabels: Record<HotTopicTemperature, string> = {
  monitor: 'Monitorar',
  attention: 'Atenção',
  critical: 'Crítico',
}

export const hotTopicImpactLabels: Record<HotTopicImpact, string> = {
  financial: 'Financeiro',
  operational: 'Operacional',
  customer: 'Cliente',
  regulatory: 'Regulatório',
  reputational: 'Reputacional',
  team: 'Time',
}

export const initialHotTopics: HotTopic[] = [
  {
    id: 'hot-topic-support-sla',
    title: 'Degradação do SLA de suporte crítico',
    context:
      'A fila de chamados críticos segue acima da capacidade semanal de resolução. Clientes estratégicos já reportaram impacto operacional. Engenharia atua de forma reativa nos incidentes mais urgentes.',
    whyNow:
      'A renovação de três contas relevantes ocorre neste mês e a degradação já está visível para os decisores.',
    temperature: 'critical',
    impacts: ['customer', 'operational', 'financial', 'reputational'],
    owner: 'Camila Freitas',
    stakeholders: ['Customer Success', 'Engenharia de Plataforma', 'Diretoria Comercial'],
    lastUpdate: '2026-06-03T14:30:00.000Z',
    nextAction: '',
    decisionNeeded: 'Definir reforço temporário de engenharia por duas semanas.',
    reevaluationDate: '2026-06-06',
    containmentPlan:
      'Criar uma célula temporária para as contas afetadas, congelar demandas não críticas e comunicar planos individuais de recuperação.',
    criticalSince: '2026-05-19T13:00:00.000Z',
    initiativeId: 'initiative-support-sla',
    createdAt: '2026-05-12T13:00:00.000Z',
    updatedAt: '2026-06-03T14:30:00.000Z',
  },
  {
    id: 'hot-topic-data-reliability',
    title: 'Divergência nos indicadores executivos de receita',
    context:
      'Financeiro e Dados usam regras distintas para receita líquida. Os painéis da reunião executiva apresentam variações relevantes. A reconciliação ainda depende de trabalho manual.',
    whyNow:
      'O planejamento do próximo trimestre e decisões de investimento dependem de uma visão única e confiável.',
    temperature: 'critical',
    impacts: ['financial', 'operational', 'reputational'],
    owner: 'Diego Martins',
    stakeholders: ['Financeiro', 'Dados', 'CEO', 'Diretoria Comercial'],
    lastUpdate: '2026-05-21T18:10:00.000Z',
    nextAction: 'Apresentar as duas regras e impactos financeiros no comitê executivo.',
    decisionNeeded: 'Escolher a regra oficial de reconhecimento de receita líquida.',
    reevaluationDate: '2026-06-05',
    containmentPlan:
      'Publicar uma reconciliação semanal assinada por Financeiro até a definição e impedir decisões com dados não reconciliados.',
    criticalSince: '2026-05-16T12:00:00.000Z',
    initiativeId: 'initiative-data-reliability',
    createdAt: '2026-05-02T12:00:00.000Z',
    updatedAt: '2026-05-21T18:10:00.000Z',
  },
  {
    id: 'hot-topic-enterprise-renewal',
    title: 'Renovação do maior contrato enterprise',
    context:
      'O cliente solicitou revisão comercial após incidentes recentes. A percepção de valor está concentrada em poucos usuários. A negociação envolve condições fora da política atual.',
    whyNow:
      'A decisão de renovação deve ocorrer em menos de três semanas e representa uma parcela relevante da receita recorrente.',
    temperature: 'attention',
    impacts: ['financial', 'customer', 'reputational'],
    owner: 'Marina Costa',
    stakeholders: ['CEO', 'Comercial Enterprise', 'Customer Success', 'Produto'],
    lastUpdate: '2026-06-02T17:00:00.000Z',
    nextAction: 'Realizar reunião executiva com o sponsor do cliente e apresentar plano de valor.',
    decisionNeeded: 'Aprovar limites de concessão comercial para a renovação.',
    reevaluationDate: '2026-06-09',
    containmentPlan:
      'Preparar proposta de renovação em etapas, plano executivo de recuperação e cenário financeiro de churn.',
    createdAt: '2026-05-26T15:00:00.000Z',
    updatedAt: '2026-06-02T17:00:00.000Z',
  },
  {
    id: 'hot-topic-regulatory-change',
    title: 'Adequação à nova exigência regulatória',
    context:
      'Uma mudança regulatória pode exigir ajustes no fluxo de consentimento e retenção de dados. O parecer jurídico inicial indica impacto moderado. O escopo técnico ainda não foi estimado.',
    whyNow:
      'A janela de adequação pode competir com entregas estratégicas do próximo ciclo de produto e tecnologia.',
    temperature: 'attention',
    impacts: ['regulatory', 'operational', 'customer'],
    owner: 'Ana Ribeiro',
    stakeholders: ['Jurídico', 'Segurança', 'Produto', 'Engenharia'],
    lastUpdate: '2026-05-29T11:40:00.000Z',
    nextAction: 'Concluir parecer jurídico e traduzir obrigações em requisitos de produto.',
    decisionNeeded: '',
    reevaluationDate: '2026-06-10',
    containmentPlan:
      'Adotar temporariamente a interpretação mais restritiva e limitar novas integrações que ampliem exposição.',
    createdAt: '2026-05-22T11:00:00.000Z',
    updatedAt: '2026-05-29T11:40:00.000Z',
  },
  {
    id: 'hot-topic-key-team-capacity',
    title: 'Capacidade e retenção do time de plataforma',
    context:
      'O time concentra conhecimento crítico em poucas pessoas. A demanda de incidentes reduziu o espaço para evolução estrutural. Há sinais de sobrecarga e risco de saída.',
    whyNow:
      'O próximo trimestre depende da plataforma para suportar crescimento e reduzir incidentes recorrentes.',
    temperature: 'monitor',
    impacts: ['team', 'operational', 'customer'],
    owner: 'Felipe Rocha',
    stakeholders: ['CTO', 'People', 'Produto', 'Engenharia de Plataforma'],
    lastUpdate: '2026-06-04T10:15:00.000Z',
    nextAction: 'Revisar capacidade, riscos de retenção e plano de distribuição de conhecimento.',
    decisionNeeded: '',
    reevaluationDate: '2026-06-18',
    containmentPlan:
      'Priorizar documentação operacional, definir backups para funções críticas e contratar suporte especializado temporário.',
    createdAt: '2026-05-28T14:00:00.000Z',
    updatedAt: '2026-06-04T10:15:00.000Z',
  },
]

const hotTopicTemperatureSet = new Set<string>(hotTopicTemperatures)
const hotTopicImpactSet = new Set<string>(hotTopicImpacts)

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

function readImpacts(value: unknown) {
  if (!Array.isArray(value)) return []

  return [...new Set(value.filter(
    (item): item is HotTopicImpact => typeof item === 'string' && hotTopicImpactSet.has(item),
  ))]
}

function readTemperature(value: unknown): HotTopicTemperature {
  return typeof value === 'string' && hotTopicTemperatureSet.has(value)
    ? (value as HotTopicTemperature)
    : 'monitor'
}

function normalizeHotTopic(value: unknown, index: number): HotTopic | null {
  if (!isRecord(value)) return null

  const title = readString(value.title).trim()
  if (!title) return null

  const id = readString(value.id).trim() || `hot-topic-${index + 1}`
  const createdAt = readString(value.createdAt) || new Date(0).toISOString()
  const criticalSince = readString(value.criticalSince)
  const initiativeId = readString(value.initiativeId).trim()

  return {
    id,
    title,
    context: readString(value.context),
    whyNow: readString(value.whyNow),
    temperature: readTemperature(value.temperature),
    impacts: readImpacts(value.impacts),
    owner: readString(value.owner),
    stakeholders: readStringArray(value.stakeholders),
    lastUpdate: readString(value.lastUpdate),
    nextAction: readString(value.nextAction),
    decisionNeeded: readString(value.decisionNeeded),
    reevaluationDate: readString(value.reevaluationDate),
    containmentPlan: readString(value.containmentPlan),
    ...(criticalSince ? { criticalSince } : {}),
    ...(initiativeId ? { initiativeId } : {}),
    createdAt,
    updatedAt: readString(value.updatedAt, createdAt),
  }
}

function cloneInitialHotTopics() {
  return initialHotTopics.map(hotTopic => ({
    ...hotTopic,
    impacts: [...hotTopic.impacts],
    stakeholders: [...hotTopic.stakeholders],
  }))
}

export function createEmptyHotTopic(): HotTopic {
  const now = new Date().toISOString()
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `hot-topic-${Date.now()}`

  return {
    id,
    title: 'Novo tema quente',
    context: '',
    whyNow: '',
    temperature: 'monitor',
    impacts: [],
    owner: '',
    stakeholders: [],
    lastUpdate: now,
    nextAction: '',
    decisionNeeded: '',
    reevaluationDate: '',
    containmentPlan: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function loadHotTopics(): HotTopic[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(HOT_TOPICS_STORAGE_KEY)
    if (!stored) return cloneInitialHotTopics()

    const parsed: unknown = JSON.parse(stored)
    const rawHotTopics = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.hotTopics)
        ? parsed.hotTopics
        : null

    if (!rawHotTopics) return cloneInitialHotTopics()

    return rawHotTopics
      .map(normalizeHotTopic)
      .filter((hotTopic): hotTopic is HotTopic => hotTopic !== null)
  } catch {
    return cloneInitialHotTopics()
  }
}

export function saveHotTopics(hotTopics: HotTopic[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storage: HotTopicsStorage = {
      version: HOT_TOPICS_STORAGE_VERSION,
      hotTopics,
    }

    window.localStorage.setItem(HOT_TOPICS_STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch {
    return false
  }
}
