export type PlanCriticality = 'low' | 'medium' | 'high' | 'critical'
export type ManagementPlanStatus = 'todo' | 'doing' | 'blocked' | 'done'

export type ManagementPlan = {
  id: string
  title: string
  fact: string
  cause: string
  action: string
  owner: string
  dueDate: string
  criticality: PlanCriticality
  status: ManagementPlanStatus
  successMetric: string
  nextCheckIn: string
  lastUpdate: string
  sourcePlanId?: string
  sourceItems: string[]
  createdAt: string
  updatedAt: string
}

export type RetroSnapshot = {
  id: string
  title: string
  date: string
  moodAverage: number
  moodCount: number
  itemCount: number
  openPlanCount: number
  themes: string[]
  createdAt: string
}

export const MANAGEMENT_PLAN_STORAGE_KEY = 'retro-management-plans'
export const RETRO_SNAPSHOT_STORAGE_KEY = 'retro-management-snapshots'

export function loadManagementPlans() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(MANAGEMENT_PLAN_STORAGE_KEY) || '[]') as ManagementPlan[]
  } catch {
    return []
  }
}

export function loadRetroSnapshots() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(RETRO_SNAPSHOT_STORAGE_KEY) || '[]') as RetroSnapshot[]
  } catch {
    return []
  }
}

export function saveRetroSnapshots(snapshots: RetroSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RETRO_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots))
}

export function isOverdue(plan: ManagementPlan, today = new Date()) {
  if (!plan.dueDate || plan.status === 'done') return false
  return new Date(`${plan.dueDate}T23:59:59`) < today
}

export function isCheckInLate(plan: ManagementPlan, today = new Date()) {
  if (!plan.nextCheckIn || plan.status === 'done') return false
  return new Date(`${plan.nextCheckIn}T23:59:59`) < today
}

export function getFcaCompleteness(plan: ManagementPlan) {
  const fields = [plan.fact, plan.cause, plan.action, plan.owner, plan.dueDate, plan.successMetric]
  return Math.round((fields.filter(field => field.trim().length > 0).length / fields.length) * 100)
}
