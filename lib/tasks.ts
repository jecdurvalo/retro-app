export const TASKS_STORAGE_KEY = 'leadership-tasks'

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

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value.map(normalizeTask) : []
  } catch { return [] }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window !== 'undefined') localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
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
