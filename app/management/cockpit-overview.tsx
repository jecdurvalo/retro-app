'use client'

import { useEffect, useMemo, useState, type ElementType } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  ListChecks,
  UsersRound,
} from 'lucide-react'
import { loadDelegationItems, type DelegationItem } from '@/lib/delegation'
import { loadHotTopics, type HotTopic } from '@/lib/hot-topics'
import { loadInitiatives, type Initiative } from '@/lib/initiatives'
import { isOverdue, type ManagementPlan } from '@/lib/management'
import { calculateManagementQuality } from '@/lib/management-quality'

type ActionItem = {
  id: string
  kind: string
  title: string
  reason: string
  owner: string
  priority: number
  tone: string
}

function SummaryCard({ icon: Icon, label, value, detail, tone }: { icon: ElementType; label: string; value: string | number; detail: string; tone: string }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-zinc-900">{value}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-700">{label}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={16} /></span>
      </div>
      <p className="mt-3 text-xs font-semibold text-zinc-400">{detail}</p>
    </article>
  )
}

export default function CockpitOverview({ plans }: { plans: ManagementPlan[] }) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([])
  const [delegations, setDelegations] = useState<DelegationItem[]>([])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInitiatives(loadInitiatives())
      setHotTopics(loadHotTopics())
      setDelegations(loadDelegationItems())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const activePlans = plans.filter(plan => plan.status !== 'done')
  const activeInitiatives = initiatives.filter(item => item.status !== 'completed' && item.status !== 'paused')
  const riskInitiatives = initiatives.filter(item => item.status === 'at_risk' || item.status === 'blocked')
  const hotAttention = hotTopics.filter(item => item.temperature === 'critical' || item.temperature === 'attention')
  const lateDelegations = delegations.filter(item => !item.nextCheckIn || item.nextCheckIn < new Date().toISOString().slice(0, 10))
  const managementQuality = useMemo(() => calculateManagementQuality(
    plans,
    initiatives,
    hotTopics,
    delegations,
    typeof window === 'undefined' ? '' : window.localStorage.getItem('retro-delegation-manager') || 'Marina Costa',
  ).score, [delegations, hotTopics, initiatives, plans])

  const actions = useMemo(() => {
    const result: ActionItem[] = []
    hotTopics.forEach(topic => {
      if (topic.temperature === 'critical') result.push({ id: `hot-${topic.id}`, kind: 'Tema quente', title: topic.title, reason: !topic.nextAction.trim() ? 'Crítico e sem próxima ação' : 'Tema em nível crítico', owner: topic.owner || 'Sem dono', priority: !topic.nextAction.trim() ? 500 : 450, tone: 'bg-rose-100 text-rose-700' })
      else if (topic.temperature === 'attention' && !topic.nextAction.trim()) result.push({ id: `hot-${topic.id}`, kind: 'Tema quente', title: topic.title, reason: 'Em atenção e sem próxima ação', owner: topic.owner || 'Sem dono', priority: 360, tone: 'bg-amber-100 text-amber-800' })
    })
    initiatives.forEach(initiative => {
      if (initiative.status === 'blocked') result.push({ id: `initiative-${initiative.id}`, kind: 'Iniciativa', title: initiative.title, reason: 'Iniciativa bloqueada', owner: initiative.owner || 'Sem dono', priority: 420, tone: 'bg-rose-100 text-rose-700' })
      else if (initiative.status === 'at_risk' || !initiative.nextStep.trim()) result.push({ id: `initiative-${initiative.id}`, kind: 'Iniciativa', title: initiative.title, reason: !initiative.nextStep.trim() ? 'Sem próximo passo objetivo' : 'Iniciativa em risco', owner: initiative.owner || 'Sem dono', priority: initiative.criticality === 'high' ? 350 : 300, tone: 'bg-amber-100 text-amber-800' })
    })
    plans.forEach(plan => {
      if (plan.status === 'blocked' || isOverdue(plan)) result.push({ id: `plan-${plan.id}`, kind: 'Plano / FCA', title: plan.title, reason: plan.status === 'blocked' ? 'Plano bloqueado' : 'Prazo vencido', owner: plan.owner || 'Sem responsável', priority: plan.criticality === 'critical' ? 380 : 280, tone: 'bg-orange-100 text-orange-800' })
    })
    delegations.forEach(item => {
      if (!item.responsible.trim() || !item.nextCheckIn || item.nextCheckIn < new Date().toISOString().slice(0, 10)) result.push({ id: `delegation-${item.id}`, kind: 'Delegação', title: item.title, reason: !item.responsible.trim() ? 'Sem DRI definido' : 'Check-in pendente', owner: item.responsible || 'Sem DRI', priority: !item.responsible.trim() ? 310 : 210, tone: 'bg-violet-100 text-violet-700' })
    })
    return result.sort((a, b) => b.priority - a.priority).slice(0, 5)
  }, [delegations, hotTopics, initiatives, plans])

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard icon={ListChecks} label="Planos abertos" value={activePlans.length} detail={`${plans.filter(plan => plan.status === 'done').length} concluído(s)`} tone="bg-[rgba(135,0,47,0.08)] text-[var(--retro-wine)]" />
        <SummaryCard icon={BriefcaseBusiness} label="Iniciativas ativas" value={activeInitiatives.length} detail={`${riskInitiatives.length} em risco ou bloqueada(s)`} tone="bg-cyan-50 text-cyan-700" />
        <SummaryCard icon={Flame} label="Temas quentes" value={hotAttention.length} detail={`${hotTopics.filter(item => item.temperature === 'critical').length} crítico(s)`} tone="bg-rose-50 text-rose-700" />
        <SummaryCard icon={AlertTriangle} label="Itens em risco" value={riskInitiatives.length + plans.filter(plan => plan.status === 'blocked' || isOverdue(plan)).length + hotTopics.filter(item => item.temperature === 'critical').length} detail="Sinais consolidados" tone="bg-amber-50 text-amber-800" />
        <SummaryCard icon={UsersRound} label="Delegações em andamento" value={delegations.length} detail={`${lateDelegations.length} check-in(s) pendente(s)`} tone="bg-violet-50 text-violet-700" />
        <SummaryCard icon={ClipboardCheck} label="Qualidade da gestão" value={`${managementQuality}%`} detail="Clareza e completude" tone="bg-emerald-50 text-emerald-700" />
      </div>

      <section aria-label="Ações prioritárias da liderança" className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--retro-wine)]"><ArrowUpRight size={14} /> Onde atuar agora</p>
            <h2 className="mt-2 text-2xl font-black">As 5 ações mais importantes para a liderança</h2>
          </div>
          <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500">Priorização automática</span>
        </div>
        <div className="mt-5 grid gap-2 lg:grid-cols-5">
          {actions.length ? actions.map((action, index) => (
            <article key={action.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <span className={`rounded-lg px-2 py-1 text-[12px] font-semibold ${action.tone}`}>{action.kind}</span>
                <span className="text-xs font-semibold text-zinc-300">0{index + 1}</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-5 text-zinc-900">{action.title}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-zinc-500">{action.reason}</p>
              <p className="mt-3 truncate text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-400">{action.owner}</p>
            </article>
          )) : (
            <p className="col-span-full rounded-2xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={16} /> Nenhum item prioritário identificado.</p>
          )}
        </div>
      </section>
    </>
  )
}
