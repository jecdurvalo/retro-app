'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Plus, Target, UserRound } from 'lucide-react'
import {
  createEmptyPerson,
  loadPeople,
  savePeople,
  type LeadershipPerson,
} from '@/lib/people'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/ui/page-header'
import { QuickAddModal } from '@/components/ui/quick-add-modal'
import { attentionTone, cardClass, fieldClass, formatDate, initials } from '@/components/people-shared'

// ─── Person row (summary, links to the dedicated profile page) ───────────────

function PersonRow({ person }: { person: LeadershipPerson }) {
  const hasOneOnOne = Boolean(person.nextOneOnOne)
  const hasPdi = person.pdi.status !== 'Sem PDI'

  return (
    <Link
      href={`/pessoas/${person.id}`}
      className={`flex items-center gap-3.5 border-l-[3px] border-[var(--retro-wine)] px-5 py-4 text-left transition hover:bg-zinc-50 ${cardClass}`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--retro-wine-soft)] text-sm font-black text-[var(--retro-wine)]">
        {initials(person.name) || <UserRound size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-black text-zinc-900">{person.name || <span className="text-zinc-400">Sem nome</span>}</span>
          {person.role && <span className="text-sm font-medium text-zinc-500">{person.role}</span>}
          {person.attention && (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${attentionTone[person.attention]}`}>
              {person.attention}
            </span>
          )}
        </span>
        {(person.visionSummary || person.moment || person.nextLeap) && (
          <span className="mt-1 block truncate text-xs font-semibold text-zinc-500">
            {person.visionSummary || person.moment || person.nextLeap}
          </span>
        )}
      </span>
      <span className="hidden shrink-0 items-center gap-2 sm:flex">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            hasOneOnOne ? 'bg-[var(--retro-wine-soft)] text-[var(--retro-wine)]' : 'bg-amber-50 text-amber-600'
          }`}
        >
          <CalendarDays size={12} /> {hasOneOnOne ? formatDate(person.nextOneOnOne) : 'Sem 1:1'}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            hasPdi ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
          }`}
        >
          <Target size={12} /> {person.pdi.status}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-zinc-400" />
    </Link>
  )
}

// ─── Add Person Form ─────────────────────────────────────────────────────────

function AddPersonForm({ onAdd }: { onAdd: (p: LeadershipPerson) => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [relationship, setRelationship] = useState<'Liderado direto' | 'Time negócios'>('Liderado direto')
  const canSubmit = name.trim().length > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onAdd(createEmptyPerson({ id: `person-${Date.now()}`, name: name.trim(), role: role.trim(), relationship }))
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Nome</label>
        <input
          autoFocus
          required
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome da pessoa"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Cargo</label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Ex: Analista sênior"
            className={fieldClass}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Categoria</label>
          <Select
            value={relationship}
            options={['Liderado direto', 'Time negócios']}
            onChange={value => setRelationship(value as 'Liderado direto' | 'Time negócios')}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="justify-self-end rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Criar perfil
      </button>
    </form>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, people }: { title: string; people: LeadershipPerson[] }) {
  if (people.length === 0) return null
  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{title}</h2>
        <div className="flex-1 border-t border-zinc-100" />
      </div>
      {people.map(person => (
        <PersonRow key={person.id} person={person} />
      ))}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PessoasPage() {
  const [people, setPeople] = useState<LeadershipPerson[]>([])

  useEffect(() => {
    let active = true
    loadPeople().then(value => {
      if (active) setPeople(value)
    })
    return () => {
      active = false
    }
  }, [])

  function addPerson(p: LeadershipPerson) {
    const next = [...people, p]
    setPeople(next)
    void savePeople(next)
  }

  const diretos = people.filter(p => p.relationship === 'Liderado direto')
  const negocios = people.filter(p => p.relationship === 'Time negócios')
  const pdisAtivos = people.filter(p => p.pdi.status !== 'Sem PDI').length
  const umAUmAgendados = people.filter(p => p.nextOneOnOne).length
  const pessoasEmAtencao = people.filter(p => p.attention === 'Cuidar' || p.attention === 'Monitorar carga').length

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-zinc-900 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <PageHeader
          eyebrow="Perfis do time"
          title="Pessoas e desenvolvimento"
          subtitle="Acompanhe 1:1s, momento atual, PDI, riscos e alavancas para liderar com contexto e cobrar o essencial."
          action={
            <QuickAddModal
              title="Nova pessoa"
              triggerLabel="Nova pessoa"
              renderTrigger={open => (
                <button
                  type="button"
                  onClick={open}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[var(--retro-wine-hover)]"
                >
                  <Plus size={15} /> Nova pessoa
                </button>
              )}
            >
              {close => (
                <AddPersonForm
                  onAdd={p => {
                    addPerson(p)
                    close()
                  }}
                />
              )}
            </QuickAddModal>
          }
          stats={[
            { label: 'Pessoas', value: people.length, detail: 'perfis acompanhados' },
            { label: '1:1s', value: umAUmAgendados, detail: 'com data marcada' },
            { label: 'PDIs', value: pdisAtivos, detail: 'ativos ou em revisão' },
            { label: 'Atenção', value: pessoasEmAtencao, detail: 'cuidado ou carga' },
          ]}
        />

        {/* Empty state */}
        {people.length === 0 && (
          <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center shadow-sm">
            <UserRound size={36} className="text-zinc-300" />
            <p className="mt-4 font-black text-zinc-900">Nenhum perfil de pessoa ainda</p>
            <p className="mt-1 max-w-sm text-sm font-semibold text-zinc-400">
              Comece pelos liderados diretos: momento, próximo 1:1 e alavanca de desenvolvimento.
            </p>
            <div className="mt-6">
              <QuickAddModal
                title="Nova pessoa"
                triggerLabel="Criar primeiro perfil"
                renderTrigger={open => (
                  <button
                    type="button"
                    onClick={open}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
                  >
                    <Plus size={15} /> Criar primeiro perfil
                  </button>
                )}
              >
                {close => (
                  <AddPersonForm
                    onAdd={p => {
                      addPerson(p)
                      close()
                    }}
                  />
                )}
              </QuickAddModal>
            </div>
          </div>
        )}

        {/* Sections */}
        {people.length > 0 && (
          <div className="mt-7 grid gap-8">
            <Section title="Liderados diretos" people={diretos} />
            <Section title="Parceiros de negócio" people={negocios} />
          </div>
        )}
      </div>
    </main>
  )
}
