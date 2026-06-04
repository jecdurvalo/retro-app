'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Archive,
  Check,
} from 'lucide-react'
import {
  createEmptyFront,
  createEmptyFCA,
  frontTemperatures,
  frontTypes,
  loadFronts,
  saveFronts,
  fcaStatuses,
  type ManagementFront,
  type FCA,
} from '@/lib/fronts'
import {
  createEmptyTask,
  loadTasks,
  saveTasks,
  taskStatuses,
  type Task,
} from '@/lib/tasks'

const cardClass = 'rounded-3xl border border-black/5 bg-white shadow-sm'
const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]'

const temperatureTone: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-50 text-emerald-700',
  Atenção: 'bg-amber-50 text-amber-700',
  Crítica: 'bg-rose-50 text-rose-700',
}

const temperatureDot: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-500',
  Atenção: 'bg-amber-400',
  Crítica: 'bg-rose-500',
}

const taskStatusTone: Record<Task['status'], string> = {
  Aberta: 'bg-zinc-100 text-zinc-600',
  'Em andamento': 'bg-blue-50 text-blue-700',
  Concluída: 'bg-emerald-50 text-emerald-700',
}

const fcaStatusTone: Record<FCA['status'], string> = {
  'Em andamento': 'bg-blue-50 text-blue-700',
  Concluído: 'bg-emerald-50 text-emerald-700',
  Bloqueado: 'bg-rose-50 text-rose-700',
}

function formatDateShort(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  )
}

// ─── New Front Form ───────────────────────────────────────────────────────────

type NewFrontDraft = { name: string; type: ManagementFront['type']; temperature: ManagementFront['temperature'] }

function NewFrontForm({ onCancel, onSave }: { onCancel: () => void; onSave: (draft: NewFrontDraft) => void }) {
  const [draft, setDraft] = useState<NewFrontDraft>({ name: '', type: 'Projeto', temperature: 'Saudável' })
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  return (
    <form
      className={`${cardClass} mb-4 p-4`}
      onSubmit={e => {
        e.preventDefault()
        if (!draft.name.trim()) return
        onSave(draft)
      }}
    >
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--retro-wine)]">Nova frente</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-xs font-bold text-zinc-500 sm:col-span-1">
          Nome
          <input
            ref={nameRef}
            required
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Nome da frente"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          Tipo
          <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value as ManagementFront['type'] }))} className={fieldClass}>
            {(['Projeto', 'Processo', 'Risco', 'PDI', 'Governança', 'Oportunidade', 'Rotina'] as const).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          Temperatura
          <select value={draft.temperature} onChange={e => setDraft(d => ({ ...d, temperature: e.target.value as ManagementFront['temperature'] }))} className={fieldClass}>
            {frontTemperatures.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50">
          Cancelar
        </button>
        <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2 text-sm font-black text-white shadow-md shadow-[rgba(135,0,47,0.18)]">
          Criar frente
        </button>
      </div>
    </form>
  )
}

// ─── FCA Form ─────────────────────────────────────────────────────────────────

function FcaForm({ onCancel, onSave }: { onCancel: () => void; onSave: (fca: FCA) => void }) {
  const [draft, setDraft] = useState<FCA>(createEmptyFCA())
  const set = <K extends keyof FCA>(key: K, val: FCA[K]) => setDraft(d => ({ ...d, [key]: val }))

  return (
    <form
      className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
      onSubmit={e => {
        e.preventDefault()
        if (!draft.fact.trim() || !draft.action.trim()) return
        onSave({ ...draft, updatedAt: new Date().toISOString() })
      }}
    >
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-[var(--retro-wine)]">Novo FCA</p>
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          Fato (o que aconteceu, com evidência)
          <textarea required rows={2} value={draft.fact} onChange={e => set('fact', e.target.value)} className={fieldClass} />
        </label>
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          Causa (por que aconteceu)
          <textarea rows={2} value={draft.cause} onChange={e => set('cause', e.target.value)} className={fieldClass} />
        </label>
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          Ação (o que será feito)
          <textarea required rows={2} value={draft.action} onChange={e => set('action', e.target.value)} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold text-zinc-500">
            Responsável
            <input value={draft.owner} onChange={e => set('owner', e.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-zinc-500">
            Prazo
            <input type="date" value={draft.dueDate} onChange={e => set('dueDate', e.target.value)} className={fieldClass} />
          </label>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50">
          Cancelar
        </button>
        <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-5 py-2 text-sm font-black text-white shadow-md shadow-[rgba(135,0,47,0.18)]">
          Salvar FCA
        </button>
      </div>
    </form>
  )
}

// ─── FCA Item ─────────────────────────────────────────────────────────────────

function FcaItem({ fca, onStatusChange }: { fca: FCA; onStatusChange: (status: FCA['status']) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-3">
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setExpanded(v => !v)} className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-700">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-zinc-800 truncate">{fca.fact || '(sem fato)'}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${fcaStatusTone[fca.status]}`}>{fca.status}</span>
            {fca.owner && <span className="text-xs text-zinc-500">{fca.owner}</span>}
            {fca.dueDate && <span className="text-xs text-zinc-400">{formatDateShort(fca.dueDate)}</span>}
          </div>
          {expanded && (
            <div className="mt-3 grid gap-2 text-sm">
              {fca.fact && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Fato</p>
                  <p className="mt-0.5 text-zinc-700">{fca.fact}</p>
                </div>
              )}
              {fca.cause && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Causa</p>
                  <p className="mt-0.5 text-zinc-700">{fca.cause}</p>
                </div>
              )}
              {fca.action && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Ação</p>
                  <p className="mt-0.5 text-zinc-700">{fca.action}</p>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">Status:</span>
                <select
                  value={fca.status}
                  onChange={e => onStatusChange(e.target.value as FCA['status'])}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold outline-none focus:border-[var(--retro-wine)]"
                >
                  {fcaStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onChange }: { task: Task; onChange: (updated: Task) => void }) {
  const done = task.status === 'Concluída'
  return (
    <div className="flex items-center gap-2 py-1.5">
      <button
        type="button"
        aria-label={done ? 'Marcar como aberta' : 'Marcar como concluída'}
        onClick={() => onChange({ ...task, status: done ? 'Aberta' : 'Concluída', updatedAt: new Date().toISOString() })}
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 bg-white text-transparent'}`}
      >
        <Check size={11} strokeWidth={3} />
      </button>
      <span className={`flex-1 text-sm ${done ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>{task.text}</span>
      {task.dueDate && <span className="text-xs text-zinc-400 shrink-0">{formatDateShort(task.dueDate)}</span>}
      {task.assignee && <span className="text-xs text-zinc-500 shrink-0">{task.assignee}</span>}
      <select
        value={task.status}
        onChange={e => onChange({ ...task, status: e.target.value as Task['status'], updatedAt: new Date().toISOString() })}
        className={`rounded-full px-2 py-0.5 text-xs font-bold outline-none ${taskStatusTone[task.status]}`}
      >
        {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}

// ─── Quick Add Task ───────────────────────────────────────────────────────────

function QuickAddTask({ frontId, onAdd }: { frontId: string; onAdd: (task: Task) => void }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(createEmptyTask({ text: text.trim(), dueDate, assignee, frontId }))
    setText('')
    setDueDate('')
    setAssignee('')
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-center gap-2">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Nova task..."
        className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)]"
      />
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--retro-wine)]"
      />
      <input
        value={assignee}
        onChange={e => setAssignee(e.target.value)}
        placeholder="Responsável"
        className="w-32 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--retro-wine)]"
      />
      <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-sm font-black text-white shadow-sm shadow-[rgba(135,0,47,0.18)]">
        Add
      </button>
    </form>
  )
}

// ─── Front Card ───────────────────────────────────────────────────────────────

function FrontCard({
  front,
  tasks,
  onUpdateFront,
  onArchive,
  onAddTask,
  onUpdateTask,
}: {
  front: ManagementFront
  tasks: Task[]
  onUpdateFront: (f: ManagementFront) => void
  onArchive: (f: ManagementFront) => void
  onAddTask: (t: Task) => void
  onUpdateTask: (t: Task) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showFcaForm, setShowFcaForm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(front.name)

  const frontTasks = tasks.filter(t => t.frontId === front.id)

  const saveName = () => {
    if (nameDraft.trim() && nameDraft.trim() !== front.name) {
      onUpdateFront({ ...front, name: nameDraft.trim(), updatedAt: new Date().toISOString() })
    }
    setEditingName(false)
  }

  const addFca = (fca: FCA) => {
    onUpdateFront({ ...front, fcas: [...(front.fcas ?? []), fca], updatedAt: new Date().toISOString() })
    setShowFcaForm(false)
  }

  const updateFcaStatus = (fcaId: string, status: FCA['status']) => {
    onUpdateFront({
      ...front,
      fcas: (front.fcas ?? []).map(f => f.id === fcaId ? { ...f, status, updatedAt: new Date().toISOString() } : f),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm">
      {/* Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${temperatureDot[front.temperature]}`} aria-hidden />
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setExpanded(v => !v)}
        >
          <span className="block truncate font-black text-zinc-900">{front.name}</span>
          {front.description && !expanded && (
            <span className="block truncate text-xs text-zinc-400 mt-0.5">{front.description}</span>
          )}
        </button>
        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-bold sm:block ${temperatureTone[front.temperature]}`}>
          {front.temperature}
        </span>
        <select
          value={front.temperature}
          onChange={e => onUpdateFront({ ...front, temperature: e.target.value as ManagementFront['temperature'], updatedAt: new Date().toISOString() })}
          className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-[var(--retro-wine)] sm:hidden"
          aria-label="Temperatura"
        >
          {frontTemperatures.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 text-zinc-400 hover:text-zinc-700"
          aria-label={expanded ? 'Colapsar' : 'Expandir'}
        >
          {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3">
          {/* Description + edit name */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {editingName ? (
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameDraft(front.name); setEditingName(false) } }}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-black text-zinc-900 outline-none focus:border-[var(--retro-wine)]"
                />
              ) : (
                <p className="text-sm text-zinc-600">{front.description || <span className="text-zinc-400 italic">Sem descrição</span>}</p>
              )}
            </div>
            {!editingName && (
              <button
                type="button"
                onClick={() => { setNameDraft(front.name); setEditingName(true) }}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                Editar nome
              </button>
            )}
          </div>

          {/* Temperature select (always visible on desktop too when expanded) */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">Temperatura:</span>
            <select
              value={front.temperature}
              onChange={e => onUpdateFront({ ...front, temperature: e.target.value as ManagementFront['temperature'], updatedAt: new Date().toISOString() })}
              className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-[var(--retro-wine)]"
            >
              {frontTemperatures.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* ── FCAs ── */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">FCAs</p>
              <button
                type="button"
                onClick={() => setShowFcaForm(v => !v)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--retro-wine)] hover:bg-[rgba(135,0,47,0.06)]"
              >
                <Plus size={13} /> Criar FCA
              </button>
            </div>

            {showFcaForm && <FcaForm onCancel={() => setShowFcaForm(false)} onSave={addFca} />}

            {(front.fcas ?? []).length > 0 && (
              <div className="mt-2 grid gap-2">
                {(front.fcas ?? []).map(fca => (
                  <FcaItem key={fca.id} fca={fca} onStatusChange={status => updateFcaStatus(fca.id, status)} />
                ))}
              </div>
            )}
            {(front.fcas ?? []).length === 0 && !showFcaForm && (
              <p className="mt-2 text-xs text-zinc-400">Nenhum FCA registrado.</p>
            )}
          </div>

          {/* ── Tasks ── */}
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Tasks</p>
            <QuickAddTask frontId={front.id} onAdd={onAddTask} />
            {frontTasks.length > 0 && (
              <div className="mt-2 divide-y divide-zinc-50">
                {frontTasks.map(task => (
                  <TaskRow key={task.id} task={task} onChange={onUpdateTask} />
                ))}
              </div>
            )}
            {frontTasks.length === 0 && (
              <p className="mt-2 text-xs text-zinc-400">Nenhuma task ainda.</p>
            )}
          </div>

          {/* ── Archive ── */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onArchive(front)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <Archive size={13} /> Arquivar frente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FrentesPage() {
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    setFronts(loadFronts())
    setTasks(loadTasks())
  }, [])

  const persistFronts = (next: ManagementFront[]) => {
    setFronts(next)
    saveFronts(next)
  }

  const persistTasks = (next: Task[]) => {
    setTasks(next)
    saveTasks(next)
  }

  const createFront = ({ name, type, temperature }: { name: string; type: ManagementFront['type']; temperature: ManagementFront['temperature'] }) => {
    const front = createEmptyFront()
    front.name = name
    front.type = type
    front.temperature = temperature
    persistFronts([front, ...fronts])
    setShowNewForm(false)
  }

  const updateFront = (updated: ManagementFront) => {
    persistFronts(fronts.map(f => f.id === updated.id ? updated : f))
  }

  const archiveFront = (front: ManagementFront) => {
    persistFronts(fronts.map(f => f.id === front.id ? { ...f, status: 'Arquivada', updatedAt: new Date().toISOString() } : f))
  }

  const addTask = (task: Task) => {
    persistTasks([...tasks, task])
  }

  const updateTask = (updated: Task) => {
    persistTasks(tasks.map(t => t.id === updated.id ? updated : t))
  }

  const activeFronts = useMemo(() => fronts.filter(f => f.status !== 'Arquivada'), [fronts])

  const leaderFronts = useMemo(
    () => activeFronts.filter(f => f.managerIntervention !== 'Nenhuma'),
    [activeFronts],
  )

  const monitorFronts = useMemo(
    () => activeFronts.filter(f => f.managerIntervention === 'Nenhuma'),
    [activeFronts],
  )

  return (
    <main id="main-content" className="min-h-screen bg-[var(--retro-bg)] px-4 py-8 text-[var(--retro-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">Frentes</h1>
          <button
            type="button"
            onClick={() => setShowNewForm(v => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"
          >
            {showNewForm ? <X size={16} /> : <Plus size={16} />}
            {showNewForm ? 'Cancelar' : 'Nova frente'}
          </button>
        </div>

        {/* New front form */}
        {showNewForm && (
          <NewFrontForm onCancel={() => setShowNewForm(false)} onSave={createFront} />
        )}

        {/* Empty state */}
        {activeFronts.length === 0 && !showNewForm && (
          <div className={`${cardClass} p-10 text-center`}>
            <p className="font-black text-zinc-800">Nenhuma frente ainda</p>
            <p className="mt-1 text-sm text-zinc-400">Crie a primeira frente para começar.</p>
          </div>
        )}

        {/* "Você lidera" */}
        {leaderFronts.length > 0 && (
          <section className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-500">Você lidera</p>
            <div className="grid gap-2">
              {leaderFronts.map(front => (
                <FrontCard
                  key={front.id}
                  front={front}
                  tasks={tasks}
                  onUpdateFront={updateFront}
                  onArchive={archiveFront}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* "Você monitora" */}
        {monitorFronts.length > 0 && (
          <section className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-500">Você monitora</p>
            <div className="grid gap-2">
              {monitorFronts.map(front => (
                <FrontCard
                  key={front.id}
                  front={front}
                  tasks={tasks}
                  onUpdateFront={updateFront}
                  onArchive={archiveFront}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
