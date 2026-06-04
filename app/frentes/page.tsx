'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Edit3,
  Filter,
  Flag,
  FolderOpen,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  UserRoundX,
  X,
} from 'lucide-react'
import {
  createEmptyFront,
  frontOrigins,
  frontStatuses,
  frontTemperatures,
  frontTypes,
  loadFronts,
  managerInterventions,
  saveFronts,
  type ManagementFront,
} from '@/lib/fronts'

type Filters = {
  type: string
  temperature: string
  owner: string
  origin: string
  intervention: string
  status: string
}

const emptyFilters: Filters = {
  type: '',
  temperature: '',
  owner: '',
  origin: '',
  intervention: '',
  status: '',
}

const temperatureTone: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  Atenção: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  Crítica: 'bg-rose-50 text-rose-700 ring-rose-600/10',
}

const statusTone: Record<ManagementFront['status'], string> = {
  'Não iniciada': 'bg-zinc-100 text-zinc-600',
  'Em andamento': 'bg-blue-50 text-blue-700',
  Bloqueada: 'bg-rose-50 text-rose-700',
  Concluída: 'bg-emerald-50 text-emerald-700',
  Arquivada: 'bg-zinc-100 text-zinc-500',
}

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]'

function formatDate(value: string) {
  if (!value) return 'Sem checkpoint'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function daysSince(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
}

function isWithinNextWeek(value: string) {
  if (!value) return false
  const checkpoint = new Date(`${value}T23:59:59`).getTime()
  const now = Date.now()
  return checkpoint >= now && checkpoint <= now + 7 * 86_400_000
}

function toList(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
      {label}
      <select value={value} onChange={event => onChange(event.target.value)} className={fieldClass}>
        <option value="">Todos</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function FrontModal({
  front,
  onClose,
  onSave,
}: {
  front: ManagementFront
  onClose: () => void
  onSave: (front: ManagementFront) => void
}) {
  const [draft, setDraft] = useState(front)
  const set = <K extends keyof ManagementFront>(key: K, value: ManagementFront[K]) =>
    setDraft(current => ({ ...current, [key]: value }))

  const listField = (
    label: string,
    key: 'involvedPeople' | 'stakeholders' | 'risks' | 'relatedDecisions' | 'relatedTasks' | 'evidence',
    placeholder: string,
  ) => (
    <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
      {label}
      <input
        value={draft[key].join(', ')}
        onChange={event => set(key, toList(event.target.value))}
        placeholder={placeholder}
        className={fieldClass}
      />
    </label>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="front-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <form
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#fbfaf9] shadow-2xl"
        onSubmit={event => {
          event.preventDefault()
          if (!draft.name.trim()) return
          onSave({ ...draft, name: draft.name.trim(), updatedAt: new Date().toISOString() })
        }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--retro-wine)]">Frente de gestão</p>
            <h2 id="front-modal-title" className="mt-1 text-xl font-black text-zinc-950">
              {front.name === 'Nova frente' ? 'Criar nova frente' : 'Editar frente'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
              Nome
              <input required value={draft.name} onChange={event => set('name', event.target.value)} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500 md:col-span-2">
              Descrição curta
              <textarea
                value={draft.description}
                onChange={event => set('description', event.target.value)}
                rows={3}
                placeholder="Explique em uma frase o que esta frente está tentando resolver."
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Dono
              <input required={draft.status === 'Em andamento' || draft.status === 'Bloqueada'} value={draft.owner} onChange={event => set('owner', event.target.value)} className={fieldClass} />
            </label>
            <SelectField label="Status" value={draft.status} options={frontStatuses} onChange={value => set('status', value as ManagementFront['status'])} />
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Próximo checkpoint
              <input
                required={draft.status === 'Em andamento' || draft.status === 'Bloqueada'}
                type="date"
                value={draft.nextCheckpoint}
                onChange={event => set('nextCheckpoint', event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Próximo passo
              <input required={draft.status === 'Em andamento' || draft.status === 'Bloqueada'} value={draft.nextStep} onChange={event => set('nextStep', event.target.value)} className={fieldClass} />
            </label>
          </div>

          <details className="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-black text-zinc-700">Campos avançados</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SelectField label="Tipo" value={draft.type} options={frontTypes} onChange={value => set('type', value as ManagementFront['type'])} />
              <SelectField
                label="Temperatura"
                value={draft.temperature}
                options={frontTemperatures}
                onChange={value => set('temperature', value as ManagementFront['temperature'])}
              />
              <SelectField label="Origem" value={draft.origin} options={frontOrigins} onChange={value => set('origin', value as ManagementFront['origin'])} />
              <SelectField
                label="Intervenção da Joana"
                value={draft.managerIntervention}
                options={managerInterventions}
                onChange={value => set('managerIntervention', value as ManagementFront['managerIntervention'])}
              />
            </div>
          </details>

          <details className="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-black text-zinc-700">Relações, riscos e evidências</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {listField('Pessoas envolvidas', 'involvedPeople', 'Separe nomes por vírgula')}
              {listField('Stakeholders', 'stakeholders', 'Separe stakeholders por vírgula')}
              {listField('Riscos', 'risks', 'Separe riscos por vírgula')}
              {listField('Decisões relacionadas', 'relatedDecisions', 'Separe decisões por vírgula')}
              {listField('Tasks relacionadas', 'relatedTasks', 'Separe tasks por vírgula')}
              {listField('Evidências', 'evidence', 'Separe evidências por vírgula')}
            </div>
          </details>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)]">
            Salvar frente
          </button>
        </div>
      </form>
    </div>
  )
}

export default function FrentesPage() {
  const [fronts, setFronts] = useState<ManagementFront[]>(loadFronts)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(true)
  const [editing, setEditing] = useState<ManagementFront | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [activeAlert, setActiveAlert] = useState('')
  const [feedback, setFeedback] = useState('')

  const activeFronts = useMemo(() => fronts.filter(front => front.status !== 'Arquivada' && front.status !== 'Concluída'), [fronts])
  const owners = useMemo(() => [...new Set(fronts.map(front => front.owner).filter(Boolean))].sort(), [fronts])
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filteredFronts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return fronts.filter(front => {
      const searchable = [
        front.name,
        front.description,
        front.owner,
        front.type,
        front.origin,
        front.nextStep,
        ...front.involvedPeople,
        ...front.stakeholders,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return (
        (!term || searchable.includes(term)) &&
        (!filters.type || front.type === filters.type) &&
        (!filters.temperature || front.temperature === filters.temperature) &&
        (!filters.owner || front.owner === filters.owner) &&
        (!filters.origin || front.origin === filters.origin) &&
        (!filters.intervention || front.managerIntervention === filters.intervention) &&
        (!filters.status || front.status === filters.status) &&
        (!activeAlert || (
          (activeAlert === 'Sem update há 7 dias' && daysSince(front.updatedAt) >= 7) ||
          (activeAlert === 'Conflito de prioridades' && front.temperature !== 'Saudável') ||
          (activeAlert === 'Decisão sem dono' && !front.owner && front.relatedDecisions.length > 0) ||
          (activeAlert === 'Sem próximo checkpoint' && !front.nextCheckpoint)
        ))
      )
    })
  }, [activeAlert, filters, fronts, search])

  const ownerPriorityConflicts = useMemo(() => {
    const counts = new Map<string, number>()
    activeFronts
      .filter(front => front.owner && front.temperature !== 'Saudável')
      .forEach(front => counts.set(front.owner, (counts.get(front.owner) ?? 0) + 1))
    return [...counts.values()].filter(count => count > 1).length
  }, [activeFronts])

  const alerts = [
    {
      label: 'Sem update há 7 dias',
      detail: 'Frentes sem atualização recente',
      count: activeFronts.filter(front => daysSince(front.updatedAt) >= 7).length,
      icon: AlertTriangle,
      tone: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'Conflito de prioridades',
      detail: 'Donos com múltiplas frentes em atenção',
      count: ownerPriorityConflicts,
      icon: Flag,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Decisão sem dono',
      detail: 'Frentes com decisão relacionada e sem dono',
      count: activeFronts.filter(front => !front.owner && front.relatedDecisions.length > 0).length,
      icon: UserRoundX,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Sem próximo checkpoint',
      detail: 'Frentes ativas sem data definida',
      count: activeFronts.filter(front => !front.nextCheckpoint).length,
      icon: CalendarClock,
      tone: 'bg-blue-50 text-blue-700',
    },
  ]

  const persist = (next: ManagementFront[]) => {
    setFronts(next)
    saveFronts(next)
  }

  const save = (front: ManagementFront) => {
    const exists = fronts.some(item => item.id === front.id)
    persist(exists ? fronts.map(item => (item.id === front.id ? front : item)) : [front, ...fronts])
    setEditing(null)
    setFeedback(exists ? 'Frente atualizada.' : 'Frente criada.')
    window.setTimeout(() => setFeedback(''), 2200)
  }

  const changeArchivedState = (front: ManagementFront) => {
    const status = front.status === 'Arquivada' ? 'Em andamento' : 'Arquivada'
    persist(fronts.map(item => (item.id === front.id ? { ...item, status, updatedAt: new Date().toISOString() } : item)))
    setOpenMenu(null)
    setFeedback(status === 'Arquivada' ? 'Frente arquivada.' : 'Frente reaberta.')
    window.setTimeout(() => setFeedback(''), 2200)
  }

  const filterForAlert = (label: string) => {
    setSearch('')
    setFilters(emptyFilters)
    setActiveAlert(label)
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--retro-bg)] px-4 py-6 text-[var(--retro-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Frentes de Gestão</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Acompanhe projetos, melhorias, temas sensíveis e frentes de desenvolvimento em um só lugar.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <label className="relative min-w-0 flex-1 xl:w-80">
              <span className="sr-only">Buscar frentes</span>
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar frentes, donos, origens..."
                className={`${fieldClass} h-11 pl-10`}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowFilters(value => !value)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700"
            >
              <Filter size={16} /> Filtros
              {activeFilterCount > 0 && <span className="rounded-full bg-[var(--retro-wine)] px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span>}
            </button>
            <button
              type="button"
              onClick={() => setEditing(createEmptyFront())}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"
            >
              <Plus size={17} /> Nova frente
            </button>
          </div>
        </header>

        <section aria-label="Indicadores das frentes" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Frentes ativas', value: activeFronts.length, note: 'Em acompanhamento', icon: FolderOpen, tone: 'bg-emerald-50 text-emerald-700' },
            {
              label: 'Críticas',
              value: activeFronts.filter(front => front.temperature === 'Crítica').length,
              note: 'Pedem intervenção',
              icon: CircleAlert,
              tone: 'bg-rose-50 text-rose-700',
            },
            {
              label: 'Sem dono claro',
              value: activeFronts.filter(front => !front.owner).length,
              note: 'Atribuir responsável',
              icon: UserRoundX,
              tone: 'bg-amber-50 text-amber-700',
            },
            {
              label: 'Checkpoints esta semana',
              value: activeFronts.filter(front => isWithinNextWeek(front.nextCheckpoint)).length,
              note: 'Próximos 7 dias',
              icon: CalendarClock,
              tone: 'bg-blue-50 text-blue-700',
            },
          ].map(item => (
            <article key={item.label} className={`${cardClass} flex items-center gap-4 p-4 sm:p-5`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${item.tone}`}>
                <item.icon size={21} />
              </span>
              <div>
                <p className="text-xs font-bold text-zinc-500">{item.label}</p>
                <p className="mt-0.5 text-2xl font-black text-zinc-950">{item.value}</p>
                <p className="text-xs text-zinc-400">{item.note}</p>
              </div>
            </article>
          ))}
        </section>

        {showFilters && (
          <section aria-label="Filtros da carteira" className={`${cardClass} mt-5 p-4`}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <SelectField label="Tipo" value={filters.type} options={frontTypes} onChange={value => setFilters(current => ({ ...current, type: value }))} />
              <SelectField
                label="Temperatura"
                value={filters.temperature}
                options={frontTemperatures}
                onChange={value => setFilters(current => ({ ...current, temperature: value }))}
              />
              <SelectField label="Dono" value={filters.owner} options={owners} onChange={value => setFilters(current => ({ ...current, owner: value }))} />
              <SelectField label="Origem" value={filters.origin} options={frontOrigins} onChange={value => setFilters(current => ({ ...current, origin: value }))} />
              <SelectField
                label="Intervenção da Joana"
                value={filters.intervention}
                options={managerInterventions}
                onChange={value => setFilters(current => ({ ...current, intervention: value }))}
              />
              <SelectField label="Status" value={filters.status} options={frontStatuses} onChange={value => setFilters(current => ({ ...current, status: value }))} />
            </div>
            {activeFilterCount > 0 && (
              <button type="button" onClick={() => setFilters(emptyFilters)} className="mt-3 text-xs font-black text-[var(--retro-wine)]">
                Limpar filtros
              </button>
            )}
          </section>
        )}

        {(activeAlert || feedback) && (
          <div className="mt-4 flex flex-wrap items-center gap-2" role="status">
            {activeAlert && (
              <button type="button" onClick={() => setActiveAlert('')} className="rounded-full bg-[rgba(135,0,47,0.08)] px-3 py-1.5 text-xs font-black text-[var(--retro-wine)]">
                Alerta: {activeAlert} · limpar
              </button>
            )}
            {feedback && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">{feedback}</span>}
          </div>
        )}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className={`${cardClass} min-w-0 overflow-hidden`}>
            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-black text-zinc-950">Carteira de frentes</h2>
                <p className="mt-1 text-xs text-zinc-400">{filteredFronts.length} frentes nesta visão</p>
              </div>
              <span className="hidden text-xs font-bold text-zinc-400 sm:block">Atualizadas em tempo real</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
                <thead className="border-y border-zinc-100 bg-[#fcfbfa] text-zinc-500">
                  <tr>
                    {['Frente', 'Tipo', 'Dono', 'Temperatura', 'Status', 'Próximo checkpoint', 'Origem', 'Intervenção da Joana', ''].map(label => (
                      <th key={label} className="px-4 py-3 font-bold first:pl-6 last:pr-6">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredFronts.map(front => (
                    <tr key={front.id} className="transition hover:bg-[#fcfaf9]">
                      <td className="max-w-[230px] py-4 pl-6 pr-4">
                        <button type="button" onClick={() => setEditing(front)} className="text-left">
                          <span className="block font-black text-zinc-900">{front.name}</span>
                          <span className="mt-1 block truncate text-zinc-400">{front.description || front.nextStep || 'Sem descrição'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">{front.type}</span>
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{front.owner || <span className="text-rose-600">Sem dono</span>}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 font-bold ring-1 ring-inset ${temperatureTone[front.temperature]}`}>{front.temperature}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 font-bold ${statusTone[front.status]}`}>{front.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={front.nextCheckpoint ? 'font-bold text-zinc-700' : 'font-bold text-rose-600'}>{formatDate(front.nextCheckpoint)}</span>
                      </td>
                      <td className="px-4 py-4 text-zinc-600">{front.origin}</td>
                      <td className="px-4 py-4">
                        <span className={front.managerIntervention === 'Nenhuma' ? 'text-zinc-400' : 'font-bold text-[var(--retro-wine)]'}>
                          {front.managerIntervention}
                        </span>
                      </td>
                      <td className="relative py-4 pl-2 pr-6 text-right">
                        <button
                          type="button"
                          aria-label={`Ações para ${front.name}`}
                          onClick={() => setOpenMenu(current => (current === front.id ? null : front.id))}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <MoreHorizontal size={17} />
                        </button>
                        {openMenu === front.id && (
                          <div className="absolute right-5 top-11 z-20 w-40 rounded-xl border border-zinc-100 bg-white p-1.5 text-left shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(front)
                                setOpenMenu(null)
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-bold text-zinc-600 hover:bg-zinc-50"
                            >
                              <Edit3 size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => changeArchivedState(front)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-bold text-zinc-600 hover:bg-zinc-50"
                            >
                              {front.status === 'Arquivada' ? <RotateCcw size={14} /> : <Archive size={14} />}
                              {front.status === 'Arquivada' ? 'Reabrir' : 'Arquivar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredFronts.length === 0 && (
              <div className="grid place-items-center px-6 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                  <Search size={20} />
                </span>
                <p className="mt-3 font-black text-zinc-800">Nenhuma frente encontrada</p>
                <p className="mt-1 text-sm text-zinc-400">Ajuste a busca ou limpe os filtros para ampliar a visão.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilters(emptyFilters)
                    setActiveAlert('')
                  }}
                  className="mt-4 text-sm font-black text-[var(--retro-wine)]"
                >
                  Limpar busca e filtros
                </button>
              </div>
            )}
          </section>

          <aside className={`${cardClass} h-fit p-5`}>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(135,0,47,0.08)] text-[var(--retro-wine)]">
                <CircleAlert size={17} />
              </span>
              <div>
                <h2 className="font-black text-zinc-950">Onde a liderança precisa atuar</h2>
                <p className="mt-0.5 text-xs text-zinc-400">Sinais para revisar agora</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5">
              {alerts.map(alert => (
                <button
                  type="button"
                  key={alert.label}
                  onClick={() => filterForAlert(alert.label)}
                  className="group flex items-center gap-3 rounded-2xl border border-zinc-100 p-3 text-left transition hover:border-[rgba(135,0,47,0.18)] hover:bg-[#fcfaf9]"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${alert.tone}`}>
                    <alert.icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-black text-zinc-950">{alert.count}</span>
                    <span className="block text-xs font-black text-zinc-700">{alert.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-zinc-400">{alert.detail}</span>
                  </span>
                  <ChevronRight size={15} className="text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--retro-wine)]" />
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {editing && <FrontModal key={editing.id} front={editing} onClose={() => setEditing(null)} onSave={save} />}
    </main>
  )
}
