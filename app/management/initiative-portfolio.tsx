'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Filter,
  Flag,
  Link2,
  Plus,
  Trash2,
  UserRoundX,
} from 'lucide-react'
import {
  createEmptyInitiative,
  INITIATIVES_UPDATED_EVENT,
  loadInitiatives,
  saveInitiatives,
  type Initiative,
  type InitiativeCriticality,
  type InitiativeStatus,
  type InitiativeType,
} from '@/lib/initiatives'

const statusMeta: Record<InitiativeStatus, { label: string; tone: string; dot: string }> = {
  not_started: { label: 'Não iniciado', tone: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  in_progress: { label: 'Em andamento', tone: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  at_risk: { label: 'Em risco', tone: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  blocked: { label: 'Bloqueado', tone: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  completed: { label: 'Concluído', tone: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  paused: { label: 'Pausado', tone: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
}

const criticalityMeta: Record<InitiativeCriticality, { label: string; tone: string }> = {
  high: { label: 'Alta', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
  medium: { label: 'Média', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  low: { label: 'Baixa', tone: 'bg-zinc-50 text-zinc-600 ring-zinc-200' },
}

const typeLabels: Record<InitiativeType, string> = {
  project: 'Projeto',
  hot_topic: 'Tema quente',
  process: 'Processo',
  risk: 'Risco',
  continuous_improvement: 'Melhoria contínua',
  tech_ask: 'Tech ask',
}

const activeStatuses: InitiativeStatus[] = ['not_started', 'in_progress', 'at_risk', 'blocked']
const filterClass = 'rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 outline-none focus:border-[var(--retro-wine)]'
const inputClass = 'mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--retro-wine)]'
const labelClass = 'text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400'

function formatDate(value: string) {
  if (!value) return 'Sem data'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function PortfolioMetric({ icon: Icon, label, value, detail, tone }: { icon: typeof BriefcaseBusiness; label: string; value: number; detail: string; tone: string }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-zinc-900">{value}</p>
          <p className="mt-1 text-xs font-black text-zinc-700">{label}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={16} /></span>
      </div>
      <p className="mt-3 text-[11px] font-semibold text-zinc-400">{detail}</p>
    </article>
  )
}

function leadershipReasons(initiative: Initiative) {
  const reasons: string[] = []
  if (initiative.status === 'blocked') reasons.push('Bloqueada')
  if (!initiative.nextStep.trim() && initiative.status !== 'completed') reasons.push('Sem próximo passo')
  if (initiative.criticality === 'high' && initiative.status !== 'completed') reasons.push('Alta criticidade')
  if (initiative.decisionNeeded.trim() && initiative.status !== 'completed') reasons.push('Decisão pendente')
  return reasons
}

export default function InitiativePortfolio() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [loaded, setLoaded] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState({ status: '', criticality: '', owner: '', type: '', area: '' })

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInitiatives(loadInitiatives())
      setLoaded(true)
    })
    const syncInitiatives = () => setInitiatives(loadInitiatives())
    window.addEventListener(INITIATIVES_UPDATED_EVENT, syncInitiatives)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener(INITIATIVES_UPDATED_EVENT, syncInitiatives)
    }
  }, [])

  useEffect(() => {
    if (loaded) saveInitiatives(initiatives)
  }, [initiatives, loaded])

  const metrics = useMemo(() => {
    const now = new Date()
    return {
      active: initiatives.filter(item => activeStatuses.includes(item.status)).length,
      risk: initiatives.filter(item => item.status === 'at_risk' || item.status === 'blocked').length,
      noNextStep: initiatives.filter(item => item.status !== 'completed' && !item.nextStep.trim()).length,
      noOwner: initiatives.filter(item => item.status !== 'completed' && !item.owner.trim()).length,
      completedMonth: initiatives.filter(item => {
        if (item.status !== 'completed' || !item.completedAt) return false
        const date = new Date(`${item.completedAt}T12:00:00`)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length,
    }
  }, [initiatives])

  const ownerOptions = useMemo(() => [...new Set(initiatives.map(item => item.owner).filter(Boolean))].sort(), [initiatives])
  const areaOptions = useMemo(() => [...new Set(initiatives.map(item => item.area).filter(Boolean))].sort(), [initiatives])
  const leadershipItems = useMemo(() => initiatives
    .map(item => ({ item, reasons: leadershipReasons(item) }))
    .filter(entry => entry.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length || Number(b.item.status === 'blocked') - Number(a.item.status === 'blocked'))
    .slice(0, 4), [initiatives])
  const filtered = useMemo(() => initiatives.filter(item => (
    (!filters.status || item.status === filters.status)
    && (!filters.criticality || item.criticality === filters.criticality)
    && (!filters.owner || item.owner === filters.owner)
    && (!filters.type || item.type === filters.type)
    && (!filters.area || item.area === filters.area)
  )), [filters, initiatives])

  function updateInitiative(id: string, updates: Partial<Initiative>) {
    setInitiatives(current => current.map(item => item.id === id
      ? {
          ...item,
          ...updates,
          completedAt: updates.status === 'completed'
            ? item.completedAt || new Date().toISOString().slice(0, 10)
            : updates.status ? undefined : item.completedAt,
          updatedAt: new Date().toISOString(),
        }
      : item))
  }

  function addInitiative() {
    const initiative = createEmptyInitiative()
    setInitiatives(current => [initiative, ...current])
    setExpandedId(initiative.id)
  }

  function removeInitiative(id: string) {
    setInitiatives(current => current.filter(item => item.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]">
            <BriefcaseBusiness size={14} />
            Carteira de iniciativas
          </p>
          <h2 className="mt-2 text-2xl font-black">Visão executiva das frentes prioritárias</h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-zinc-400">Projetos, temas e riscos que precisam de acompanhamento na reunião semanal.</p>
        </div>
        <button onClick={addInitiative} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)]">
          <Plus size={16} />
          Nova iniciativa
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <PortfolioMetric icon={CircleDot} label="Iniciativas ativas" value={metrics.active} detail="Em acompanhamento" tone="bg-cyan-50 text-cyan-700" />
        <PortfolioMetric icon={AlertCircle} label="Em risco / bloqueadas" value={metrics.risk} detail="Pedem intervenção" tone="bg-rose-50 text-rose-700" />
        <PortfolioMetric icon={ArrowUpRight} label="Sem próximo passo" value={metrics.noNextStep} detail="Precisam de objetividade" tone="bg-amber-50 text-amber-700" />
        <PortfolioMetric icon={UserRoundX} label="Sem dono claro" value={metrics.noOwner} detail="Responsabilidade pendente" tone="bg-violet-50 text-violet-700" />
        <PortfolioMetric icon={CheckCircle2} label="Concluídas no mês" value={metrics.completedMonth} detail="Resultados entregues" tone="bg-emerald-50 text-emerald-700" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_2.1fr]">
        <aside className="rounded-3xl bg-[var(--retro-wine)] p-5 text-white">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/55">
            <Flag size={14} />
            Onde a liderança precisa atuar agora
          </p>
          <div className="mt-4 space-y-2">
            {leadershipItems.length === 0 ? (
              <p className="rounded-2xl bg-white/10 p-4 text-sm font-semibold text-white/65">Nenhuma atuação prioritária identificada.</p>
            ) : leadershipItems.map(({ item, reasons }) => (
              <button key={item.id} onClick={() => setExpandedId(item.id)} aria-expanded={expandedId === item.id} className="block w-full rounded-2xl bg-white/[0.09] p-3 text-left transition hover:bg-white/[0.14]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black leading-5">{item.title}</p>
                  <ChevronDown size={15} className="mt-0.5 shrink-0 -rotate-90 text-white/45" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {reasons.map(reason => <span key={reason} className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-white/65">{reason}</span>)}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 lg:flex-row lg:items-center">
            <p className="flex shrink-0 items-center gap-2 text-xs font-black text-zinc-500"><Filter size={14} /> Filtros</p>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <select aria-label="Filtrar por status" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))} className={filterClass}>
                <option value="">Status</option>
                {Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
              <select aria-label="Filtrar por criticidade" value={filters.criticality} onChange={event => setFilters(current => ({ ...current, criticality: event.target.value }))} className={filterClass}>
                <option value="">Criticidade</option>
                {Object.entries(criticalityMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
              <select aria-label="Filtrar por dono" value={filters.owner} onChange={event => setFilters(current => ({ ...current, owner: event.target.value }))} className={filterClass}>
                <option value="">Dono</option>
                {ownerOptions.map(value => <option key={value}>{value}</option>)}
              </select>
              <select aria-label="Filtrar por tipo" value={filters.type} onChange={event => setFilters(current => ({ ...current, type: event.target.value }))} className={filterClass}>
                <option value="">Tipo</option>
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select aria-label="Filtrar por área" value={filters.area} onChange={event => setFilters(current => ({ ...current, area: event.target.value }))} className={filterClass}>
                <option value="">Produto / área</option>
                {areaOptions.map(value => <option key={value}>{value}</option>)}
              </select>
            </div>
            {Object.values(filters).some(Boolean) && <button onClick={() => setFilters({ status: '', criticality: '', owner: '', type: '', area: '' })} className="shrink-0 text-xs font-black text-[var(--retro-wine)]">Limpar</button>}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
            <div className="hidden grid-cols-[minmax(260px,1fr)_130px_120px_130px_36px] gap-3 bg-zinc-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400 lg:grid">
              <span>Iniciativa</span><span>Dono / área</span><span>Próximo marco</span><span>Status</span><span />
            </div>
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-sm font-semibold text-zinc-400">Nenhuma iniciativa encontrada com estes filtros.</p>
            ) : filtered.map(item => {
              const expanded = expandedId === item.id
              return (
                <article key={item.id} className="border-t border-zinc-100 first:border-t-0">
                  <button onClick={() => setExpandedId(expanded ? null : item.id)} aria-expanded={expanded} className="grid w-full gap-3 p-4 text-left lg:grid-cols-[minmax(260px,1fr)_130px_120px_130px_36px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-black ring-1 ring-inset ${criticalityMeta[item.criticality].tone}`}>{criticalityMeta[item.criticality].label}</span>
                        <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-black text-zinc-500">{typeLabels[item.type]}</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-black text-zinc-900">{item.title}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-zinc-400">{item.nextStep || 'Próximo passo não definido'}</p>
                    </div>
                    <div><p className="text-xs font-black text-zinc-700">{item.owner || 'Sem dono'}</p><p className="mt-1 text-[11px] font-semibold text-zinc-400">{item.area || 'Sem área'}</p></div>
                    <div><p className="truncate text-xs font-black text-zinc-700">{item.nextMilestone || 'Sem marco'}</p><p className="mt-1 text-[11px] font-semibold text-zinc-400">Alvo {formatDate(item.targetDate)}</p></div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-black ${statusMeta[item.status].tone}`}><span className={`h-1.5 w-1.5 rounded-full ${statusMeta[item.status].dot}`} />{statusMeta[item.status].label}</span>
                    <ChevronDown size={16} className={`text-zinc-400 transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>

                  {expanded && (
                    <div className="border-t border-zinc-100 bg-zinc-50/70 p-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="md:col-span-2"><span className={labelClass}>Título</span><input value={item.title} onChange={event => updateInitiative(item.id, { title: event.target.value })} className={inputClass} /></label>
                        <label><span className={labelClass}>Tipo</span><select value={item.type} onChange={event => updateInitiative(item.id, { type: event.target.value as InitiativeType })} className={inputClass}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        <label><span className={labelClass}>Status</span><select value={item.status} onChange={event => updateInitiative(item.id, { status: event.target.value as InitiativeStatus })} className={inputClass}>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
                        <label className="md:col-span-2"><span className={labelClass}>Descrição curta</span><textarea rows={2} value={item.description} onChange={event => updateInitiative(item.id, { description: event.target.value })} className={inputClass} /></label>
                        <label><span className={labelClass}>Criticidade</span><select value={item.criticality} onChange={event => updateInitiative(item.id, { criticality: event.target.value as InitiativeCriticality })} className={inputClass}>{Object.entries(criticalityMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
                        <label><span className={labelClass}>Dono principal</span><input value={item.owner} onChange={event => updateInitiative(item.id, { owner: event.target.value })} className={inputClass} /></label>
                        <label><span className={labelClass}>Pessoas envolvidas</span><input value={item.involvedPeople.join(', ')} onChange={event => updateInitiative(item.id, { involvedPeople: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} placeholder="Nomes separados por vírgula" className={inputClass} /></label>
                        <label><span className={labelClass}>Produto / área</span><input value={item.area} onChange={event => updateInitiative(item.id, { area: event.target.value })} className={inputClass} /></label>
                        <label><span className={labelClass}>Data de início</span><input type="date" value={item.startDate} onChange={event => updateInitiative(item.id, { startDate: event.target.value })} className={inputClass} /></label>
                        <label><span className={labelClass}>Próximo marco</span><input value={item.nextMilestone} onChange={event => updateInitiative(item.id, { nextMilestone: event.target.value })} placeholder="Entrega ou validação seguinte" className={inputClass} /></label>
                        <label><span className={labelClass}>Prazo alvo</span><input type="date" value={item.targetDate} onChange={event => updateInitiative(item.id, { targetDate: event.target.value })} className={inputClass} /></label>
                        <label className="md:col-span-2"><span className={labelClass}>Próximo passo objetivo</span><textarea rows={2} value={item.nextStep} onChange={event => updateInitiative(item.id, { nextStep: event.target.value })} className={inputClass} /></label>
                        <label className="md:col-span-2"><span className={labelClass}>Risco atual</span><textarea rows={2} value={item.currentRisk} onChange={event => updateInitiative(item.id, { currentRisk: event.target.value })} className={inputClass} /></label>
                        <label className="md:col-span-2"><span className={labelClass}>Decisão necessária</span><textarea rows={2} value={item.decisionNeeded} onChange={event => updateInitiative(item.id, { decisionNeeded: event.target.value })} className={inputClass} /></label>
                        <label className="md:col-span-2"><span className={labelClass}>Evidência de resultado esperada</span><textarea rows={2} value={item.expectedEvidence} onChange={event => updateInitiative(item.id, { expectedEvidence: event.target.value })} className={inputClass} /></label>
                        <label className="md:col-span-2"><span className={labelClass}>Link com FCA ou retro de origem</span><div className="relative"><Link2 className="absolute left-3 top-4 text-zinc-400" size={14} /><input type="url" value={item.sourceLink} onChange={event => updateInitiative(item.id, { sourceLink: event.target.value })} placeholder="https://..." className={`${inputClass} pl-9`} /></div></label>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400"><CalendarDays size={13} /> Atualizada em {new Date(item.updatedAt).toLocaleDateString('pt-BR')}</p>
                        <button onClick={() => removeInitiative(item.id)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50"><Trash2 size={13} /> Excluir</button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
