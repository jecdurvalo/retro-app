'use client'

import { useEffect, useState, useRef } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  X,
  UserRound,
} from 'lucide-react'
import {
  attentionTypes,
  createEmptyPerson,
  loadPeople,
  savePeople,
  type AttentionType,
  type LeadershipPerson,
  type NoteEntry,
} from '@/lib/people'

// ─── Styles ──────────────────────────────────────────────────────────────────

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const attentionTone: Record<AttentionType, string> = {
  'Dar autonomia': 'bg-emerald-50 text-emerald-700',
  Desafiar: 'bg-violet-50 text-violet-700',
  Cuidar: 'bg-rose-50 text-rose-700',
  Desenvolver: 'bg-blue-50 text-blue-700',
  'Monitorar carga': 'bg-amber-50 text-amber-700',
}

const avatarColors = [
  'bg-[rgba(135,0,47,0.10)] text-[var(--retro-wine)]',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
]

function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % avatarColors.length
  return avatarColors[hash]
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value: string) {
  if (!value) return 'Não agendado'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso))
}

function newNote(text: string): NoteEntry {
  return { id: `note-${Date.now()}-${Math.random()}`, text, createdAt: new Date().toISOString() }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoteHistory({ entries }: { entries: NoteEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  if (entries.length === 0) return <p className="text-xs text-zinc-400">Nenhum registro ainda.</p>
  const visible = expanded ? entries : entries.slice(0, 3)
  return (
    <div className="mt-3 grid gap-2">
      {visible.map(entry => (
        <div key={entry.id} className="flex gap-3 text-xs">
          <span className="shrink-0 font-bold text-zinc-400">{formatTimestamp(entry.createdAt)}</span>
          <span className="text-zinc-700">{entry.text}</span>
        </div>
      ))}
      {entries.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-1 text-left text-xs font-bold text-[var(--retro-wine)]"
        >
          {expanded ? 'Ver menos' : `+ ${entries.length - 3} mais antigas`}
        </button>
      )}
    </div>
  )
}

// ─── Person Card ─────────────────────────────────────────────────────────────

type Tab = 'geral' | 'pdi' | 'notas' | 'feedback'

function PersonCard({
  person,
  onChange,
  onDelete,
}: {
  person: LeadershipPerson
  onChange: (updated: LeadershipPerson) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('geral')

  // local draft mirrors person so we can auto-save on blur
  const [draft, setDraft] = useState(person)

  // Keep draft in sync if parent replaces the person (e.g. after note save)
  const prevId = useRef(person.id)
  if (prevId.current !== person.id) {
    setDraft(person)
    prevId.current = person.id
  }

  function save(updated: LeadershipPerson) {
    setDraft(updated)
    onChange({ ...updated, updatedAt: new Date().toISOString() })
  }

  function field<K extends keyof LeadershipPerson>(key: K) {
    return {
      value: draft[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setDraft(d => ({ ...d, [key]: e.target.value })),
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        save({ ...draft, [key]: e.target.value }),
    }
  }

  // ── PDI helpers
  const [pdiDraft, setPdiDraft] = useState(person.pdi)
  function savePdi() {
    save({ ...draft, pdi: { ...pdiDraft, updatedAt: new Date().toISOString() } })
  }

  // ── Notes / feedback helpers
  const [noteText, setNoteText] = useState('')
  const [fbText, setFbText] = useState('')

  function addNote() {
    const text = noteText.trim()
    if (!text) return
    const updated = { ...draft, notes: [newNote(text), ...draft.notes] }
    setDraft(updated)
    onChange({ ...updated, updatedAt: new Date().toISOString() })
    setNoteText('')
  }

  function addFeedback() {
    const text = fbText.trim()
    if (!text) return
    const updated = { ...draft, feedback: [newNote(text), ...draft.feedback] }
    setDraft(updated)
    onChange({ ...updated, updatedAt: new Date().toISOString() })
    setFbText('')
  }

  // ── Projects (frontIds as free-text array)
  function addProject() {
    const updated = { ...draft, frontIds: [...draft.frontIds, ''] }
    setDraft(updated)
  }

  function updateProject(index: number, value: string) {
    const next = [...draft.frontIds]
    next[index] = value
    setDraft(d => ({ ...d, frontIds: next }))
  }

  function saveProject(index: number, value: string) {
    const next = [...draft.frontIds]
    next[index] = value
    save({ ...draft, frontIds: next })
  }

  function removeProject(index: number) {
    const next = draft.frontIds.filter((_, i) => i !== index)
    save({ ...draft, frontIds: next })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'pdi', label: 'PDI' },
    { id: 'notas', label: 'Notas' },
    { id: 'feedback', label: 'Feedback' },
  ]

  return (
    <div className={`${cardClass} overflow-hidden`}>
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-zinc-50/60"
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${avatarColor(person.id)}`}>
          {initials(person.name) || <UserRound size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-black text-zinc-900">{person.name || <span className="text-zinc-400">Sem nome</span>}</span>
            <span className="text-xs text-zinc-400">{person.role}</span>
            {person.attention && (
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${attentionTone[person.attention]}`}>
                {person.attention}
              </span>
            )}
            {person.nextOneOnOne && (
              <span className="text-xs text-zinc-400">1:1 {formatDate(person.nextOneOnOne)}</span>
            )}
          </span>
        </span>
        {open ? <ChevronDown size={16} className="shrink-0 text-zinc-400" /> : <ChevronRight size={16} className="shrink-0 text-zinc-400" />}
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t border-zinc-100">
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-zinc-100 px-5 pt-3">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-t-lg px-3 py-2 text-xs font-bold transition ${
                  tab === t.id
                    ? 'border-b-2 border-[var(--retro-wine)] text-[var(--retro-wine)]'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ─── Aba: Geral ──────────────────────────────── */}
            {tab === 'geral' && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    Momento atual
                    <input type="text" placeholder="Ex: Trilha para especialista…" className={fieldClass} {...field('moment')} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    Atenção
                    <select
                      className={fieldClass}
                      value={draft.attention}
                      onChange={e => setDraft(d => ({ ...d, attention: e.target.value as AttentionType }))}
                      onBlur={e => save({ ...draft, attention: e.target.value as AttentionType })}
                    >
                      {attentionTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </div>

                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Próximo 1:1
                  <input type="date" className={`${fieldClass} max-w-[200px]`} {...field('nextOneOnOne')} />
                </label>

                <div className="grid gap-1.5">
                  <p className="text-xs font-bold text-zinc-500">Projetos</p>
                  <div className="grid gap-2">
                    {draft.frontIds.map((proj, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={proj}
                          placeholder="Nome do projeto"
                          className={fieldClass}
                          onChange={e => updateProject(i, e.target.value)}
                          onBlur={e => saveProject(i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeProject(i)}
                          className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addProject}
                      className="flex items-center gap-1.5 text-xs font-bold text-[var(--retro-wine)]"
                    >
                      <Plus size={13} /> Adicionar projeto
                    </button>
                  </div>
                </div>

                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Próximo salto
                  <textarea rows={2} placeholder="Qual é a próxima evolução esperada?" className={fieldClass} {...field('nextLeap')} />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    Alertas / riscos
                    <textarea
                      rows={3}
                      placeholder="Um risco por linha"
                      className={fieldClass}
                      value={draft.risks.join('\n')}
                      onChange={e => setDraft(d => ({ ...d, risks: e.target.value.split('\n') }))}
                      onBlur={e => save({ ...draft, risks: e.target.value.split('\n').filter(Boolean) })}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    Alavancas
                    <textarea
                      rows={3}
                      placeholder="Uma alavanca por linha"
                      className={fieldClass}
                      value={draft.levers.join('\n')}
                      onChange={e => setDraft(d => ({ ...d, levers: e.target.value.split('\n') }))}
                      onBlur={e => save({ ...draft, levers: e.target.value.split('\n').filter(Boolean) })}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ─── Aba: PDI ────────────────────────────────── */}
            {tab === 'pdi' && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    Título do PDI
                    <input
                      type="text"
                      placeholder="Ex: Especialista: influência técnica"
                      className={fieldClass}
                      value={pdiDraft.title}
                      onChange={e => setPdiDraft(d => ({ ...d, title: e.target.value }))}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                    Status
                    <select
                      className={fieldClass}
                      value={pdiDraft.status}
                      onChange={e => setPdiDraft(d => ({ ...d, status: e.target.value as 'Ativo' | 'Em revisão' | 'Sem PDI' }))}
                    >
                      <option>Ativo</option>
                      <option>Em revisão</option>
                      <option>Sem PDI</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Objetivos
                  <textarea
                    rows={3}
                    placeholder="Um objetivo por linha"
                    className={fieldClass}
                    value={pdiDraft.goals}
                    onChange={e => setPdiDraft(d => ({ ...d, goals: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Próximo passo
                  <textarea
                    rows={2}
                    placeholder="O que precisa acontecer antes do próximo 1:1?"
                    className={fieldClass}
                    value={pdiDraft.nextStep}
                    onChange={e => setPdiDraft(d => ({ ...d, nextStep: e.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  onClick={savePdi}
                  className="justify-self-start rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white"
                >
                  Salvar PDI
                </button>
              </div>
            )}

            {/* ─── Aba: Notas ──────────────────────────────── */}
            {tab === 'notas' && (
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Nova nota
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="O que observou, o que vai desafiar no próximo 1:1..."
                    className={fieldClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!noteText.trim()}
                  className="justify-self-start rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"
                >
                  Salvar nota
                </button>
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-xs font-bold text-zinc-500">Histórico</p>
                  <NoteHistory entries={draft.notes} />
                </div>
              </div>
            )}

            {/* ─── Aba: Feedback ───────────────────────────── */}
            {tab === 'feedback' && (
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
                  Novo feedback
                  <textarea
                    rows={4}
                    value={fbText}
                    onChange={e => setFbText(e.target.value)}
                    placeholder="Feedback dado ou recebido, contexto, data..."
                    className={fieldClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={addFeedback}
                  disabled={!fbText.trim()}
                  className="justify-self-start rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white disabled:opacity-40"
                >
                  Registrar feedback
                </button>
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-xs font-bold text-zinc-500">Histórico</p>
                  <NoteHistory entries={draft.feedback} />
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => onDelete(person.id)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={13} /> Remover pessoa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Person Form ─────────────────────────────────────────────────────────

function AddPersonForm({ onAdd, onCancel }: { onAdd: (p: LeadershipPerson) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [relationship, setRelationship] = useState<'Liderado direto' | 'Time negócios'>('Liderado direto')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(createEmptyPerson({ id: `person-${Date.now()}`, name: name.trim(), role: role.trim(), relationship }))
  }

  return (
    <form
      onSubmit={submit}
      className={`${cardClass} grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end`}
    >
      <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
        Nome
        <input
          autoFocus
          required
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome da pessoa"
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
        Cargo
        <input
          type="text"
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Ex: Analista sênior"
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
        Categoria
        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value as 'Liderado direto' | 'Time negócios')}
          className={fieldClass}
        >
          <option value="Liderado direto">Liderado direto</option>
          <option value="Time negócios">Time negócios</option>
        </select>
      </label>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-600 hover:bg-zinc-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="h-10 rounded-xl bg-[var(--retro-wine)] px-5 text-sm font-black text-white"
      >
        Adicionar
      </button>
    </form>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title,
  people,
  onChangePerson,
  onDeletePerson,
}: {
  title: string
  people: LeadershipPerson[]
  onChangePerson: (updated: LeadershipPerson) => void
  onDeletePerson: (id: string) => void
}) {
  if (people.length === 0) return null
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">{title}</h2>
      {people.map(person => (
        <PersonCard key={person.id} person={person} onChange={onChangePerson} onDelete={onDeletePerson} />
      ))}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PessoasPage() {
  const [people, setPeople] = useState<LeadershipPerson[]>([])
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    setPeople(loadPeople())
  }, [])

  function addPerson(p: LeadershipPerson) {
    const next = [...people, p]
    setPeople(next)
    savePeople(next)
    setShowAddForm(false)
  }

  function updatePerson(updated: LeadershipPerson) {
    const next = people.map(p => (p.id === updated.id ? updated : p))
    setPeople(next)
    savePeople(next)
  }

  function deletePerson(id: string) {
    if (!window.confirm('Remover esta pessoa?')) return
    const next = people.filter(p => p.id !== id)
    setPeople(next)
    savePeople(next)
  }

  const diretos = people.filter(p => p.relationship === 'Liderado direto')
  const negocios = people.filter(p => p.relationship === 'Time negócios')

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--retro-bg)] px-4 py-6 text-[var(--retro-ink)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Time</h1>
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"
            >
              <Plus size={16} /> Adicionar pessoa
            </button>
          )}
        </header>

        {/* Add form */}
        {showAddForm && (
          <div className="mt-5">
            <AddPersonForm onAdd={addPerson} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {/* Empty state */}
        {people.length === 0 && !showAddForm && (
          <div className={`${cardClass} mt-8 grid place-items-center py-16 text-center`}>
            <UserRound size={32} className="text-zinc-300" />
            <p className="mt-4 font-black text-zinc-800">Nenhuma pessoa ainda</p>
            <p className="mt-1 text-sm text-zinc-400">Adicione os membros do seu time para começar.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white"
            >
              <Plus size={15} /> Adicionar pessoa
            </button>
          </div>
        )}

        {/* Sections */}
        {people.length > 0 && (
          <div className="mt-7 grid gap-8">
            <Section title="Liderados diretos" people={diretos} onChangePerson={updatePerson} onDeletePerson={deletePerson} />
            <Section title="Time negócios" people={negocios} onChangePerson={updatePerson} onDeletePerson={deletePerson} />
          </div>
        )}
      </div>
    </main>
  )
}
