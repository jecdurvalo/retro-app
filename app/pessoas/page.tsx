'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  FileCheck2,
  Filter,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { attentionTypes, loadPeople, savePeople, type AttentionType, type LeadershipPerson } from '@/lib/people'

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]'

const attentionTone: Record<AttentionType, string> = {
  'Dar autonomia': 'bg-emerald-50 text-emerald-700',
  Desafiar: 'bg-violet-50 text-violet-700',
  Cuidar: 'bg-rose-50 text-rose-700',
  Desenvolver: 'bg-blue-50 text-blue-700',
  'Monitorar carga': 'bg-amber-50 text-amber-700',
}

const pdiTone: Record<LeadershipPerson['pdiStatus'], string> = {
  Ativo: 'bg-emerald-50 text-emerald-700',
  'Em revisão': 'bg-amber-50 text-amber-700',
  'Sem PDI': 'bg-zinc-100 text-zinc-500',
}

type OneOnOneDraft = {
  personId: string
  date: string
  notes: string
}

function formatDate(value: string) {
  if (!value) return 'Não agendado'
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

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
}

function frontNames(person: LeadershipPerson, fronts: ManagementFront[]) {
  return person.frontIds.map(id => fronts.find(front => front.id === id)).filter((front): front is ManagementFront => Boolean(front))
}

function OneOnOneModal({
  people,
  initialPersonId,
  onClose,
  onSave,
}: {
  people: LeadershipPerson[]
  initialPersonId?: string
  onClose: () => void
  onSave: (draft: OneOnOneDraft) => void
}) {
  const [draft, setDraft] = useState<OneOnOneDraft>({
    personId: initialPersonId || people[0]?.id || '',
    date: '',
    notes: '',
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="one-on-one-title"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <form
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-[#fbfaf9] shadow-2xl"
        onSubmit={event => {
          event.preventDefault()
          if (!draft.personId || !draft.date || !draft.notes.trim()) return
          onSave({ ...draft, notes: draft.notes.trim() })
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--retro-wine)]">Desenvolvimento com evidência</p>
            <h2 id="one-on-one-title" className="mt-1 text-xl font-black text-zinc-950">
              Registrar próximo 1:1
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Pessoa
            <select
              required
              value={draft.personId}
              onChange={event => setDraft(current => ({ ...current, personId: event.target.value }))}
              className={fieldClass}
            >
              {people.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.role}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Data do 1:1
            <input
              required
              type="date"
              value={draft.date}
              onChange={event => setDraft(current => ({ ...current, date: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Pauta do 1:1
            <textarea
              required
              rows={4}
              value={draft.notes}
              onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))}
              placeholder="Ex.: trouxe recomendação estratégica, risco de carga ou próximo salto."
              className={fieldClass}
            />
          </label>
          <p className="rounded-xl bg-violet-50 px-3 py-2.5 text-xs leading-5 text-violet-700">
            O encontro vira evidência e atualiza o próximo 1:1.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 bg-white px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white">
            Salvar 1:1
          </button>
        </div>
      </form>
    </div>
  )
}

export default function PessoasPage() {
  const [people, setPeople] = useState<LeadershipPerson[]>(loadPeople)
  const [fronts] = useState<ManagementFront[]>(loadFronts)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [attentionFilter, setAttentionFilter] = useState('')
  const [relationshipFilter, setRelationshipFilter] = useState('')
  const [pdiFilter, setPdiFilter] = useState('')
  const [oneOnOnePersonId, setOneOnOnePersonId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return people.filter(person => {
      const connectedFronts = frontNames(person, fronts)
      const searchable = [
        person.name,
        person.role,
        person.relationship,
        person.moment,
        person.nextLeap,
        person.attention,
        person.pdiTitle,
        person.pdiStatus,
        ...person.evidence,
        ...person.risks,
        ...person.levers,
        ...connectedFronts.map(front => front.name),
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return (
        (!term || searchable.includes(term)) &&
        (!attentionFilter || person.attention === attentionFilter) &&
        (!relationshipFilter || person.relationship === relationshipFilter) &&
        (!pdiFilter || person.pdiStatus === pdiFilter)
      )
    })
  }, [attentionFilter, fronts, pdiFilter, people, relationshipFilter, search])

  const focusPeople = useMemo(
    () =>
      [...people]
        .sort((a, b) => {
          const priority: Record<AttentionType, number> = { Cuidar: 0, 'Monitorar carga': 1, Desenvolver: 2, Desafiar: 3, 'Dar autonomia': 4 }
          return priority[a.attention] - priority[b.attention]
        })
        .slice(0, 4),
    [people],
  )

  const saveOneOnOne = (draft: OneOnOneDraft) => {
    const next = people.map(person =>
      person.id === draft.personId
        ? {
            ...person,
            nextOneOnOne: draft.date,
            evidence: [`1:1 registrado: ${draft.notes}`, ...person.evidence],
            updatedAt: new Date().toISOString(),
          }
        : person,
    )
    setPeople(next)
    savePeople(next)
    setOneOnOnePersonId(null)
    setFeedback('1:1 registrado e próximo encontro atualizado.')
    window.setTimeout(() => setFeedback(''), 2400)
  }

  const clearFilters = () => {
    setAttentionFilter('')
    setRelationshipFilter('')
    setPdiFilter('')
  }

  const activeFilterCount = [attentionFilter, relationshipFilter, pdiFilter].filter(Boolean).length
  const signals = {
    evidence: people.flatMap(person => person.evidence.slice(0, 1).map(text => ({ person: person.name, text }))).slice(0, 4),
    risks: people.flatMap(person => person.risks.slice(0, 1).map(text => ({ person: person.name, text }))).slice(0, 4),
    levers: people.flatMap(person => person.levers.slice(0, 1).map(text => ({ person: person.name, text }))).slice(0, 4),
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--retro-bg)] px-4 py-6 text-[var(--retro-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Pessoas</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">Desenvolvimento, autonomia e próximos saltos do time.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <label className="relative min-w-0 flex-1 xl:w-80">
              <span className="sr-only">Buscar pessoas</span>
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar pessoas, frentes, PDIs..."
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
              onClick={() => setOneOnOnePersonId('')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"
            >
              <Plus size={17} /> Agendar 1:1
            </button>
          </div>
        </header>

        <section aria-label="Indicadores de pessoas" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Pessoas em foco', value: focusPeople.length, note: 'Pedem ação da gestora', icon: UsersRound, tone: 'bg-violet-50 text-violet-700' },
            {
              label: '1:1s da semana',
              value: people.filter(person => isWithinNextWeek(person.nextOneOnOne)).length,
              note: 'Próximos 7 dias',
              icon: CalendarCheck,
              tone: 'bg-amber-50 text-amber-700',
            },
            {
              label: 'PDIs ativos',
              value: people.filter(person => person.pdiStatus === 'Ativo').length,
              note: 'Com evidências conectadas',
              icon: FileCheck2,
              tone: 'bg-emerald-50 text-emerald-700',
            },
            {
              label: 'Próximos saltos definidos',
              value: people.filter(person => person.nextLeap).length,
              note: `${Math.round((people.filter(person => person.nextLeap).length / people.length) * 100)}% do time`,
              icon: ArrowUpRight,
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
          <section aria-label="Filtros de pessoas" className={`${cardClass} mt-5 p-4`}>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Atenção da Joana
                <select value={attentionFilter} onChange={event => setAttentionFilter(event.target.value)} className={fieldClass}>
                  <option value="">Todas</option>
                  {attentionTypes.map(type => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Relação
                <select value={relationshipFilter} onChange={event => setRelationshipFilter(event.target.value)} className={fieldClass}>
                  <option value="">Todas</option>
                  <option>Liderado direto</option>
                  <option>Liderada emprestada</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                PDI
                <select value={pdiFilter} onChange={event => setPdiFilter(event.target.value)} className={fieldClass}>
                  <option value="">Todos</option>
                  <option>Ativo</option>
                  <option>Em revisão</option>
                  <option>Sem PDI</option>
                </select>
              </label>
            </div>
            {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-black text-[var(--retro-wine)]">Limpar filtros</button>}
          </section>
        )}
        {feedback && <p role="status" className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{feedback}</p>}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className={`${cardClass} min-w-0 overflow-hidden`}>
            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-black text-zinc-950">Visão do time</h2>
                <p className="mt-1 text-xs text-zinc-400">{filteredPeople.length} pessoas nesta visão · desenvolvimento com evidências reais</p>
                <p className="mt-1 text-xs text-zinc-400">Conecta pessoas, frentes, PDI e 1:1s.</p>
              </div>
              <UserRoundCheck size={20} className="text-[var(--retro-wine)]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
                <thead className="border-y border-zinc-100 bg-[#fcfbfa] text-zinc-500">
                  <tr>
                    {['Pessoa', 'Momento', 'Frentes principais', 'Próximo salto', 'Próximo 1:1', 'Atenção da Joana'].map(label => (
                      <th key={label} className="px-4 py-3 font-bold first:pl-6 last:pr-6">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredPeople.map(person => {
                    const connectedFronts = frontNames(person, fronts)
                    return (
                      <tr key={person.id} className="align-top transition hover:bg-[#fcfaf9]">
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(135,0,47,0.08)] font-black text-[var(--retro-wine)]">
                              {initials(person.name)}
                            </span>
                            <div>
                              <p className="font-black text-zinc-900">{person.name}</p>
                              <p className="mt-0.5 text-[11px] text-zinc-400">{person.role}</p>
                              <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${pdiTone[person.pdiStatus]}`}>
                                PDI {person.pdiStatus.toLocaleLowerCase('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[210px] px-4 py-4">
                          <p className="font-bold leading-5 text-zinc-700">{person.moment}</p>
                          <p className="mt-1 text-[11px] text-zinc-400">{person.relationship}</p>
                        </td>
                        <td className="max-w-[210px] px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {connectedFronts.map(front => (
                              <span key={front.id} title={front.description} className="rounded-full bg-blue-50 px-2 py-1 font-bold text-blue-700">
                                {front.name}
                              </span>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] font-bold text-violet-700">{person.pdiTitle}</p>
                        </td>
                        <td className="max-w-[240px] px-4 py-4 leading-5 text-zinc-600">{person.nextLeap}</td>
                        <td className="px-4 py-4">
                          <button type="button" onClick={() => setOneOnOnePersonId(person.id)} className="text-left">
                            <span className="block font-black text-zinc-700">{formatDate(person.nextOneOnOne)}</span>
                            <span className="mt-1 block text-[11px] font-bold text-[var(--retro-wine)]">Agendar 1:1</span>
                          </button>
                        </td>
                        <td className="py-4 pl-4 pr-6">
                          <span className={`inline-flex rounded-full px-2.5 py-1 font-bold ${attentionTone[person.attention]}`}>{person.attention}</span>
                          <p className="mt-2 max-w-[180px] text-[11px] leading-4 text-zinc-400">{person.evidence[0] || 'Sem evidência recente'}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredPeople.length === 0 && (
              <div className="grid place-items-center px-6 py-14 text-center">
                <Search size={21} className="text-zinc-300" />
                <p className="mt-3 font-black text-zinc-800">Nenhuma pessoa encontrada</p>
                <button type="button" onClick={() => { setSearch(''); clearFilters() }} className="mt-3 text-sm font-black text-[var(--retro-wine)]">
                  Limpar busca e filtros
                </button>
              </div>
            )}
          </section>

          <aside className={`${cardClass} h-fit p-5`}>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-50 text-violet-700"><Target size={18} /></span>
              <div>
                <h2 className="font-black text-zinc-950">Pessoas em foco agora</h2>
                <p className="mt-0.5 text-xs text-zinc-400">Onde cuidar, desafiar ou soltar</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2.5">
              {focusPeople.map(person => (
                <button
                  type="button"
                  key={person.id}
                  onClick={() => {
                    setSearch(person.name)
                    setAttentionFilter('')
                    setRelationshipFilter('')
                    setPdiFilter('')
                  }}
                  className="group rounded-2xl border border-zinc-100 p-3.5 text-left transition hover:border-[rgba(135,0,47,0.18)] hover:bg-[#fcfaf9]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-black text-zinc-700">{initials(person.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-black text-zinc-900">{person.name}</span>
                        <ChevronRight size={14} className="text-zinc-300 group-hover:text-[var(--retro-wine)]" />
                      </span>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${attentionTone[person.attention]}`}>{person.attention}</span>
                    </span>
                  </div>
                  <span className="mt-2 block text-xs leading-5 text-zinc-500">{person.nextLeap}</span>
                  {person.risks[0] && <span className="mt-2 block text-[11px] leading-4 text-rose-600">{person.risks[0]}</span>}
                </button>
              ))}
            </div>
          </aside>
        </div>

        <section className={`${cardClass} mt-5 p-5 sm:p-6`}>
          <div className="flex items-center gap-2">
            <Sparkles size={19} className="text-[var(--retro-wine)]" />
            <div>
              <h2 className="text-lg font-black text-zinc-950">Sinais de desenvolvimento</h2>
              <p className="mt-0.5 text-xs text-zinc-400">Leitura prática do que já aconteceu e do próximo passo.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {[
              { title: 'Evidências recentes', items: signals.evidence, icon: FileCheck2, tone: 'border-emerald-100 bg-emerald-50/40 text-emerald-700' },
              { title: 'Riscos/atenções', items: signals.risks, icon: AlertTriangle, tone: 'border-amber-100 bg-amber-50/40 text-amber-700' },
              { title: 'Próximas alavancas', items: signals.levers, icon: Lightbulb, tone: 'border-blue-100 bg-blue-50/40 text-blue-700' },
            ].map(group => (
              <article key={group.title} className={`rounded-2xl border p-4 ${group.tone}`}>
                <div className="flex items-center gap-2 font-black"><group.icon size={17} /> {group.title}</div>
                <ul className="mt-4 grid gap-3">
                  {group.items.map((item, index) => (
                    <li key={`${item.person}-${index}`} className="text-xs leading-5">
                      <span className="font-black">{item.person}:</span> <span className="text-zinc-600">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>

      {oneOnOnePersonId !== null && (
        <OneOnOneModal people={people} initialPersonId={oneOnOnePersonId} onClose={() => setOneOnOnePersonId(null)} onSave={saveOneOnOne} />
      )}
    </main>
  )
}
