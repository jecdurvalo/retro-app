import { supabase } from '@/lib/supabase'

export interface BoardHeader {
  title: string
  subtitle: string
}

/** The header normally lives in Supabase (table `retro_board_settings`). This key holds
 * pre-existing local data to migrate once Supabase works, and also doubles as a
 * fallback store whenever Supabase is unreachable (e.g. table not created yet). */
const LOCAL_STORAGE_PREFIX = 'retro-board-header'
const MIGRATION_FLAG_PREFIX = 'retro-board-header-migrated'

function localKey(sessionId: string) {
  return `${LOCAL_STORAGE_PREFIX}-${sessionId}`
}

function migrationFlagKey(sessionId: string) {
  return `${MIGRATION_FLAG_PREFIX}-${sessionId}`
}

function readLocalHeader(sessionId: string): BoardHeader | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(localKey(sessionId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.title === 'string' && typeof parsed?.subtitle === 'string') return parsed as BoardHeader
    return null
  } catch {
    return null
  }
}

function writeLocalHeader(sessionId: string, header: BoardHeader) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localKey(sessionId), JSON.stringify(header))
}

export async function loadBoardHeader(sessionId: string, fallback: BoardHeader): Promise<BoardHeader> {
  const { data, error } = await supabase
    .from('retro_board_settings')
    .select('board_header')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) {
    // Supabase unreachable (e.g. table not created yet) — use local storage.
    return readLocalHeader(sessionId) ?? fallback
  }

  const header = data?.board_header as Partial<BoardHeader> | undefined
  if (header?.title) {
    return { title: header.title, subtitle: header.subtitle ?? '' }
  }

  // Supabase works but has nothing yet — migrate pre-existing local data once.
  if (typeof window !== 'undefined' && !window.localStorage.getItem(migrationFlagKey(sessionId))) {
    const legacy = readLocalHeader(sessionId)
    window.localStorage.setItem(migrationFlagKey(sessionId), '1')
    if (legacy) {
      await saveBoardHeader(sessionId, legacy)
      return legacy
    }
  }

  return fallback
}

export async function saveBoardHeader(sessionId: string, header: BoardHeader) {
  const { error } = await supabase
    .from('retro_board_settings')
    .upsert({ session_id: sessionId, board_header: header, updated_at: new Date().toISOString() }, { onConflict: 'session_id' })

  if (error) {
    writeLocalHeader(sessionId, header)
  }
}
