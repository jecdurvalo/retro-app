export const TASKS_STORAGE_KEY = 'leadership-tasks'

export const taskStatuses = ['Aberta', 'Em andamento', 'Concluída'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export type Task = {
  id: string
  text: string
  status: TaskStatus
  dueDate: string
  assignee: string
  frontId: string
  fcaId: string
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || 'null')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window !== 'undefined') localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
}
