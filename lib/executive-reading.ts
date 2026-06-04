import type { DelegationItem } from './delegation'
import type { HotTopic } from './hot-topics'
import type { Initiative } from './initiatives'
import type { ManagementPlan, RetroSnapshot } from './management'

export type ExecutiveReadingTone = 'slack' | 'minutes' | 'senior'
export type ExecutiveReadingSource = 'plan' | 'initiative' | 'hot_topic' | 'delegation' | 'snapshot'

export type ExecutiveReadingItem = {
  title: string
  detail: string
  sourceType: ExecutiveReadingSource
  sourceId: string
  owner: string
  evidence: string
  priority: number
}

export type ExecutiveDecision = ExecutiveReadingItem & {
  suggestedOwner: string
  suggestedDeadline: string
}

export type ExecutiveMove = {
  action: string
  owner: string
  suggestedDeadline: string
  reason: string
  sourceType: ExecutiveReadingSource
  sourceId: string
  priority: number
}

export type ExecutiveReading = {
  tone: ExecutiveReadingTone
  summary: string[]
  advances: ExecutiveReadingItem[]
  attentionPoints: ExecutiveReadingItem[]
  decisions: ExecutiveDecision[]
  nextMoves: ExecutiveMove[]
  gaps: string[]
}

export type GenerateExecutiveReadingInput = {
  plans: ManagementPlan[]
  initiatives: Initiative[]
  hotTopics: HotTopic[]
  delegations: DelegationItem[]
  snapshots: RetroSnapshot[]
  currentMood: number | null
  tone: ExecutiveReadingTone
  /**
   * Reference date in YYYY-MM-DD format. It is required instead of reading the
   * system clock so generation remains deterministic and easy to test.
   */
  referenceDate: string
}

const DAY_MS = 86_400_000
const NO_OWNER = 'Liderança deve nomear responsável'

function filled(value: string | undefined) {
  return Boolean(value?.trim())
}

function parseDate(value: string) {
  const timestamp = Date.parse(value.length === 10 ? `${value}T12:00:00Z` : value)
  return Number.isNaN(timestamp) ? null : timestamp
}

function dateOnly(value: string) {
  const timestamp = parseDate(value)
  return timestamp === null ? '' : new Date(timestamp).toISOString().slice(0, 10)
}

function daysBetween(earlier: string, later: string) {
  const start = parseDate(earlier)
  const end = parseDate(later)
  if (start === null || end === null) return null
  return Math.floor((end - start) / DAY_MS)
}

function addDays(date: string, days: number) {
  const timestamp = parseDate(date)
  if (timestamp === null) return date
  return new Date(timestamp + days * DAY_MS).toISOString().slice(0, 10)
}

function isRecent(value: string, referenceDate: string, days: number) {
  const age = daysBetween(value, referenceDate)
  return age !== null && age >= 0 && age <= days
}

function isPast(value: string, referenceDate: string) {
  const normalized = dateOnly(value)
  return Boolean(normalized && normalized < referenceDate)
}

function ownerOrFallback(owner: string) {
  return filled(owner) ? owner.trim() : NO_OWNER
}

function sortByPriority<T extends { priority: number; title?: string; action?: string }>(items: T[]) {
  return items.sort((a, b) => {
    const priorityDifference = b.priority - a.priority
    if (priorityDifference !== 0) return priorityDifference
    return (a.title ?? a.action ?? '').localeCompare(b.title ?? b.action ?? '', 'pt-BR')
  })
}

function activeInitiatives(initiatives: Initiative[]) {
  return initiatives.filter(item => item.status !== 'completed' && item.status !== 'paused')
}

function formatMood(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function summaryLines(input: GenerateExecutiveReadingInput) {
  const active = activeInitiatives(input.initiatives)
  const risky = active.filter(item => item.status === 'blocked' || item.status === 'at_risk')
  const criticalTopics = input.hotTopics.filter(item => item.temperature === 'critical')
  const criticalWithoutAction = criticalTopics.filter(item => !filled(item.nextAction))
  const openPlans = input.plans.filter(item => item.status !== 'done')
  const blockedOrOverduePlans = openPlans.filter(
    item => item.status === 'blocked' || isPast(item.dueDate, input.referenceDate),
  )
  const lateCheckIns = input.delegations.filter(
    item => !filled(item.responsible) || !filled(item.nextCheckIn) || isPast(item.nextCheckIn, input.referenceDate),
  )
  const snapshots = [...input.snapshots].sort((a, b) => b.date.localeCompare(a.date))

  const lines = [
    `${active.length} iniciativas estão ativas; ${risky.length} estão bloqueadas ou em risco.`,
    `${criticalTopics.length} temas estão críticos; ${criticalWithoutAction.length} não têm próxima ação definida.`,
    `${openPlans.length} FCAs estão abertos; ${blockedOrOverduePlans.length} estão bloqueados ou vencidos.`,
    `${lateCheckIns.length} delegações estão sem responsável ou com check-in fora da cadência.`,
  ]

  if (input.currentMood === null) {
    lines.push('Não há mood atual suficiente para afirmar o estado do time.')
  } else if (snapshots.length === 0) {
    lines.push(`O mood atual é ${formatMood(input.currentMood)}; não há snapshot anterior para afirmar tendência.`)
  } else {
    const difference = input.currentMood - snapshots[0].moodAverage
    const direction = difference > 0 ? 'acima' : difference < 0 ? 'abaixo' : 'igual'
    lines.push(
      `O mood atual é ${formatMood(input.currentMood)}, ${formatMood(Math.abs(difference))} ponto ${direction} do último snapshot.`,
    )
  }

  return lines.slice(0, 5)
}

function buildAdvances(input: GenerateExecutiveReadingInput) {
  const advances: ExecutiveReadingItem[] = []

  input.initiatives.forEach(item => {
    if (item.status !== 'completed' || !item.completedAt || !isRecent(item.completedAt, input.referenceDate, 30)) return
    advances.push({
      title: item.title,
      detail: filled(item.expectedEvidence)
        ? `Iniciativa concluída; espera-se como resultado: ${item.expectedEvidence.trim()}`
        : 'Iniciativa concluída, sem evidência de resultado esperada registrada.',
      sourceType: 'initiative',
      sourceId: item.id,
      owner: ownerOrFallback(item.owner),
      evidence: `Conclusão registrada em ${dateOnly(item.completedAt)}.`,
      priority: 400,
    })
  })

  input.plans.forEach(plan => {
    if (plan.status !== 'done' || !isRecent(plan.updatedAt, input.referenceDate, 30)) return
    advances.push({
      title: plan.title,
      detail: filled(plan.successMetric)
        ? `FCA concluído; a evidência esperada registrada é: ${plan.successMetric.trim()}`
        : 'FCA concluído, sem métrica de sucesso registrada.',
      sourceType: 'plan',
      sourceId: plan.id,
      owner: ownerOrFallback(plan.owner),
      evidence: `Conclusão inferida pelo status, com atualização em ${dateOnly(plan.updatedAt)}.`,
      priority: 350,
    })
  })

  input.delegations.forEach(item => {
    if (!filled(item.observedEvolution)) return
    advances.push({
      title: item.title,
      detail: item.observedEvolution.trim(),
      sourceType: 'delegation',
      sourceId: item.id,
      owner: ownerOrFallback(item.responsible),
      evidence: 'Evolução observada registrada na delegação.',
      priority: 300,
    })
  })

  const snapshots = [...input.snapshots].sort((a, b) => b.date.localeCompare(a.date))
  if (snapshots.length >= 2) {
    const current = snapshots[0]
    const previous = snapshots[1]
    const planReduction = previous.openPlanCount - current.openPlanCount
    if (planReduction > 0) {
      advances.push({
        title: 'Redução de FCAs abertos',
        detail: `${planReduction} FCAs a menos entre os dois últimos snapshots.`,
        sourceType: 'snapshot',
        sourceId: current.id,
        owner: 'Liderança',
        evidence: `${previous.openPlanCount} abertos em ${previous.date} e ${current.openPlanCount} em ${current.date}.`,
        priority: 280,
      })
    }
    if (current.moodAverage > previous.moodAverage) {
      advances.push({
        title: 'Evolução positiva de mood',
        detail: `O mood subiu ${formatMood(current.moodAverage - previous.moodAverage)} ponto entre os dois últimos snapshots.`,
        sourceType: 'snapshot',
        sourceId: current.id,
        owner: 'Liderança',
        evidence: `${formatMood(previous.moodAverage)} em ${previous.date} e ${formatMood(current.moodAverage)} em ${current.date}.`,
        priority: 260,
      })
    }
  }

  return sortByPriority(advances).slice(0, input.tone === 'senior' ? 3 : 5)
}

function buildAttentionPoints(input: GenerateExecutiveReadingInput) {
  const points: ExecutiveReadingItem[] = []

  input.hotTopics.forEach(topic => {
    const missingAction = !filled(topic.nextAction)
    if (topic.temperature === 'critical' || topic.temperature === 'attention' || missingAction) {
      const priority = topic.temperature === 'critical' ? (missingAction ? 500 : 450) : missingAction ? 300 : 240
      points.push({
        title: topic.title,
        detail: missingAction
          ? `${topic.whyNow.trim() || 'Tema sem justificativa temporal registrada.'} Não há próxima ação definida.`
          : topic.whyNow.trim() || 'Tema sem justificativa temporal registrada.',
        sourceType: 'hot_topic',
        sourceId: topic.id,
        owner: ownerOrFallback(topic.owner),
        evidence: `Temperatura registrada: ${topic.temperature}.`,
        priority,
      })
    }
  })

  activeInitiatives(input.initiatives).forEach(item => {
    const missingOwner = !filled(item.owner)
    const priority =
      item.status === 'blocked' ? 420 : filled(item.decisionNeeded) ? 380 : item.status === 'at_risk' ? 350 : missingOwner ? 320 : 0
    if (priority === 0) return
    points.push({
      title: item.title,
      detail: item.currentRisk.trim() || (missingOwner ? 'A iniciativa não possui DRI definido.' : 'Risco sem descrição registrada.'),
      sourceType: 'initiative',
      sourceId: item.id,
      owner: ownerOrFallback(item.owner),
      evidence: `Status ${item.status}; criticidade ${item.criticality}.`,
      priority,
    })
  })

  input.plans.forEach(plan => {
    if (plan.status !== 'blocked' && !isPast(plan.dueDate, input.referenceDate)) return
    points.push({
      title: plan.title,
      detail: plan.status === 'blocked' ? 'FCA bloqueado.' : `FCA vencido em ${dateOnly(plan.dueDate)}.`,
      sourceType: 'plan',
      sourceId: plan.id,
      owner: ownerOrFallback(plan.owner),
      evidence: plan.lastUpdate.trim() || 'Não há atualização registrada.',
      priority: 340,
    })
  })

  input.delegations.forEach(item => {
    if (filled(item.nextCheckIn) && !isPast(item.nextCheckIn, input.referenceDate)) return
    points.push({
      title: item.title,
      detail: filled(item.nextCheckIn) ? `Check-in vencido em ${dateOnly(item.nextCheckIn)}.` : 'Não há próximo check-in definido.',
      sourceType: 'delegation',
      sourceId: item.id,
      owner: ownerOrFallback(item.responsible),
      evidence: item.warningSigns.trim() || 'Não há sinais de alerta registrados.',
      priority: 220,
    })
  })

  return sortByPriority(points).slice(0, 5)
}

function buildDecisions(input: GenerateExecutiveReadingInput) {
  const decisions: ExecutiveDecision[] = []

  input.hotTopics.forEach(topic => {
    if (!filled(topic.decisionNeeded)) return
    decisions.push({
      title: topic.decisionNeeded.trim(),
      detail: `Decisão pendente no tema "${topic.title}".`,
      sourceType: 'hot_topic',
      sourceId: topic.id,
      owner: ownerOrFallback(topic.owner),
      suggestedOwner: ownerOrFallback(topic.owner),
      suggestedDeadline: addDays(input.referenceDate, topic.temperature === 'critical' ? 2 : 5),
      evidence: 'Decisão necessária registrada no tema quente.',
      priority: topic.temperature === 'critical' ? 450 : 350,
    })
  })

  input.initiatives.forEach(item => {
    if (!filled(item.decisionNeeded)) return
    decisions.push({
      title: item.decisionNeeded.trim(),
      detail: `Decisão pendente na iniciativa "${item.title}".`,
      sourceType: 'initiative',
      sourceId: item.id,
      owner: ownerOrFallback(item.owner),
      suggestedOwner: ownerOrFallback(item.owner),
      suggestedDeadline: addDays(input.referenceDate, item.status === 'blocked' ? 3 : 5),
      evidence: 'Decisão necessária registrada na iniciativa.',
      priority: item.status === 'blocked' ? 420 : item.status === 'at_risk' ? 380 : 300,
    })
  })

  input.plans.forEach(plan => {
    if (plan.status !== 'blocked' || filled(plan.action)) return
    decisions.push({
      title: `Definir encaminhamento para ${plan.title}`,
      detail: 'O FCA está bloqueado e não possui ação objetiva registrada.',
      sourceType: 'plan',
      sourceId: plan.id,
      owner: ownerOrFallback(plan.owner),
      suggestedOwner: ownerOrFallback(plan.owner),
      suggestedDeadline: addDays(input.referenceDate, 3),
      evidence: 'Status bloqueado e campo de ação vazio.',
      priority: 340,
    })
  })

  return sortByPriority(decisions).slice(0, input.tone === 'senior' ? 3 : 5)
}

function buildNextMoves(input: GenerateExecutiveReadingInput, attention: ExecutiveReadingItem[]) {
  const moves: ExecutiveMove[] = []

  attention.forEach(item => {
    if (item.sourceType === 'hot_topic') {
      const topic = input.hotTopics.find(candidate => candidate.id === item.sourceId)
      if (!topic) return
      moves.push({
        action: filled(topic.nextAction)
          ? `Entregar "${topic.nextAction.trim()}" e registrar o resultado no tema "${topic.title}".`
          : `Definir e registrar uma próxima ação verificável para o tema "${topic.title}".`,
        owner: ownerOrFallback(topic.owner),
        suggestedDeadline: addDays(input.referenceDate, topic.temperature === 'critical' ? 2 : 5),
        reason: topic.whyNow.trim() || 'O tema exige uma justificativa temporal e um próximo movimento explícito.',
        sourceType: 'hot_topic',
        sourceId: topic.id,
        priority: item.priority,
      })
    } else if (item.sourceType === 'initiative') {
      const initiative = input.initiatives.find(candidate => candidate.id === item.sourceId)
      if (!initiative) return
      moves.push({
        action: filled(initiative.nextStep)
          ? `Concluir "${initiative.nextStep.trim()}" e registrar o desfecho na iniciativa "${initiative.title}".`
          : `Definir e registrar o próximo passo objetivo da iniciativa "${initiative.title}".`,
        owner: ownerOrFallback(initiative.owner),
        suggestedDeadline: addDays(input.referenceDate, initiative.status === 'blocked' ? 3 : 5),
        reason: initiative.currentRisk.trim() || 'A iniciativa precisa de um próximo movimento verificável.',
        sourceType: 'initiative',
        sourceId: initiative.id,
        priority: item.priority,
      })
    } else if (item.sourceType === 'plan') {
      const plan = input.plans.find(candidate => candidate.id === item.sourceId)
      if (!plan) return
      moves.push({
        action: filled(plan.action)
          ? `Executar "${plan.action.trim()}" e registrar a evidência no FCA "${plan.title}".`
          : `Definir uma ação objetiva para retirar o FCA "${plan.title}" do bloqueio.`,
        owner: ownerOrFallback(plan.owner),
        suggestedDeadline: addDays(input.referenceDate, 3),
        reason: item.detail,
        sourceType: 'plan',
        sourceId: plan.id,
        priority: item.priority,
      })
    } else if (item.sourceType === 'delegation') {
      const delegation = input.delegations.find(candidate => candidate.id === item.sourceId)
      if (!delegation) return
      moves.push({
        action: `Realizar o check-in de "${delegation.title}" e registrar decisão, risco e próxima entrega.`,
        owner: ownerOrFallback(delegation.responsible),
        suggestedDeadline: addDays(input.referenceDate, 1),
        reason: item.detail,
        sourceType: 'delegation',
        sourceId: delegation.id,
        priority: item.priority,
      })
    }
  })

  return sortByPriority(moves).slice(0, input.tone === 'senior' ? 3 : 5)
}

function buildGaps(input: GenerateExecutiveReadingInput, advances: ExecutiveReadingItem[]) {
  const gaps: string[] = []
  if (input.currentMood === null) gaps.push('Não há mood atual suficiente para afirmar o estado do time.')
  if (input.snapshots.length < 2) gaps.push('Não há histórico mensal suficiente para afirmar tendências recorrentes.')
  if (input.plans.some(plan => plan.status === 'done' && !filled(plan.successMetric))) {
    gaps.push('Há FCAs concluídos sem métrica de sucesso; não há evidência suficiente para afirmar o resultado alcançado.')
  }
  if (input.initiatives.some(item => item.status === 'completed' && !filled(item.completedAt))) {
    gaps.push('Há iniciativas concluídas sem data de conclusão; não é possível confirmar a entrega no período.')
  }
  if (input.initiatives.some(item => item.status === 'completed' && filled(item.expectedEvidence))) {
    gaps.push('Evidências esperadas das iniciativas não comprovam resultados realizados.')
  }
  if (input.hotTopics.some(topic => filled(topic.decisionNeeded) && !filled(topic.owner))) {
    gaps.push('Há decisões em temas quentes sem owner; a leitura sugere que a liderança nomeie um responsável.')
  }
  if (input.delegations.some(item => !filled(item.responsible))) {
    gaps.push('Há delegações sem responsável definido.')
  }
  if (advances.length === 0) {
    gaps.push('Não há evidência suficiente para afirmar avanços relevantes no período.')
  }
  return [...new Set(gaps)]
}

export function generateExecutiveReading(input: GenerateExecutiveReadingInput): ExecutiveReading {
  const advances = buildAdvances(input)
  const attentionPoints = buildAttentionPoints(input)

  return {
    tone: input.tone,
    summary: summaryLines(input),
    advances,
    attentionPoints,
    decisions: buildDecisions(input),
    nextMoves: buildNextMoves(input, attentionPoints),
    gaps: buildGaps(input, advances),
  }
}
