import { supabase, type Category } from '@/lib/supabase'

export interface ThemeGroup {
  id: string
  category: Category
  title: string
  itemIds: string[]
}

/** Groups normally live in Supabase (table `retro_board_settings`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const LOCAL_STORAGE_PREFIX = 'retro-theme-groups'
const MIGRATION_FLAG_PREFIX = 'retro-theme-groups-migrated'

function localKey(sessionId: string) {
  return `${LOCAL_STORAGE_PREFIX}-${sessionId}`
}

function migrationFlagKey(sessionId: string) {
  return `${MIGRATION_FLAG_PREFIX}-${sessionId}`
}

function readLocalGroups(sessionId: string): ThemeGroup[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(localKey(sessionId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalGroups(sessionId: string, groups: ThemeGroup[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localKey(sessionId), JSON.stringify(groups))
}

export async function loadThemeGroups(sessionId: string): Promise<ThemeGroup[]> {
  const { data, error } = await supabase
    .from('retro_board_settings')
    .select('theme_groups')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalGroups(sessionId)
  }

  const groups = (data?.theme_groups as ThemeGroup[] | undefined) ?? []
  if (groups.length > 0) return groups

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(migrationFlagKey(sessionId))) {
    const legacy = readLocalGroups(sessionId)
    window.localStorage.setItem(migrationFlagKey(sessionId), '1')
    if (legacy.length > 0) {
      await saveThemeGroups(sessionId, legacy)
      return legacy
    }
  }

  return groups
}

export async function saveThemeGroups(sessionId: string, groups: ThemeGroup[]) {
  const { error } = await supabase
    .from('retro_board_settings')
    .upsert({ session_id: sessionId, theme_groups: groups, updated_at: new Date().toISOString() }, { onConflict: 'session_id' })

  if (error) {
    writeLocalGroups(sessionId, groups)
  }
}
