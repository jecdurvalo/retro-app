'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
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

const cardClass = 'overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5 transition hover:shadow-md'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const attentionTone: Record<AttentionType, string> = {
  'Dar autonomia': 'bg-emerald-100 text-emerald-800',
  Desafiar: 'bg-violet-100 text-violet-800',
  Cuidar: 'bg-rose-100 text-rose-800',
  Desenvolver: 'bg-blue-100 text-blue-800',
  'Monitorar carga': 'bg-amber-100 text-amber-800',
}

const avatarColors = [
  'bg-rose-100 text-rose-700',
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
    <div className="mt-3 grid gap-4">
      {visible.map(entry => (
        <div key={entry.id}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 shrink-0">
              {formatTimestamp(entry.createdAt)}
            </span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>
          <p className="text-sm text-zinc-700">{entry.text}</p>
        </div>
      ))}
      {entries.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-left text-xs font-semibold text-zinc-500 hover:text-zinc-800"
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
  const profileSignals = [
    { label: 'Próximo 1:1', value: formatDate(person.nextOneOnOne) },
    { label: 'PDI', value: person.pdi.status },
    { label: 'Notas', value: String(person.notes.length) },
    { label: 'Feedbacks', value: String(person.feedback.length) },
  ]

  return (
    <div className={cardClass}>
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 border-l-4 border-[var(--retro-wine)] px-5 py-4 text-left transition hover:bg-zinc-50"
      >
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${avatarColor(person.id)}`}>
          {initials(person.name) || <UserRound size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-black text-zinc-900">{person.name || <span className="text-zinc-400">Sem nome</span>}</span>
            {person.role && <span className="text-sm text-zinc-500">{person.role}</span>}
            {person.attention && (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${attentionTone[person.attention]}`}>
                {person.attention}
              </span>
            )}
            {person.nextOneOnOne && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400">
                <CalendarDays size={12} />
                1:1 {formatDate(person.nextOneOnOne)}
              </span>
            )}
          </span>
          {(person.moment || person.nextLeap) && (
            <span className="mt-1 block truncate text-xs font-semibold text-zinc-500">
              {person.moment || person.nextLeap}
            </span>
          )}
        </span>
        {open
          ? <ChevronDown size={16} className="shrink-0 text-zinc-400" />
          : <ChevronRight size={16} className="shrink-0 text-zinc-400" />
        }
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t border-zinc-100">
          <div className="bg-[linear-gradient(135deg,#fff,#f8f1f4)] px-5 py-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--retro-wine)]">Perfil de desenvolvimento</p>
                <h3 className="mt-2 text-xl font-black text-zinc-950">{person.name || 'Pessoa sem nome'}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
                  {person.moment || 'Defina o momento atual para transformar este card em um perfil de liderança.'}
                </p>
                {person.nextLeap && (
                  <div className="mt-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm">
                    <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-400">
                      <Target size={13} />
                      Próximo salto
                    </p>
                    <p className="mt-1 text-sm font-bold leading-5 text-zinc-800">{person.nextLeap}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {profileSignals.map(signal => (
                  <div key={signal.label} className="rounded-2xl border border-white bg-white/85 p-3 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{signal.label}</p>
                    <p className="mt-1 truncate text-sm font-black text-zinc-900">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {(person.risks.filter(Boolean).length > 0 || person.levers.filter(Boolean).length > 0) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {person.risks.filter(Boolean).length > 0 && (
                  <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-rose-500">Riscos</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-zinc-600">{person.risks.filter(Boolean).slice(0, 2).join(' · ')}</p>
                  </div>
                )}
                {person.levers.filter(Boolean).length > 0 && (
                  <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-600">Alavancas</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-zinc-600">{person.levers.filter(Boolean).slice(0, 2).join(' · ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 px-5 pt-4 pb-0">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? 'bg-[var(--retro-wine)] text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-b-3xl bg-zinc-50/70 p-5">
            {/* ─── Aba: Geral ──────────────────────────────── */}
            {tab === 'geral' && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                      Momento atual
                    </label>
                    <input type="text" placeholder="Ex: Trilha para especialista…" className={fieldClass} {...field('moment')} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                      Atenção
                    </label>
                    <select
                      className={fieldClass}
                      value={draft.attention}
                      onChange={e => setDraft(d => ({ ...d, attention: e.target.value as AttentionType }))}
                      onBlur={e => save({ ...draft, attention: e.target.value as AttentionType })}
                    >
                      {attentionTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                    Próximo 1:1
                  </label>
                  <input type="date" className={`${fieldClass} max-w-[200px]`} {...field('nextOneOnOne')} />
                </div>

                <div className="grid gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">Projetos</p>
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
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                    >
                      <Plus size={13} /> Adicionar projeto
                    </button>
                  </div>
                </div>

                <div className="grid gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                    Próximo salto
                  </label>
                  <textarea rows={2} placeholder="Qual é a próxima evolução esperada?" className={fieldClass} {...field('nextLeap')} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                      Alertas / riscos
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Um risco por linha"
                      className={fieldClass}
                      value={draft.risks.join('\n')}
                      onChange={e => setDraft(d => ({ ...d, risks: e.target.value.split('\n') }))}
                      onBlur={e => save({ ...draft, risks: e.target.value.split('\n').filter(Boolean) })}
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                      Alavancas
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Uma alavanca por linha"
                      className={fieldClass}
                      value={draft.levers.join('\n')}
                      onChange={e => setDraft(d => ({ ...d, levers: e.target.value.split('\n') }))}
                      onBlur={e => save({ ...draft, levers: e.target.value.split('\n').filter(Boolean) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Aba: PDI ────────────────────────────────── */}
            {tab === 'pdi' && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                      Título do PDI
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Especialista: influência técnica"
                      className={fieldClass}
                      value={pdiDraft.title}
                      onChange={e => setPdiDraft(d => ({ ...d, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                      Status
                    </label>
                    <select
                      className={fieldClass}
                      value={pdiDraft.status}
                      onChange={e => setPdiDraft(d => ({ ...d, status: e.target.value as 'Ativo' | 'Em revisão' | 'Sem PDI' }))}
                    >
                      <option>Ativo</option>
                      <option>Em revisão</option>
                      <option>Sem PDI</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                    Objetivos
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Um objetivo por linha"
                    className={fieldClass}
                    value={pdiDraft.goals}
                    onChange={e => setPdiDraft(d => ({ ...d, goals: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                    Próximo passo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="O que precisa acontecer antes do próximo 1:1?"
                    className={fieldClass}
                    value={pdiDraft.nextStep}
                    onChange={e => setPdiDraft(d => ({ ...d, nextStep: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={savePdi}
                  className="justify-self-start rounded-xl bg-[var(--retro-wine)] px-5 py-2 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
                >
                  Salvar PDI
                </button>
              </div>
            )}

            {/* ─── Aba: Notas ──────────────────────────────── */}
            {tab === 'notas' && (
              <div className="grid gap-4">
                <div className="grid gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                    Nova nota
                  </label>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="O que observou, o que vai desafiar no próximo 1:1..."
                    className={fieldClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!noteText.trim()}
                  className="justify-self-start rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)] disabled:opacity-40"
                >
                  Salvar nota
                </button>
                <div className="border-t border-zinc-200 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">Histórico</p>
                  <NoteHistory entries={draft.notes} />
                </div>
              </div>
            )}

            {/* ─── Aba: Feedback ───────────────────────────── */}
            {tab === 'feedback' && (
              <div className="grid gap-4">
                <div className="grid gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
                    Novo feedback
                  </label>
                  <textarea
                    rows={4}
                    value={fbText}
                    onChange={e => setFbText(e.target.value)}
                    placeholder="Feedback dado ou recebido, contexto, data..."
                    className={fieldClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={addFeedback}
                  disabled={!fbText.trim()}
                  className="justify-self-start rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)] disabled:opacity-40"
                >
                  Registrar feedback
                </button>
                <div className="border-t border-zinc-200 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">Histórico</p>
                  <NoteHistory entries={draft.feedback} />
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end border-t border-zinc-200 pt-4">
              <button
                type="button"
                onClick={() => onDelete(person.id)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50"
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
      className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-md shadow-zinc-950/5 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end"
    >
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
        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value as 'Liderado direto' | 'Time negócios')}
          className={fieldClass}
        >
          <option value="Liderado direto">Liderado direto</option>
          <option value="Time negócios">Time negócios</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="h-10 rounded-xl bg-[var(--retro-wine)] px-5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
      >
        Criar perfil
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
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{title}</h2>
        <div className="flex-1 border-t border-zinc-100" />
      </div>
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
    const frame = window.requestAnimationFrame(() => {
      setPeople(loadPeople())
    })

    return () => window.cancelAnimationFrame(frame)
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
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-md shadow-zinc-950/5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--retro-blue),var(--retro-green),var(--retro-amber),var(--retro-wine))]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--retro-wine)]">Perfis do time</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Pessoas e desenvolvimento</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
                Acompanhe 1:1s, momento atual, PDI, riscos e alavancas para liderar com contexto e cobrar o essencial.
              </p>
            </div>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[var(--retro-wine-hover)]"
              >
                <Plus size={15} /> Nova pessoa
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              ['Pessoas', people.length, 'perfis acompanhados'],
              ['1:1s', umAUmAgendados, 'com data marcada'],
              ['PDIs', pdisAtivos, 'ativos ou em revisão'],
              ['Atenção', pessoasEmAtencao, 'cuidado ou carga'],
            ].map(([label, value, detail]) => (
              <div key={String(label)} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{String(label)}</p>
                <p className="mt-1 text-2xl font-black text-zinc-950">{Number(value)}</p>
                <p className="mt-0.5 text-xs font-semibold text-zinc-500">{String(detail)}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Add form */}
        {showAddForm && (
          <div className="mt-5">
            <AddPersonForm onAdd={addPerson} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {/* Empty state */}
        {people.length === 0 && !showAddForm && (
          <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center shadow-sm">
            <UserRound size={36} className="text-zinc-300" />
            <p className="mt-4 font-black text-zinc-900">Nenhum perfil de pessoa ainda</p>
            <p className="mt-1 max-w-sm text-sm font-semibold text-zinc-400">
              Comece pelos liderados diretos: momento, próximo 1:1 e alavanca de desenvolvimento.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
            >
              <Plus size={15} /> Criar primeiro perfil
            </button>
          </div>
        )}

        {/* Sections */}
        {people.length > 0 && (
          <div className="mt-7 grid gap-8">
            <Section title="Liderados diretos" people={diretos} onChangePerson={updatePerson} onDeletePerson={deletePerson} />
            <Section title="Parceiros de negócio" people={negocios} onChangePerson={updatePerson} onDeletePerson={deletePerson} />
          </div>
        )}
      </div>
    </main>
  )
}
