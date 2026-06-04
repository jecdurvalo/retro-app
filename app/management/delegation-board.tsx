'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Gauge,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import {
  createEmptyDelegationItem,
  loadDelegationItems,
  saveDelegationItems,
  type AutonomyLevel,
  type DelegationItem,
  type ResponsibilityType,
} from '@/lib/delegation'
import { loadInitiatives, type Initiative } from '@/lib/initiatives'

const MANAGER_STORAGE_KEY = 'retro-delegation-manager'
const responsibilityLabels: Record<ResponsibilityType, string> = {
  execution: 'Execução',
  analysis: 'Análise',
  communication: 'Comunicação',
  stakeholder: 'Stakeholder',
  decision: 'Decisão',
  monitoring: 'Monitoramento',
  documentation: 'Documentação',
}
const autonomyLabels: Record<AutonomyLevel, string> = {
  1: 'Executar com orientação próxima',
  2: 'Propor caminho e validar',
  3: 'Tocar com check-in periódico',
  4: 'Liderar ponta a ponta',
  5: 'Ensinar outras pessoas',
}
const inputClass = 'mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]'
const labelClass = 'text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400'

function percentage(matches: number, total: number) {
  return total ? Math.round((matches / total) * 100) : 0
}

function isCheckInLate(value: string) {
  return !value || value < new Date().toISOString().slice(0, 10)
}

export default function DelegationBoard() {
  const [items, setItems] = useState<DelegationItem[]>([])
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [manager, setManager] = useState('Marina Costa')
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<'people' | 'initiatives'>('people')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(loadDelegationItems())
      setInitiatives(loadInitiatives())
      setManager(window.localStorage.getItem(MANAGER_STORAGE_KEY) || 'Marina Costa')
      setLoaded(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!loaded) return
    saveDelegationItems(items)
    window.localStorage.setItem(MANAGER_STORAGE_KEY, manager)
  }, [items, loaded, manager])

  const activeInitiatives = useMemo(() => initiatives.filter(item => item.status !== 'completed' && item.status !== 'paused'), [initiatives])
  const index = useMemo(() => {
    const dri = percentage(activeInitiatives.filter(item => item.owner.trim()).length, activeInitiatives.length)
    const independent = percentage(activeInitiatives.filter(initiative => (
      initiative.owner !== manager
      && !items.some(item => item.initiativeId === initiative.id && item.responsible === manager)
    )).length, activeInitiatives.length)
    const checkIns = percentage(items.filter(item => !isCheckInLate(item.nextCheckIn)).length, items.length)
    const criteria = percentage(items.filter(item => item.successCriteria.trim()).length, items.length)
    return { dri, independent, checkIns, criteria, overall: Math.round((dri + independent + checkIns + criteria) / 4) }
  }, [activeInitiatives, items, manager])

  const people = useMemo(() => {
    const names = [...new Set([
      ...items.map(item => item.responsible),
      ...activeInitiatives.map(item => item.owner),
    ].filter(Boolean))].sort()
    return names.map(name => {
      const responsibilities = items.filter(item => item.responsible === name)
      const critical = responsibilities.filter(item => initiatives.find(initiative => initiative.id === item.initiativeId)?.criticality === 'high').length
      const support = responsibilities.filter(item => item.autonomyLevel <= 2 || isCheckInLate(item.nextCheckIn) || item.warningSigns.trim()).length
      const autonomy = responsibilities.filter(item => item.autonomyLevel >= 4 || item.observedEvolution.trim()).length
      return { name, responsibilities, critical, support, autonomy }
    })
  }, [activeInitiatives, initiatives, items])

  const alerts = useMemo(() => {
    const noDri = items.filter(item => !item.responsible.trim()).length
    const managerItems = items.filter(item => item.responsible === manager).length
    const overloaded = people.filter(person => person.responsibilities.length >= 4).length
    const noStrategic = people.filter(person => !person.responsibilities.some(item => item.autonomyLevel >= 4 || item.responsibilityType === 'decision' || item.responsibilityType === 'stakeholder')).length
    return [
      { label: 'Itens sem DRI', value: noDri, detail: 'Responsável precisa ser definido' },
      { label: 'Concentrados na gestora', value: managerItems, detail: managerItems > Math.max(2, items.length * 0.35) ? 'Concentração acima do saudável' : 'Dentro do limite atual' },
      { label: 'Pessoas com excesso de carga', value: overloaded, detail: '4 ou mais responsabilidades' },
      { label: 'Sem responsabilidade estratégica', value: noStrategic, detail: 'Sem decisão, stakeholder ou autonomia 4+' },
    ]
  }, [items, manager, people])

  function updateItem(id: string, updates: Partial<DelegationItem>) {
    setItems(current => current.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
  }

  function addItem() {
    const item = createEmptyDelegationItem()
    setItems(current => [item, ...current])
    setExpandedId(item.id)
  }

  return (
    <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]"><UsersRound size={14} /> Delegation Board</p>
          <h2 className="mt-2 text-2xl font-black">Responsabilidade clara, autonomia em evolução</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-400">Visão de distribuição, dependências e desenvolvimento do time.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="block text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">Gestora de referência</span>
            <input aria-label="Gestora de referência" value={manager} onChange={event => setManager(event.target.value)} className="mt-0.5 w-36 bg-transparent text-xs font-black text-zinc-700 outline-none" />
          </label>
          <button onClick={addItem} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-black text-white"><Plus size={16} /> Delegar responsabilidade</button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <article className="rounded-3xl bg-[var(--retro-wine)] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/55"><Gauge size={14} /> Índice de Delegação</p><p className="mt-3 text-5xl font-black">{index.overall}%</p></div>
            <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white/65">{items.length} itens</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[['Iniciativas com DRI claro', index.dri], ['Sem dependência direta', index.independent], ['Check-ins em dia', index.checkIns], ['Com critério de sucesso', index.criteria]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/[0.09] p-3"><p className="text-2xl font-black">{value}%</p><p className="mt-1 text-[11px] font-black text-white/60">{label}</p></div>
            ))}
          </div>
        </article>
        <div className="grid gap-3 sm:grid-cols-2">
          {alerts.map(alert => (
            <article key={alert.label} className={`rounded-2xl border p-4 ${alert.value ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-black text-zinc-800">{alert.label}</p><p className="mt-1 text-[11px] font-semibold text-zinc-500">{alert.detail}</p></div>
                <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black ${alert.value ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{alert.value || <CheckCircle2 size={16} />}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-b border-zinc-200">
        <button onClick={() => setView('people')} className={`border-b-2 px-3 py-3 text-xs font-black ${view === 'people' ? 'border-[var(--retro-wine)] text-[var(--retro-wine)]' : 'border-transparent text-zinc-400'}`}><UserRound className="mr-1.5 inline" size={14} /> Por pessoa</button>
        <button onClick={() => setView('initiatives')} className={`border-b-2 px-3 py-3 text-xs font-black ${view === 'initiatives' ? 'border-[var(--retro-wine)] text-[var(--retro-wine)]' : 'border-transparent text-zinc-400'}`}><BriefcaseBusiness className="mr-1.5 inline" size={14} /> Por iniciativa</button>
      </div>

      {view === 'people' ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {people.map(person => (
            <article key={person.name} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-black text-zinc-900">{person.name}</p><p className="mt-1 text-xs font-semibold text-zinc-400">{person.responsibilities.length} responsabilidade(s)</p></div>{person.name === manager && <span className="rounded-lg bg-[rgba(135,0,47,0.08)] px-2 py-1 text-[9px] font-black text-[var(--retro-wine)]">Gestora</span>}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-rose-50 p-2"><p className="text-lg font-black text-rose-700">{person.critical}</p><p className="text-[9px] font-black text-rose-500">Críticos</p></div>
                <div className="rounded-xl bg-amber-50 p-2"><p className="text-lg font-black text-amber-700">{person.support}</p><p className="text-[9px] font-black text-amber-600">Pedem apoio</p></div>
                <div className="rounded-xl bg-cyan-50 p-2"><p className="text-lg font-black text-cyan-700">{person.autonomy}</p><p className="text-[9px] font-black text-cyan-600">Evoluindo</p></div>
              </div>
              <div className="mt-3 space-y-1.5">{person.responsibilities.slice(0, 3).map(item => <button key={item.id} onClick={() => setExpandedId(item.id)} className="block w-full truncate rounded-xl bg-zinc-50 px-3 py-2 text-left text-[11px] font-black text-zinc-600">{item.title}</button>)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {activeInitiatives.map(initiative => {
            const related = items.filter(item => item.initiativeId === initiative.id)
            const support = [...new Set(related.map(item => item.responsible).filter(name => name && name !== initiative.owner))]
            const managerDecision = initiative.decisionNeeded && (initiative.owner === manager || related.some(item => item.responsible === manager && item.responsibilityType === 'decision'))
            return (
              <article key={initiative.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-black text-zinc-900">{initiative.title}</p><p className="mt-1 text-xs font-semibold text-zinc-400">{initiative.area || 'Área não definida'}</p></div><span className="rounded-xl bg-zinc-100 px-2.5 py-1 text-[10px] font-black text-zinc-600">{related.length} parte(s) delegada(s)</span></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-xl bg-zinc-50 p-3 text-xs font-semibold text-zinc-500"><strong className="block text-[10px] uppercase tracking-[0.1em] text-zinc-400">DRI</strong><span className="mt-1 block font-black text-zinc-700">{initiative.owner || 'Sem DRI'}</span></p>
                  <p className="rounded-xl bg-zinc-50 p-3 text-xs font-semibold text-zinc-500"><strong className="block text-[10px] uppercase tracking-[0.1em] text-zinc-400">Apoia</strong><span className="mt-1 block font-black text-zinc-700">{support.join(', ') || 'Sem apoio definido'}</span></p>
                </div>
                {managerDecision && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800"><AlertCircle className="mr-1.5 inline" size={13} /> Decisão depende da gestora: {initiative.decisionNeeded}</p>}
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-5 space-y-2">
        {items.map(item => {
          const expanded = expandedId === item.id
          const initiative = initiatives.find(entry => entry.id === item.initiativeId)
          return (
            <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white ${isCheckInLate(item.nextCheckIn) ? 'border-amber-200' : 'border-zinc-200'}`}>
              <button onClick={() => setExpandedId(expanded ? null : item.id)} aria-expanded={expanded} className="grid w-full gap-3 p-4 text-left lg:grid-cols-[1fr_180px_150px_36px] lg:items-center">
                <div><p className="text-sm font-black text-zinc-900">{item.title}</p><p className="mt-1 text-xs font-semibold text-zinc-400">{initiative?.title || 'Sem iniciativa relacionada'}</p></div>
                <div><p className="text-xs font-black text-zinc-700">{item.responsible || 'Sem DRI'}</p><p className="mt-1 text-[10px] font-black text-zinc-400">{responsibilityLabels[item.responsibilityType]}</p></div>
                <div><p className="text-xs font-black text-zinc-700">Autonomia {item.autonomyLevel}</p><p className={`mt-1 text-[10px] font-black ${isCheckInLate(item.nextCheckIn) ? 'text-amber-700' : 'text-zinc-400'}`}>{isCheckInLate(item.nextCheckIn) ? 'Check-in pendente' : `Próximo: ${new Date(`${item.nextCheckIn}T12:00:00`).toLocaleDateString('pt-BR')}`}</p></div>
                <ChevronDown size={16} className={`text-zinc-400 transition ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded && (
                <div className="border-t border-zinc-100 bg-zinc-50/70 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="md:col-span-2"><span className={labelClass}>Título da responsabilidade</span><input value={item.title} onChange={event => updateItem(item.id, { title: event.target.value })} className={inputClass} /></label>
                    <label><span className={labelClass}>Pessoa responsável</span><input value={item.responsible} onChange={event => updateItem(item.id, { responsible: event.target.value })} className={inputClass} /></label>
                    <label><span className={labelClass}>Iniciativa relacionada</span><select value={item.initiativeId} onChange={event => updateItem(item.id, { initiativeId: event.target.value })} className={inputClass}><option value="">Sem iniciativa</option>{initiatives.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>
                    <label><span className={labelClass}>Tipo de responsabilidade</span><select value={item.responsibilityType} onChange={event => updateItem(item.id, { responsibilityType: event.target.value as ResponsibilityType })} className={inputClass}>{Object.entries(responsibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="md:col-span-2"><span className={labelClass}>Nível de autonomia esperado</span><select value={item.autonomyLevel} onChange={event => updateItem(item.id, { autonomyLevel: Number(event.target.value) as AutonomyLevel })} className={inputClass}>{Object.entries(autonomyLabels).map(([value, label]) => <option key={value} value={value}>{value}. {label}</option>)}</select></label>
                    <label><span className={labelClass}>Frequência de check-in</span><input value={item.checkInFrequency} onChange={event => updateItem(item.id, { checkInFrequency: event.target.value })} className={inputClass} /></label>
                    <label><span className={labelClass}>Próximo check-in</span><input type="date" value={item.nextCheckIn} onChange={event => updateItem(item.id, { nextCheckIn: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Resultado esperado</span><textarea rows={2} value={item.expectedOutcome} onChange={event => updateItem(item.id, { expectedOutcome: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Critério de sucesso</span><textarea rows={2} value={item.successCriteria} onChange={event => updateItem(item.id, { successCriteria: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Sinais de alerta</span><textarea rows={2} value={item.warningSigns} onChange={event => updateItem(item.id, { warningSigns: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Feedback da liderança</span><textarea rows={2} value={item.leadershipFeedback} onChange={event => updateItem(item.id, { leadershipFeedback: event.target.value })} className={inputClass} /></label>
                    <label className="md:col-span-2"><span className={labelClass}>Evolução observada</span><textarea rows={2} value={item.observedEvolution} onChange={event => updateItem(item.id, { observedEvolution: event.target.value })} className={inputClass} /></label>
                  </div>
                  <div className="mt-3 flex justify-end"><button onClick={() => setItems(current => current.filter(entry => entry.id !== item.id))} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-rose-600"><Trash2 size={13} /> Excluir</button></div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
