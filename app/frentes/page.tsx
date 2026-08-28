'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Select } from '@/components/ui/select'
import {
  Archive,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  Flag,
  LayoutGrid,
  Lightbulb,
  List as ListIcon,
  Plus,
  RotateCcw,
  Search,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react'
import {
  createEmptyFCA,
  createEmptyFront,
  fcaStatuses,
  frontHasAutoProgressSource,
  frontProgress,
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
import { PageHeader, type PageStat } from '@/components/ui/page-header'
import { QuickAddModal } from '@/components/ui/quick-add-modal'

const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

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

const temperatureHex: Record<ManagementFront['temperature'], string> = {
  Saudável: '#10b981',
  Atenção: '#f59e0b',
  Crítica: '#f43f5e',
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

const subTabs = [
  { key: 'visao', label: 'Visão geral' },
  { key: 'saude', label: 'Saúde das frentes' },
  { key: 'linha', label: 'Linha do tempo' },
  { key: 'acoes', label: 'Minhas ações' },
] as const

type SubTab = (typeof subTabs)[number]['key']

function formatDate(value: string) {
  if (!value) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function isOverdue(value: string, referenceTime: number) {
  return Boolean(value && new Date(`${value}T23:59:59`).getTime() < referenceTime)
}

function ProgressBar({ value, tone = 'wine' }: { value: number; tone?: 'wine' | 'emerald' | 'amber' | 'rose' }) {
  const barColor = {
    wine: 'bg-[var(--retro-wine)]',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500',
  }[tone]
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const value = draft.trim()
    if (!value || tags.includes(value)) return setDraft('')
    onChange([...tags, value])
    setDraft('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600">
          <TagIcon size={11} />
          {tag}
          <button type="button" aria-label={`Remover tag ${tag}`} onClick={() => onChange(tags.filter(item => item !== tag))} className="text-zinc-400 hover:text-rose-500">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault()
            addTag()
          }
        }}
        onBlur={addTag}
        placeholder="+ tag"
        className="w-20 rounded-full border border-dashed border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 outline-none focus:border-[var(--retro-wine)]"
      />
    </div>
  )
}

type NewFrontDraft = {
  name: string
  type: ManagementFront['type']
  temperature: ManagementFront['temperature']
}

function NewFrontForm({ onSave }: { onSave: (draft: NewFrontDraft) => void }) {
  const [draft, setDraft] = useState<NewFrontDraft>({
    name: '',
    type: 'Projeto',
    temperature: 'Saudável',
  })

  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        if (!draft.name.trim()) return
        onSave(draft)
      }}
    >
      <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Nome</span>
        <input
          autoFocus
          required
          value={draft.name}
          onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
          placeholder="Ex.: Reestruturar onboarding"
          className={fieldClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Tipo</span>
          <Select
            value={draft.type}
            onChange={value => setDraft(current => ({ ...current, type: value as ManagementFront['type'] }))}
            options={['Projeto', 'Processo', 'Risco', 'PDI', 'Governança', 'Oportunidade', 'Rotina']}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Saúde</span>
          <Select
            value={draft.temperature}
            onChange={value => setDraft(current => ({ ...current, temperature: value as ManagementFront['temperature'] }))}
            options={[...frontTemperatures]}
            className={fieldClass}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={!draft.name.trim()}
        className="justify-self-end rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Criar frente
      </button>
    </form>
  )
}

function TaskRow({
  task,
  frontName,
  onChange,
  onDelete,
  referenceTime,
}: {
  task: Task
  frontName?: string
  onChange: (task: Task) => void
  onDelete: () => void
  referenceTime: number
}) {
  const done = task.status === 'Concluída'
  const overdue = isOverdue(task.dueDate, referenceTime) && !done

  return (
    <div className="group grid gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:border-zinc-200 hover:shadow-sm sm:grid-cols-[auto_minmax(180px,1fr)_110px_120px_auto] sm:items-center">
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
        {frontName && <span className="ml-2 text-xs font-bold text-zinc-400">· {frontName}</span>}
      </p>
      <span className={`inline-flex items-center gap-1 text-xs font-bold ${overdue ? 'text-rose-600' : 'text-zinc-500'}`}>
        <CalendarDays size={12} />
        {formatDate(task.dueDate)}
      </span>
      <Select
        value={task.status}
        onChange={value => onChange({ ...task, status: value as Task['status'], updatedAt: new Date().toISOString() })}
        options={[...taskStatuses]}
        className="!px-2 !py-1.5 !text-xs !font-bold !text-zinc-600 !bg-zinc-50"
      />
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
    <div className="mt-3">
      <QuickAddModal title="Nova ação" triggerLabel="Adicionar ação" compact>
        {close => (
          <form
            className="grid gap-3"
            onSubmit={event => {
              event.preventDefault()
              const value = text.trim()
              if (!value) return
              onAdd(createEmptyTask({ text: value, dueDate, frontId }))
              setText('')
              setDueDate('')
              close()
            }}
          >
            <input
              autoFocus
              value={text}
              onChange={event => setText(event.target.value)}
              placeholder="Qual é a próxima ação?"
              className={fieldClass}
            />
            <label className="grid gap-1.5 text-xs font-bold text-zinc-500">
              Prazo (opcional)
              <input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} className={fieldClass} />
            </label>
            <button
              type="submit"
              disabled={!text.trim()}
              className="justify-self-end rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Adicionar
            </button>
          </form>
        )}
      </QuickAddModal>
    </div>
  )
}

function FcaForm({ onCancel, onSave }: { onCancel: () => void; onSave: (fca: FCA) => void }) {
  const [draft, setDraft] = useState<FCA>(() => createEmptyFCA())
  const set = <K extends keyof FCA>(key: K, value: FCA[K]) => setDraft(current => ({ ...current, [key]: value }))

  return (
    <form
      className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
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
            <Select value={draft.status} onChange={value => set('status', value as FCA['status'])} options={[...fcaStatuses]} className={fieldClass} />
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
          <Select
            value={fca.status}
            onChange={value => onStatusChange(value as FCA['status'])}
            options={[...fcaStatuses]}
            className={`!rounded-full !border-0 !px-2.5 !py-1 !text-xs !font-black ${fcaStatusPill[fca.status]}`}
          />
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
  expanded,
  onToggleExpand,
  onUpdateFront,
  onArchive,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  referenceTime,
}: {
  front: ManagementFront
  tasks: Task[]
  expanded: boolean
  onToggleExpand: () => void
  onUpdateFront: (front: ManagementFront) => void
  onArchive: (front: ManagementFront) => void
  onDelete: (front: ManagementFront) => void
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  referenceTime: number
}) {
  const [showFcaForm, setShowFcaForm] = useState(false)
  const frontTasks = tasks.filter(task => task.frontId === front.id)
  const openTasks = frontTasks.filter(task => task.status !== 'Concluída')
  const frontFcas = front.fcas ?? []
  const openFcas = frontFcas.filter(fca => fca.status !== 'Concluído')
  const overdue = isOverdue(front.nextCheckpoint, referenceTime)
  const progress = frontProgress(front, tasks)
  const hasAutoProgress = frontHasAutoProgressSource(front, tasks)

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
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-transparent transition hover:shadow-md">
      <button
        type="button"
        onClick={onToggleExpand}
        className="grid w-full gap-3 border-l-4 px-4 py-4 text-left transition hover:bg-zinc-50 lg:grid-cols-[minmax(240px,1fr)_120px_150px_130px_120px_auto] lg:items-center"
        style={{ borderLeftColor: temperatureHex[front.temperature] }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${temperatureDot[front.temperature]}`} />
            <h2 className="truncate text-sm font-black text-zinc-950">{front.name || 'Frente sem nome'}</h2>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-zinc-500">
            {front.nextStep || front.description || 'Próximo passo ainda não definido'}
          </p>
          {front.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {front.tags.slice(0, 3).map(tag => (
                <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">{tag}</span>
              ))}
              {front.tags.length > 3 && <span className="text-[10px] font-bold text-zinc-400">+{front.tags.length - 3}</span>}
            </div>
          )}
        </div>
        <div className="min-w-[90px]">
          <div className="flex items-center justify-between text-[11px] font-black text-zinc-500">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1">
            <ProgressBar value={progress} tone={front.temperature === 'Crítica' ? 'rose' : front.temperature === 'Atenção' ? 'amber' : 'emerald'} />
          </div>
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
              <Select value={front.status} onChange={value => update({ status: value as ManagementFront['status'] })} options={frontStatuses.filter(item => item !== 'Arquivada')} className={fieldClass} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Saúde</span>
              <Select value={front.temperature} onChange={value => update({ temperature: value as ManagementFront['temperature'] })} options={[...frontTemperatures]} className={fieldClass} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Checkpoint</span>
              <input type="date" value={front.nextCheckpoint} onChange={event => update({ nextCheckpoint: event.target.value })} className={fieldClass} />
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Progresso</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-zinc-900">{progress}%</span>
                {front.progressOverride !== null && hasAutoProgress && (
                  <button
                    type="button"
                    onClick={() => update({ progressOverride: null })}
                    className="text-xs font-bold text-[var(--retro-wine)] hover:underline"
                  >
                    Calcular automaticamente
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={event => update({ progressOverride: Number(event.target.value) })}
              className="mt-2.5 w-full accent-[var(--retro-wine)]"
            />
            <p className="mt-1.5 text-[11px] font-semibold text-zinc-400">
              {front.progressOverride !== null
                ? 'Definido manualmente — arraste para ajustar.'
                : hasAutoProgress
                  ? 'Calculado a partir dos FCAs e ações vinculadas a esta frente.'
                  : 'Sem FCAs ou ações ainda: arraste para definir manualmente.'}
            </p>
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

          <label className="mt-3 grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Tags</span>
            <TagEditor tags={front.tags} onChange={tags => update({ tags })} />
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
                  Nenhuma ação registrada nesta frente.
                </p>
              )}
            </div>
            <QuickAddTask frontId={front.id} onAdd={onAddTask} />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onDelete(front)}
              className="mr-2 inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-black text-rose-500 hover:bg-rose-50"
            >
              <Trash2 size={13} />
              Excluir
            </button>
            <button
              type="button"
              onClick={() => onArchive(front)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-500 hover:bg-zinc-50"
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

function FrontCardCompact({ front, tasks, onOpen }: { front: ManagementFront; tasks: Task[]; onOpen: () => void }) {
  const progress = frontProgress(front, tasks)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm ring-1 ring-transparent transition hover:shadow-md"
      style={{ borderLeftWidth: 4, borderLeftColor: temperatureHex[front.temperature] }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${temperatureDot[front.temperature]}`} />
          <h3 className="truncate text-sm font-black text-zinc-950">{front.name || 'Frente sem nome'}</h3>
        </div>
        <p className="mt-1 line-clamp-2 text-xs font-medium text-zinc-500">
          {front.nextStep || front.description || 'Próximo passo ainda não definido'}
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between text-[11px] font-black text-zinc-500">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1">
          <ProgressBar value={progress} tone={front.temperature === 'Crítica' ? 'rose' : front.temperature === 'Atenção' ? 'amber' : 'emerald'} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${statusPill[front.status]}`}>{front.status}</span>
        {front.tags.slice(0, 2).map(tag => (
          <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">{tag}</span>
        ))}
      </div>
    </button>
  )
}

function Donut({ segments }: { segments: { color: string; value: number }[] }) {
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
    <div
      className="grid h-32 w-32 place-items-center rounded-full"
      style={{ background: `conic-gradient(${stops.join(', ')})` }}
    >
      <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white text-center">
        <span className="text-lg font-black text-zinc-900">{total}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">frentes</span>
      </div>
    </div>
  )
}

export default function FrentesPage() {
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('Todas')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [tab, setTab] = useState<SubTab>('visao')
  const [expandedId, setExpandedId] = useState<string | null>(null)
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
  }

  const updateFront = (updated: ManagementFront) => {
    persistFronts(fronts.map(front => (front.id === updated.id ? updated : front)))
  }

  const archiveFront = (front: ManagementFront) => {
    persistFronts(fronts.map(item => (
      item.id === front.id ? { ...item, status: 'Arquivada', updatedAt: new Date().toISOString() } : item
    )))
  }

  const restoreFront = (front: ManagementFront) => {
    persistFronts(fronts.map(item => (
      item.id === front.id ? { ...item, status: 'Em andamento', updatedAt: new Date().toISOString() } : item
    )))
  }

  const deleteFront = (front: ManagementFront) => {
    if (!window.confirm(`Excluir definitivamente "${front.name || 'esta frente'}"?`)) return
    persistFronts(fronts.filter(item => item.id !== front.id))
    persistTasks(tasks.filter(task => task.frontId !== front.id))
    if (expandedId === front.id) setExpandedId(null)
  }

  const addTask = (task: Task) => persistTasks([...tasks, task])
  const updateTask = (updated: Task) => persistTasks(tasks.map(task => (task.id === updated.id ? updated : task)))
  const deleteTask = (id: string) => persistTasks(tasks.filter(task => task.id !== id))

  const openInList = (front: ManagementFront) => {
    setView('list')
    setTab('visao')
    setExpandedId(front.id)
  }

  const activeFronts = useMemo(() => fronts.filter(front => front.status !== 'Arquivada'), [fronts])
  const archivedFronts = useMemo(() => fronts.filter(front => front.status === 'Arquivada'), [fronts])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    activeFronts.forEach(front => front.tags.forEach(tag => set.add(tag)))
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [activeFronts])

  const filteredFronts = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('pt-BR')
    return activeFronts.filter(front => {
      if (tagFilter !== 'Todas' && !front.tags.includes(tagFilter)) return false
      if (!value) return true
      const frontTasks = tasks.filter(task => task.frontId === front.id)
      return [
        front.name,
        front.owner,
        front.nextStep,
        front.description,
        ...front.tags,
        ...frontTasks.map(task => task.text),
      ].join(' ').toLocaleLowerCase('pt-BR').includes(value)
    })
  }, [activeFronts, search, tagFilter, tasks])

  const actionFronts = filteredFronts.filter(front => (
    front.temperature !== 'Saudável' || front.status === 'Bloqueada' || isOverdue(front.nextCheckpoint, referenceTime)
  ))
  const otherFronts = filteredFronts.filter(front => !actionFronts.some(item => item.id === front.id))
  const openTasks = tasks.filter(task => task.status !== 'Concluída')
  const overdueTasks = openTasks.filter(task => isOverdue(task.dueDate, referenceTime))

  const avgProgress = activeFronts.length > 0
    ? Math.round(activeFronts.reduce((sum, front) => sum + frontProgress(front, tasks), 0) / activeFronts.length)
    : 0

  const healthCounts = useMemo(() => ({
    Saudável: activeFronts.filter(front => front.temperature === 'Saudável').length,
    Atenção: activeFronts.filter(front => front.temperature === 'Atenção').length,
    Crítica: activeFronts.filter(front => front.temperature === 'Crítica').length,
  }), [activeFronts])

  const upcomingMilestones = useMemo(() => {
    return activeFronts
      .filter(front => front.nextCheckpoint)
      .sort((a, b) => a.nextCheckpoint.localeCompare(b.nextCheckpoint))
      .slice(0, 5)
  }, [activeFronts])

  const insight = useMemo(() => {
    if (healthCounts.Crítica > 0) {
      return `${healthCounts.Crítica} frente${healthCounts.Crítica > 1 ? 's' : ''} crítica${healthCounts.Crítica > 1 ? 's' : ''} pedindo decisão agora.`
    }
    if (overdueTasks.length > 0) {
      return `${overdueTasks.length} ação${overdueTasks.length > 1 ? 'ões' : ''} em atraso — vale revisar prioridades no 1:1 desta semana.`
    }
    if (activeFronts.length > 0 && healthCounts.Saudável / activeFronts.length >= 0.8) {
      return `Portfólio saudável: ${Math.round((healthCounts.Saudável / activeFronts.length) * 100)}% das frentes sem risco ativo.`
    }
    if (activeFronts.length === 0) {
      return 'Nenhuma frente ativa ainda — crie a primeira para começar o acompanhamento.'
    }
    return `Progresso médio do portfólio em ${avgProgress}%. Acompanhe os próximos marcos ao lado.`
  }, [healthCounts, overdueTasks, activeFronts, avgProgress])

  const timelineEvents = useMemo(() => {
    type Event = { date: string; frontName: string; label: string; kind: 'checkpoint' | 'fca' }
    const events: Event[] = []
    activeFronts.forEach(front => {
      if (front.nextCheckpoint) {
        events.push({ date: front.nextCheckpoint, frontName: front.name || 'Frente sem nome', label: 'Checkpoint', kind: 'checkpoint' })
      }
      front.fcas.forEach(fca => {
        if (fca.dueDate && fca.status !== 'Concluído') {
          events.push({ date: fca.dueDate, frontName: front.name || 'Frente sem nome', label: fca.action || 'FCA', kind: 'fca' })
        }
      })
    })
    return events.sort((a, b) => a.date.localeCompare(b.date))
  }, [activeFronts])

  const stats: PageStat[] = [
    { label: 'Ativas', value: activeFronts.length, detail: 'em acompanhamento' },
    { label: 'Pedem decisão', value: actionFronts.length, detail: 'atenção, crítica ou atraso' },
    { label: 'Ações abertas', value: openTasks.length, detail: `${overdueTasks.length} em atraso` },
    { label: 'Progresso médio', value: `${avgProgress}%`, detail: 'FCAs + ações concluídas' },
  ]

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Gestão das frentes"
          title="Frentes, FCAs e próximas ações"
          subtitle="Uma visão simples para saber o que está saudável, o que precisa de intervenção e qual cobrança vem a seguir."
          action={
            <QuickAddModal
              title="Nova frente"
              triggerLabel="Nova frente"
              renderTrigger={open => (
                <button
                  type="button"
                  onClick={open}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)]"
                >
                  <Plus size={16} />
                  Nova frente
                </button>
              )}
            >
              {close => (
                <NewFrontForm
                  onSave={draft => {
                    createFront(draft)
                    close()
                  }}
                />
              )}
            </QuickAddModal>
          }
          stats={stats}
        >
          <div className="flex flex-wrap gap-2">
            {subTabs.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  tab === item.key
                    ? 'bg-[var(--retro-wine)] text-white'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </PageHeader>

        {tab === 'visao' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto_auto]">
                <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-400 focus-within:border-[var(--retro-wine)] focus-within:bg-white">
                  <Search size={17} />
                  <span className="sr-only">Buscar frentes</span>
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Buscar por frente, dono, próximo passo ou ação..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder:text-zinc-400"
                  />
                </label>
                <Select
                  value={tagFilter}
                  onChange={setTagFilter}
                  options={['Todas', ...allTags]}
                  aria-label="Filtrar por tag"
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => setView(value => (value === 'list' ? 'grid' : 'list'))}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-600 hover:bg-zinc-50"
                >
                  {view === 'list' ? <LayoutGrid size={16} /> : <ListIcon size={16} />}
                  {view === 'list' ? 'Grade' : 'Lista'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchived(value => !value)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-600 hover:bg-zinc-50"
                >
                  {showArchived ? <EyeOff size={16} /> : <Eye size={16} />}
                  Arquivadas {archivedFronts.length > 0 ? `(${archivedFronts.length})` : ''}
                </button>
              </div>

              {activeFronts.length === 0 && (
                <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
                  <p className="text-base font-black text-zinc-900">Nenhuma frente ativa ainda</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-400">Crie uma frente com dono, saúde, próximo passo e checkpoint.</p>
                </div>
              )}

              {view === 'list' ? (
                <>
                  {actionFronts.length > 0 && (
                    <section className="mt-6">
                      <div className="mb-3 flex items-center gap-3">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Precisam de intervenção</h2>
                        <div className="h-px flex-1 bg-zinc-200" />
                      </div>
                      <div className="grid gap-3">
                        {actionFronts.map(front => (
                          <FrontCard
                            key={front.id}
                            front={front}
                            tasks={tasks}
                            expanded={expandedId === front.id}
                            onToggleExpand={() => setExpandedId(current => (current === front.id ? null : front.id))}
                            referenceTime={referenceTime}
                            onUpdateFront={updateFront}
                            onArchive={archiveFront}
                            onDelete={deleteFront}
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
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Acompanhamento regular</h2>
                        <div className="h-px flex-1 bg-zinc-200" />
                      </div>
                      <div className="grid gap-3">
                        {otherFronts.map(front => (
                          <FrontCard
                            key={front.id}
                            front={front}
                            tasks={tasks}
                            expanded={expandedId === front.id}
                            onToggleExpand={() => setExpandedId(current => (current === front.id ? null : front.id))}
                            referenceTime={referenceTime}
                            onUpdateFront={updateFront}
                            onArchive={archiveFront}
                            onDelete={deleteFront}
                            onAddTask={addTask}
                            onUpdateTask={updateTask}
                            onDeleteTask={deleteTask}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredFronts.map(front => (
                    <FrontCardCompact key={front.id} front={front} tasks={tasks} onOpen={() => openInList(front)} />
                  ))}
                </div>
              )}

              {showArchived && (
                <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Arquivadas</h2>
                    <div className="h-px flex-1 bg-zinc-200" />
                  </div>
                  {archivedFronts.length > 0 ? (
                    <div className="grid gap-2">
                      {archivedFronts.map(front => (
                        <div key={front.id} className="grid gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-zinc-800">{front.name || 'Frente sem nome'}</p>
                            <p className="mt-0.5 text-xs font-semibold text-zinc-500">{front.nextStep || front.description || 'Arquivada sem contexto registrado'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => restoreFront(front)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50"
                          >
                            <RotateCcw size={13} />
                            Restaurar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFront(front)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-black text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                            Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-sm font-semibold text-zinc-400">
                      Nenhuma frente arquivada.
                    </p>
                  )}
                </section>
              )}
            </div>

            <aside className="grid gap-4 self-start">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Saúde do portfólio</p>
                <div className="mt-3 flex items-center gap-4">
                  <Donut
                    segments={[
                      { color: temperatureHex.Saudável, value: healthCounts.Saudável },
                      { color: temperatureHex.Atenção, value: healthCounts.Atenção },
                      { color: temperatureHex.Crítica, value: healthCounts.Crítica },
                    ]}
                  />
                  <div className="grid gap-1.5 text-xs font-bold text-zinc-600">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Saudável · {healthCounts.Saudável}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Atenção · {healthCounts.Atenção}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Crítica · {healthCounts.Crítica}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Próximos marcos importantes</p>
                <div className="mt-3 grid gap-2">
                  {upcomingMilestones.length > 0 ? upcomingMilestones.map(front => (
                    <div key={front.id} className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                      <Flag size={13} className={isOverdue(front.nextCheckpoint, referenceTime) ? 'text-rose-500' : 'text-zinc-400'} />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-700">{front.name || 'Frente sem nome'}</span>
                      <span className={`text-xs font-black ${isOverdue(front.nextCheckpoint, referenceTime) ? 'text-rose-600' : 'text-zinc-500'}`}>{formatDate(front.nextCheckpoint)}</span>
                    </div>
                  )) : (
                    <p className="text-xs font-semibold text-zinc-400">Nenhum checkpoint agendado.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--retro-wine-tint)] bg-[var(--retro-wine-soft)] p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb size={16} className="mt-0.5 shrink-0 text-[var(--retro-wine)]" />
                  <p className="text-sm font-bold leading-5 text-zinc-800">{insight}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Links rápidos</p>
                <div className="mt-3 grid gap-1.5">
                  <Link href="/decisoes" className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                    <Compass size={14} className="text-zinc-400" />
                    Decisões
                  </Link>
                  <Link href="/rituais" className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                    <Compass size={14} className="text-zinc-400" />
                    Rituais
                  </Link>
                  <Link href="/pessoas" className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                    <Compass size={14} className="text-zinc-400" />
                    Pessoas
                  </Link>
                  <Link href="/historico" className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50">
                    <Compass size={14} className="text-zinc-400" />
                    Histórico de retros
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}

        {tab === 'saude' && (
          <div className="mt-6 grid gap-4">
            {(['Crítica', 'Atenção', 'Saudável'] as const).map(temperature => {
              const group = activeFronts.filter(front => front.temperature === temperature)
              return (
                <section key={temperature} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${temperatureDot[temperature]}`} />
                    <h2 className="text-sm font-black text-zinc-900">{temperature}</h2>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-500">{group.length}</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {group.length > 0 ? group.map(front => {
                      const progress = frontProgress(front, tasks)
                      return (
                        <div key={front.id} className="grid gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-center">
                          <span className="truncate text-sm font-bold text-zinc-800">{front.name || 'Frente sem nome'}</span>
                          <ProgressBar value={progress} tone={temperature === 'Crítica' ? 'rose' : temperature === 'Atenção' ? 'amber' : 'emerald'} />
                          <span className="justify-self-end text-xs font-black text-zinc-500">{progress}%</span>
                        </div>
                      )
                    }) : (
                      <p className="text-xs font-semibold text-zinc-400">Nenhuma frente nesta faixa.</p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {tab === 'linha' && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Linha do tempo</h2>
            <div className="mt-4 grid gap-2">
              {timelineEvents.length > 0 ? timelineEvents.map((event, index) => {
                const overdue = isOverdue(event.date, referenceTime)
                return (
                  <div key={`${event.frontName}-${index}`} className="grid gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 sm:grid-cols-[100px_auto_minmax(0,1fr)] sm:items-center">
                    <span className={`text-xs font-black ${overdue ? 'text-rose-600' : 'text-zinc-600'}`}>{formatDate(event.date)}</span>
                    <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-black ${event.kind === 'fca' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {event.kind === 'fca' ? 'FCA' : 'Checkpoint'}
                    </span>
                    <span className="truncate text-sm font-semibold text-zinc-700">{event.frontName} · {event.label}</span>
                  </div>
                )
              }) : (
                <p className="text-sm font-semibold text-zinc-400">Nenhum checkpoint ou FCA com prazo agendado.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'acoes' && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Minhas ações {openTasks.length > 0 ? `(${openTasks.length} abertas)` : ''}</h2>
              {overdueTasks.length > 0 && <span className="text-xs font-black text-rose-600">{overdueTasks.length} em atraso</span>}
            </div>
            <div className="mt-3 grid gap-2">
              {tasks.length > 0 ? [...tasks]
                .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
                .map(task => {
                  const front = fronts.find(item => item.id === task.frontId)
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      frontName={front?.name}
                      referenceTime={referenceTime}
                      onChange={updateTask}
                      onDelete={() => deleteTask(task.id)}
                    />
                  )
                }) : (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-4 text-sm font-semibold text-zinc-400">
                  Nenhuma ação registrada ainda.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
