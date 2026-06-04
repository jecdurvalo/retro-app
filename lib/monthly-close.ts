export const MONTHLY_CLOSE_STORAGE_KEY = 'retro-management-monthly-closes'
export const MONTHLY_CLOSE_STORAGE_VERSION = 1

export const monthlyCloseStepIds = [
  'referenceMonthSelected',
  'moodAndRetroReviewed',
  'actionPlansConfirmed',
  'initiativesUpdated',
  'hotTopicsUpdated',
  'delegationsReviewed',
  'learningsRegistered',
  'executiveReadingGenerated',
] as const

export type MonthlyCloseStepId = (typeof monthlyCloseStepIds)[number]

export type MonthlyCloseSteps = Record<MonthlyCloseStepId, boolean>

export type MonthlyCloseMetrics = {
  moodAverage: number
  moodResponses: number
  retroItems: number
  openPlans: number
  closedPlans: number
  activeInitiatives: number
  completedInitiatives: number
  hotTopics: number
  criticalHotTopics: number
  activeDelegations: number
  overdueCheckIns: number
  managementQualityScore: number
}

export type MonthlyCloseSnapshot = {
  id: string
  referenceMonth: string
  steps: MonthlyCloseSteps
  learnings: string[]
  executiveMinutes: string
  improved: string[]
  worsened: string[]
  stalled: string[]
  leadershipActions: string[]
  decisions: string[]
  nextMonthTopics: string[]
  protagonists: string[]
  escalatedRisks: string[]
  metrics: MonthlyCloseMetrics
  createdAt: string
  updatedAt: string
}

type MonthlyCloseStorage = {
  version: number
  snapshots: MonthlyCloseSnapshot[]
}

export const monthlyCloseStepLabels: Record<MonthlyCloseStepId, string> = {
  referenceMonthSelected: 'Selecionar mês de referência',
  moodAndRetroReviewed: 'Revisar mood e principais temas da retro',
  actionPlansConfirmed: 'Confirmar planos de ação criados',
  initiativesUpdated: 'Atualizar status das iniciativas',
  hotTopicsUpdated: 'Atualizar temas quentes',
  delegationsReviewed: 'Revisar delegações e autonomia',
  learningsRegistered: 'Registrar aprendizados do mês',
  executiveReadingGenerated: 'Gerar leitura executiva',
}

function createEmptySteps(): MonthlyCloseSteps {
  return {
    referenceMonthSelected: false,
    moodAndRetroReviewed: false,
    actionPlansConfirmed: false,
    initiativesUpdated: false,
    hotTopicsUpdated: false,
    delegationsReviewed: false,
    learningsRegistered: false,
    executiveReadingGenerated: false,
  }
}

function createEmptyMetrics(): MonthlyCloseMetrics {
  return {
    moodAverage: 0,
    moodResponses: 0,
    retroItems: 0,
    openPlans: 0,
    closedPlans: 0,
    activeInitiatives: 0,
    completedInitiatives: 0,
    hotTopics: 0,
    criticalHotTopics: 0,
    activeDelegations: 0,
    overdueCheckIns: 0,
    managementQualityScore: 0,
  }
}

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

function readBoolean(value: unknown) {
  return value === true
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeSteps(value: unknown): MonthlyCloseSteps {
  const steps = createEmptySteps()
  if (!isRecord(value)) return steps

  for (const stepId of monthlyCloseStepIds) {
    steps[stepId] = readBoolean(value[stepId])
  }

  return steps
}

function normalizeMetrics(value: unknown): MonthlyCloseMetrics {
  const metrics = createEmptyMetrics()
  if (!isRecord(value)) return metrics

  for (const key of Object.keys(metrics) as Array<keyof MonthlyCloseMetrics>) {
    metrics[key] = readNumber(value[key])
  }

  return metrics
}

function normalizeMonthlyClose(value: unknown, index: number): MonthlyCloseSnapshot | null {
  if (!isRecord(value)) return null

  const referenceMonth = readString(value.referenceMonth).trim()
  if (!referenceMonth) return null

  const id = readString(value.id).trim() || `monthly-close-${referenceMonth}-${index + 1}`
  const createdAt = readString(value.createdAt) || new Date(0).toISOString()

  return {
    id,
    referenceMonth,
    steps: normalizeSteps(value.steps),
    learnings: readStringArray(value.learnings),
    executiveMinutes: readString(value.executiveMinutes),
    improved: readStringArray(value.improved),
    worsened: readStringArray(value.worsened),
    stalled: readStringArray(value.stalled),
    leadershipActions: readStringArray(value.leadershipActions),
    decisions: readStringArray(value.decisions),
    nextMonthTopics: readStringArray(value.nextMonthTopics),
    protagonists: readStringArray(value.protagonists),
    escalatedRisks: readStringArray(value.escalatedRisks),
    metrics: normalizeMetrics(value.metrics),
    createdAt,
    updatedAt: readString(value.updatedAt, createdAt),
  }
}

export function createEmptyMonthlyClose(referenceMonth = ''): MonthlyCloseSnapshot {
  const now = new Date().toISOString()
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `monthly-close-${Date.now()}`

  return {
    id,
    referenceMonth,
    steps: {
      ...createEmptySteps(),
      referenceMonthSelected: referenceMonth.trim().length > 0,
    },
    learnings: [],
    executiveMinutes: '',
    improved: [],
    worsened: [],
    stalled: [],
    leadershipActions: [],
    decisions: [],
    nextMonthTopics: [],
    protagonists: [],
    escalatedRisks: [],
    metrics: createEmptyMetrics(),
    createdAt: now,
    updatedAt: now,
  }
}

export function loadMonthlyCloses(): MonthlyCloseSnapshot[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(MONTHLY_CLOSE_STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    const rawSnapshots = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.snapshots)
        ? parsed.snapshots
        : null

    if (!rawSnapshots) return []

    return rawSnapshots
      .map(normalizeMonthlyClose)
      .filter((snapshot): snapshot is MonthlyCloseSnapshot => snapshot !== null)
  } catch {
    return []
  }
}

export function saveMonthlyCloses(snapshots: MonthlyCloseSnapshot[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    const storage: MonthlyCloseStorage = {
      version: MONTHLY_CLOSE_STORAGE_VERSION,
      snapshots,
    }

    window.localStorage.setItem(MONTHLY_CLOSE_STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch {
    return false
  }
}
