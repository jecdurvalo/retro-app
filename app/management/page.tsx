'use client'

import Link from 'next/link'
import type { ElementType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Home,
  Import,
  Lightbulb,
  ListChecks,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react'
import { isMoodItem, parseMoodItem } from '@/lib/mood'
import {
  getFcaCompleteness,
  isCheckInLate,
  isOverdue,
  loadManagementPlans,
  loadRetroSnapshots,
  MANAGEMENT_PLAN_STORAGE_KEY,
  RETRO_SNAPSHOT_STORAGE_KEY,
  type ManagementPlan,
  type ManagementPlanStatus,
  type PlanCriticality,
  type RetroSnapshot,
} from '@/lib/management'
import { SESSION_ID, supabase, type Category, type RetroItem } from '@/lib/supabase'
import DelegationBoard from './delegation-board'
import HotTopicRadar from './hot-topic-radar'
import InitiativePortfolio from './initiative-portfolio'

const PLAN_STORAGE_KEY = `retro-action-plans:${SESSION_ID}`
const CARD_GROUP_STORAGE_KEY = `retro-card-groups:${SESSION_ID}`

type DashboardPlanDraft = {
  action: string
  owner: string
  dueDate: string
  status: 'todo' | 'doing' | 'done'
}

type CardGroup = {
  id: string
  title: string
  itemIds: string[]
}

const criticalityMeta: Record<PlanCriticality, { label: string; tone: string }> = {
  low: { label: 'Baixa', tone: 'bg-zinc-100 text-zinc-600' },
  medium: { label: 'Média', tone: 'bg-amber-100 text-amber-800' },
  high: { label: 'Alta', tone: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Crítica', tone: 'bg-rose-100 text-rose-800' },
}

const statusMeta: Record<ManagementPlanStatus, { label: string; tone: string }> = {
  todo: { label: 'A iniciar', tone: 'bg-zinc-100 text-zinc-700' },
  doing: { label: 'Em andamento', tone: 'bg-cyan-100 text-cyan-800' },
  blocked: { label: 'Bloqueado', tone: 'bg-rose-100 text-rose-800' },
  done: { label: 'Concluído', tone: 'bg-emerald-100 text-emerald-800' },
}

const STOP_WORDS = new Set([
  'ainda', 'algum', 'alguma', 'com', 'como', 'das', 'dos', 'ela', 'ele', 'eles', 'essa', 'esse',
  'esta', 'este', 'isso', 'mais', 'mas', 'mesmo', 'muito', 'nas', 'nos', 'nossa', 'nosso', 'para',
  'pela', 'pelo', 'por', 'porque', 'pra', 'que', 'sem', 'ser', 'sua', 'tambem', 'tem', 'uma', 'vamos',
])

function normalizeWord(word: string) {
  return word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getThemes(items: RetroItem[]) {
  const counts = new Map<string, number>()

  items.forEach(item => {
    if (isMoodItem(item)) return
    const words = item.content.match(/[a-zA-ZÀ-ÿ0-9]+/g) || []
    words
      .map(normalizeWord)
      .filter(word => word.length >= 4 && !STOP_WORDS.has(word))
      .forEach(word => counts.set(word, (counts.get(word) || 0) + 1))
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word]) => word)
}

function todayValue() {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyPlan(): ManagementPlan {
  const now = new Date().toISOString()
  return {
    id: `management-${Date.now()}`,
    title: 'Novo FCA',
    fact: '',
    cause: '',
    action: '',
    owner: '',
    dueDate: '',
    criticality: 'medium',
    status: 'todo',
    successMetric: '',
    nextCheckIn: '',
    lastUpdate: '',
    sourceItems: [],
    createdAt: now,
    updatedAt: now,
  }
}

function formatDate(value: string) {
  if (!value) return 'Sem data'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ElementType
  label: string
  value: string | number
  detail: string
  tone: string
}) {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/88 p-5 shadow-lg shadow-zinc-950/5 backdrop-blur-xl">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}>
        <Icon size={19} />
      </div>
      <p className="mt-5 text-3xl font-black text-[var(--retro-ink)]">{value}</p>
      <p className="mt-1 text-sm font-black text-zinc-800">{label}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-400">{detail}</p>
    </article>
  )
}

export default function ManagementPage() {
  const [plans, setPlans] = useState<ManagementPlan[]>(loadManagementPlans)
  const [snapshots, setSnapshots] = useState<RetroSnapshot[]>(loadRetroSnapshots)
  const [items, setItems] = useState<RetroItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [snapshotDate, setSnapshotDate] = useState(todayValue)
  const [snapshotSaved, setSnapshotSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('retro_items')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setItems(data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    window.localStorage.setItem(MANAGEMENT_PLAN_STORAGE_KEY, JSON.stringify(plans))
  }, [plans])

  useEffect(() => {
    window.localStorage.setItem(RETRO_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots))
  }, [snapshots])

  const moodEntries = useMemo(() => items.map(parseMoodItem).filter(entry => entry !== null), [items])
  const currentMood = useMemo(() => {
    if (moodEntries.length === 0) return 0
    return moodEntries.reduce((sum, entry) => sum + entry.score, 0) / moodEntries.length
  }, [moodEntries])
  const previousSnapshot = snapshots.at(-1)
  const moodDelta = previousSnapshot && currentMood
    ? currentMood - previousSnapshot.moodAverage
    : 0
  const openPlans = plans.filter(plan => plan.status !== 'done')
  const overduePlans = plans.filter(plan => isOverdue(plan))
  const lateCheckIns = plans.filter(plan => isCheckInLate(plan))
  const completeFcas = plans.filter(plan => getFcaCompleteness(plan) === 100)
  const averageCompleteness = plans.length
    ? Math.round(plans.reduce((sum, plan) => sum + getFcaCompleteness(plan), 0) / plans.length)
    : 0

  const insights = useMemo(() => {
    const result: { title: string; detail: string; level: 'risk' | 'attention' | 'good' }[] = []
    const criticalOpen = plans.filter(plan => plan.status !== 'done' && plan.criticality === 'critical')
    const noCause = plans.filter(plan => plan.status !== 'done' && !plan.cause.trim())

    if (overduePlans.length > 0) {
      result.push({
        title: `${overduePlans.length} plano${overduePlans.length !== 1 ? 's' : ''} fora do prazo`,
        detail: 'Replaneje a data ou registre o impedimento antes do próximo check-in.',
        level: 'risk',
      })
    }
    if (criticalOpen.length > 0) {
      result.push({
        title: `${criticalOpen.length} item${criticalOpen.length !== 1 ? 's' : ''} crítico${criticalOpen.length !== 1 ? 's' : ''} aberto${criticalOpen.length !== 1 ? 's' : ''}`,
        detail: 'Itens críticos devem ter responsável, métrica de sucesso e check-in curto.',
        level: 'risk',
      })
    }
    if (noCause.length > 0) {
      result.push({
        title: `${noCause.length} FCA${noCause.length !== 1 ? 's' : ''} sem causa registrada`,
        detail: 'Sem causa, a ação corre o risco de tratar apenas o sintoma.',
        level: 'attention',
      })
    }
    if (plans.length > 0 && completeFcas.length === plans.length) {
      result.push({
        title: 'Carteira com FCAs completos',
        detail: 'O próximo foco é evidenciar resultado e encerrar ações concluídas.',
        level: 'good',
      })
    }
    if (result.length === 0) {
      result.push({
        title: 'Comece importando os planos da retro',
        detail: 'Depois complete fato, causa, criticidade e critério de sucesso.',
        level: 'attention',
      })
    }

    return result.slice(0, 4)
  }, [completeFcas.length, overduePlans, plans])

  function updatePlan(id: string, updates: Partial<ManagementPlan>) {
    setPlans(current => current.map(plan => (
      plan.id === id
        ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
        : plan
    )))
  }

  function addPlan() {
    const plan = createEmptyPlan()
    setPlans(current => [plan, ...current])
    setActivePlanId(plan.id)
  }

  function deletePlan(id: string) {
    setPlans(current => current.filter(plan => plan.id !== id))
    if (activePlanId === id) setActivePlanId(null)
  }

  function importDashboardPlans() {
    const drafts = JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY) || '{}') as Record<string, DashboardPlanDraft>
    const groupsByCategory = JSON.parse(window.localStorage.getItem(CARD_GROUP_STORAGE_KEY) || '{}') as Partial<Record<Category, CardGroup[]>>
    const existingSourceIds = new Set(plans.map(plan => plan.sourcePlanId).filter(Boolean))
    const relevantItems = items.filter(item => !isMoodItem(item) && (item.category === 'to_improve' || item.category === 'action_items'))
    const itemById = new Map(relevantItems.map(item => [item.id, item]))
    const groups = (['to_improve', 'action_items'] as Category[])
      .flatMap(category => groupsByCategory[category] || [])
      .map(group => ({ ...group, itemIds: group.itemIds.filter(id => itemById.has(id)) }))
      .filter(group => group.itemIds.length > 0)
    const groupedIds = new Set(groups.flatMap(group => group.itemIds))
    const candidates = [
      ...groups.map(group => ({
        sourcePlanId: group.id,
        title: group.title,
        sourceItems: group.itemIds.map(id => itemById.get(id)!.content),
      })),
      ...relevantItems
        .filter(item => !groupedIds.has(item.id))
        .map(item => ({
          sourcePlanId: `single:${item.id}`,
          title: item.content.slice(0, 70),
          sourceItems: [item.content],
        })),
    ]
    const now = new Date().toISOString()

    const imported = candidates
      .filter(candidate => !existingSourceIds.has(candidate.sourcePlanId))
      .map(candidate => {
        const draft = drafts[candidate.sourcePlanId]

        return {
          id: `imported-${candidate.sourcePlanId}`,
          title: candidate.title || 'Plano importado da retro',
          fact: candidate.sourceItems.join('\n'),
          cause: '',
          action: draft?.action || `Definir ação para tratar "${candidate.title}".`,
          owner: draft?.owner || '',
          dueDate: draft?.dueDate || '',
          criticality: 'medium' as PlanCriticality,
          status: (draft?.status || 'todo') as ManagementPlanStatus,
          successMetric: '',
          nextCheckIn: '',
          lastUpdate: 'Importado dos planos consolidados da retro.',
          sourcePlanId: candidate.sourcePlanId,
          sourceItems: candidate.sourceItems,
          createdAt: now,
          updatedAt: now,
        }
      })

    setPlans(current => [...imported, ...current])
    if (imported[0]) setActivePlanId(imported[0].id)
  }

  function saveSnapshot() {
    const snapshot: RetroSnapshot = {
      id: `snapshot-${Date.now()}`,
      title: `Retro ${formatDate(snapshotDate)}`,
      date: snapshotDate,
      moodAverage: currentMood,
      moodCount: moodEntries.length,
      itemCount: items.filter(item => !isMoodItem(item)).length,
      openPlanCount: openPlans.length,
      themes: getThemes(items),
      createdAt: new Date().toISOString(),
    }

    setSnapshots(current => [...current.filter(item => item.date !== snapshotDate), snapshot].sort((a, b) => a.date.localeCompare(b.date)))
    setSnapshotSaved(true)
    window.setTimeout(() => setSnapshotSaved(false), 1800)
  }

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] text-[var(--retro-ink)]">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(135,0,47,0.12),rgba(255,255,255,0.96)_32%,rgba(247,242,240,0.98)),radial-gradient(circle_at_88%_8%,rgba(52,232,207,0.2),transparent_24%)]" />
      <div className="fixed inset-x-0 top-0 z-30 h-2 bg-[var(--retro-wine)]" />

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-black/5 bg-white/85 p-4 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-600">
              <Home size={17} />
            </Link>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]">
                <ShieldCheck size={14} />
                Área gerencial
              </p>
              <h1 className="mt-1 text-2xl font-black">Cockpit de melhoria contínua</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={importDashboardPlans} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black text-zinc-700">
              <Import size={16} />
              Importar planos da retro
            </button>
            <button onClick={addPlan} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)]">
              <Plus size={16} />
              Novo FCA
            </button>
          </div>
        </header>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={ListChecks} label="Planos abertos" value={openPlans.length} detail={`${plans.filter(plan => plan.status === 'done').length} concluído(s)`} tone="bg-[rgba(135,0,47,0.1)] text-[var(--retro-wine)]" />
          <MetricCard icon={AlertTriangle} label="Exigem atenção" value={overduePlans.length + lateCheckIns.length} detail={`${overduePlans.length} atrasado(s) · ${lateCheckIns.length} check-in(s)`} tone="bg-rose-100 text-rose-700" />
          <MetricCard icon={ClipboardCheck} label="Qualidade dos FCAs" value={`${averageCompleteness}%`} detail={`${completeFcas.length} completo(s) de ${plans.length}`} tone="bg-amber-100 text-amber-800" />
          <MetricCard icon={BarChart3} label="Mood atual" value={currentMood ? currentMood.toFixed(1) : '—'} detail={moodEntries.length ? `${moodEntries.length} resposta(s)` : 'Sem respostas nesta sessão'} tone="bg-cyan-100 text-cyan-800" />
        </div>

        <HotTopicRadar />

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]">
                  <Sparkles size={14} />
                  Leitura gerencial
                </p>
                <h2 className="mt-2 text-2xl font-black">Onde cobrar atenção agora</h2>
              </div>
              <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-500">Regras automáticas</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {insights.map(insight => (
                <article key={insight.title} className={`rounded-2xl border p-4 ${insight.level === 'risk' ? 'border-rose-200 bg-rose-50' : insight.level === 'good' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <p className="font-black text-zinc-900">{insight.title}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">{insight.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-[var(--retro-wine)] p-5 text-white shadow-xl shadow-[rgba(135,0,47,0.2)]">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">
              <Lightbulb size={14} />
              Próxima camada de IA
            </p>
            <h2 className="mt-3 text-2xl font-black">IA como copiloto, não como dona do plano</h2>
            <ul className="mt-5 space-y-3 text-sm font-semibold leading-6 text-white/70">
              <li>• Sugerir clusters semânticos entre retros.</li>
              <li>• Questionar causas fracas ou ações genéricas.</li>
              <li>• Resumir recorrências e sinais do mood.</li>
              <li>• Preparar pauta de cobrança por criticidade.</li>
            </ul>
          </section>
        </div>

        <InitiativePortfolio />

        <DelegationBoard />

        <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]">
                <Target size={14} />
                Carteira de FCAs
              </p>
              <h2 className="mt-2 text-2xl font-black">Do fato até a evidência de resultado</h2>
            </div>
            <p className="text-sm font-semibold text-zinc-400">{plans.length} plano{plans.length !== 1 ? 's' : ''} acompanhado{plans.length !== 1 ? 's' : ''}</p>
          </div>

          {plans.length === 0 ? (
            <div className="mt-5 grid min-h-56 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
              <div>
                <Target className="mx-auto text-zinc-300" size={30} />
                <p className="mt-3 font-black text-zinc-700">Sua carteira ainda está vazia</p>
                <p className="mt-1 text-sm font-semibold text-zinc-400">Importe os planos da retro ou crie o primeiro FCA.</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {plans.map(plan => {
                const expanded = activePlanId === plan.id
                const completeness = getFcaCompleteness(plan)
                const attention = isOverdue(plan) || isCheckInLate(plan) || plan.status === 'blocked'

                return (
                  <article key={plan.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${attention ? 'border-rose-200' : 'border-zinc-200'}`}>
                    <button type="button" onClick={() => setActivePlanId(expanded ? null : plan.id)} className="flex w-full flex-col gap-4 p-4 text-left lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-xl px-2.5 py-1 text-[11px] font-black ${criticalityMeta[plan.criticality].tone}`}>{criticalityMeta[plan.criticality].label}</span>
                          <span className={`rounded-xl px-2.5 py-1 text-[11px] font-black ${statusMeta[plan.status].tone}`}>{statusMeta[plan.status].label}</span>
                          {attention && <span className="rounded-xl bg-rose-100 px-2.5 py-1 text-[11px] font-black text-rose-700">Atenção</span>}
                        </div>
                        <p className="mt-2 truncate text-lg font-black text-zinc-900">{plan.title}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-zinc-400">{plan.action || 'Ação ainda não definida'}</p>
                      </div>
                      <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl bg-zinc-50 px-3 py-2">
                          <p className="text-xs font-black text-zinc-800">{plan.owner || '—'}</p>
                          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Responsável</p>
                        </div>
                        <div className="rounded-2xl bg-zinc-50 px-3 py-2">
                          <p className="text-xs font-black text-zinc-800">{formatDate(plan.dueDate)}</p>
                          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Prazo</p>
                        </div>
                        <div className="rounded-2xl bg-zinc-50 px-3 py-2">
                          <p className="text-xs font-black text-zinc-800">{completeness}%</p>
                          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">FCA</p>
                        </div>
                      </div>
                      <ChevronDown className={`shrink-0 text-zinc-400 transition ${expanded ? 'rotate-180' : ''}`} size={18} />
                    </button>

                    {expanded && (
                      <div className="border-t border-zinc-100 bg-zinc-50/70 p-4">
                        <div className="grid gap-3 lg:grid-cols-3">
                          <label className="block lg:col-span-2">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Título</span>
                            <input value={plan.title} onChange={event => updatePlan(plan.id, { title: event.target.value })} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Criticidade</span>
                            <select value={plan.criticality} onChange={event => updatePlan(plan.id, { criticality: event.target.value as PlanCriticality })} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--retro-wine)]">
                              {Object.entries(criticalityMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Fato</span>
                            <textarea value={plan.fact} onChange={event => updatePlan(plan.id, { fact: event.target.value })} rows={4} placeholder="O que aconteceu, com evidência?" className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Causa</span>
                            <textarea value={plan.cause} onChange={event => updatePlan(plan.id, { cause: event.target.value })} rows={4} placeholder="Por que isso aconteceu?" className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Ação</span>
                            <textarea value={plan.action} onChange={event => updatePlan(plan.id, { action: event.target.value })} rows={4} placeholder="O que será feito?" className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          <label className="block">
                            <span className="flex items-center gap-1 text-xs font-black uppercase tracking-[0.1em] text-zinc-400"><UserRound size={13} />Responsável</span>
                            <input value={plan.owner} onChange={event => updatePlan(plan.id, { owner: event.target.value })} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">Status</span>
                            <select value={plan.status} onChange={event => updatePlan(plan.id, { status: event.target.value as ManagementPlanStatus })} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]">
                              {Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">Prazo</span>
                            <input type="date" value={plan.dueDate} onChange={event => updatePlan(plan.id, { dueDate: event.target.value })} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                          <label className="block">
                            <span className="flex items-center gap-1 text-xs font-black uppercase tracking-[0.1em] text-zinc-400"><CalendarCheck size={13} />Próximo check-in</span>
                            <input type="date" value={plan.nextCheckIn} onChange={event => updatePlan(plan.id, { nextCheckIn: event.target.value })} className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-400">Métrica de sucesso</span>
                            <input value={plan.successMetric} onChange={event => updatePlan(plan.id, { successMetric: event.target.value })} placeholder="Como saberemos?" className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]" />
                          </label>
                        </div>

                        <label className="mt-3 block">
                          <span className="flex items-center gap-1 text-xs font-black uppercase tracking-[0.1em] text-zinc-400"><Clock3 size={13} />Última atualização / evidência</span>
                          <textarea value={plan.lastUpdate} onChange={event => updatePlan(plan.id, { lastUpdate: event.target.value })} rows={2} placeholder="O que mudou desde a última cobrança?" className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[var(--retro-wine)]" />
                        </label>

                        <div className="mt-3 flex justify-end">
                          <button onClick={() => deletePlan(plan.id)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50">
                            <Trash2 size={14} />
                            Excluir FCA
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]">
                <BarChart3 size={14} />
                Histórico de retros
              </p>
              <h2 className="mt-2 text-2xl font-black">Comparação de mood e temas</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-400">Salve um snapshot ao encerrar cada retro para construir a série histórica.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input type="date" value={snapshotDate} onChange={event => setSnapshotDate(event.target.value)} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[var(--retro-wine)]" />
              <button onClick={saveSnapshot} disabled={loading || !snapshotDate} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-black text-white disabled:opacity-40">
                {snapshotSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {snapshotSaved ? 'Snapshot salvo' : 'Salvar retro atual'}
              </button>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm font-semibold text-zinc-400">
              Nenhum snapshot salvo. Use a retro de 29/05 como primeiro marco do histórico.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {snapshots.map((snapshot, index) => {
                const previous = snapshots[index - 1]
                const delta = previous ? snapshot.moodAverage - previous.moodAverage : 0
                return (
                  <article key={snapshot.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-zinc-900">{snapshot.title}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-400">{snapshot.itemCount} cards · {snapshot.openPlanCount} planos abertos</p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                        <p className="text-xl font-black text-[var(--retro-wine)]">{snapshot.moodAverage ? snapshot.moodAverage.toFixed(1) : '—'}</p>
                        {previous && (
                          <p className={`mt-0.5 flex items-center justify-end text-[11px] font-black ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {snapshot.themes.map(theme => <span key={theme} className="rounded-xl bg-white px-2.5 py-1 text-[11px] font-black text-zinc-500">{theme}</span>)}
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {previousSnapshot && currentMood > 0 && (
            <p className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${moodDelta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {moodDelta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              O mood atual está {Math.abs(moodDelta).toFixed(1)} ponto{Math.abs(moodDelta) !== 1 ? 's' : ''} {moodDelta >= 0 ? 'acima' : 'abaixo'} do último snapshot.
            </p>
          )}
        </section>
      </section>
    </main>
  )
}
