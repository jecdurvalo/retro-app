'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Download,
  Pencil,
  Search,
  Smile,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { loadRetroSnapshots, updateRetroSnapshot, deleteRetroSnapshot, type RetroSnapshot, type RetroSnapshotItem } from '@/lib/management'
import { SESSION_ID } from '@/lib/supabase'
import { PageHeader, type PageStat } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { initials } from '@/components/people-shared'

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const CATEGORY_TONE: Record<string, { badge: string; dot: string; border: string; order: number; text: string }> = {
  'Mandamos muito bem': {
    badge: 'bg-[var(--retro-green-soft)] text-[var(--success-text)]',
    dot: 'bg-[var(--retro-green)]',
    border: 'border-[var(--retro-green)]/25',
    text: 'text-[var(--success-text)]',
    order: 0,
  },
  'Podemos melhorar': {
    badge: 'bg-[var(--retro-amber-soft)] text-[var(--warning-text)]',
    dot: 'bg-[var(--retro-amber)]',
    border: 'border-[var(--retro-amber)]/30',
    text: 'text-[var(--warning-text)]',
    order: 1,
  },
  'Vamos repensar': {
    badge: 'bg-[var(--retro-red-soft)] text-[var(--critical-text)]',
    dot: 'bg-[var(--retro-red)]',
    border: 'border-[var(--retro-red)]/25',
    text: 'text-[var(--critical-text)]',
    order: 2,
  },
}
const DEFAULT_TONE = { badge: 'bg-zinc-100 text-zinc-500', dot: 'bg-zinc-400', border: 'border-zinc-200', text: 'text-zinc-600', order: 99 }

// Older snapshots stored "Categoria · Tema" as a single string; newer ones may not.
// Parsing it this way keeps both shapes working without needing a data migration.
function resolveGroupLabel(item: RetroSnapshotItem) {
  return item.category.split(' · ')[0]
}

function resolveTheme(item: RetroSnapshotItem) {
  const parts = item.category.split(' · ')
  return parts.length > 1 ? parts[1] : null
}

function groupSnapshotItems(items: RetroSnapshotItem[]) {
  const byCategory = new Map<string, RetroSnapshotItem[]>()
  items.forEach(item => {
    const label = resolveGroupLabel(item)
    byCategory.set(label, [...(byCategory.get(label) ?? []), item])
  })

  return [...byCategory.entries()]
    .sort((a, b) => (CATEGORY_TONE[a[0]]?.order ?? DEFAULT_TONE.order) - (CATEGORY_TONE[b[0]]?.order ?? DEFAULT_TONE.order))
    .map(([label, categoryItems]) => {
      const byTheme = new Map<string, RetroSnapshotItem[]>()
      const untitled: RetroSnapshotItem[] = []
      categoryItems.forEach(item => {
        const theme = resolveTheme(item)
        if (theme) byTheme.set(theme, [...(byTheme.get(theme) ?? []), item])
        else untitled.push(item)
      })
      return { label, tone: CATEGORY_TONE[label] ?? DEFAULT_TONE, themes: [...byTheme.entries()], untitled, count: categoryItems.length }
    })
}

function monthKey(dateIso: string) {
  return dateIso.slice(0, 7) // YYYY-MM
}

function trend(current: number, previous: number | null): { label: string; up: boolean } | null {
  if (previous === null || previous === 0) return null
  const diff = current - previous
  if (diff === 0) return null
  const pct = Math.round((diff / previous) * 100)
  return { label: `${diff > 0 ? '+' : ''}${pct}%`, up: diff > 0 }
}

const PAGE_SIZE = 3

export default function HistoricoPage() {
  const [snapshots, setSnapshots] = useState<RetroSnapshot[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resumoCollapsedId, setResumoCollapsedId] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', date: '' })
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('6')
  const [moodFilter, setMoodFilter] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [page, setPage] = useState(1)

  function toggleGroup(key: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    let active = true
    loadRetroSnapshots(SESSION_ID).then(data => {
      if (active) setSnapshots(data)
    })
    return () => {
      active = false
    }
  }, [])

  function startEdit(snapshot: RetroSnapshot) {
    setEditingId(snapshot.id)
    setDraft({ title: snapshot.title, date: snapshot.date })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit() {
    if (!editingId) return
    const title = draft.title.trim()
    if (!title || !draft.date) return

    setSaving(true)
    const { error } = await updateRetroSnapshot(editingId, { title, date: draft.date })
    setSaving(false)
    if (error) {
      window.alert('Não foi possível salvar. Tente novamente.')
      return
    }

    setSnapshots(prev =>
      [...prev.map(s => (s.id === editingId ? { ...s, title, date: draft.date } : s))].sort((a, b) => b.date.localeCompare(a.date))
    )
    setEditingId(null)
  }

  async function toggleBookmark(snapshot: RetroSnapshot) {
    const next = !snapshot.bookmarked
    setSnapshots(prev => prev.map(s => (s.id === snapshot.id ? { ...s, bookmarked: next } : s)))
    await updateRetroSnapshot(snapshot.id, { bookmarked: next })
  }

  async function removeSnapshot(id: string) {
    const confirmed = window.confirm('Remover este snapshot do histórico? Essa ação não pode ser desfeita.')
    if (!confirmed) return

    const { error } = await deleteRetroSnapshot(id)
    if (error) {
      window.alert('Não foi possível remover. Tente novamente.')
      return
    }

    setSnapshots(prev => prev.filter(s => s.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const allThemes = useMemo(() => {
    const set = new Set<string>()
    snapshots.forEach(s => s.themes.forEach(t => set.add(t)))
    return [...set].sort()
  }, [snapshots])

  const filtered = useMemo(() => {
    const now = new Date()
    const cutoff = period === 'all' ? null : new Date(now.getFullYear(), now.getMonth() - Number(period), now.getDate())
    return snapshots.filter(s => {
      if (cutoff && new Date(`${s.date}T00:00:00`) < cutoff) return false
      if (moodFilter === 'alto' && s.moodAverage < 4) return false
      if (moodFilter === 'medio' && (s.moodAverage < 3 || s.moodAverage >= 4)) return false
      if (moodFilter === 'baixo' && s.moodAverage >= 3) return false
      if (themeFilter && !s.themes.includes(themeFilter)) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${s.title} ${s.themes.join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [snapshots, period, moodFilter, themeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [period, moodFilter, themeFilter, search])

  // Trend: compare the most recent calendar month present in the data vs the one before it.
  const monthBuckets = useMemo(() => {
    const map = new Map<string, RetroSnapshot[]>()
    snapshots.forEach(s => {
      const key = monthKey(s.date)
      map.set(key, [...(map.get(key) ?? []), s])
    })
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [snapshots])

  const currentBucket = monthBuckets[0]?.[1] ?? []
  const previousBucket = monthBuckets[1]?.[1] ?? null

  const themeFrequency = useMemo(() => {
    const map = new Map<string, number>()
    snapshots.forEach(s => s.themes.forEach(t => map.set(t, (map.get(t) ?? 0) + 1)))
    return [...map.values()].filter(count => count > 1).length
  }, [snapshots])

  const totalCards = snapshots.reduce((sum, s) => sum + s.itemCount, 0)
  const avgMood = snapshots.length ? snapshots.reduce((sum, s) => sum + s.moodAverage, 0) / snapshots.length : 0
  const prevAvgMood = previousBucket && previousBucket.length
    ? previousBucket.reduce((sum, s) => sum + s.moodAverage, 0) / previousBucket.length
    : null
  const prevCards = previousBucket ? previousBucket.reduce((sum, s) => sum + s.itemCount, 0) : null

  const stats: PageStat[] = [
    {
      label: 'Retros salvas',
      value: snapshots.length,
      detail: trend(currentBucket.length, previousBucket?.length ?? null)?.label
        ? `${trend(currentBucket.length, previousBucket?.length ?? null)?.label} vs mês anterior`
        : 'no histórico',
    },
    {
      label: 'Cards arquivados',
      value: totalCards,
      detail: trend(currentBucket.reduce((s, snap) => s + snap.itemCount, 0), prevCards)?.label
        ? `${trend(currentBucket.reduce((s, snap) => s + snap.itemCount, 0), prevCards)?.label} vs mês anterior`
        : 'ao longo do tempo',
    },
    {
      label: 'Mood médio',
      value: avgMood.toFixed(1),
      detail: trend(currentBucket.length ? currentBucket.reduce((s, snap) => s + snap.moodAverage, 0) / currentBucket.length : 0, prevAvgMood)?.label
        ? `${trend(currentBucket.length ? currentBucket.reduce((s, snap) => s + snap.moodAverage, 0) / currentBucket.length : 0, prevAvgMood)?.label} vs mês anterior`
        : 'de todas as retros',
    },
    { label: 'Temas recorrentes', value: themeFrequency, detail: 'com mais frequência' },
  ]

  function exportCsv() {
    const header = ['Título', 'Data', 'Líder', 'Participantes', 'Mood', 'Cards', 'Temas']
    const rows = filtered.map(s => [
      s.title,
      s.date,
      s.leaderName ?? '',
      (s.participantNames ?? []).join('; '),
      s.moodCount ? s.moodAverage.toFixed(1) : '',
      String(s.itemCount),
      s.themes.join('; '),
    ])
    const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico-retros-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function clearFilters() {
    setSearch('')
    setPeriod('6')
    setMoodFilter('')
    setThemeFilter('')
  }

  const hasActiveFilters = Boolean(search || period !== '6' || moodFilter || themeFilter)

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          eyebrow="Pulso da retro"
          title="Histórico de retros"
          subtitle="Explore o que já foi discutido, acompanhe a evolução do time e transforme aprendizados em ação."
          backLink={
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600">
              <ArrowLeft size={14} />
              Voltar ao painel
            </Link>
          }
          action={
            snapshots.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-600 hover:bg-zinc-50"
              >
                <Download size={15} /> Exportar relatório
              </button>
            )
          }
          stats={snapshots.length > 0 ? stats : undefined}
        >
          {snapshots.length > 0 && (
            <div className="grid gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-end">
              <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-400 focus-within:border-[var(--retro-wine)] focus-within:bg-white">
                <Search size={16} />
                <span className="sr-only">Buscar retros</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar retros, temas ou palavras-chave…"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder:text-zinc-400"
                />
              </label>
              <Select
                value={period}
                onChange={setPeriod}
                options={[
                  { value: '3', label: 'Últimos 3 meses' },
                  { value: '6', label: 'Últimos 6 meses' },
                  { value: '12', label: 'Últimos 12 meses' },
                  { value: 'all', label: 'Todos' },
                ]}
              />
              <Select
                value={moodFilter}
                onChange={setMoodFilter}
                placeholder="Mood"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'alto', label: 'Alto (≥ 4)' },
                  { value: 'medio', label: 'Médio (3–4)' },
                  { value: 'baixo', label: 'Baixo (< 3)' },
                ]}
              />
              <Select
                value={themeFilter}
                onChange={setThemeFilter}
                placeholder="Temas"
                options={[{ value: '', label: 'Todos' }, ...allThemes.map(t => ({ value: t, label: t }))]}
              />
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="whitespace-nowrap text-xs font-bold text-[var(--retro-wine)] hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </PageHeader>

        {snapshots.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-zinc-400">Nenhum snapshot salvo ainda. Use &quot;Salvar snapshot&quot; no board da retro.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-zinc-400">Nenhuma retro encontrada com esses filtros.</p>
            <button type="button" onClick={clearFilters} className="mt-2 text-xs font-bold text-[var(--retro-wine)] hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {pageItems.map(snapshot => {
              const isEditing = editingId === snapshot.id
              const isExpanded = expandedId === snapshot.id
              const resumoCollapsed = resumoCollapsedId.has(snapshot.id)
              const groups = groupSnapshotItems(snapshot.items ?? [])
              const participants = snapshot.participantNames ?? []

              return (
                <div key={snapshot.id} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <input
                        value={draft.title}
                        onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                        autoFocus
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-base font-bold text-zinc-900 outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[var(--retro-wine)]/15"
                      />
                      <input
                        type="date"
                        value={draft.date}
                        onChange={e => setDraft(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[var(--retro-wine)]/15"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={saving || !draft.title.trim() || !draft.date}
                          className="rounded-lg bg-[var(--retro-wine)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-zinc-900">{snapshot.title}</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                          <CalendarDays size={13} />
                          {formatDate(snapshot.date)}
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">
                            <Smile size={11} />
                            {snapshot.moodCount ? snapshot.moodAverage.toFixed(1) : '-'}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--retro-blue-soft)] px-2 py-0.5 font-bold text-[var(--retro-blue)]">
                            <ClipboardList size={11} />
                            {snapshot.itemCount} cards
                          </span>
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                          {snapshot.leaderName && (
                            <div>
                              <p className="font-black uppercase tracking-wide text-zinc-400">Líder</p>
                              <p className="mt-0.5 inline-flex items-center gap-1.5 font-bold text-zinc-700">
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--retro-wine-soft)] text-[10px] font-black text-[var(--retro-wine)]">
                                  {initials(snapshot.leaderName)}
                                </span>
                                {snapshot.leaderName}
                              </p>
                            </div>
                          )}
                          {participants.length > 0 && (
                            <div>
                              <p className="font-black uppercase tracking-wide text-zinc-400">Participantes</p>
                              <div className="mt-0.5 flex items-center">
                                {participants.slice(0, 4).map((name, i) => (
                                  <span
                                    key={name}
                                    style={{ marginLeft: i === 0 ? 0 : -6 }}
                                    className="grid h-5 w-5 place-items-center rounded-full border border-white bg-zinc-100 text-[10px] font-black text-zinc-600"
                                    title={name}
                                  >
                                    {initials(name)}
                                  </span>
                                ))}
                                {participants.length > 4 && (
                                  <span className="ml-1 text-[11px] font-bold text-zinc-400">+{participants.length - 4}</span>
                                )}
                              </div>
                            </div>
                          )}
                          {snapshot.themes.length > 0 && (
                            <div className="min-w-0">
                              <p className="font-black uppercase tracking-wide text-zinc-400">Temas</p>
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {snapshot.themes.slice(0, 3).map(theme => (
                                  <span key={theme} className="rounded-full bg-zinc-100 px-2 py-0.5 font-bold text-zinc-600">{theme}</span>
                                ))}
                                {snapshot.themes.length > 3 && <span className="font-bold text-zinc-400">+{snapshot.themes.length - 3}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleBookmark(snapshot)}
                          aria-label={snapshot.bookmarked ? 'Remover destaque' : 'Destacar retro'}
                          className={`grid h-8 w-8 place-items-center rounded-full hover:bg-zinc-50 ${snapshot.bookmarked ? 'text-amber-500' : 'text-zinc-400'}`}
                        >
                          {snapshot.bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(snapshot)}
                          aria-label="Editar snapshot"
                          className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSnapshot(snapshot.id)}
                          aria-label="Remover snapshot"
                          className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : snapshot.id)}
                          className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[var(--retro-wine)] px-3.5 py-2 text-xs font-black text-white hover:bg-[var(--retro-wine-hover)]"
                        >
                          Abrir retro
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronRight size={13} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isEditing && groups.length > 0 && (
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setResumoCollapsedId(prev => {
                          const next = new Set(prev)
                          if (next.has(snapshot.id)) next.delete(snapshot.id)
                          else next.add(snapshot.id)
                          return next
                        })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                      >
                        {resumoCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        <Sparkles size={13} /> Resumo da retro
                      </button>

                      {!resumoCollapsed && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {groups.map(group => {
                            const preview = [...group.themes.flatMap(([, items]) => items), ...group.untitled].slice(0, 3)
                            return (
                              <div key={group.label} className={`rounded-2xl border p-3 ${group.tone.border}`}>
                                <p className={`inline-flex items-center gap-1.5 text-xs font-black ${group.tone.text}`}>
                                  <span className={`h-2 w-2 rounded-full ${group.tone.dot}`} />
                                  {group.label}
                                  <span className="opacity-60">{group.count}</span>
                                </p>
                                <ul className="mt-2 grid gap-1">
                                  {preview.map((item, i) => (
                                    <li key={i} className="text-xs font-semibold leading-4 text-zinc-600">• {item.content}</li>
                                  ))}
                                </ul>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {!isEditing && groups.length > 0 && isExpanded && (
                    <div className="mt-4 border-t border-zinc-100 pt-4">
                      <div className="space-y-4">
                        {groups.map(group => {
                          const groupKey = `${snapshot.id}::${group.label}`
                          const groupCollapsed = collapsedGroups.has(groupKey)

                          return (
                            <div key={group.label}>
                              <button
                                type="button"
                                onClick={() => toggleGroup(groupKey)}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${group.tone.badge}`}
                              >
                                {groupCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                                <span className={`h-2 w-2 rounded-full ${group.tone.dot}`} />
                                {group.label}
                                <span className="opacity-60">· {group.count}</span>
                              </button>

                              {!groupCollapsed && (
                                <div className="mt-2 space-y-2">
                                  {group.themes.map(([theme, themeItems]) => {
                                    const themeKey = `${groupKey}::${theme}`
                                    const themeCollapsed = collapsedGroups.has(themeKey)

                                    return (
                                      <div key={theme} className={`rounded-2xl border p-2.5 ${group.tone.border}`}>
                                        <button
                                          type="button"
                                          onClick={() => toggleGroup(themeKey)}
                                          className="flex w-full items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-zinc-500"
                                        >
                                          {themeCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                          🏷 {theme}
                                          <span className="opacity-60">· {themeItems.length}</span>
                                        </button>
                                        {!themeCollapsed && (
                                          <div className="mt-1.5 grid gap-1.5">
                                            {themeItems.map((item, index) => (
                                              <div key={index} className="rounded-xl bg-white px-3 py-2">
                                                <p className="text-sm font-medium text-zinc-800">{item.content}</p>
                                                <p className="mt-1 text-xs font-semibold text-zinc-400">{item.authorName || 'Anônimo'}</p>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}

                                  {group.untitled.map((item, index) => (
                                    <div key={index} className="rounded-xl bg-zinc-50 px-3 py-2">
                                      <p className="text-sm font-medium text-zinc-800">{item.content}</p>
                                      <p className="mt-1 text-xs font-semibold text-zinc-400">{item.authorName || 'Anônimo'}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {!isEditing && !snapshot.items && (
                    <p className="mt-3 border-t border-zinc-100 pt-3 text-xs font-medium text-zinc-400">
                      Este snapshot foi salvo antes de guardarmos o conteúdo dos cards — só os números ficaram registrados.
                    </p>
                  )}
                </div>
              )
            })}

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-semibold text-zinc-400">
                  Mostrando {(page - 1) * PAGE_SIZE + 1} a {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} retros
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
                        p === page ? 'bg-[var(--retro-wine)] text-white' : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
