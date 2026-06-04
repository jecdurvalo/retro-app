import type { RetroItem } from './supabase'

export const MOOD_PREFIX = '__retro_mood__:'

export type MoodScore = 1 | 2 | 3 | 4 | 5

export type MoodEntry = {
  id: string
  score: MoodScore
  note: string
  authorName: string | null
  createdAt: string
}

export const moodOptions: { score: MoodScore; label: string; tone: string }[] = [
  { score: 1, label: 'Pesado', tone: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  { score: 2, label: 'Tenso', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  { score: 3, label: 'Ok', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { score: 4, label: 'Bem', tone: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { score: 5, label: 'Muito bem', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
]

export function encodeMood(score: MoodScore, note: string) {
  return `${MOOD_PREFIX}${JSON.stringify({ score, note })}`
}

export function isMoodItem(item: RetroItem) {
  return item.content.startsWith(MOOD_PREFIX)
}

export function parseMoodItem(item: RetroItem): MoodEntry | null {
  if (!isMoodItem(item)) return null

  try {
    const parsed = JSON.parse(item.content.slice(MOOD_PREFIX.length)) as { score?: number; note?: string }

    if (!parsed.score || parsed.score < 1 || parsed.score > 5) return null

    return {
      id: item.id,
      score: parsed.score as MoodScore,
      note: parsed.note || '',
      authorName: item.author_name,
      createdAt: item.created_at,
    }
  } catch {
    return null
  }
}
