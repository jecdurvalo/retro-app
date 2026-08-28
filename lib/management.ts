import { supabase } from './supabase'

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

export type RetroSnapshotItem = {
  category: string
  content: string
  authorName: string | null
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
  /** Full card content at the time the snapshot was saved. Optional for backward
   * compatibility with snapshots saved before this field existed. */
  items?: RetroSnapshotItem[]
  /** Who led the retro and who attended. Optional — older snapshots and
   * Supabase tables created before this field existed won't have it. */
  leaderName?: string
  participantNames?: string[]
  bookmarked?: boolean
}

export const MANAGEMENT_PLAN_STORAGE_KEY = 'retro-management-plans'
/** Snapshots normally live in Supabase (table `retro_snapshots`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const LOCAL_RETRO_SNAPSHOT_STORAGE_KEY = 'retro-management-snapshots'
const SNAPSHOT_MIGRATION_FLAG_KEY = 'retro-snapshots-migrated-to-supabase'

function readLocalSnapshots(): RetroSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_RETRO_SNAPSHOT_STORAGE_KEY) || '[]') as RetroSnapshot[]
  } catch {
    return []
  }
}

function writeLocalSnapshots(snapshots: RetroSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_RETRO_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots))
}

export function loadManagementPlans() {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(MANAGEMENT_PLAN_STORAGE_KEY) || '[]') as ManagementPlan[]
  } catch {
    return []
  }
}

function snapshotRowToModel(row: Record<string, unknown>): RetroSnapshot {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    moodAverage: Number(row.mood_average ?? 0),
    moodCount: Number(row.mood_count ?? 0),
    itemCount: Number(row.item_count ?? 0),
    openPlanCount: Number(row.open_plan_count ?? 0),
    themes: (row.themes as string[]) ?? [],
    createdAt: row.created_at as string,
    items: (row.items as RetroSnapshotItem[] | undefined) ?? undefined,
    leaderName: (row.leader_name as string | undefined) ?? undefined,
    participantNames: (row.participant_names as string[] | undefined) ?? undefined,
    bookmarked: Boolean(row.bookmarked),
  }
}

function snapshotModelToRow(sessionId: string, snapshot: RetroSnapshot) {
  return {
    id: snapshot.id,
    session_id: sessionId,
    title: snapshot.title,
    date: snapshot.date,
    mood_average: snapshot.moodAverage,
    mood_count: snapshot.moodCount,
    item_count: snapshot.itemCount,
    open_plan_count: snapshot.openPlanCount,
    themes: snapshot.themes,
    items: snapshot.items ?? [],
    created_at: snapshot.createdAt,
    leader_name: snapshot.leaderName ?? null,
    participant_names: snapshot.participantNames ?? [],
    bookmarked: snapshot.bookmarked ?? false,
  }
}

/** One-time move of any snapshot saved to localStorage before this table existed. */
async function migrateLegacySnapshotsIfNeeded(sessionId: string) {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(SNAPSHOT_MIGRATION_FLAG_KEY)) return

  try {
    const legacy = readLocalSnapshots()
    if (legacy.length > 0) {
      const { error } = await supabase.from('retro_snapshots').insert(legacy.map(s => snapshotModelToRow(sessionId, s)))
      if (error) return // Supabase still not ready — try again on the next load.
    }
    window.localStorage.setItem(SNAPSHOT_MIGRATION_FLAG_KEY, '1')
  } catch {
    // leave the flag unset so migration is retried on the next load
  }
}

/** Reads from Supabase when reachable, otherwise falls back to whatever was saved
 * locally (see LOCAL_RETRO_SNAPSHOT_STORAGE_KEY above). */
export async function loadRetroSnapshots(sessionId: string): Promise<RetroSnapshot[]> {
  const { data, error } = await supabase
    .from('retro_snapshots')
    .select('*')
    .eq('session_id', sessionId)
    .order('date', { ascending: false })

  if (!error && data) {
    await migrateLegacySnapshotsIfNeeded(sessionId)
    return data.map(snapshotRowToModel)
  }

  return [...readLocalSnapshots()].sort((a, b) => b.date.localeCompare(a.date))
}

export async function insertRetroSnapshot(sessionId: string, snapshot: RetroSnapshot) {
  const { error } = await supabase.from('retro_snapshots').insert(snapshotModelToRow(sessionId, snapshot))
  if (!error) return { error: null }

  // Supabase unreachable (e.g. table not created yet) — keep it locally so nothing is lost.
  writeLocalSnapshots([snapshot, ...readLocalSnapshots()])
  return { error: null }
}

export async function updateRetroSnapshot(
  id: string,
  updates: Partial<Pick<RetroSnapshot, 'title' | 'date' | 'bookmarked'>>,
) {
  await supabase.from('retro_snapshots').update(updates).eq('id', id)
  // Also keep the local fallback copy (if any) in sync, in case Supabase isn't reachable.
  writeLocalSnapshots(readLocalSnapshots().map(s => (s.id === id ? { ...s, ...updates } : s)))
  return { error: null }
}

export async function deleteRetroSnapshot(id: string) {
  await supabase.from('retro_snapshots').delete().eq('id', id)
  writeLocalSnapshots(readLocalSnapshots().filter(s => s.id !== id))
  return { error: null }
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
