'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ChevronDown,
  Edit3,
  Filter,
  Flag,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  UserRoundX,
  X,
} from 'lucide-react'
import {
  createEmptyDecision,
  decisionStatuses,
  loadDecisions,
  saveDecisions,
  type LeadershipDecision,
} from '@/lib/decisions'
import { loadFronts, type ManagementFront } from '@/lib/fronts'

type Filters = {
  status: string
  hqa: string
  frontId: string
}

const emptyFilters: Filters = { status: '', hqa: '', frontId: '' }
const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]'

const statusTone: Record<LeadershipDecision['status'], string> = {
  Pendente: 'bg-amber-50 text-amber-700',
  'Em alinhamento': 'bg-blue-50 text-blue-700',
  Decidida: 'bg-emerald-50 text-emerald-700',
  Escalada: 'bg-rose-50 text-rose-700',
}

function toList(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function formatDate(value: string) {
  if (!value) return 'Sem checkpoint'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function isOverdue(value: string) {
  return Boolean(value) && new Date(`${value}T23:59:59`).getTime() < Date.now()
}

function DecisionModal({
  decision,
  fronts,
  onClose,
  onSave,
}: {
  decision: LeadershipDecision
  fronts: ManagementFront[]
  onClose: () => void
  onSave: (decision: LeadershipDecision) => void
}) {
  const [draft, setDraft] = useState(decision)
  const [error, setError] = useState('')
  const set = <K extends keyof LeadershipDecision>(key: K, value: LeadershipDecision[K]) =>
    setDraft(current => ({ ...current, [key]: value }))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <form
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#fbfaf9] shadow-2xl"
        onSubmit={event => {
          event.preventDefault()
          if (!draft.title.trim() || !draft.context.trim() || !draft.owner.trim()) {
            setError('Preencha decisão, contexto e dono.')
            return
          }
          if (!draft.nextCheckpoint && !draft.noCheckpointReason.trim()) {
            setError('Defina um próximo checkpoint ou registre uma justificativa.')
            return
          }
          onSave({
            ...draft,
            title: draft.title.trim(),
            context: draft.context.trim(),
            owner: draft.owner.trim(),
            updatedAt: new Date().toISOString(),
          })
        }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--retro-wine)]">Governança de decisão</p>
            <h2 id="decision-modal-title" className="mt-1 text-xl font-black text-zinc-950">
              {decision.title === 'Nova decisão' ? 'Criar nova decisão' : 'Editar decisão'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
              Decisão
              <input required value={draft.title} onChange={event => set('title', event.target.value)} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
              Contexto
              <textarea
                required
                rows={3}
                value={draft.context}
                onChange={event => set('context', event.target.value)}
                placeholder="Qual problema, objetivo ou cenário embasa esta decisão?"
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Dono
              <input required value={draft.owner} onChange={event => set('owner', event.target.value)} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Status
              <select
                value={draft.status}
                onChange={event => set('status', event.target.value as LeadershipDecision['status'])}
                className={fieldClass}
              >
                {decisionStatuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
              Frente relacionada
              <span className="relative block">
                <select
                  value={draft.frontIds[0] || ''}
                  onChange={event => set('frontIds', event.target.value ? [event.target.value] : [])}
                  className={`${fieldClass} appearance-none pr-10`}
                >
                  <option value="">Nenhuma</option>
                  {fronts.map(front => (
                    <option key={front.id} value={front.id}>
                      {front.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute bottom-3.5 right-4 text-zinc-400" />
              </span>
            </label>
          </div>

          <details className="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-black text-zinc-700">Ajustes de governança</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
                Trade-off
                <textarea
                  rows={2}
                  value={draft.tradeOff}
                  onChange={event => set('tradeOff', event.target.value)}
                  placeholder="O que ganha, o que cede e por quê?"
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
                Stakeholders
                <input
                  value={draft.stakeholders.join(', ')}
                  onChange={event => set('stakeholders', toList(event.target.value))}
                  placeholder="Separe por vírgula"
                  className={fieldClass}
                />
              </label>
              <div className="rounded-2xl border border-zinc-200 bg-[#fcfbfa] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={draft.hqa}
                    onChange={event => set('hqa', event.target.checked)}
                    className="mt-1 accent-[var(--retro-wine)]"
                  />
                  <span>
                    <strong className="flex items-center gap-1.5 text-sm text-zinc-900">
                      HQA alinhado <CircleHelp size={14} aria-label="High Quality Agreement" />
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">Houve concordância real sobre decisão, impactos e compromissos.</span>
                  </span>
                </label>
                <label className="mt-4 grid gap-1.5 text-xs font-bold text-zinc-500">
                  Observação do HQA
                  <textarea rows={2} value={draft.hqaNote} onChange={event => set('hqaNote', event.target.value)} className={fieldClass} />
                </label>
              </div>
              <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-[#fcfbfa] p-4">
                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Próximo checkpoint
                  <input
                    type="date"
                    value={draft.nextCheckpoint}
                    onChange={event => set('nextCheckpoint', event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Justificativa para não ter checkpoint
                  <textarea
                    rows={2}
                    value={draft.noCheckpointReason}
                    onChange={event => set('noCheckpointReason', event.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
          </details>

          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)]">
            Salvar decisão
          </button>
        </div>
      </form>
    </div>
  )
}

export default function DecisoesPage() {
  const [decisions, setDecisions] = useState<LeadershipDecision[]>(loadDecisions)
  const [fronts] = useState<ManagementFront[]>(loadFronts)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [editing, setEditing] = useState<LeadershipDecision | null>(null)
  const [feedback, setFeedback] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return decisions.filter(decision => {
      const searchable = [decision.title, decision.context, decision.owner, decision.tradeOff, ...decision.stakeholders]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
      return (
        (!term || searchable.includes(term)) &&
        (!filters.status || decision.status === filters.status) &&
        (!filters.hqa || String(decision.hqa) === filters.hqa) &&
        (!filters.frontId || decision.frontIds.includes(filters.frontId))
      )
    })
  }, [decisions, filters, search])

  const frontById = useMemo(() => new Map(fronts.map(front => [front.id, front])), [fronts])
  const attention = useMemo(() => ({
    noAlignment: decisions.filter(decision => !decision.hqa && decision.status !== 'Decidida'),
    overdue: decisions.filter(decision => isOverdue(decision.nextCheckpoint) && decision.status !== 'Decidida'),
    noTradeOff: decisions.filter(decision => !decision.tradeOff.trim()),
    noOwner: decisions.filter(decision => !decision.owner.trim()),
  }), [decisions])

  const save = (decision: LeadershipDecision) => {
    const next = decisions.some(item => item.id === decision.id)
      ? decisions.map(item => item.id === decision.id ? decision : item)
      : [decision, ...decisions]
    setDecisions(next)
    saveDecisions(next)
    setEditing(null)
    setFeedback('Decisão salva.')
    window.setTimeout(() => setFeedback(''), 2200)
  }

  const applyAlertFilter = (kind: keyof typeof attention) => {
    setSearch('')
    setFilters(emptyFilters)
    if (kind === 'noAlignment') setFilters({ ...emptyFilters, hqa: 'false' })
    if (kind === 'overdue') setSearch(attention.overdue[0]?.title ?? '')
    if (kind === 'noTradeOff') setSearch(attention.noTradeOff[0]?.title ?? '')
    if (kind === 'noOwner') setSearch(attention.noOwner[0]?.title ?? '')
  }

  const kpis = [
    { label: 'Pendentes', value: decisions.filter(item => item.status === 'Pendente' || item.status === 'Em alinhamento').length, detail: 'Aguardando definição', icon: CalendarClock, tone: 'bg-amber-50 text-amber-700' },
    { label: 'HQA alinhado', value: decisions.filter(item => item.hqa).length, detail: 'Acordos validados', icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Sem checkpoint', value: decisions.filter(item => !item.nextCheckpoint && !item.noCheckpointReason).length, detail: 'Sem data ou justificativa', icon: AlertTriangle, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Escaladas', value: decisions.filter(item => item.status === 'Escalada').length, detail: 'Enviadas para liderança', icon: Flag, tone: 'bg-rose-50 text-rose-700' },
  ]

  const alerts = [
    { key: 'noAlignment' as const, label: 'Sem alinhamento final', detail: 'HQA ainda não confirmado', icon: Scale, tone: 'bg-amber-50 text-amber-700' },
    { key: 'overdue' as const, label: 'Checkpoint vencido', detail: 'Revisão de decisão em atraso', icon: CalendarClock, tone: 'bg-rose-50 text-rose-700' },
    { key: 'noTradeOff' as const, label: 'Trade-off não registrado', detail: 'Escolha sem impacto explícito', icon: AlertTriangle, tone: 'bg-violet-50 text-violet-700' },
    { key: 'noOwner' as const, label: 'Decisão sem dono', detail: 'Responsável ainda indefinido', icon: UserRoundX, tone: 'bg-blue-50 text-blue-700' },
  ]

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-7 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Decisões</h1>
            <p className="mt-2 text-sm text-zinc-500">Acordos, trade-offs, donos e próximos checkpoints.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-72 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm">
              <Search size={17} className="text-zinc-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar decisões, donos, contextos..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </label>
            <button onClick={() => setShowFilters(value => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm">
              <Filter size={16} /> Filtros
            </button>
            <button onClick={() => setEditing(createEmptyDecision())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)]">
              <Plus size={17} /> Nova decisão
            </button>
          </div>
        </header>

        {showFilters && (
          <section className={`${cardClass} mt-5 grid gap-4 p-4 sm:grid-cols-3`}>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Status
              <select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))} className={fieldClass}>
                <option value="">Todos</option>
                {decisionStatuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              HQA
              <select value={filters.hqa} onChange={event => setFilters(current => ({ ...current, hqa: event.target.value }))} className={fieldClass}>
                <option value="">Todos</option><option value="true">Alinhado</option><option value="false">Não alinhado</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Frente relacionada
              <select value={filters.frontId} onChange={event => setFilters(current => ({ ...current, frontId: event.target.value }))} className={fieldClass}>
                <option value="">Todas</option>
                {fronts.map(front => <option key={front.id} value={front.id}>{front.name}</option>)}
              </select>
            </label>
          </section>
        )}
        {feedback && <p role="status" className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{feedback}</p>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, detail, icon: Icon, tone }) => (
            <article key={label} className={`${cardClass} flex items-center gap-4 p-5`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={22} /></span>
              <div><p className="text-sm font-bold text-zinc-500">{label}</p><p className="text-3xl font-black text-zinc-950">{value}</p><p className="text-xs text-zinc-400">{detail}</p></div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <article className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-4 border-b border-zinc-100 p-5 sm:px-6">
              <div><h2 className="text-lg font-black">Registro de decisões</h2><p className="mt-1 text-xs text-zinc-500">{filtered.length} decisões visíveis</p></div>
              {(search || Object.values(filters).some(Boolean)) && (
                <button onClick={() => { setSearch(''); setFilters(emptyFilters) }} className="text-xs font-black text-[var(--retro-wine)]">Limpar filtros</button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="bg-[#fcfaf9] text-xs font-bold text-zinc-500">
                  <tr>{['Decisão', 'Contexto', 'Dono', 'Stakeholders', 'HQA', 'Próximo checkpoint', 'Status', ''].map(label => <th key={label} className="px-5 py-3.5">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map(decision => (
                    <tr key={decision.id} className="align-top hover:bg-[#fcfaf9]">
                      <td className="max-w-52 px-5 py-4"><p className="font-black text-zinc-900">{decision.title}</p><p className="mt-1 line-clamp-1 text-xs text-[var(--retro-wine)]">{decision.frontIds.map(id => frontById.get(id)?.name).filter(Boolean).join(' · ') || 'Sem frente vinculada'}</p></td>
                      <td className="max-w-60 px-5 py-4"><p className="line-clamp-2 text-xs leading-5 text-zinc-600">{decision.context}</p>{decision.tradeOff && <p className="mt-1 line-clamp-1 text-xs text-zinc-400">Trade-off: {decision.tradeOff}</p>}</td>
                      <td className="px-5 py-4 font-bold text-zinc-700">{decision.owner || <span className="text-rose-600">Sem dono</span>}</td>
                      <td className="max-w-48 px-5 py-4"><div className="flex flex-wrap gap-1">{decision.stakeholders.slice(0, 3).map(item => <span key={item} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{item}</span>)}</div></td>
                      <td className="px-5 py-4">
                        <span title="HQA significa High Quality Agreement: alinhamento real sobre decisão, impactos e compromissos." className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${decision.hqa ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {decision.hqa ? <CheckCircle2 size={13} /> : <CircleHelp size={13} />}{decision.hqa ? 'Alinhado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-5 py-4"><p className={`font-bold ${isOverdue(decision.nextCheckpoint) ? 'text-rose-600' : 'text-zinc-700'}`}>{formatDate(decision.nextCheckpoint)}</p>{!decision.nextCheckpoint && decision.noCheckpointReason && <p className="mt-1 max-w-40 text-xs text-zinc-400">{decision.noCheckpointReason}</p>}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[decision.status]}`}>{decision.status}</span></td>
                      <td className="px-5 py-4"><button onClick={() => setEditing(decision)} aria-label={`Editar ${decision.title}`} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-[var(--retro-wine)]"><Edit3 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="p-8 text-center text-sm text-zinc-500">
                  <p>Nenhuma decisão encontrada com estes filtros.</p>
                  <button onClick={() => { setSearch(''); setFilters(emptyFilters) }} className="mt-3 font-black text-[var(--retro-wine)]">Limpar filtros</button>
                </div>
              )}
            </div>
          </article>

          <aside className={`${cardClass} h-fit p-5`}>
            <div className="flex items-center gap-2"><AlertTriangle size={19} className="text-[var(--retro-wine)]" /><h2 className="text-lg font-black">Decisões que pedem atenção</h2></div>
            <div className="mt-4 grid gap-3">
              {alerts.map(({ key, label, detail, icon: Icon, tone }) => (
                <button key={key} onClick={() => applyAlertFilter(key)} className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-3 text-left transition hover:border-[rgba(135,0,47,0.2)] hover:bg-[#fcfaf9]">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><span className="text-xs text-zinc-500">{attention[key].length} · {detail}</span></span>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <section className={`${cardClass} mt-6 p-5 sm:p-6`}>
          <div className="flex items-center gap-2"><ShieldCheck size={20} className="text-[var(--retro-wine)]" /><h2 className="text-lg font-black">Boas práticas de registro</h2></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Contexto claro', 'Registre cenário, objetivo e informação que embasam a escolha.', CircleHelp],
              ['Trade-off explícito', 'Documente alternativas, ganhos, perdas e por que esta escolha venceu.', Scale],
              ['Dono definido', 'Atribua quem responde pela decisão e pelo próximo passo.', UserRoundX],
              ['Próximo checkpoint', 'Determine quando revisar, validar ou justificar a ausência de revisão.', CalendarClock],
            ].map(([title, text, Icon]) => (
              <div key={String(title)} className="flex gap-3 border-zinc-100 xl:border-r xl:pr-4 xl:last:border-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(135,0,47,0.07)] text-[var(--retro-wine)]"><Icon size={18} /></span>
                <div><h3 className="text-sm font-black">{String(title)}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{String(text)}</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {editing && <DecisionModal decision={editing} fronts={fronts} onClose={() => setEditing(null)} onSave={save} />}
    </main>
  )
}
