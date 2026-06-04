'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck, CheckCircle2, ClipboardCopy, Save } from 'lucide-react'
import { loadDelegationItems, type DelegationItem } from '@/lib/delegation'
import { generateExecutiveReading } from '@/lib/executive-reading'
import { loadHotTopics, type HotTopic } from '@/lib/hot-topics'
import { loadInitiatives, type Initiative } from '@/lib/initiatives'
import { calculateManagementQuality } from '@/lib/management-quality'
import type { ManagementPlan, RetroSnapshot } from '@/lib/management'
import {
  createEmptyMonthlyClose,
  loadMonthlyCloses,
  monthlyCloseStepIds,
  monthlyCloseStepLabels,
  saveMonthlyCloses,
  type MonthlyCloseSnapshot,
} from '@/lib/monthly-close'

function listValue(value: string[]) {
  return value.join('\n')
}

function parseList(value: string) {
  return value.split('\n').map(item => item.trim()).filter(Boolean)
}

export default function MonthlyClose({
  plans,
  snapshots,
  currentMood,
  moodCount,
  retroItemCount,
}: {
  plans: ManagementPlan[]
  snapshots: RetroSnapshot[]
  currentMood: number
  moodCount: number
  retroItemCount: number
}) {
  const [closes, setCloses] = useState<MonthlyCloseSnapshot[]>([])
  const [draft, setDraft] = useState<MonthlyCloseSnapshot>(() => createEmptyMonthlyClose(new Date().toISOString().slice(0, 7)))
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([])
  const [delegations, setDelegations] = useState<DelegationItem[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = loadMonthlyCloses()
      setCloses(stored)
      const month = new Date().toISOString().slice(0, 7)
      setDraft(stored.find(item => item.referenceMonth === month) || createEmptyMonthlyClose(month))
      setInitiatives(loadInitiatives())
      setHotTopics(loadHotTopics())
      setDelegations(loadDelegationItems())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const progress = Math.round((Object.values(draft.steps).filter(Boolean).length / monthlyCloseStepIds.length) * 100)

  function update(updates: Partial<MonthlyCloseSnapshot>) {
    setDraft(current => ({ ...current, ...updates, updatedAt: new Date().toISOString() }))
  }

  function generateMinutes() {
    setInitiatives(loadInitiatives())
    setHotTopics(loadHotTopics())
    setDelegations(loadDelegationItems())
    const reading = generateExecutiveReading({
      plans,
      initiatives,
      hotTopics,
      delegations,
      snapshots,
      currentMood: currentMood || null,
      tone: 'minutes',
      referenceDate: new Date().toISOString().slice(0, 10),
    })
    const executiveMinutes = [
      `ATA GERENCIAL · ${draft.referenceMonth}`,
      '',
      'RESUMO EXECUTIVO',
      ...reading.summary.map(item => `- ${item}`),
      '',
      'PRINCIPAIS AVANÇOS',
      ...reading.advances.map(item => `- ${item.title}: ${item.detail}`),
      '',
      'PONTOS DE ATENÇÃO',
      ...reading.attentionPoints.map(item => `- ${item.title}: ${item.detail}`),
      '',
      'DECISÕES NECESSÁRIAS',
      ...reading.decisions.map(item => `- ${item.title} | Dono sugerido: ${item.suggestedOwner} | Prazo: ${item.suggestedDeadline}`),
      '',
      'PRÓXIMOS MOVIMENTOS',
      ...reading.nextMoves.map(item => `- ${item.owner}: ${item.action} Prazo: ${item.suggestedDeadline}`),
    ].join('\n')
    update({
      executiveMinutes,
      improved: reading.advances.map(item => item.title),
      leadershipActions: reading.attentionPoints.map(item => item.title),
      decisions: reading.decisions.map(item => item.title),
      escalatedRisks: reading.attentionPoints.filter(item => item.priority >= 400).map(item => item.title),
      steps: { ...draft.steps, executiveReadingGenerated: true },
    })
  }

  function save() {
    const manager = window.localStorage.getItem('retro-delegation-manager') || 'Marina Costa'
    const quality = calculateManagementQuality(plans, initiatives, hotTopics, delegations, manager)
    const finalized = {
      ...draft,
      metrics: {
        moodAverage: currentMood,
        moodResponses: moodCount,
        retroItems: retroItemCount,
        openPlans: plans.filter(item => item.status !== 'done').length,
        closedPlans: plans.filter(item => item.status === 'done').length,
        activeInitiatives: initiatives.filter(item => item.status !== 'completed' && item.status !== 'paused').length,
        completedInitiatives: initiatives.filter(item => item.status === 'completed').length,
        hotTopics: hotTopics.length,
        criticalHotTopics: hotTopics.filter(item => item.temperature === 'critical').length,
        activeDelegations: delegations.length,
        overdueCheckIns: delegations.filter(item => !item.nextCheckIn || item.nextCheckIn < new Date().toISOString().slice(0, 10)).length,
        managementQualityScore: quality.score,
      },
      updatedAt: new Date().toISOString(),
    }
    const next = [...closes.filter(item => item.referenceMonth !== finalized.referenceMonth), finalized]
    setCloses(next)
    setDraft(finalized)
    saveMonthlyCloses(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <section aria-label="Fechamento mensal de gestão" className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--retro-wine)]"><CalendarCheck size={14} /> Fechamento Mensal de Gestão</p>
          <h2 className="mt-2 text-2xl font-black">Consolidar o mês e preparar o próximo ciclo</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-400">{progress}% das etapas concluídas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="month" value={draft.referenceMonth} onChange={event => update({ referenceMonth: event.target.value, steps: { ...draft.steps, referenceMonthSelected: Boolean(event.target.value) } })} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 outline-none focus-visible:ring-2 focus-visible:ring-[var(--retro-wine)] focus-visible:ring-offset-1" />
          <button onClick={generateMinutes} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"><ClipboardCopy size={14} /> Gerar ata gerencial do mês</button>
          <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-3 py-2 text-xs font-semibold text-white">{saved ? <CheckCircle2 size={14} /> : <Save size={14} />}{saved ? 'Snapshot salvo' : 'Salvar fechamento'}</button>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {monthlyCloseStepIds.map((step, index) => (
          <label key={step} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${draft.steps[step] ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-white'}`}>
            <input type="checkbox" checked={draft.steps[step]} onChange={event => update({ steps: { ...draft.steps, [step]: event.target.checked } })} className="mt-0.5 accent-[var(--retro-wine)]" />
            <span><strong className="block text-[12px] font-semibold text-zinc-400">0{index + 1}</strong><span className="mt-1 block text-xs font-semibold text-zinc-700">{monthlyCloseStepLabels[step]}</span></span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CloseField label="O que melhorou" value={draft.improved} onChange={improved => update({ improved })} />
        <CloseField label="O que piorou" value={draft.worsened} onChange={worsened => update({ worsened })} />
        <CloseField label="O que ficou parado" value={draft.stalled} onChange={stalled => update({ stalled })} />
        <CloseField label="Onde a liderança precisa atuar" value={draft.leadershipActions} onChange={leadershipActions => update({ leadershipActions })} />
        <CloseField label="Decisões necessárias" value={draft.decisions} onChange={decisions => update({ decisions })} />
        <CloseField label="Temas do próximo mês" value={draft.nextMonthTopics} onChange={nextMonthTopics => update({ nextMonthTopics })} />
        <CloseField label="Pessoas com mais protagonismo" value={draft.protagonists} onChange={protagonists => update({ protagonists })} />
        <CloseField label="Riscos para escalonar" value={draft.escalatedRisks} onChange={escalatedRisks => update({ escalatedRisks })} />
      </div>

      <label className="mt-3 block"><span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Aprendizados do mês</span><textarea rows={3} value={listValue(draft.learnings)} onChange={event => update({ learnings: parseList(event.target.value), steps: { ...draft.steps, learningsRegistered: Boolean(event.target.value.trim()) } })} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--retro-wine)] focus-visible:ring-2 focus-visible:ring-[var(--retro-wine)] focus-visible:ring-offset-1" placeholder="Um aprendizado por linha" /></label>
      {draft.executiveMinutes && <label className="mt-3 block"><span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Ata gerencial copiável</span><textarea rows={12} readOnly value={draft.executiveMinutes} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-xs leading-5 text-zinc-600 outline-none" /></label>}
    </section>
  )
}

function CloseField({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  return <label><span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</span><textarea rows={4} value={listValue(value)} onChange={event => onChange(parseList(event.target.value))} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold leading-5 outline-none focus:border-[var(--retro-wine)] focus-visible:ring-2 focus-visible:ring-[var(--retro-wine)] focus-visible:ring-offset-1" placeholder="Um item por linha" /></label>
}
