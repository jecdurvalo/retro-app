'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Archive,
  Check,
  Trash2,
  Calendar,
  User,
  Flag,
  MoreHorizontal,
  GripVertical,
  Clock,
  AlertCircle,
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
  taskPriorities,
  taskTypes,
  taskEfforts,
  type Task,
  type TaskPriority,
  type TaskType,
  type TaskEffort,
  type Subtask,
} from '@/lib/tasks'

const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.08)] transition-all'

const temperaturePill: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-500 text-white',
  Atenção: 'bg-amber-400 text-white',
  Crítica: 'bg-rose-500 text-white',
}

const temperatureDot: Record<ManagementFront['temperature'], string> = {
  Saudável: 'bg-emerald-500',
  Atenção: 'bg-amber-400',
  Crítica: 'bg-rose-500',
}

const taskStatusConfig: Record<Task['status'], { bg: string; text: string; border: string; dot: string; label: string }> = {
  Aberta: { 
    bg: 'bg-zinc-50', 
    text: 'text-zinc-600', 
    border: 'border-zinc-200', 
    dot: 'bg-zinc-400',
    label: 'bg-zinc-100 text-zinc-700'
  },
  'Em andamento': { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-200', 
    dot: 'bg-blue-500',
    label: 'bg-blue-100 text-blue-700'
  },
  Concluída: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200', 
    dot: 'bg-emerald-500',
    label: 'bg-emerald-100 text-emerald-700'
  },
}

const priorityConfig: Record<TaskPriority, { color: string; bg: string; text: string; dot: string }> = {
  Baixa: { color: 'zinc', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  Média: { color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Alta: { color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Urgente: { color: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
}

const typeConfig: Record<TaskType, { bg: string; text: string; icon: string }> = {
  Operacional: { bg: 'bg-slate-100', text: 'text-slate-700', icon: '⚙️' },
  Estratégica: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🎯' },
  Desenvolvimento: { bg: 'bg-green-100', text: 'text-green-700', icon: '🌱' },
  Governança: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🛡️' },
}

const effortConfig: Record<TaskEffort, { color: string; width: string }> = {
  XS: { color: 'bg-emerald-500', width: 'w-8' },
  S: { color: 'bg-lime-500', width: 'w-12' },
  M: { color: 'bg-yellow-500', width: 'w-16' },
  L: { color: 'bg-orange-500', width: 'w-20' },
  XL: { color: 'bg-rose-500', width: 'w-24' },
}

const fcaBorderLeft: Record<FCA['status'], string> = {
  'Em andamento': 'border-l-blue-400',
  Concluído: 'border-l-emerald-400',
  Bloqueado: 'border-l-rose-400',
}

const fcaStatusPill: Record<FCA['status'], string> = {
  'Em andamento': 'bg-blue-100 text-blue-700',
  Concluído: 'bg-emerald-100 text-emerald-700',
  Bloqueado: 'bg-rose-100 text-rose-700',
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
      className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
      onSubmit={e => {
        e.preventDefault()
        if (!draft.name.trim()) return
        onSave(draft)
      }}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Nova frente</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 sm:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nome</span>
          <input
            ref={nameRef}
            required
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Nome da frente"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tipo</span>
          <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value as ManagementFront['type'] }))} className={fieldClass}>
            {(['Projeto', 'Processo', 'Risco', 'PDI', 'Governança', 'Oportunidade', 'Rotina'] as const).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Temperatura</span>
          <select value={draft.temperature} onChange={e => setDraft(d => ({ ...d, temperature: e.target.value as ManagementFront['temperature'] }))} className={fieldClass}>
            {frontTemperatures.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-bold text-white hover:bg-zinc-800 transition-colors">
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
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Novo FCA</p>
      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Fato (o que aconteceu, com evidência)</span>
          <textarea required rows={2} value={draft.fact} onChange={e => set('fact', e.target.value)} className={fieldClass} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Causa (por que aconteceu)</span>
          <textarea rows={2} value={draft.cause} onChange={e => set('cause', e.target.value)} className={fieldClass} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ação (o que será feito)</span>
          <textarea required rows={2} value={draft.action} onChange={e => set('action', e.target.value)} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Responsável</span>
            <input value={draft.owner} onChange={e => set('owner', e.target.value)} className={fieldClass} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Prazo</span>
            <input type="date" value={draft.dueDate} onChange={e => set('dueDate', e.target.value)} className={fieldClass} />
          </label>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-bold text-white hover:bg-zinc-800 transition-colors">
          Salvar FCA
        </button>
      </div>
    </form>
  )
}

// ─── FCA Item ─────────────────────────────────────────────────────────────────

function FcaItem({ fca, onStatusChange, onDelete }: { fca: FCA; onStatusChange: (status: FCA['status']) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-xl border border-zinc-200 border-l-4 ${fcaBorderLeft[fca.status]} bg-white p-4`}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setExpanded(v => !v)} className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900 truncate">{fca.fact || '(sem fato)'}</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${fcaStatusPill[fca.status]}`}>{fca.status}</span>
            {fca.owner && <span className="text-xs text-zinc-500">{fca.owner}</span>}
            {fca.dueDate && <span className="text-xs text-zinc-400">{formatDateShort(fca.dueDate)}</span>}
          </div>
          {expanded && (
            <div className="mt-3 grid gap-3 text-sm">
              {fca.fact && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Fato</p>
                  <p className="mt-1 text-sm text-zinc-700">{fca.fact}</p>
                </div>
              )}
              {fca.cause && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Causa</p>
                  <p className="mt-1 text-sm text-zinc-700">{fca.cause}</p>
                </div>
              )}
              {fca.action && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ação</p>
                  <p className="mt-1 text-sm text-zinc-700">{fca.action}</p>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2 pt-1 border-t border-zinc-100">
                <span className="text-xs font-semibold text-zinc-500">Status:</span>
                <select
                  value={fca.status}
                  onChange={e => onStatusChange(e.target.value as FCA['status'])}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-zinc-400"
                >
                  {fcaStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  type="button"
                  onClick={onDelete}
                  className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={12} /> Excluir FCA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onChange, onDelete, index }: { task: Task; onChange: (updated: Task) => void; onDelete: () => void; index: number }) {
  const done = task.status === 'Concluída'
  const config = taskStatusConfig[task.status]
  const priorityCfg = priorityConfig[task.priority]
  const typeCfg = typeConfig[task.type]
  const effortCfg = effortConfig[task.effort]
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !done
  
  const completedSubtasks = task.subtasks.filter(s => s.done).length
  const totalSubtasks = task.subtasks.length
  
  return (
    <div className={`group flex flex-col gap-3 px-4 py-4 rounded-2xl transition-all duration-200 ${config.bg} hover:shadow-md border border-transparent hover:border-zinc-200`}>
      {/* Linha principal */}
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Arrastar tarefa"
        >
          <GripVertical size={14} />
        </button>

        {/* Checkbox customizado */}
        <button
          type="button"
          aria-label={done ? 'Marcar como aberta' : 'Marcar como concluída'}
          onClick={() => onChange({ ...task, status: done ? 'Aberta' : 'Concluída', updatedAt: new Date().toISOString() })}
          className={`grid place-items-center rounded-full border-2 transition-all duration-200 ${
            done 
              ? 'border-emerald-500 bg-emerald-500 text-white scale-100' 
              : 'border-zinc-300 bg-white text-transparent hover:border-emerald-400 hover:scale-105'
          }`}
          style={{ width: '24px', height: '24px' }}
        >
          <Check size={14} strokeWidth={3.5} />
        </button>

        {/* Texto da tarefa */}
        <span className={`flex-1 min-w-0 text-sm font-semibold transition-all ${
          done ? 'text-zinc-400 line-through' : 'text-zinc-800'
        }`}>
          {task.text}
        </span>

        {/* Prioridade badge */}
        <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${priorityCfg.bg} ${priorityCfg.text}`}>
          <span className={`w-2 h-2 rounded-full ${priorityCfg.dot}`} />
          {task.priority}
        </span>

        {/* Tipo badge */}
        <span className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${typeCfg.bg} ${typeCfg.text}`}>
          <span>{typeCfg.icon}</span>
          {task.type}
        </span>

        {/* Esforço indicator */}
        <div className="hidden lg:flex items-center gap-2 shrink-0" title={`Esforço: ${task.effort}`}>
          <span className="text-xs font-semibold text-zinc-500">Esforço</span>
          <div className="flex items-center gap-1">
            <div className={`h-2 rounded-full ${effortCfg.color} ${effortCfg.width} transition-all`} />
            <span className="text-xs font-bold text-zinc-600 w-6">{task.effort}</span>
          </div>
        </div>

        {/* Status badge melhorado */}
        <select
          value={task.status}
          onChange={e => onChange({ ...task, status: e.target.value as Task['status'], updatedAt: new Date().toISOString() })}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition-all hover:scale-105 ${config.label}`}
        >
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          {task.status}
        </select>

        {/* Botão de excluir */}
        <button
          type="button"
          aria-label="Excluir task"
          onClick={onDelete}
          className="shrink-0 p-2 text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Segunda linha com metadados */}
      <div className="flex flex-wrap items-center gap-3 pl-10">
        {/* Data com ícone */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
          isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-white text-zinc-500'
        }`}>
          <Calendar size={12} />
          <span>{task.dueDate ? formatDateShort(task.dueDate) : 'Sem prazo'}</span>
        </div>

        {/* Responsável com ícone */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white text-xs font-bold text-zinc-600">
          <User size={12} className="text-zinc-400" />
          <span>{task.assignee || 'Não atribuído'}</span>
        </div>

        {/* Subtasks progress */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white">
            <div className="flex items-center gap-1">
              <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-zinc-600">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600">
                #{tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs font-semibold text-zinc-400">+{task.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quick Add Task ───────────────────────────────────────────────────────────

function QuickAddTask({ frontId, onAdd }: { frontId: string; onAdd: (task: Task) => void }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Média')
  const [type, setType] = useState<TaskType>('Operacional')
  const [effort, setEffort] = useState<TaskEffort>('M')
  const [isExpanded, setIsExpanded] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(createEmptyTask({ text: text.trim(), dueDate, assignee, priority, type, effort, frontId }))
    setText('')
    setDueDate('')
    setAssignee('')
    setPriority('Média')
    setType('Operacional')
    setEffort('M')
    setIsExpanded(false)
  }

  return (
    <form onSubmit={submit} className="mt-3">
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)] transition-all group"
        >
          <Plus size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Adicionar nova tarefa...</span>
        </button>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-md">
          {/* Linha 1: Texto da task */}
          <div className="mb-3">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[rgba(135,0,47,0.1)] placeholder:text-zinc-400 transition-all font-medium"
            />
          </div>
          
          {/* Linha 2: Metadados */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            {/* Prioridade */}
            <div className="relative">
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-8 py-2.5 text-xs font-bold outline-none focus:border-[var(--retro-wine)] transition-all cursor-pointer"
              >
                {taskPriorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</span>
            </div>
            
            {/* Tipo */}
            <div className="relative">
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-8 py-2.5 text-xs font-bold outline-none focus:border-[var(--retro-wine)] transition-all cursor-pointer"
              >
                {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</span>
            </div>
            
            {/* Esforço */}
            <div className="relative">
              <select
                value={effort}
                onChange={e => setEffort(e.target.value as TaskEffort)}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-8 py-2.5 text-xs font-bold outline-none focus:border-[var(--retro-wine)] transition-all cursor-pointer"
              >
                {taskEfforts.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</span>
            </div>
            
            {/* Data */}
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white pl-3 pr-3 py-2.5 text-xs text-zinc-600 outline-none focus:border-[var(--retro-wine)] transition-all"
              />
            </div>
            
            {/* Responsável */}
            <div className="relative">
              <input
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="Quem?"
                className="w-full rounded-lg border border-zinc-200 bg-white pl-3 pr-3 py-2.5 text-xs outline-none focus:border-[var(--retro-wine)] placeholder:text-zinc-400 transition-all"
              />
            </div>
          </div>
          
          {/* Linha 3: Ações */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsExpanded(false); setText(''); setDueDate(''); setAssignee(''); setPriority('Média'); setType('Operacional'); setEffort('M') }}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!text.trim()}
              className="rounded-xl bg-[var(--retro-wine)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--retro-wine-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
            >
              <Check size={16} />
              Criar tarefa
            </button>
          </div>
        </div>
      )}
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
  onDeleteTask,
}: {
  front: ManagementFront
  tasks: Task[]
  onUpdateFront: (f: ManagementFront) => void
  onArchive: (f: ManagementFront) => void
  onAddTask: (t: Task) => void
  onUpdateTask: (t: Task) => void
  onDeleteTask: (id: string) => void
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
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${temperatureDot[front.temperature]}`} aria-hidden />

        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-zinc-900">{front.name}</span>
          {front.description && !expanded && (
            <span className="block truncate text-xs text-zinc-400 mt-0.5">{front.description}</span>
          )}
        </div>

        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex items-center gap-1.5 ${temperaturePill[front.temperature]}`}>
          {front.temperature}
        </span>

        <select
          value={front.temperature}
          onClick={e => e.stopPropagation()}
          onChange={e => {
            e.stopPropagation()
            onUpdateFront({ ...front, temperature: e.target.value as ManagementFront['temperature'], updatedAt: new Date().toISOString() })
          }}
          className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-zinc-400 sm:hidden"
          aria-label="Temperatura"
        >
          {frontTemperatures.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <span className="shrink-0 text-zinc-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-5 pt-4">

          {/* Name editing + description */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {editingName ? (
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameDraft(front.name); setEditingName(false) } }}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-bold text-zinc-900 outline-none focus:border-zinc-500"
                />
              ) : (
                <p className="text-sm text-zinc-700">
                  {front.description || <span className="italic text-zinc-400">Sem descrição</span>}
                </p>
              )}
            </div>
            {!editingName && (
              <button
                type="button"
                onClick={() => { setNameDraft(front.name); setEditingName(true) }}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                Editar nome
              </button>
            )}
          </div>

          {/* Temperature select (desktop, inside expanded) */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Temperatura:</span>
            <select
              value={front.temperature}
              onChange={e => onUpdateFront({ ...front, temperature: e.target.value as ManagementFront['temperature'], updatedAt: new Date().toISOString() })}
              className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-zinc-400"
            >
              {frontTemperatures.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* ── FCAs ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">FCAs</p>
              <button
                type="button"
                onClick={() => setShowFcaForm(v => !v)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <Plus size={12} /> Criar FCA
              </button>
            </div>

            {showFcaForm && <FcaForm onCancel={() => setShowFcaForm(false)} onSave={addFca} />}

            {(front.fcas ?? []).length > 0 && (
              <div className="grid gap-2">
                {(front.fcas ?? []).map(fca => (
                  <FcaItem
                    key={fca.id}
                    fca={fca}
                    onStatusChange={status => updateFcaStatus(fca.id, status)}
                    onDelete={() => onUpdateFront({ ...front, fcas: (front.fcas ?? []).filter(f => f.id !== fca.id), updatedAt: new Date().toISOString() })}
                  />
                ))}
              </div>
            )}
            {(front.fcas ?? []).length === 0 && !showFcaForm && (
              <p className="text-xs text-zinc-400">Nenhum FCA registrado.</p>
            )}
          </div>

          {/* ── Tasks ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tasks</p>
                {frontTasks.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                    {frontTasks.filter(t => t.status !== 'Concluída').length}/{frontTasks.length}
                  </span>
                )}
              </div>
            </div>

            {frontTasks.length > 0 && (
              <div className="mt-1 grid gap-2">
                {frontTasks.map((task, idx) => (
                  <TaskRow key={task.id} task={task} index={idx} onChange={onUpdateTask} onDelete={() => onDeleteTask(task.id)} />
                ))}
              </div>
            )}

            {frontTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-center">
                <p className="text-sm text-zinc-400">Nenhuma tarefa ainda</p>
                <p className="text-xs text-zinc-300 mt-0.5">Adicione a primeira tarefa abaixo</p>
              </div>
            )}

            <QuickAddTask frontId={front.id} onAdd={onAddTask} />
          </div>

          {/* ── Archive ── */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => onArchive(front)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Archive size={12} /> Arquivar frente
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

  const deleteTask = (id: string) => {
    persistTasks(tasks.filter(t => t.id !== id))
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

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-zinc-950">Frentes</h1>
          <button
            type="button"
            onClick={() => setShowNewForm(v => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            {showNewForm ? <X size={15} /> : <Plus size={15} />}
            {showNewForm ? 'Cancelar' : 'Nova frente'}
          </button>
        </div>

        {/* New front form */}
        {showNewForm && (
          <NewFrontForm onCancel={() => setShowNewForm(false)} onSave={createFront} />
        )}

        {/* Empty state */}
        {activeFronts.length === 0 && !showNewForm && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-bold text-zinc-900 text-base">Nenhuma frente ainda</p>
            <p className="mt-1 text-sm text-zinc-400">Crie a primeira frente para começar a organizar seu trabalho.</p>
          </div>
        )}

        {/* "Você lidera" */}
        {leaderFronts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Você lidera</p>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>
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
                  onDeleteTask={deleteTask}
                />
              ))}
            </div>
          </section>
        )}

        {/* "Você monitora" */}
        {monitorFronts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Você monitora</p>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>
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
