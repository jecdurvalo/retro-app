'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  ChevronDown,
  Flame,
  Link2,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import {
  createEmptyHotTopic,
  loadHotTopics,
  saveHotTopics,
  type HotTopic,
  type HotTopicImpact,
  type HotTopicTemperature,
} from '@/lib/hot-topics'
import {
  createEmptyInitiative,
  INITIATIVES_UPDATED_EVENT,
  loadInitiatives,
  saveInitiatives,
  type Initiative,
} from '@/lib/initiatives'

const temperatureMeta: Record<HotTopicTemperature, { label: string; tone: string; panel: string; score: number }> = {
  monitor: { label: 'Monitorar', tone: 'bg-cyan-100 text-cyan-800', panel: 'border-cyan-200', score: 1 },
  attention: { label: 'Atenção', tone: 'bg-amber-100 text-amber-800', panel: 'border-amber-200', score: 2 },
  critical: { label: 'Crítico', tone: 'bg-rose-100 text-rose-700', panel: 'border-rose-300', score: 3 },
}

const impactLabels: Record<HotTopicImpact, string> = {
  financial: 'Financeiro',
  operational: 'Operacional',
  customer: 'Cliente',
  regulatory: 'Regulatório',
  reputational: 'Reputacional',
  team: 'Time',
}

const inputClass = 'mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]'
const labelClass = 'text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400'
const DAY_MS = 86_400_000

function daysSince(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - new Date(`${value.slice(0, 10)}T12:00:00`).getTime()) / DAY_MS)
}

function topicSignals(topic: HotTopic) {
  const signals: string[] = []
  if (daysSince(topic.lastUpdate) > 7) signals.push('Sem atualização recente')
  if (topic.temperature === 'critical' && !topic.nextAction.trim()) signals.push('Risco de gestão')
  if (topic.decisionNeeded.trim() && !topic.owner.trim()) signals.push('Pendente de liderança')
  if (topic.temperature === 'critical' && topic.criticalSince && daysSince(topic.criticalSince) > 14) signals.push('Escalonamento sugerido')
  return signals
}

function priorityScore(topic: HotTopic) {
  const signals = topicSignals(topic)
  return temperatureMeta[topic.temperature].score * 100
    + (!topic.nextAction.trim() ? 80 : 0)
    + (signals.includes('Pendente de liderança') ? 60 : 0)
    + (signals.includes('Escalonamento sugerido') ? 40 : 0)
    + (signals.includes('Sem atualização recente') ? 20 : 0)
}

function managementReading(topic: HotTopic) {
  const signals = topicSignals(topic)
  const impact = topic.impacts.map(item => impactLabels[item].toLowerCase()).join(', ')
  const reasons = [
    topic.temperature === 'critical' ? 'está crítico' : topic.temperature === 'attention' ? 'está em atenção' : '',
    !topic.nextAction.trim() ? 'não possui próxima ação definida' : '',
    signals.includes('Sem atualização recente') ? `está há ${daysSince(topic.lastUpdate)} dias sem atualização` : '',
    impact ? `pode gerar impacto ${impact}` : '',
  ].filter(Boolean)
  const movement = !topic.nextAction.trim()
    ? 'Definir dono e próxima ação objetiva ainda nesta reunião.'
    : signals.includes('Pendente de liderança')
      ? 'Atribuir responsável e destravar a decisão pendente.'
      : signals.includes('Escalonamento sugerido')
        ? 'Escalonar o tema e revisar o plano de contenção.'
        : `Executar: ${topic.nextAction}`
  const risk = topic.containmentPlan.trim()
    ? `Sem ação, será necessário acionar a contenção: ${topic.containmentPlan}`
    : `Há risco de ampliação do impacto ${impact || 'operacional'} sem contenção registrada.`

  return { reason: reasons.join(', ') || 'precisa permanecer visível até a próxima reavaliação', movement, risk }
}

function initiativeFromTopic(topic: HotTopic): Initiative {
  const initiative = createEmptyInitiative()
  const criticality = topic.temperature === 'critical' ? 'high' : topic.temperature === 'attention' ? 'medium' : 'low'
  return {
    ...initiative,
    title: topic.title,
    description: topic.context,
    type: 'risk',
    status: topic.temperature === 'critical' ? 'at_risk' : 'in_progress',
    criticality,
    owner: topic.owner,
    involvedPeople: topic.stakeholders,
    startDate: new Date().toISOString().slice(0, 10),
    nextMilestone: 'Reavaliação do tema quente',
    targetDate: topic.reevaluationDate,
    nextStep: topic.nextAction,
    currentRisk: topic.containmentPlan,
    decisionNeeded: topic.decisionNeeded,
    sourceLink: `/management?hotTopic=${topic.id}`,
  }
}

export default function HotTopicRadar() {
  const [topics, setTopics] = useState<HotTopic[]>([])
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [loaded, setLoaded] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTopics(loadHotTopics())
      setInitiatives(loadInitiatives())
      setLoaded(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (loaded) saveHotTopics(topics)
  }, [loaded, topics])

  const radarTopics = useMemo(() => {
    const prioritized = [...topics]
      .sort((a, b) => priorityScore(b) - priorityScore(a) || a.reevaluationDate.localeCompare(b.reevaluationDate))
      .slice(0, 5)
    const expanded = topics.find(topic => topic.id === expandedId)
    if (expanded && !prioritized.some(topic => topic.id === expanded.id)) return [...prioritized.slice(0, 4), expanded]
    return prioritized
  }, [expandedId, topics])

  function updateTopic(id: string, updates: Partial<HotTopic>) {
    setTopics(current => current.map(topic => {
      if (topic.id !== id) return topic
      const enteringCritical = updates.temperature === 'critical' && topic.temperature !== 'critical'
      return {
        ...topic,
        ...updates,
        criticalSince: enteringCritical ? new Date().toISOString().slice(0, 10) : updates.temperature && updates.temperature !== 'critical' ? undefined : topic.criticalSince,
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  function addTopic() {
    const topic = createEmptyHotTopic()
    setTopics(current => [topic, ...current])
    setExpandedId(topic.id)
  }

  function transformTopic(topic: HotTopic) {
    if (topic.initiativeId) return
    const initiative = initiativeFromTopic(topic)
    const nextInitiatives = [initiative, ...loadInitiatives()]
    saveInitiatives(nextInitiatives)
    window.dispatchEvent(new CustomEvent(INITIATIVES_UPDATED_EVENT))
    setInitiatives(nextInitiatives)
    updateTopic(topic.id, { initiativeId: initiative.id })
  }

  function linkTopic(topicId: string, initiativeId: string) {
    updateTopic(topicId, { initiativeId: initiativeId || undefined })
  }

  return (
    <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]"><Flame size={14} /> Radar de temas quentes</p>
          <h2 className="mt-2 text-2xl font-black">O que não pode sair do radar da liderança</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-400">Até 5 temas priorizados por temperatura e ausência de próximo movimento.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.length > 5 && (
            <select aria-label="Abrir qualquer tema quente" value={expandedId || ''} onChange={event => setExpandedId(event.target.value || null)} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-xs font-black text-zinc-600 outline-none">
              <option value="">Abrir tema ({topics.length} no total)</option>
              {topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
            </select>
          )}
          <button onClick={addTopic} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Novo tema quente</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-5">
        {radarTopics.map(topic => {
          const expanded = expandedId === topic.id
          const signals = topicSignals(topic)
          const reading = managementReading(topic)
          const linked = initiatives.find(item => item.id === topic.initiativeId)
          return (
            <article key={topic.id} className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${temperatureMeta[topic.temperature].panel} ${expanded ? 'xl:col-span-5' : ''}`}>
              <button onClick={() => {
                setInitiatives(loadInitiatives())
                setExpandedId(expanded ? null : topic.id)
              }} aria-expanded={expanded} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black ${temperatureMeta[topic.temperature].tone}`}>{temperatureMeta[topic.temperature].label}</span>
                  <ChevronDown size={16} className={`shrink-0 text-zinc-400 transition ${expanded ? 'rotate-180' : ''}`} />
                </div>
                <p className="mt-3 text-sm font-black leading-5 text-zinc-900">{topic.title}</p>
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-zinc-400">{topic.whyNow || topic.context}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {signals.slice(0, 2).map(signal => <span key={signal} className="rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-700">{signal}</span>)}
                  {linked && <span className="rounded-lg bg-cyan-50 px-2 py-1 text-[9px] font-black text-cyan-700">Iniciativa conectada</span>}
                </div>
              </button>

              {expanded && (
                <div className="border-t border-zinc-100 bg-zinc-50/70 p-4">
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-rose-100 bg-white p-4">
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-rose-600"><AlertTriangle size={13} /> Esse tema exige atenção porque...</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{reading.reason}.</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-100 bg-white p-4">
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700"><ArrowUpRight size={13} /> Próximo movimento recomendado...</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{reading.movement}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-white p-4">
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700"><ShieldAlert size={13} /> Risco se nada for feito...</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{reading.risk}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="md:col-span-2"><span className={labelClass}>Título</span><input value={topic.title} onChange={event => updateTopic(topic.id, { title: event.target.value })} className={inputClass} /></label>
                    <label><span className={labelClass}>Temperatura</span><select value={topic.temperature} onChange={event => updateTopic(topic.id, { temperature: event.target.value as HotTopicTemperature })} className={inputClass}>{Object.entries(temperatureMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
                    <label><span className={labelClass}>Dono da frente</span><input value={topic.owner} onChange={event => updateTopic(topic.id, { owner: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Contexto em 3 linhas</span><textarea rows={3} value={topic.context} onChange={event => updateTopic(topic.id, { context: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Por que importa agora</span><textarea rows={3} value={topic.whyNow} onChange={event => updateTopic(topic.id, { whyNow: event.target.value })} className={inputClass} /></label>
                    <fieldset className="md:col-span-2"><legend className={labelClass}>Impacto potencial</legend><div className="mt-2 flex flex-wrap gap-2">{Object.entries(impactLabels).map(([value, label]) => <label key={value} className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-black ${topic.impacts.includes(value as HotTopicImpact) ? 'border-[var(--retro-wine)] bg-[rgba(135,0,47,0.06)] text-[var(--retro-wine)]' : 'border-zinc-200 bg-white text-zinc-500'}`}><input type="checkbox" className="sr-only" checked={topic.impacts.includes(value as HotTopicImpact)} onChange={() => updateTopic(topic.id, { impacts: topic.impacts.includes(value as HotTopicImpact) ? topic.impacts.filter(item => item !== value) : [...topic.impacts, value as HotTopicImpact] })} />{label}</label>)}</div></fieldset>
                    <label><span className={labelClass}>Stakeholders principais</span><input value={topic.stakeholders.join(', ')} onChange={event => updateTopic(topic.id, { stakeholders: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} className={inputClass} /></label>
                    <label><span className={labelClass}>Último update</span><input type="date" value={topic.lastUpdate.slice(0, 10)} onChange={event => updateTopic(topic.id, { lastUpdate: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Próxima ação</span><textarea rows={2} value={topic.nextAction} onChange={event => updateTopic(topic.id, { nextAction: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Decisão necessária</span><textarea rows={2} value={topic.decisionNeeded} onChange={event => updateTopic(topic.id, { decisionNeeded: event.target.value })} className={inputClass} /></label>
                    <label><span className={labelClass}>Data para reavaliação</span><input type="date" value={topic.reevaluationDate} onChange={event => updateTopic(topic.id, { reevaluationDate: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-3"><span className={labelClass}>Se piorar, qual é o plano de contenção?</span><textarea rows={2} value={topic.containmentPlan} onChange={event => updateTopic(topic.id, { containmentPlan: event.target.value })} className={inputClass} /></label>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center">
                    <p className="flex shrink-0 items-center gap-2 text-xs font-black text-zinc-500"><Link2 size={14} /> Conexão com iniciativa</p>
                    <select aria-label="Conectar tema a uma iniciativa" value={topic.initiativeId || ''} onChange={event => linkTopic(topic.id, event.target.value)} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 outline-none">
                      <option value="">Nenhuma iniciativa conectada</option>
                      {initiatives.map(initiative => <option key={initiative.id} value={initiative.id}>{initiative.title}</option>)}
                    </select>
                    <button onClick={() => transformTopic(topic)} disabled={Boolean(topic.initiativeId)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-black text-white disabled:opacity-35"><BellRing size={13} /> Transformar em iniciativa</button>
                    <button onClick={() => setTopics(current => current.filter(item => item.id !== topic.id))} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-rose-600"><Trash2 size={13} /> Excluir</button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
