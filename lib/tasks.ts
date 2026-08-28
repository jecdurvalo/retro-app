import { supabase } from '@/lib/supabase'

export const TASKS_STORAGE_KEY = 'leadership-tasks'
/** Tasks normally live in Supabase (table `leadership_tasks`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const MIGRATION_FLAG_KEY = 'leadership-tasks-migrated-to-supabase'

export const taskStatuses = ['Aberta', 'Em andamento', 'Concluída'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskPriorities = ['Baixa', 'Média', 'Alta', 'Urgente'] as const
export type TaskPriority = (typeof taskPriorities)[number]

export const taskTypes = ['Operacional', 'Estratégica', 'Desenvolvimento', 'Governança'] as const
export type TaskType = (typeof taskTypes)[number]

export const taskEfforts = ['XS', 'S', 'M', 'L', 'XL'] as const
export type TaskEffort = (typeof taskEfforts)[number]

export type Subtask = {
  id: string
  text: string
  done: boolean
}

export type Task = {
  id: string
  text: string
  status: TaskStatus
  dueDate: string
  assignee: string
  frontId: string
  fcaId: string
  priority: TaskPriority
  type: TaskType
  effort: TaskEffort
  tags: string[]
  subtasks: Subtask[]
  notes: string
  createdAt: string
  updatedAt: string
}

export function createEmptyTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString()
  return {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `task-${Date.now()}`,
    text: '',
    status: 'Aberta',
    dueDate: '',
    assignee: '',
    frontId: '',
    fcaId: '',
    priority: 'Média',
    type: 'Operacional',
    effort: 'M',
    tags: [],
    subtasks: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function normalizeTask(value: Partial<Task>): Task {
  return {
    id: value.id || `task-${Date.now()}`,
    text: value.text || '',
    status: value.status || 'Aberta',
    dueDate: value.dueDate || '',
    assignee: value.assignee || '',
    frontId: value.frontId || '',
    fcaId: value.fcaId || '',
    priority: value.priority || 'Média',
    type: value.type || 'Operacional',
    effort: value.effort || 'M',
    tags: Array.isArray(value.tags) ? value.tags : [],
    subtasks: Array.isArray(value.subtasks) ? value.subtasks : [],
    notes: value.notes || '',
    createdAt: value.createdAt || new Date().toISOString(),
    updatedAt: value.updatedAt || new Date().toISOString(),
  }
}

function readLocalTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(TASKS_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value.map(normalizeTask) : []
  } catch {
    return []
  }
}

function writeLocalTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

export async function loadTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('leadership_tasks').select('id, data')

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalTasks()
  }

  const tasks = (data ?? []).map(row => normalizeTask(row.data as Partial<Task>))
  if (tasks.length > 0) return tasks

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(MIGRATION_FLAG_KEY)) {
    const legacy = readLocalTasks()
    window.localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    if (legacy.length > 0) {
      await saveTasks(legacy)
      return legacy
    }
  }

  return tasks
}

export async function saveTasks(tasks: Task[]) {
  // Write to local storage first so the fallback is always current even if Supabase fails.
  writeLocalTasks(tasks)

  if (tasks.length === 0) {
    await supabase.from('leadership_tasks').delete().neq('id', '')
    return
  }

  const now = new Date().toISOString()
  await supabase
    .from('leadership_tasks')
    .upsert(tasks.map(task => ({ id: task.id, data: task, updated_at: now })), { onConflict: 'id' })

  const ids = tasks.map(task => task.id)
  await supabase.from('leadership_tasks').delete().not('id', 'in', `(${ids.join(',')})`)
}
