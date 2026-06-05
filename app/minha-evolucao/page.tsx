'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  Link2,
  Plus,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react'
import {
  createEmptyEvidence,
  evolutionAreas,
  leadershipPrinciples,
  loadEvolutionData,
  saveEvolutionEvidence,
  type EvolutionArea,
  type EvolutionEvidence,
  type LeadershipPrinciple,
} from '@/lib/evolution'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { loadPeople, type LeadershipPerson } from '@/lib/people'

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]'

const areaTone: Record<EvolutionArea, string> = {
  'Modelo de gestão': 'bg-rose-50 text-rose-700',
  'Desenvolvimento do time': 'bg-violet-50 text-violet-700',
  'Exposição estratégica': 'bg-amber-50 text-amber-700',
  'Governança e decisões': 'bg-emerald-50 text-emerald-700',
}

const centralizationPoints = [
  {
    title: 'Critérios de decisão ainda ficam muito implícitos',
    description: 'Transforme contexto em critérios claros para o time decidir sem depender de validação a cada passo.',
  },
  {
    title: 'Cobrança tende a aparecer tarde',
    description: 'Use checkpoints curtos de frente, FCA e task para cobrar antes do atraso virar surpresa.',
  },
  {
    title: 'Desenvolvimento precisa virar evidência',
    description: 'Conecte 1:1s, PDIs e temas da retro a fatos observáveis de evolução do time.',
  },
]

const commitments = [
  'Toda frente ativa precisa ter dono, próximo passo e checkpoint.',
  'Todo ponto relevante da retro deve virar frente, task, FCA, decisão ou evidência de desenvolvimento.',
  'Todo FCA aberto deve ter ação corretiva, responsável e prazo.',
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
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
          onSave({ ...draft, description: draft.description.trim(), learning: draft.learning.trim() })
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
            <select value={draft.area} onChange={event => set('area', event.target.value as EvolutionArea)} className={fieldClass}>
              {evolutionAreas.map(area => <option key={area}>{area}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Princípio
            <select
              value={draft.principle}
              onChange={event => set('principle', event.target.value as LeadershipPrinciple)}
              className={fieldClass}
            >
              {leadershipPrinciples.map(principle => <option key={principle}>{principle}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
            Data
            <input required type="date" value={draft.date} onChange={event => set('date', event.target.value)} className={fieldClass} />
          </label>
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2">
            <summary className="cursor-pointer text-sm font-black text-zinc-700">Detalhes opcionais</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Pessoa conectada
                <select value={draft.personId} onChange={event => set('personId', event.target.value)} className={fieldClass}>
                  <option value="">Nenhuma</option>
                  {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                Frente conectada
                <select value={draft.frontId} onChange={event => set('frontId', event.target.value)} className={fieldClass}>
                  <option value="">Nenhuma</option>
                  {fronts.map(front => <option key={front.id} value={front.id}>{front.name}</option>)}
                </select>
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

export default function MinhaEvolucaoPage() {
  const [evidence, setEvidence] = useState<EvolutionEvidence[]>(() => loadEvolutionData().evidences)
  const [fronts] = useState<ManagementFront[]>(loadFronts)
  const [people] = useState<LeadershipPerson[]>(loadPeople)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [areaFilter, setAreaFilter] = useState('')
  const [principleFilter, setPrincipleFilter] = useState('')
  const [expandedAreas, setExpandedAreas] = useState<EvolutionArea[]>([])
  const [showModal, setShowModal] = useState(false)
  const [saved, setSaved] = useState(false)

  const frontById = useMemo(() => new Map(fronts.map(front => [front.id, front.name])), [fronts])
  const personById = useMemo(() => new Map(people.map(person => [person.id, person.name])), [people])
  const filteredEvidence = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return evidence.filter(item => {
      const searchable = [
        item.description,
        item.area,
        item.principle,
        item.learning,
        item.decision,
        item.ritual,
        frontById.get(item.frontId) || '',
        personById.get(item.personId) || '',
      ].join(' ').toLocaleLowerCase('pt-BR')
      return (!term || searchable.includes(term)) && (!areaFilter || item.area === areaFilter) && (!principleFilter || item.principle === principleFilter)
    })
  }, [areaFilter, evidence, frontById, personById, principleFilter, search])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const evidenceThisMonth = evidence.filter(item => item.date.startsWith(currentMonth)).length
  const developedPeople = new Set(evidence.map(item => item.personId).filter(Boolean)).size
  const activePdis = people.filter(person => person.pdi?.status !== 'Sem PDI').length

  function saveNewEvidence(item: EvolutionEvidence) {
    const next = [item, ...evidence]
    setEvidence(next)
    saveEvolutionEvidence(next)
    setShowModal(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 3000)
  }

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-7 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Minha Evolução</h1>
            <p className="mt-2 text-sm text-zinc-500">Evidências de gestão, desenvolvimento e próximos focos como líder.</p>
          </div>
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
        </header>

        {saved && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <Check size={17} /> Evidência salva e conectada à sua evolução.
          </div>
        )}

        {showFilters && (
          <section aria-label="Filtros de evidências" className={`${cardClass} mt-4 grid gap-3 p-4 sm:grid-cols-2`}>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Área
              <select value={areaFilter} onChange={event => setAreaFilter(event.target.value)} className={fieldClass}>
                <option value="">Todas as áreas</option>
                {evolutionAreas.map(area => <option key={area}>{area}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Princípio
              <select value={principleFilter} onChange={event => setPrincipleFilter(event.target.value)} className={fieldClass}>
                <option value="">Todos os princípios</option>
                {leadershipPrinciples.map(principle => <option key={principle}>{principle}</option>)}
              </select>
            </label>
          </section>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Evidências do mês', String(evidenceThisMonth), BookOpenCheck, 'Fatos registrados no ciclo'],
            ['Pessoas desenvolvidas', String(developedPeople), UsersRound, 'Com evidências conectadas'],
            ['Pontos de atenção', '3', Target, 'Focos para descentralizar'],
            ['PDI em andamento', String(activePdis), UserRoundCheck, 'Do time acompanhado'],
          ].map(([label, value, Icon, detail]) => (
            <article key={String(label)} className={`${cardClass} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-bold text-zinc-500">{String(label)}</p><p className="mt-2 text-3xl font-black">{String(value)}</p></div>
                <span className="rounded-2xl bg-rose-50 p-3 text-[var(--retro-wine)]"><Icon size={20} /></span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{String(detail)}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-black">Evidências de evolução</h2><p className="mt-1 text-sm text-zinc-500">Fatos observáveis, organizados por área.</p></div>
              <Sparkles size={20} className="text-[var(--retro-wine)]" />
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
                        const connections = [frontById.get(item.frontId), personById.get(item.personId), item.decision, item.ritual].filter(Boolean)
                        return (
                          <article key={item.id} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-4">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm font-bold leading-6 text-zinc-800">{item.description}</p>
                              <time className="shrink-0 text-xs text-zinc-400">{formatDate(item.date)}</time>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--retro-wine)] ring-1 ring-zinc-100">{item.principle}</span>
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
                        <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
                          Nenhuma evidência nesta área. Registre um fato observável quando ele acontecer.
                        </div>
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
          </section>

          <div className="grid content-start gap-6">
            <section className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2"><Target size={19} className="text-[var(--retro-wine)]" /><h2 className="text-lg font-black">Onde ainda centralizo</h2></div>
              <div className="mt-4 divide-y divide-zinc-100">
                {centralizationPoints.map(item => (
                  <article key={item.title} className="py-3 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-black">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2"><CalendarDays size={19} className="text-[var(--retro-wine)]" /><h2 className="text-lg font-black">Compromissos propostos</h2></div>
              <ul className="mt-4 grid gap-3">
                {commitments.map(item => <li key={item} className="flex gap-2 text-sm leading-5 text-zinc-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{item}</li>)}
              </ul>
            </section>
          </div>
        </div>

        <section className={`${cardClass} mt-6 grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr]`}>
          <div>
            <div className="flex items-center gap-2"><BookOpenCheck size={19} className="text-[var(--retro-wine)]" /><h2 className="text-lg font-black">Minha leitura atual</h2></div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              Avancei em governança e exposição estratégica. O próximo salto é transformar contexto e critérios em autonomia real para o time, sem voltar a centralizar quando a pressão aumenta.
            </p>
          </div>
          <div className="border-t border-zinc-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
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

        <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--retro-wine)] p-5 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Próximo passo</p><p className="mt-1 font-bold">Registre uma evidência observável da semana e conecte ao contexto.</p></div>
          <button type="button" onClick={() => setShowModal(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--retro-wine)]">
            Registrar evidência <ArrowRight size={16} />
          </button>
        </aside>
      </div>

      {showModal && <EvidenceModal fronts={fronts} people={people} onClose={() => setShowModal(false)} onSave={saveNewEvidence} />}
    </main>
  )
}
