'use client'

import { useEffect, useMemo, useState } from 'react'
import { Select } from '@/components/ui/select'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Filter,
  Flag,
  ListChecks,
  Plus,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { loadPeople, type LeadershipPerson } from '@/lib/people'
import { PageHeader, type PageStat } from '@/components/ui/page-header'
import {
  createEmptyRitual,
  loadMonthlyClose,
  loadRituals,
  ritualCadences,
  ritualTypes,
  saveMonthlyClose,
  saveRituals,
  type LeadershipRitual,
  type MonthlyClose,
  type RitualType,
} from '@/lib/rituals'

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'
const outputOptions = ['Task', 'Decisão', 'Checkpoint', 'Atualização'] as const

const typeTone: Record<RitualType, string> = {
  'Checkpoint de frente': 'bg-blue-50 text-blue-700',
  '1:1': 'bg-amber-50 text-amber-700',
  'Retro mensal': 'bg-rose-50 text-rose-700',
  'Sync com liderança': 'bg-violet-50 text-violet-700',
  'Revisão de decisões': 'bg-cyan-50 text-cyan-700',
  'Fechamento mensal': 'bg-emerald-50 text-emerald-700',
}

const essentialRituals = [
  { type: 'Retro mensal', cadence: 'Mensal', purpose: 'Ler sinais e definir ações.' },
  { type: '1:1', cadence: 'Quinzenal', purpose: 'Conectar desenvolvimento e evidências.' },
  { type: 'Checkpoint de frente', cadence: 'Semanal', purpose: 'Desbloquear e confirmar passos.' },
  { type: 'Revisão de decisões', cadence: 'Semanal', purpose: 'Confirmar HQA, donos e checkpoints.' },
  { type: 'Fechamento mensal', cadence: 'Mensal', purpose: 'Consolidar aprendizados e preparar o ciclo.' },
] satisfies { type: RitualType; cadence: string; purpose: string }[]

function formatDate(value: string) {
  if (!value) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function isWithinNextWeek(value: string) {
  if (!value) return false
  const date = new Date(`${value}T23:59:59`).getTime()
  const now = Date.now()
  return date >= now && date <= now + 7 * 86_400_000
}

function relationLabel(ritual: LeadershipRitual, fronts: ManagementFront[], people: LeadershipPerson[]) {
  const front = fronts.find(item => item.id === ritual.frontId)
  const person = people.find(item => item.id === ritual.personId)
  return front?.name || person?.name || 'Cadência geral'
}

function RitualModal({
  fronts,
  people,
  onClose,
  onSave,
}: {
  fronts: ManagementFront[]
  people: LeadershipPerson[]
  onClose: () => void
  onSave: (ritual: LeadershipRitual) => void
}) {
  const [draft, setDraft] = useState<LeadershipRitual>(createEmptyRitual)
  const [showDetails, setShowDetails] = useState(false)
  const set = <K extends keyof LeadershipRitual>(key: K, value: LeadershipRitual[K]) =>
    setDraft(current => ({ ...current, [key]: value }))

  const toggleOutput = (output: string) =>
    set(
      'outputs',
      draft.outputs.includes(output) ? draft.outputs.filter(item => item !== output) : [...draft.outputs, output],
    )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ritual-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#fbfaf9] shadow-2xl"
        onSubmit={event => {
          event.preventDefault()
          if (!draft.name.trim() || !draft.nextDate || !draft.purpose.trim()) return
          onSave({ ...draft, name: draft.name.trim(), purpose: draft.purpose.trim(), preparation: draft.preparation.trim() })
        }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--retro-wine)]">Cadência de gestão</p>
            <h2 id="ritual-modal-title" className="mt-1 text-xl font-black text-zinc-950">
              Novo ritual
            </h2>
            <p className="mt-1 text-xs text-zinc-400">Defina propósito, recorrência e o que pode sair.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Nome do ritual *
            <input
              required
              value={draft.name}
              onChange={event => set('name', event.target.value)}
              placeholder="Ex.: Checkpoint semanal de onboarding"
              className={fieldClass}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Tipo *
              <Select value={draft.type} onChange={value => set('type', value as RitualType)} options={[...ritualTypes]} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Cadência *
              <Select
                value={draft.cadence}
                onChange={value => set('cadence', value as LeadershipRitual['cadence'])}
                options={ritualCadences.filter(cadence => cadence !== 'Pontual')}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Próxima realização *
              <input required type="date" value={draft.nextDate} onChange={event => set('nextDate', event.target.value)} className={fieldClass} />
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Propósito *
            <textarea
              required
              rows={2}
              value={draft.purpose}
              onChange={event => set('purpose', event.target.value)}
              placeholder="Que resultado este ritual precisa produzir?"
              className={fieldClass}
            />
          </label>

          <fieldset>
            <legend className="text-xs font-bold text-zinc-500">Pode gerar</legend>
            <p className="mt-1 text-xs text-zinc-400">Marque só o que este ritual pode produzir.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {outputOptions.map(output => {
                const selected = draft.outputs.includes(output)
                return (
                  <button
                    key={output}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleOutput(output)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      selected ? 'bg-[var(--retro-wine)] text-white' : 'border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {selected && <Check size={12} className="mr-1 inline" />}
                    {output}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => setShowDetails(value => !value)}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm font-bold text-zinc-600"
          >
            Mais detalhes
            <ChevronDown size={16} className={`transition ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          {showDetails && (
            <div className="grid gap-4 rounded-2xl border border-zinc-100 bg-white p-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Frente relacionada
                <Select value={draft.frontId} onChange={value => set('frontId', value)} options={[{ value: '', label: 'Nenhuma' }, ...fronts.map(front => ({ value: front.id, label: front.name }))]} className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Pessoa relacionada
                <Select value={draft.personId} onChange={value => set('personId', value)} options={[{ value: '', label: 'Nenhuma' }, ...people.map(person => ({ value: person.id, label: person.name }))]} className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500 sm:col-span-2">
                Preparo
                <textarea
                  rows={2}
                  value={draft.preparation}
                  onChange={event => set('preparation', event.target.value)}
                  placeholder="O que precisa estar pronto antes do ritual?"
                  className={fieldClass}
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 bg-white px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white">
            Criar ritual recorrente
          </button>
        </div>
      </form>
    </div>
  )
}

export default function RituaisPage() {
  const [rituals, setRituals] = useState<LeadershipRitual[]>([])
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [people, setPeople] = useState<LeadershipPerson[]>([])
  const [monthlyClose, setMonthlyClose] = useState<MonthlyClose>({
    progress: 0,
    checklist: [],
    improved: '',
    worsened: '',
    stalled: '',
    leadershipAction: '',
    nextSteps: [],
    updatedAt: '',
  })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [cadenceFilter, setCadenceFilter] = useState('')
  const [relationFilter, setRelationFilter] = useState('')
  const [showRitualModal, setShowRitualModal] = useState(false)
  const [editingClose, setEditingClose] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const [ritualsData, frontsData, peopleData, monthlyCloseData] = await Promise.all([
        loadRituals(),
        loadFronts(),
        loadPeople(),
        loadMonthlyClose(),
      ])
      if (!active) return
      setRituals(ritualsData)
      setFronts(frontsData)
      setPeople(peopleData)
      setMonthlyClose(monthlyCloseData)
    })()
    return () => {
      active = false
    }
  }, [])

  const flash = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2800)
  }

  const filteredRituals = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return rituals
      .filter(ritual => {
        const relation = relationLabel(ritual, fronts, people)
        const searchable = [ritual.name, ritual.type, ritual.cadence, ritual.purpose, ritual.preparation, relation, ...ritual.outputs]
          .join(' ')
          .toLocaleLowerCase('pt-BR')
        return (
          (!term || searchable.includes(term)) &&
          (!typeFilter || ritual.type === typeFilter) &&
          (!cadenceFilter || ritual.cadence === cadenceFilter) &&
          (!relationFilter ||
            (relationFilter === 'Frente' ? Boolean(ritual.frontId) : relationFilter === 'Pessoa' ? Boolean(ritual.personId) : !ritual.frontId && !ritual.personId))
        )
      })
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
  }, [cadenceFilter, fronts, people, relationFilter, rituals, search, typeFilter])

  const weekRituals = rituals.filter(ritual => isWithinNextWeek(ritual.nextDate))
  const activeFilterCount = [typeFilter, cadenceFilter, relationFilter].filter(Boolean).length

  const stats: PageStat[] = [
    { label: 'Rituais da semana', value: weekRituals.length, detail: 'Próximos 7 dias' },
    { label: '1:1s agendados', value: weekRituals.filter(item => item.type === '1:1').length, detail: 'Próximos 7 dias' },
    { label: 'Checkpoints de frente', value: weekRituals.filter(item => item.type === 'Checkpoint de frente').length, detail: 'Próximos 7 dias' },
    { label: 'Fechamento mensal', value: `${monthlyClose.progress}%`, detail: 'Progresso do ciclo' },
  ]
  const nextRitual = [...rituals].filter(ritual => ritual.nextDate).sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0]

  const createRitual = (ritual: LeadershipRitual) => {
    const next = [ritual, ...rituals]
    setRituals(next)
    void saveRituals(next)
    setShowRitualModal(false)
    flash('Ritual criado e salvo.')
  }

  const updateClose = <K extends keyof MonthlyClose>(key: K, value: MonthlyClose[K]) =>
    setMonthlyClose(current => ({ ...current, [key]: value }))

  const saveClose = () => {
    const completed = monthlyClose.checklist.filter(item => item.done).length
    const progress = monthlyClose.checklist.length ? Math.round((completed / monthlyClose.checklist.length) * 100) : 0
    const next = { ...monthlyClose, progress, updatedAt: new Date().toISOString() }
    setMonthlyClose(next)
    void saveMonthlyClose(next)
    setEditingClose(false)
    flash('Fechamento mensal salvo.')
  }

  const clearFilters = () => {
    setTypeFilter('')
    setCadenceFilter('')
    setRelationFilter('')
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <PageHeader
          eyebrow="Cadência da liderança"
          title="Rituais"
          subtitle="Cadência da liderança, checkpoints e fechamento mensal."
          stats={stats}
          action={
            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
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
                onClick={() => setShowRitualModal(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"
              >
                <Plus size={17} /> Novo ritual
              </button>
            </div>
          }
        >
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Buscar rituais</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar rituais, pessoas, frentes..."
              className={`${fieldClass} h-11 pl-10`}
            />
          </label>
        </PageHeader>


        {showFilters && (
          <section aria-label="Filtros de rituais" className={`${cardClass} mt-5 p-4`}>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Tipo
                <Select value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'Todos' }, ...ritualTypes.map(type => ({ value: type, label: type }))]} className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Cadência
                <Select value={cadenceFilter} onChange={setCadenceFilter} options={[{ value: '', label: 'Todas' }, ...ritualCadences.map(cadence => ({ value: cadence, label: cadence }))]} className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Conexão
                <Select
                  value={relationFilter}
                  onChange={setRelationFilter}
                  options={[{ value: '', label: 'Todas' }, { value: 'Frente', label: 'Frente' }, { value: 'Pessoa', label: 'Pessoa' }, { value: 'Geral', label: 'Cadência geral' }]}
                  className={fieldClass}
                />
              </label>
            </div>
            {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-black text-[var(--retro-wine)]">Limpar filtros</button>}
          </section>
        )}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section className={`${cardClass} min-w-0 p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-zinc-950">Agenda de rituais</h2>
                <p className="mt-1 text-xs text-zinc-400">{filteredRituals.length} rituais nesta visão · ordenados por data</p>
              </div>
              <CalendarDays size={20} className="text-[var(--retro-wine)]" />
            </div>
            <div className="mt-4 grid gap-2">
              {filteredRituals.slice(0, 6).map(ritual => (
                <details key={ritual.id} className="group rounded-2xl border border-zinc-100 bg-[#fcfbfa] open:bg-white">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${typeTone[ritual.type]}`}><CalendarCheck2 size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-zinc-900">{ritual.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-zinc-400">{relationLabel(ritual, fronts, people)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-xs font-black text-zinc-700">{formatDate(ritual.nextDate)}</span>
                      <span className="mt-0.5 block text-[11px] text-zinc-400">{ritual.cadence}</span>
                    </span>
                    <ChevronDown size={15} className="text-zinc-300 transition group-open:rotate-180" />
                  </summary>
                  <div className="grid gap-3 border-t border-zinc-100 px-4 py-3 text-xs sm:grid-cols-2">
                    <div><p className="font-black text-zinc-500">Propósito</p><p className="mt-1 leading-5 text-zinc-600">{ritual.purpose}</p></div>
                    <div><p className="font-black text-zinc-500">Preparo</p><p className="mt-1 leading-5 text-zinc-600">{ritual.preparation || 'Sem preparo registrado.'}</p></div>
                    {ritual.outputs.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="font-black text-zinc-500">Pode gerar</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">{ritual.outputs.map(output => <span key={output} className="rounded-full bg-zinc-100 px-2 py-1 font-bold text-zinc-600">{output}</span>)}</div>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
            {filteredRituals.length === 0 && (
              <div className="grid place-items-center py-12 text-center">
                <CalendarDays size={22} className="text-zinc-300" />
                <p className="mt-3 font-black text-zinc-800">Nenhum ritual encontrado</p>
                <p className="mt-1 text-xs text-zinc-400">Limpe os filtros ou crie uma cadência para este contexto.</p>
                <button type="button" onClick={() => { setSearch(''); clearFilters(); setShowRitualModal(true) }} className="mt-4 text-sm font-black text-[var(--retro-wine)]">
                  Criar novo ritual
                </button>
              </div>
            )}
          </section>

          <section className={`${cardClass} h-fit p-5 sm:p-6`}>
            <div className="flex items-center gap-2">
              <Sparkles size={19} className="text-[var(--retro-wine)]" />
              <div>
                <h2 className="text-lg font-black text-zinc-950">Rituais essenciais</h2>
                <p className="mt-0.5 text-xs text-zinc-400">Cadências mínimas para sustentar a gestão</p>
              </div>
            </div>
            <div className="mt-4 divide-y divide-zinc-100">
              {essentialRituals.map(item => {
                const configured = rituals.some(ritual => ritual.type === item.type)
                return (
                  <div key={item.type} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${configured ? typeTone[item.type] : 'bg-zinc-100 text-zinc-400'}`}>
                      {configured ? <Check size={15} /> : <Circle size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-zinc-800">{item.type}</p>
                        <span className="text-[11px] font-bold text-zinc-400">{item.cadence}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{item.purpose}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <section className={`${cardClass} mt-5 p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"><ListChecks size={18} /></span>
              <div>
                <h2 className="text-lg font-black text-zinc-950">Fechamento mensal</h2>
                <p className="mt-0.5 text-xs text-zinc-400">Consolide o mês e prepare o próximo ciclo.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => editingClose ? saveClose() : setEditingClose(true)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${
                editingClose ? 'bg-[var(--retro-wine)] text-white' : 'border border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              {editingClose ? <Save size={16} /> : <ClipboardCheck size={16} />}
              {editingClose ? 'Salvar fechamento' : 'Editar fechamento'}
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${monthlyClose.progress}%` }} />
            </div>
            <span className="text-sm font-black text-zinc-700">{monthlyClose.progress}%</span>
          </div>

          {!editingClose ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-zinc-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Checklist</p>
                <div className="mt-3 grid gap-2.5">
                  {monthlyClose.checklist.map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      {item.done ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : <Circle size={16} className="shrink-0 text-zinc-300" />}
                      <span className={item.done ? 'text-zinc-500 line-through' : 'font-bold text-zinc-700'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['O que melhorou', monthlyClose.improved],
                  ['O que piorou', monthlyClose.worsened],
                  ['O que ficou parado', monthlyClose.stalled],
                  ['Onde a liderança precisa atuar', monthlyClose.leadershipAction],
                ].map(([label, value]) => (
                  <article key={label} className="rounded-2xl border border-zinc-100 p-4">
                    <p className="text-xs font-black text-zinc-700">{label}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">{value || 'Ainda não registrado.'}</p>
                  </article>
                ))}
              </div>
              <div className="rounded-2xl bg-[rgba(135,0,47,0.05)] p-4 lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--retro-wine)]">Próximos passos</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {monthlyClose.nextSteps.length > 0 ? monthlyClose.nextSteps.map(step => (
                    <span key={step} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-zinc-700">
                      <ArrowRight size={12} className="text-[var(--retro-wine)]" /> {step}
                    </span>
                  )) : <span className="text-xs text-zinc-400">Nenhum próximo passo definido.</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-zinc-100 bg-[#fcfbfa] p-4">
                <p className="text-xs font-black text-zinc-700">Checklist editável</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {monthlyClose.checklist.map((item, index) => (
                    <label key={`${item.label}-${index}`} className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 text-xs font-bold text-zinc-600">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={event => updateClose('checklist', monthlyClose.checklist.map((entry, itemIndex) => itemIndex === index ? { ...entry, done: event.target.checked } : entry))}
                        className="accent-[var(--retro-wine)]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['O que melhorou', 'improved'],
                  ['O que piorou', 'worsened'],
                  ['O que ficou parado', 'stalled'],
                  ['Onde a liderança precisa atuar', 'leadershipAction'],
                ].map(([label, key]) => (
                  <label key={key} className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    {label}
                    <textarea
                      rows={3}
                      value={monthlyClose[key as 'improved' | 'worsened' | 'stalled' | 'leadershipAction']}
                      onChange={event => updateClose(key as 'improved' | 'worsened' | 'stalled' | 'leadershipAction', event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                ))}
              </div>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Próximos passos
                <textarea
                  rows={2}
                  value={monthlyClose.nextSteps.join('\n')}
                  onChange={event => updateClose('nextSteps', event.target.value.split('\n').map(item => item.trim()).filter(Boolean))}
                  placeholder="Um próximo passo por linha"
                  className={fieldClass}
                />
              </label>
            </div>
          )}
        </section>

        {nextRitual && (
          <aside className="mt-5 flex flex-col gap-3 rounded-2xl bg-[var(--retro-wine)] p-4 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">Próximo passo claro</p>
              <p className="mt-1 text-sm font-bold">Prepare “{nextRitual.name}” para {formatDate(nextRitual.nextDate)}.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-white/75"><Flag size={15} /> {nextRitual.preparation || 'Confirme pauta e saídas esperadas.'}</span>
          </aside>
        )}
      </div>

      <div aria-live="polite" className="fixed bottom-5 right-5 z-50">
        {feedback && (
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white shadow-xl">
            <CheckCircle2 size={17} className="text-emerald-400" /> {feedback}
          </div>
        )}
      </div>

      {showRitualModal && <RitualModal fronts={fronts} people={people} onClose={() => setShowRitualModal(false)} onSave={createRitual} />}
    </main>
  )
}
