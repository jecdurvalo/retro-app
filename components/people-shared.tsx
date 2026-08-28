'use client'

import { useState } from 'react'
import type { AttentionType, NoteEntry } from '@/lib/people'

export const cardClass = 'overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5'
export const fieldClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

export const attentionTone: Record<AttentionType, string> = {
  'Dar autonomia': 'bg-emerald-100 text-emerald-800',
  Desafiar: 'bg-violet-100 text-violet-800',
  Cuidar: 'bg-rose-100 text-rose-800',
  Desenvolver: 'bg-blue-100 text-blue-800',
  'Monitorar carga': 'bg-amber-100 text-amber-800',
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function formatDate(value: string) {
  if (!value) return 'Não agendado'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`))
}

export function formatLongDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso))
}

export function daysAgo(iso: string) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function newNote(text: string): NoteEntry {
  return { id: `note-${Date.now()}-${Math.random()}`, text, createdAt: new Date().toISOString() }
}

export function NoteHistory({ entries }: { entries: NoteEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  if (entries.length === 0) return <p className="text-xs text-zinc-400">Nenhum registro ainda.</p>
  const visible = expanded ? entries : entries.slice(0, 3)
  return (
    <div className="mt-3 grid gap-4">
      {visible.map(entry => (
        <div key={entry.id}>
          <div className="mb-2 flex items-center gap-3">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {formatTimestamp(entry.createdAt)}
            </span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>
          <p className="text-sm text-zinc-700">{entry.text}</p>
        </div>
      ))}
      {entries.length > 3 && (
        <button type="button" onClick={() => setExpanded(v => !v)} className="text-left text-xs font-semibold text-zinc-500 hover:text-zinc-800">
          {expanded ? 'Ver menos' : `+ ${entries.length - 3} mais antigas`}
        </button>
      )}
    </div>
  )
}
