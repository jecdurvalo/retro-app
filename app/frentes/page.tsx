'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  createEmptyFCA,
  createEmptyFront,
  fcaStatuses,
  frontStatuses,
  frontTemperatures,
  loadFronts,
  saveFronts,
  type FCA,
  type ManagementFront,
} from '@/lib/fronts'
import {
  createEmptyTask,
  loadTasks,
  saveTasks,
  taskStatuses,
  type Task,
} from '@/lib/tasks'

const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

const temperatureDot: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-500',
  Atenção: 'bg-amber-400',
  Crítica: 'bg-rose-500',
}

const temperaturePill: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Atenção: 'bg-amber-50 text-amber-700 border-amber-200',
  Crítica: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusPill: Record<ManagementFront['status'], string> = {
  'Não iniciada': 'bg-zinc-100 text-zinc-600 border-zinc-200',
  'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
  Bloqueada: 'bg-rose-50 text-rose-700 border-rose-200',
  Concluída: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Arquivada: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

const fcaStatusPill: Record<FCA['status'], string> = {
  'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
  Concluído: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Bloqueado: 'bg-rose-50 text-rose-700 border-rose-200',
}

function formatDate(value: string) {
  if (!value) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function isOverdue(value: string, referenceTime: number) {
  return Boolean(value && new Date(`${value}T23:59:59`).getTime() < referenceTime)
}

type NewFrontDraft = {
  name: string
  type: ManagementFront['type']
  temperature: ManagementFront['temperature']
}

function NewFrontForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: (draft: NewFrontDraft) => void
}) {
  const [draft, setDraft] = useState<NewFrontDraft>({
    name: '',
    type: 'Projeto',
    temperature: 'Saudável',
  })
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
      onSubmit={event => {
        event.preventDefault()
        if (!draft.name.trim()) return
        onSave(draft)
      }}
    >
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_170px_auto] md:items-end">
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Nome</span>
          <input
            ref={nameRef}
            required
            value={draft.name}
            onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
            placeholder="Ex.: Reestruturar onboarding"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Tipo</span>
          <select
            value={draft.type}
            onChange={event => setDraft(current => ({ ...current, type: event.target.value as ManagementFront['type'] }))}
            className={fieldClass}
          >
            {(['Projeto', 'Processo', 'Risco', 'PDI', 'Governança', 'Oportunidade', 'Rotina'] as const).map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Saúde</span>
          <select
            value={draft.temperature}
            onChange={event => setDraft(current => ({ ...current, temperature: event.target.value as ManagementFront['temperature'] }))}
            className={fieldClass}
          >
            {frontTemperatures.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
          >
            Criar
          </button>
        </div>
      </div>
    </form>
  )
}

function TaskRow({
  task,
  onChange,
  onDelete,
  referenceTime,
}: {
  task: Task
  onChange: (task: Task) => void
  onDelete: () => void
  referenceTime: number
}) {
  const done = task.status === 'Concluída'
  const overdue = isOverdue(task.dueDate, referenceTime) && !done

  return (
    <div className="group grid gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 sm:grid-cols-[auto_minmax(180px,1fr)_110px_120px_auto] sm:items-center">
      <button
        type="button"
        aria-label={done ? 'Reabrir task' : 'Concluir task'}
        onClick={() => onChange({ ...task, status: done ? 'Aberta' : 'Concluída', updatedAt: new Date().toISOString() })}
        className={`grid h-5 w-5 place-items-center rounded-md border ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 text-transparent hover:border-emerald-500'}`}
      >
        <Check size={12} strokeWidth={3} />
      </button>
      <p className={`min-w-0 truncate text-sm font-semibold ${done ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
        {task.text}
      </p>
      <span className={`inline-flex items-center gap-1 text-xs font-bold ${overdue ? 'text-rose-600' : 'text-zinc-500'}`}>
        <CalendarDays size={12} />
        {formatDate(task.dueDate)}
      </span>
      <select
        value={task.status}
        onChange={event => onChange({ ...task, status: event.target.value as Task['status'], updatedAt: new Date().toISOString() })}
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs font-bold text-zinc-600 outline-none focus:border-[var(--retro-wine)]"
      >
        {taskStatuses.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      <button
        type="button"
        aria-label="Excluir task"
        onClick={onDelete}
        className="justify-self-start rounded-lg p-1.5 text-zinc-300 hover:bg-rose-50 hover:text-rose-500 sm:justify-self-end"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function QuickAddTask({ frontId, onAdd }: { frontId: string; onAdd: (task: Task) => void }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')

  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_auto]"
      onSubmit={event => {
        event.preventDefault()
        const value = text.trim()
        if (!value) return
        onAdd(createEmptyTask({ text: value, dueDate, frontId }))
        setText('')
        setDueDate('')
      }}
    >
      <input
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="Adicionar próxima ação..."
        className={fieldClass}
      />
      <input
        type="date"
        value={dueDate}
        onChange={event => setDueDate(event.target.value)}
        className={fieldClass}
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-700 hover:bg-zinc-50"
      >
        <Plus size={15} />
        Add
      </button>
    </form>
  )
}

function FcaForm({ onCancel, onSave }: { onCancel: () => void; onSave: (fca: FCA) => void }) {
  const [draft, setDraft] = useState<FCA>(() => createEmptyFCA())
  const set = <K extends keyof FCA>(key: K, value: FCA[K]) => setDraft(current => ({ ...current, [key]: value }))

  return (
    <form
      className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4"
      onSubmit={event => {
        event.preventDefault()
        if (!draft.fact.trim() || !draft.action.trim()) return
        onSave({ ...draft, updatedAt: new Date().toISOString() })
      }}
    >
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Fato</span>
          <textarea
            required
            rows={2}
            value={draft.fact}
            onChange={event => set('fact', event.target.value)}
            placeholder="O que aconteceu, de forma observável?"
            className={`${fieldClass} resize-none leading-6`}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Causa</span>
          <textarea
            rows={2}
            value={draft.cause}
            onChange={event => set('cause', event.target.value)}
            placeholder="Por que aconteceu?"
            className={`${fieldClass} resize-none leading-6`}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Ação</span>
          <textarea
            required
            rows={2}
            value={draft.action}
            onChange={event => set('action', event.target.value)}
            placeholder="O que será feito?"
            className={`${fieldClass} resize-none leading-6`}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Responsável</span>
            <input value={draft.owner} onChange={event => set('owner', event.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Prazo</span>
            <input type="date" value={draft.dueDate} onChange={event => set('dueDate', event.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Status</span>
            <select value={draft.status} onChange={event => set('status', event.target.value as FCA['status'])} className={fieldClass}>
              {fcaStatuses.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-600 hover:bg-zinc-50">
          Cancelar
        </button>
        <button type="submit" className="rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]">
          Salvar FCA
        </button>
      </div>
    </form>
  )
}

function FcaRow({ fca, onStatusChange, onDelete }: { fca: FCA; onStatusChange: (status: FCA['status']) => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-zinc-900">{fca.fact || 'FCA sem fato'}</p>
          {fca.action && <p className="mt-1 text-xs font-semibold leading-5 text-zinc-500">Ação: {fca.action}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-zinc-500">
            {fca.owner && <span>{fca.owner}</span>}
            {fca.dueDate && <span>{formatDate(fca.dueDate)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={fca.status}
            onChange={event => onStatusChange(event.target.value as FCA['status'])}
            className={`rounded-full border px-2.5 py-1 text-xs font-black outline-none ${fcaStatusPill[fca.status]}`}
          >
            {fcaStatuses.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" aria-label="Excluir FCA" onClick={onDelete} className="rounded-lg p-1.5 text-zinc-300 hover:bg-rose-50 hover:text-rose-500">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function FrontCard({
  front,
  tasks,
  onUpdateFront,
  onArchive,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  referenceTime,
}: {
  front: ManagementFront
  tasks: Task[]
  onUpdateFront: (front: ManagementFront) => void
  onArchive: (front: ManagementFront) => void
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  referenceTime: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [showFcaForm, setShowFcaForm] = useState(false)
  const frontTasks = tasks.filter(task => task.frontId === front.id)
  const openTasks = frontTasks.filter(task => task.status !== 'Concluída')
  const frontFcas = front.fcas ?? []
  const openFcas = frontFcas.filter(fca => fca.status !== 'Concluído')
  const overdue = isOverdue(front.nextCheckpoint, referenceTime)

  const update = (updates: Partial<ManagementFront>) => {
    onUpdateFront({ ...front, ...updates, updatedAt: new Date().toISOString() })
  }

  const addFca = (fca: FCA) => {
    update({ fcas: [fca, ...frontFcas] })
    setShowFcaForm(false)
  }

  const updateFcaStatus = (id: string, status: FCA['status']) => {
    update({
      fcas: frontFcas.map(fca => (
        fca.id === id ? { ...fca, status, updatedAt: new Date().toISOString() } : fca
      )),
    })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-zinc-50 lg:grid-cols-[minmax(260px,1fr)_160px_150px_130px_auto] lg:items-center"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${temperatureDot[front.temperature]}`} />
            <h2 className="truncate text-sm font-black text-zinc-950">{front.name || 'Frente sem nome'}</h2>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-zinc-500">
            {front.nextStep || front.description || 'Sem próximo passo definido'}
          </p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${temperaturePill[front.temperature]}`}>
          {front.temperature}
        </span>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${statusPill[front.status]}`}>
          {front.status}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${overdue && front.status !== 'Concluída' ? 'text-rose-600' : 'text-zinc-500'}`}>
          <CalendarDays size={13} />
          {formatDate(front.nextCheckpoint)}
        </span>
        <span className="justify-self-end text-zinc-400">
          {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Dono</span>
              <input value={front.owner} onChange={event => update({ owner: event.target.value })} className={fieldClass} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Status</span>
              <select value={front.status} onChange={event => update({ status: event.target.value as ManagementFront['status'] })} className={fieldClass}>
                {frontStatuses.filter(item => item !== 'Arquivada').map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Saúde</span>
              <select value={front.temperature} onChange={event => update({ temperature: event.target.value as ManagementFront['temperature'] })} className={fieldClass}>
                {frontTemperatures.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Checkpoint</span>
              <input type="date" value={front.nextCheckpoint} onChange={event => update({ nextCheckpoint: event.target.value })} className={fieldClass} />
            </label>
          </div>

          <label className="mt-3 grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Próximo passo</span>
            <input
              value={front.nextStep}
              onChange={event => update({ nextStep: event.target.value })}
              placeholder="Qual é a próxima ação objetiva?"
              className={fieldClass}
            />
          </label>

          <label className="mt-3 grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Descrição</span>
            <textarea
              rows={2}
              value={front.description}
              onChange={event => update({ description: event.target.value })}
              placeholder="Contexto curto da frente"
              className={`${fieldClass} resize-none leading-6`}
            />
          </label>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                FCAs {openFcas.length > 0 ? `(${openFcas.length} abertos)` : ''}
              </p>
              <button
                type="button"
                onClick={() => setShowFcaForm(value => !value)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50"
              >
                {showFcaForm ? <X size={13} /> : <Plus size={13} />}
                {showFcaForm ? 'Fechar' : 'Registrar FCA'}
              </button>
            </div>
            {showFcaForm && <FcaForm onCancel={() => setShowFcaForm(false)} onSave={addFca} />}
            <div className="mt-2 grid gap-2">
              {frontFcas.length > 0 ? (
                frontFcas.map(fca => (
                  <FcaRow
                    key={fca.id}
                    fca={fca}
                    onStatusChange={status => updateFcaStatus(fca.id, status)}
                    onDelete={() => update({ fcas: frontFcas.filter(item => item.id !== fca.id) })}
                  />
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-400">
                  Nenhum FCA registrado.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Tasks abertas {openTasks.length > 0 ? `(${openTasks.length})` : ''}
              </p>
            </div>
            <div className="mt-2 grid gap-2">
              {frontTasks.length > 0 ? (
                frontTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    referenceTime={referenceTime}
                    onChange={onUpdateTask}
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-400">
                  Nenhuma task ainda.
                </p>
              )}
            </div>
            <QuickAddTask frontId={front.id} onAdd={onAddTask} />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onArchive(front)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Archive size={13} />
              Arquivar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-zinc-950">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-zinc-500">{detail}</p>
    </div>
  )
}

export default function FrentesPage() {
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [search, setSearch] = useState('')
  const [referenceTime] = useState(() => Date.now())

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFronts(loadFronts())
      setTasks(loadTasks())
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const persistFronts = (next: ManagementFront[]) => {
    setFronts(next)
    saveFronts(next)
  }

  const persistTasks = (next: Task[]) => {
    setTasks(next)
    saveTasks(next)
  }

  const createFront = ({ name, type, temperature }: NewFrontDraft) => {
    const now = new Date().toISOString()
    const front = {
      ...createEmptyFront(),
      name: name.trim(),
      type,
      temperature,
      updatedAt: now,
    }
    persistFronts([front, ...fronts])
    setShowNewForm(false)
  }

  const updateFront = (updated: ManagementFront) => {
    persistFronts(fronts.map(front => (front.id === updated.id ? updated : front)))
  }

  const archiveFront = (front: ManagementFront) => {
    persistFronts(fronts.map(item => (
      item.id === front.id ? { ...item, status: 'Arquivada', updatedAt: new Date().toISOString() } : item
    )))
  }

  const addTask = (task: Task) => persistTasks([...tasks, task])
  const updateTask = (updated: Task) => persistTasks(tasks.map(task => (task.id === updated.id ? updated : task)))
  const deleteTask = (id: string) => persistTasks(tasks.filter(task => task.id !== id))

  const activeFronts = useMemo(() => fronts.filter(front => front.status !== 'Arquivada'), [fronts])
  const filteredFronts = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('pt-BR')
    if (!value) return activeFronts

    return activeFronts.filter(front => {
      const frontTasks = tasks.filter(task => task.frontId === front.id)
      return [
        front.name,
        front.owner,
        front.nextStep,
        front.description,
        ...frontTasks.map(task => task.text),
      ].join(' ').toLocaleLowerCase('pt-BR').includes(value)
    })
  }, [activeFronts, search, tasks])

  const actionFronts = filteredFronts.filter(front => (
    front.temperature !== 'Saudável' || front.status === 'Bloqueada' || isOverdue(front.nextCheckpoint, referenceTime)
  ))
  const otherFronts = filteredFronts.filter(front => !actionFronts.some(item => item.id === front.id))
  const openTasks = tasks.filter(task => task.status !== 'Concluída')
  const overdueTasks = openTasks.filter(task => isOverdue(task.dueDate, referenceTime))

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-950">Frentes</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
                O básico bem feito: dono claro, saúde visível, próximo passo, prazo e tasks abertas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewForm(value => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
            >
              {showNewForm ? <X size={16} /> : <Plus size={16} />}
              {showNewForm ? 'Cancelar' : 'Nova frente'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Ativas" value={activeFronts.length} detail="não arquivadas" />
            <SummaryCard label="Pedem ação" value={actionFronts.length} detail="atenção, crítica ou atraso" />
            <SummaryCard label="Tasks abertas" value={openTasks.length} detail={`${overdueTasks.length} em atraso`} />
          </div>

          <label className="mt-5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-400 focus-within:border-[var(--retro-wine)] focus-within:bg-white">
            <Search size={17} />
            <span className="sr-only">Buscar frentes</span>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por frente, dono, próximo passo ou task..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </label>
        </header>

        {showNewForm && (
          <div className="mt-5">
            <NewFrontForm onCancel={() => setShowNewForm(false)} onSave={createFront} />
          </div>
        )}

        {activeFronts.length === 0 && !showNewForm && (
          <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <p className="text-base font-black text-zinc-900">Nenhuma frente ainda</p>
            <p className="mt-1 text-sm font-semibold text-zinc-400">Crie uma frente com dono, próximo passo e prazo.</p>
          </div>
        )}

        {actionFronts.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Pedem ação</h2>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
            <div className="grid gap-3">
              {actionFronts.map(front => (
                <FrontCard
                  key={front.id}
                  front={front}
                  tasks={tasks}
                  referenceTime={referenceTime}
                  onUpdateFront={updateFront}
                  onArchive={archiveFront}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              ))}
            </div>
          </section>
        )}

        {otherFronts.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Em acompanhamento</h2>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>
            <div className="grid gap-3">
              {otherFronts.map(front => (
                <FrontCard
                  key={front.id}
                  front={front}
                  tasks={tasks}
                  referenceTime={referenceTime}
                  onUpdateFront={updateFront}
                  onArchive={archiveFront}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
