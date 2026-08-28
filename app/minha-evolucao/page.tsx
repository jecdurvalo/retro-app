'use client'

import { useEffect, useMemo, useState } from 'react'
import { Select } from '@/components/ui/select'
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Link2,
  ListChecks,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  UserRoundCheck,
  X,
} from 'lucide-react'
import {
  createEmptyCommitment,
  createEmptyEvidence,
  createEmptyFocus,
  cycleProgress,
  evolutionAreas,
  focusPriorities,
  leadershipPrinciples,
  loadCommitments,
  loadCycle,
  loadEvidences,
  loadFocuses,
  saveCommitments,
  saveCycle,
  saveEvidences,
  saveFocuses,
  type EvolutionArea,
  type EvolutionCommitment,
  type EvolutionCycle,
  type EvolutionEvidence,
  type EvolutionFocus,
  type FocusPriority,
  type LeadershipPrinciple,
} from '@/lib/evolution'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { loadPeople, type LeadershipPerson } from '@/lib/people'
import { PageHeader, type PageStat } from '@/components/ui/page-header'
import { QuickAddModal, QuickAddTextForm } from '@/components/ui/quick-add-modal'

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

const areaTone: Record<EvolutionArea, string> = {
  'Modelo de gestão': 'bg-rose-50 text-rose-700',
  'Desenvolvimento do time': 'bg-violet-50 text-violet-700',
  'Exposição estratégica': 'bg-amber-50 text-amber-700',
  'Governança e decisões': 'bg-emerald-50 text-emerald-700',
}

const areaHex: Record<EvolutionArea, string> = {
  'Modelo de gestão': '#f43f5e',
  'Desenvolvimento do time': '#8b5cf6',
  'Exposição estratégica': '#f59e0b',
  'Governança e decisões': '#10b981',
}

const priorityTone: Record<FocusPriority, string> = {
  Alta: 'bg-rose-50 text-rose-700 border-rose-200',
  Média: 'bg-amber-50 text-amber-700 border-amber-200',
  Baixa: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

const priorityWeight: Record<FocusPriority, number> = { Alta: 0, Média: 1, Baixa: 2 }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function monthKey(dateIso: string) {
  return dateIso.slice(0, 7)
}

function trend(current: number, previous: number): { label: string; up: boolean } | null {
  if (previous === 0) return null
  const delta = Math.round(((current - previous) / previous) * 100)
  if (delta === 0) return null
  return { label: `${delta > 0 ? '+' : ''}${delta}% vs mês anterior`, up: delta > 0 }
}

function Donut({ segments }: { segments: { color: string; value: number; label: string }[] }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return <div className="grid h-32 w-32 place-items-center rounded-full border-8 border-zinc-100 text-xs font-bold text-zinc-400">Sem dados</div>
  }
  let cursor = 0
  const stops = segments.map(item => {
    const start = (cursor / total) * 360
    cursor += item.value
    const end = (cursor / total) * 360
    return `${item.color} ${start}deg ${end}deg`
  })
  return (
    <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-center">
        <span className="text-lg font-black text-zinc-900">{total}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">evidências</span>
      </div>
    </div>
  )
}

function EvidenceModal({
  fronts,
  people,
  onClose,
  onSave,
}: {
  fronts: ManagementFront[]
  people: LeadershipPerson[]
  onClose: () => void
  onSave: (evidence: EvolutionEvidence) => void
}) {
  const [draft, setDraft] = useState(createEmptyEvidence)
  const [error, setError] = useState('')
  const set = <K extends keyof EvolutionEvidence>(key: K, value: EvolutionEvidence[K]) =>
    setDraft(current => ({ ...current, [key]: value }))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#fbfaf9] shadow-2xl"
        onSubmit={event => {
          event.preventDefault()
          if (!draft.description.trim() || !draft.date) {
            setError('Descreva a evidência e informe a data.')
            return
          }
          onSave({ ...draft, description: draft.description.trim(), learning: draft.learning.trim(), tag: draft.tag.trim() })
        }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--retro-wine)]">Evolução baseada em fatos</p>
            <h2 id="evidence-modal-title" className="mt-1 text-xl font-black text-zinc-950">
              Registrar evidência
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Registre o que aconteceu e conecte ao contexto certo.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500 sm:col-span-2">
            Evidência
            <textarea
              required
              rows={3}
              value={draft.description}
              onChange={event => set('description', event.target.value)}
              placeholder="Ex.: conduzi a recomendação executiva e deixei decisão, dono e checkpoint claros."
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Área
            <Select value={draft.area} onChange={value => set('area', value as EvolutionArea)} options={[...evolutionAreas]} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Princípio
            <Select
              value={draft.principle}
              onChange={value => set('principle', value as LeadershipPrinciple)}
              options={[...leadershipPrinciples]}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Data
            <input required type="date" value={draft.date} onChange={event => set('date', event.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Tag
            <input value={draft.tag} onChange={event => set('tag', event.target.value)} placeholder="Ex.: Delegação, Autonomia" className={fieldClass} />
          </label>
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2">
            <summary className="cursor-pointer text-sm font-black text-zinc-700">Detalhes opcionais</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Pessoa conectada
                <Select value={draft.personId} onChange={value => set('personId', value)} options={[{ value: '', label: 'Nenhuma' }, ...people.map(person => ({ value: person.id, label: person.name }))]} className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Frente conectada
                <Select value={draft.frontId} onChange={value => set('frontId', value)} options={[{ value: '', label: 'Nenhuma' }, ...fronts.map(front => ({ value: front.id, label: front.name }))]} className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Decisão relacionada
                <input value={draft.decision} onChange={event => set('decision', event.target.value)} placeholder="Nome da decisão, se houver" className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Ritual relacionado
                <input value={draft.ritual} onChange={event => set('ritual', event.target.value)} placeholder="Ex.: revisão de decisões" className={fieldClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500 sm:col-span-2">
                Aprendizado opcional
                <textarea
                  rows={2}
                  value={draft.learning}
                  onChange={event => set('learning', event.target.value)}
                  placeholder="O que vale repetir ou ajustar?"
                  className={fieldClass}
                />
              </label>
            </div>
          </details>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700 sm:col-span-2">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white">
            Salvar evidência
          </button>
        </div>
      </form>
    </div>
  )
}

function CicloAtual({ cycle, onChange }: { cycle: EvolutionCycle; onChange: (cycle: EvolutionCycle) => void }) {
  const [editing, setEditing] = useState(false)
  const { percent, daysRemaining, daysTotal } = cycleProgress(cycle)

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock size={19} className="text-[var(--retro-wine)]" />
          <h2 className="text-lg font-black">Ciclo atual</h2>
        </div>
        <button type="button" onClick={() => setEditing(value => !value)} className="text-xs font-black text-[var(--retro-wine)]">
          {editing ? 'Fechar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Nome do ciclo
            <input value={cycle.label} onChange={event => onChange({ ...cycle, label: event.target.value })} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Início
            <input type="date" value={cycle.startDate} onChange={event => onChange({ ...cycle, startDate: event.target.value })} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Fim
            <input type="date" value={cycle.endDate} onChange={event => onChange({ ...cycle, endDate: event.target.value })} className={fieldClass} />
          </label>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm font-bold text-zinc-700">{cycle.label}</p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-[var(--retro-wine)] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-bold text-zinc-500">
            <span>{percent}% concluído</span>
            <span>{daysRemaining} de {daysTotal} dias restantes</span>
          </div>
        </>
      )}
    </section>
  )
}

function FocusEditor({
  focuses,
  onAdd,
  onToggle,
  onDelete,
}: {
  focuses: EvolutionFocus[]
  onAdd: (title: string, priority: FocusPriority) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<FocusPriority>('Média')
  const sorted = [...focuses].sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority])

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-center gap-2">
        <Target size={19} className="text-[var(--retro-wine)]" />
        <h2 className="text-lg font-black">Focos atuais</h2>
      </div>
      <div className="mt-4 grid gap-2">
        {sorted.map(focus => (
          <article key={focus.id} className="group rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${priorityTone[focus.priority]}`}>{focus.priority}</span>
                  <h3 className={`truncate text-sm font-black ${focus.done ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>{focus.title}</h3>
                </div>
                {focus.description && <p className="mt-1 text-xs leading-5 text-zinc-500">{focus.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={focus.done ? 'Reabrir foco' : 'Concluir foco'}
                  onClick={() => onToggle(focus.id)}
                  className={`grid h-5 w-5 place-items-center rounded-md border ${focus.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 text-transparent hover:border-emerald-500'}`}
                >
                  <Check size={12} strokeWidth={3} />
                </button>
                <button type="button" aria-label="Excluir foco" onClick={() => onDelete(focus.id)} className="rounded-lg p-1 text-zinc-300 opacity-0 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </article>
        ))}
        {focuses.length === 0 && <p className="text-xs font-semibold text-zinc-400">Nenhum foco registrado.</p>}
      </div>
      <div className="mt-3">
        <QuickAddModal title="Novo foco" triggerLabel="Adicionar foco" compact>
          {close => (
            <form
              className="grid gap-3"
              onSubmit={event => {
                event.preventDefault()
                const value = title.trim()
                if (!value) return
                onAdd(value, priority)
                setTitle('')
                close()
              }}
            >
              <input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Descreva o foco..." className={fieldClass} />
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Prioridade
                <Select value={priority} onChange={value => setPriority(value as FocusPriority)} options={[...focusPriorities]} className={fieldClass} />
              </label>
              <button
                type="submit"
                disabled={!title.trim()}
                className="justify-self-end rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Adicionar
              </button>
            </form>
          )}
        </QuickAddModal>
      </div>
    </section>
  )
}

function CommitmentChecklist({
  commitments,
  onAdd,
  onToggle,
  onDelete,
}: {
  commitments: EvolutionCommitment[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [text, setText] = useState('')
  const done = commitments.filter(item => item.done).length

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks size={19} className="text-[var(--retro-wine)]" />
          <h2 className="text-lg font-black">Compromissos do ciclo</h2>
        </div>
        <span className="text-xs font-black text-zinc-400">{done}/{commitments.length}</span>
      </div>
      <ul className="mt-4 grid gap-2">
        {commitments.map(item => (
          <li key={item.id} className="group flex items-start gap-2">
            <button
              type="button"
              aria-label={item.done ? 'Desmarcar compromisso' : 'Marcar compromisso como cumprido'}
              onClick={() => onToggle(item.id)}
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${item.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 text-transparent hover:border-emerald-500'}`}
            >
              <Check size={12} strokeWidth={3} />
            </button>
            <span className={`flex-1 text-sm leading-5 ${item.done ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>{item.text}</span>
            <button type="button" aria-label="Excluir compromisso" onClick={() => onDelete(item.id)} className="rounded-lg p-1 text-zinc-300 opacity-0 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <QuickAddModal title="Novo compromisso" triggerLabel="Adicionar compromisso" compact>
          {close => (
            <QuickAddTextForm
              placeholder="Descreva o compromisso..."
              onSubmit={value => {
                onAdd(value)
                close()
              }}
            />
          )}
        </QuickAddModal>
      </div>
    </section>
  )
}

export default function MinhaEvolucaoPage() {
  const [evidence, setEvidence] = useState<EvolutionEvidence[]>([])
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [people, setPeople] = useState<LeadershipPerson[]>([])
  const [focuses, setFocuses] = useState<EvolutionFocus[]>([])
  const [commitments, setCommitments] = useState<EvolutionCommitment[]>([])
  const [cycle, setCycle] = useState<EvolutionCycle>({ label: '', startDate: '', endDate: '' })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [areaFilter, setAreaFilter] = useState('')
  const [principleFilter, setPrincipleFilter] = useState('')
  const [expandedAreas, setExpandedAreas] = useState<EvolutionArea[]>([])
  const [showModal, setShowModal] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [evidenceData, frontsData, peopleData, focusesData, commitmentsData, cycleData] = await Promise.all([
        loadEvidences(),
        loadFronts(),
        loadPeople(),
        loadFocuses(),
        loadCommitments(),
        loadCycle(),
      ])
      if (!active) return
      setEvidence(evidenceData)
      setFronts(frontsData)
      setPeople(peopleData)
      setFocuses(focusesData)
      setCommitments(commitmentsData)
      setCycle(cycleData)
    })()
    return () => {
      active = false
    }
  }, [])

  const frontById = useMemo(() => new Map(fronts.map(front => [front.id, front.name])), [fronts])
  const personById = useMemo(() => new Map(people.map(person => [person.id, person])), [people])
  const filteredEvidence = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return evidence.filter(item => {
      const searchable = [
        item.description,
        item.area,
        item.principle,
        item.tag,
        item.learning,
        item.decision,
        item.ritual,
        frontById.get(item.frontId) || '',
        personById.get(item.personId)?.name || '',
      ].join(' ').toLocaleLowerCase('pt-BR')
      return (!term || searchable.includes(term)) && (!areaFilter || item.area === areaFilter) && (!principleFilter || item.principle === principleFilter)
    })
  }, [areaFilter, evidence, frontById, personById, principleFilter, search])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const previousMonth = monthKey(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
  const evidenceThisMonth = evidence.filter(item => monthKey(item.date) === currentMonth).length
  const evidencePreviousMonth = evidence.filter(item => monthKey(item.date) === previousMonth).length
  const evidenceTrend = trend(evidenceThisMonth, evidencePreviousMonth)
  const developedPeople = new Set(evidence.map(item => item.personId).filter(Boolean)).size
  const activePdis = people.filter(person => person.pdi?.status !== 'Sem PDI').length

  const areaCounts = useMemo(() => (
    evolutionAreas.map(area => ({ area, count: evidence.filter(item => item.area === area).length }))
  ), [evidence])

  function saveNewEvidence(item: EvolutionEvidence) {
    const next = [item, ...evidence]
    setEvidence(next)
    void saveEvidences(next)
    setShowModal(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3000)
  }

  function updateCycle(next: EvolutionCycle) {
    setCycle(next)
    void saveCycle(next)
  }

  function addFocus(title: string, priority: FocusPriority) {
    const next = [...focuses, createEmptyFocus({ title, priority })]
    setFocuses(next)
    void saveFocuses(next)
  }
  function toggleFocus(id: string) {
    const next = focuses.map(item => (item.id === id ? { ...item, done: !item.done, updatedAt: new Date().toISOString() } : item))
    setFocuses(next)
    void saveFocuses(next)
  }
  function deleteFocus(id: string) {
    const next = focuses.filter(item => item.id !== id)
    setFocuses(next)
    void saveFocuses(next)
  }

  function addCommitment(text: string) {
    const next = [...commitments, createEmptyCommitment(text)]
    setCommitments(next)
    void saveCommitments(next)
  }
  function toggleCommitment(id: string) {
    const next = commitments.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    setCommitments(next)
    void saveCommitments(next)
  }
  function deleteCommitment(id: string) {
    const next = commitments.filter(item => item.id !== id)
    setCommitments(next)
    void saveCommitments(next)
  }

  const stats: PageStat[] = [
    { label: 'Evidências do mês', value: evidenceThisMonth, detail: evidenceTrend?.label ?? 'Fatos registrados no ciclo' },
    { label: 'Pessoas desenvolvidas', value: developedPeople, detail: 'Com evidências conectadas' },
    { label: 'PDI em andamento', value: activePdis, detail: 'Do time acompanhado' },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Desenvolvimento de liderança"
          title="Minha Evolução"
          subtitle="Evidências de gestão, desenvolvimento e próximos focos como líder."
          stats={stats}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Buscar evidências..."
                  className={`${fieldClass} pl-9`}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowFilters(current => !current)}
                aria-expanded={showFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700"
              >
                <Filter size={16} /> Filtros
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"
              >
                <Plus size={17} /> Registrar evidência
              </button>
            </div>
          }
        />

        {saved && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <Check size={17} /> Evidência salva e conectada à sua evolução.
          </div>
        )}

        {showFilters && (
          <section aria-label="Filtros de evidências" className={`${cardClass} mt-4 grid gap-3 p-4 sm:grid-cols-2`}>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Área
              <Select value={areaFilter} onChange={setAreaFilter} options={[{ value: '', label: 'Todas as áreas' }, ...evolutionAreas.map(area => ({ value: area, label: area }))]} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Princípio
              <Select value={principleFilter} onChange={setPrincipleFilter} options={[{ value: '', label: 'Todos os princípios' }, ...leadershipPrinciples.map(principle => ({ value: principle, label: principle }))]} className={fieldClass} />
            </label>
          </section>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <CicloAtual cycle={cycle} onChange={updateCycle} />
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <Sparkles size={19} className="text-[var(--retro-wine)]" />
              <h2 className="text-lg font-black">Radar de evolução</h2>
            </div>
            <div className="mt-4 flex items-center gap-5">
              <Donut segments={areaCounts.map(({ area, count }) => ({ color: areaHex[area], value: count, label: area }))} />
              <div className="grid gap-1.5 text-xs font-bold text-zinc-600">
                {areaCounts.map(({ area, count }) => (
                  <span key={area} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: areaHex[area] }} />
                    {area} · {count}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-black">Evidências de evolução</h2><p className="mt-1 text-sm text-zinc-500">Fatos observáveis, organizados por área.</p></div>
              <BookOpenCheck size={20} className="text-[var(--retro-wine)]" />
            </div>

            <div className="mt-5 grid gap-5">
              {evolutionAreas.map(area => {
                const areaEvidence = filteredEvidence.filter(item => item.area === area).sort((a, b) => b.date.localeCompare(a.date))
                const expanded = expandedAreas.includes(area)
                const visible = expanded ? areaEvidence : areaEvidence.slice(0, 2)
                return (
                  <section key={area} aria-labelledby={`area-${area}`}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 id={`area-${area}`} className="font-black">{area}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${areaTone[area]}`}>{areaEvidence.length}</span>
                    </div>
                    <div className="mt-2 grid gap-2">
                      {visible.map(item => {
                        const person = personById.get(item.personId)
                        const connections = [frontById.get(item.frontId), item.decision, item.ritual].filter(Boolean)
                        return (
                          <article key={item.id} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-4">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm font-bold leading-6 text-zinc-800">{item.description}</p>
                              <time className="shrink-0 text-xs text-zinc-400">{formatDate(item.date)}</time>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--retro-wine)] ring-1 ring-zinc-100">{item.principle}</span>
                              {item.tag && (
                                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">{item.tag}</span>
                              )}
                              {person && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                                  <UserRoundCheck size={11} /> {person.name} · {person.role}
                                </span>
                              )}
                              {connections.slice(0, 2).map(connection => (
                                <span key={connection} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                                  <Link2 size={11} /> {connection}
                                </span>
                              ))}
                            </div>
                            {item.learning && (
                              <details className="mt-3 text-xs text-zinc-500">
                                <summary className="cursor-pointer font-bold text-zinc-600">Ver aprendizado</summary>
                                <p className="mt-2 leading-5">{item.learning}</p>
                              </details>
                            )}
                          </article>
                        )
                      })}
                      {areaEvidence.length === 0 && (
                        <p className="px-1 text-xs font-semibold text-zinc-400">Nenhuma evidência registrada ainda.</p>
                      )}
                    </div>
                    {areaEvidence.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setExpandedAreas(current => expanded ? current.filter(item => item !== area) : [...current, area])}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[var(--retro-wine)]"
                      >
                        {expanded ? 'Mostrar menos' : `Ver mais ${areaEvidence.length - 2}`} <ChevronDown size={14} className={expanded ? 'rotate-180' : ''} />
                      </button>
                    )}
                  </section>
                )
              })}
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Princípios conectados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {leadershipPrinciples.map(principle => (
                  <button
                    key={principle}
                    type="button"
                    onClick={() => {
                      setPrincipleFilter(principle)
                      setShowFilters(true)
                    }}
                    className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-[var(--retro-wine)] hover:bg-rose-100"
                  >
                    {principle}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid content-start gap-6">
            <FocusEditor focuses={focuses} onAdd={addFocus} onToggle={toggleFocus} onDelete={deleteFocus} />
            <CommitmentChecklist commitments={commitments} onAdd={addCommitment} onToggle={toggleCommitment} onDelete={deleteCommitment} />
          </div>
        </div>
      </div>

      {showModal && <EvidenceModal fronts={fronts} people={people} onClose={() => setShowModal(false)} onSave={saveNewEvidence} />}
    </main>
  )
}
