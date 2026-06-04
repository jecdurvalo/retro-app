import type { DelegationItem } from './delegation'
import type { HotTopic } from './hot-topics'
import type { Initiative } from './initiatives'
import type { ManagementPlan } from './management'

export type ManagementQualityDimensionId =
  | 'clarity'
  | 'ownership'
  | 'cadence'
  | 'outcome'
  | 'delegation'

export type ManagementQualityMetricId =
  | 'initiatives_with_clear_description'
  | 'actions_with_success_criteria'
  | 'topics_with_context_and_impact'
  | 'plans_with_owner'
  | 'initiatives_with_dri'
  | 'decisions_with_owner'
  | 'initiatives_with_next_step'
  | 'check_ins_up_to_date'
  | 'hot_topics_reviewed_recently'
  | 'plans_with_result_evidence'
  | 'initiatives_completed_on_time'
  | 'actions_with_recorded_impact'
  | 'initiatives_not_centralized'
  | 'people_with_relevant_responsibility'
  | 'responsibilities_with_autonomy'

export type ManagementQualityMetric = {
  id: ManagementQualityMetricId
  dimension: ManagementQualityDimensionId
  label: string
  score: number
  numerator: number
  denominator: number
  applicable: boolean
  gapCount: number
  supportCopy: string
}

export type ManagementQualityDimension = {
  id: ManagementQualityDimensionId
  label: string
  score: number
  metrics: ManagementQualityMetric[]
}

export type ManagementQualityGap = {
  metricId: ManagementQualityMetricId
  dimension: ManagementQualityDimensionId
  title: string
  score: number
  gapCount: number
  supportCopy: string
  recommendation: string
}

export type ManagementQualityResult = {
  score: number
  dimensions: Record<ManagementQualityDimensionId, ManagementQualityDimension>
  metrics: ManagementQualityMetric[]
  topGaps: ManagementQualityGap[]
  recommendation: string
}

type MetricDefinition = {
  id: ManagementQualityMetricId
  dimension: ManagementQualityDimensionId
  label: string
  numerator: number
  denominator: number
  supportCopy: (gapCount: number) => string
  recommendation: string
}

const dimensionLabels: Record<ManagementQualityDimensionId, string> = {
  clarity: 'Clareza',
  ownership: 'Dono',
  cadence: 'Cadência',
  outcome: 'Resultado',
  delegation: 'Delegação',
}

const activeInitiativeStatuses = new Set<Initiative['status']>([
  'not_started',
  'in_progress',
  'at_risk',
  'blocked',
])

const relevantResponsibilityTypes = new Set<DelegationItem['responsibilityType']>([
  'analysis',
  'stakeholder',
  'decision',
])

function hasText(value: string | undefined) {
  return Boolean(value?.trim())
}

function normalizedName(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function percentage(numerator: number, denominator: number) {
  if (denominator === 0) return 100
  return Math.round((numerator / denominator) * 100)
}

function isDateOnOrAfter(value: string, reference: Date) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date >= reference
}

function reviewedWithinDays(value: string, today: Date, days: number) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const threshold = new Date(today)
  threshold.setDate(threshold.getDate() - days)
  return date >= threshold && date <= today
}

function completedOnTime(initiative: Initiative) {
  if (!initiative.completedAt || !initiative.targetDate) return false

  const completedAt = new Date(initiative.completedAt)
  const targetDate = new Date(`${initiative.targetDate}T23:59:59.999`)

  return (
    !Number.isNaN(completedAt.getTime()) &&
    !Number.isNaN(targetDate.getTime()) &&
    completedAt <= targetDate
  )
}

function metric(definition: MetricDefinition): ManagementQualityMetric {
  const gapCount = Math.max(definition.denominator - definition.numerator, 0)

  return {
    id: definition.id,
    dimension: definition.dimension,
    label: definition.label,
    score: percentage(definition.numerator, definition.denominator),
    numerator: definition.numerator,
    denominator: definition.denominator,
    applicable: definition.denominator > 0,
    gapCount,
    supportCopy: definition.supportCopy(gapCount),
  }
}

export function calculateManagementQuality(
  plans: ManagementPlan[],
  initiatives: Initiative[],
  hotTopics: HotTopic[],
  delegations: DelegationItem[],
  manager: string,
  today = new Date(),
): ManagementQualityResult {
  const activeInitiatives = initiatives.filter(initiative =>
    activeInitiativeStatuses.has(initiative.status),
  )
  const completedInitiatives = initiatives.filter(initiative => initiative.status === 'completed')
  const managerName = normalizedName(manager)

  const decisions = [
    ...initiatives
      .filter(initiative => hasText(initiative.decisionNeeded))
      .map(initiative => initiative.owner),
    ...hotTopics.filter(topic => hasText(topic.decisionNeeded)).map(topic => topic.owner),
    ...delegations
      .filter(item => item.responsibilityType === 'decision')
      .map(item => item.responsible),
  ]

  const people = new Set<string>()
  const relevantPeople = new Set<string>()

  initiatives.forEach(initiative => {
    if (hasText(initiative.owner)) {
      const owner = normalizedName(initiative.owner)
      people.add(owner)
      relevantPeople.add(owner)
    }
  })
  delegations.forEach(item => {
    if (!hasText(item.responsible)) return
    const responsible = normalizedName(item.responsible)
    people.add(responsible)
    if (relevantResponsibilityTypes.has(item.responsibilityType)) relevantPeople.add(responsible)
  })

  const definitions: MetricDefinition[] = [
    {
      id: 'initiatives_with_clear_description',
      dimension: 'clarity',
      label: 'Iniciativas com descrição clara',
      numerator: initiatives.filter(initiative => initiative.description.trim().length >= 40).length,
      denominator: initiatives.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'iniciativa precisa' : 'iniciativas precisam'} de uma descrição mais clara para facilitar alinhamento e cobrança.`,
      recommendation: 'Completar as descrições das iniciativas com objetivo, escopo e resultado esperado.',
    },
    {
      id: 'actions_with_success_criteria',
      dimension: 'clarity',
      label: 'Ações com critério de sucesso',
      numerator: delegations.filter(item => hasText(item.successCriteria)).length,
      denominator: delegations.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'ação está' : 'ações estão'} sem critério de sucesso. Definir o que representa conclusão pode reduzir retrabalho.`,
      recommendation: 'Definir critérios observáveis de sucesso para as responsabilidades delegadas.',
    },
    {
      id: 'topics_with_context_and_impact',
      dimension: 'clarity',
      label: 'Temas com contexto e impacto',
      numerator: hotTopics.filter(topic => topic.context.trim().length >= 40 && topic.impacts.length > 0)
        .length,
      denominator: hotTopics.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'tema precisa' : 'temas precisam'} de mais contexto ou impacto explícito para apoiar decisões rápidas.`,
      recommendation: 'Registrar contexto objetivo e impactos potenciais nos temas quentes.',
    },
    {
      id: 'plans_with_owner',
      dimension: 'ownership',
      label: 'Planos com responsável definido',
      numerator: plans.filter(plan => hasText(plan.owner)).length,
      denominator: plans.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'plano está' : 'planos estão'} sem responsável definido. Isso pode enfraquecer o acompanhamento do próximo ciclo.`,
      recommendation: 'Atribuir um responsável principal para cada plano aberto.',
    },
    {
      id: 'initiatives_with_dri',
      dimension: 'ownership',
      label: 'Iniciativas com DRI claro',
      numerator: activeInitiatives.filter(initiative => hasText(initiative.owner)).length,
      denominator: activeInitiatives.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'iniciativa ativa está' : 'iniciativas ativas estão'} sem DRI claro. Isso pode dificultar decisões e cobrança.`,
      recommendation: 'Nomear um DRI para cada iniciativa ativa.',
    },
    {
      id: 'decisions_with_owner',
      dimension: 'ownership',
      label: 'Decisões com owner',
      numerator: decisions.filter(hasText).length,
      denominator: decisions.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'decisão necessária está' : 'decisões necessárias estão'} sem owner claro, o que pode ampliar o tempo de resposta.`,
      recommendation: 'Atribuir owner às decisões pendentes e combinar prazo para resolução.',
    },
    {
      id: 'initiatives_with_next_step',
      dimension: 'cadence',
      label: 'Iniciativas com próximo passo',
      numerator: activeInitiatives.filter(initiative => hasText(initiative.nextStep)).length,
      denominator: activeInitiatives.length,
      supportCopy: count =>
        `Há ${count} ${count === 1 ? 'iniciativa' : 'iniciativas'} sem próximo passo. Isso pode dificultar cobrança e previsibilidade na próxima reunião.`,
      recommendation: 'Definir o próximo passo objetivo das iniciativas ativas antes da próxima reunião.',
    },
    {
      id: 'check_ins_up_to_date',
      dimension: 'cadence',
      label: 'Itens com check-in atualizado',
      numerator: delegations.filter(item => isDateOnOrAfter(item.nextCheckIn, today)).length,
      denominator: delegations.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'responsabilidade precisa' : 'responsabilidades precisam'} de check-in atualizado para manter apoio e autonomia no ritmo adequado.`,
      recommendation: 'Atualizar os próximos check-ins e tratar primeiro os itens em atraso.',
    },
    {
      id: 'hot_topics_reviewed_recently',
      dimension: 'cadence',
      label: 'Temas quentes revisados nos últimos 7 dias',
      numerator: hotTopics.filter(topic => reviewedWithinDays(topic.lastUpdate, today, 7)).length,
      denominator: hotTopics.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'tema quente está' : 'temas quentes estão'} sem revisão recente. Uma atualização breve pode melhorar a leitura de risco.`,
      recommendation: 'Revisar os temas quentes sem atualização nos últimos sete dias.',
    },
    {
      id: 'plans_with_result_evidence',
      dimension: 'outcome',
      label: 'Planos com evidência de resultado',
      numerator: plans.filter(plan => hasText(plan.successMetric)).length,
      denominator: plans.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'plano precisa' : 'planos precisam'} de evidência de resultado para demonstrar se a ação funcionou.`,
      recommendation: 'Definir uma métrica ou evidência verificável para cada plano.',
    },
    {
      id: 'initiatives_completed_on_time',
      dimension: 'outcome',
      label: 'Iniciativas concluídas no prazo',
      numerator: completedInitiatives.filter(completedOnTime).length,
      denominator: completedInitiatives.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'iniciativa concluída ficou' : 'iniciativas concluídas ficaram'} fora do prazo ou sem prazo comparável. Registrar datas ajuda a melhorar previsibilidade.`,
      recommendation: 'Revisar causas de atraso e registrar prazo e conclusão de forma consistente.',
    },
    {
      id: 'actions_with_recorded_impact',
      dimension: 'outcome',
      label: 'Ações com impacto registrado',
      numerator: delegations.filter(item => hasText(item.observedEvolution)).length,
      denominator: delegations.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'ação ainda não tem' : 'ações ainda não têm'} impacto registrado. Uma nota curta ajuda a conectar execução e resultado.`,
      recommendation: 'Registrar a evolução observada nas responsabilidades delegadas.',
    },
    {
      id: 'initiatives_not_centralized',
      dimension: 'delegation',
      label: 'Iniciativas não centralizadas na gestora',
      numerator: managerName
        ? activeInitiatives.filter(initiative => normalizedName(initiative.owner) !== managerName).length
        : 0,
      denominator: managerName ? activeInitiatives.length : 0,
      supportCopy: count =>
        `${count} ${count === 1 ? 'iniciativa ativa segue' : 'iniciativas ativas seguem'} centralizada na gestora. Redistribuir ownership pode liberar espaço para atuação estratégica.`,
      recommendation: 'Selecionar iniciativas que possam ganhar um DRI fora da gestão.',
    },
    {
      id: 'people_with_relevant_responsibility',
      dimension: 'delegation',
      label: 'Pessoas com responsabilidade relevante',
      numerator: relevantPeople.size,
      denominator: people.size,
      supportCopy: count =>
        `${count} ${count === 1 ? 'pessoa aparece' : 'pessoas aparecem'} sem responsabilidade estratégica explícita. Isso pode limitar desenvolvimento e distribuição de contexto.`,
      recommendation: 'Distribuir responsabilidades de análise, decisão ou stakeholders para ampliar autonomia.',
    },
    {
      id: 'responsibilities_with_autonomy',
      dimension: 'delegation',
      label: 'Responsabilidades com nível de autonomia definido',
      numerator: delegations.filter(item => item.autonomyLevel >= 1 && item.autonomyLevel <= 5).length,
      denominator: delegations.length,
      supportCopy: count =>
        `${count} ${count === 1 ? 'responsabilidade precisa' : 'responsabilidades precisam'} de nível de autonomia explícito para alinhar expectativa e apoio.`,
      recommendation: 'Combinar o nível de autonomia esperado para cada responsabilidade.',
    },
  ]

  const metrics = definitions.map(metric)
  const dimensions = Object.fromEntries(
    (Object.keys(dimensionLabels) as ManagementQualityDimensionId[]).map(id => {
      const dimensionMetrics = metrics.filter(item => item.dimension === id)
      const applicableMetrics = dimensionMetrics.filter(item => item.applicable)
      const score = applicableMetrics.length
        ? Math.round(
            applicableMetrics.reduce((total, item) => total + item.score, 0) /
              applicableMetrics.length,
          )
        : 100

      return [id, { id, label: dimensionLabels[id], score, metrics: dimensionMetrics }]
    }),
  ) as Record<ManagementQualityDimensionId, ManagementQualityDimension>

  const score = Math.round(
    Object.values(dimensions).reduce((total, dimension) => total + dimension.score, 0) /
      Object.keys(dimensions).length,
  )

  const definitionById = new Map(definitions.map(definition => [definition.id, definition]))
  const topGaps = metrics
    .filter(item => item.applicable && item.gapCount > 0)
    .sort((left, right) => left.score - right.score || right.gapCount - left.gapCount)
    .slice(0, 3)
    .map(item => {
      const definition = definitionById.get(item.id)!
      return {
        metricId: item.id,
        dimension: item.dimension,
        title: item.label,
        score: item.score,
        gapCount: item.gapCount,
        supportCopy: item.supportCopy,
        recommendation: definition.recommendation,
      }
    })

  return {
    score,
    dimensions,
    metrics,
    topGaps,
    recommendation:
      topGaps[0]?.recommendation ??
      'Manter a cadência atual e usar o próximo ciclo para consolidar as práticas que já funcionam.',
  }
}
