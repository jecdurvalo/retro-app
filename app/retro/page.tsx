'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Layers,
  MessageSquareText,
  Pause,
  Play,
  RefreshCw,
  Pencil,
  Save,
  Smile,
  TimerReset,
  Trash2,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { CATEGORIES, SESSION_ID, supabase, type Category, type RetroItem } from '@/lib/supabase'
import { isMoodItem, parseMoodItem } from '@/lib/mood'
import { loadManagementPlans, insertRetroSnapshot, type RetroSnapshot } from '@/lib/management'
import { loadThemeGroups, saveThemeGroups, type ThemeGroup } from '@/lib/theme-groups'
import { loadBoardHeader, saveBoardHeader, type BoardHeader } from '@/lib/board-header'
import { loadPeople } from '@/lib/people'

const DEFAULT_BOARD_HEADER: BoardHeader = {
  title: 'Board da retro ao vivo',
  subtitle: 'Acompanhe os cards do time em tempo real. Selecione dois ou mais cards de uma mesma coluna para agrupá-los por tema.',
}

const categoryTone: Record<Category, { border: string; header: string; dot: string; empty: string; soft: string }> = {
  went_well: {
    border: 'border-[var(--retro-green)]/30',
    header: 'bg-[var(--retro-green-soft)] text-[var(--success-text)]',
    dot: 'bg-[var(--retro-green)]',
    empty: 'O que funcionou bem aparece aqui.',
    soft: 'bg-[var(--retro-green-soft)]/40',
  },
  to_improve: {
    border: 'border-[var(--retro-amber)]/35',
    header: 'bg-[var(--retro-amber-soft)] text-[var(--warning-text)]',
    dot: 'bg-[var(--retro-amber)]',
    empty: 'Pontos de melhoria aparecem aqui.',
    soft: 'bg-[var(--retro-amber-soft)]/40',
  },
  action_items: {
    border: 'border-[var(--retro-red)]/30',
    header: 'bg-[var(--retro-red-soft)] text-[var(--critical-text)]',
    dot: 'bg-[var(--retro-red)]',
    empty: 'Paradas, ações ou decisões aparecem aqui.',
    soft: 'bg-[var(--retro-red-soft)]/40',
  },
}

function moodColor(score: number) {
  if (score >= 4) return 'bg-[var(--retro-green-soft)] text-[var(--success-text)]'
  if (score >= 3) return 'bg-[var(--retro-amber-soft)] text-[var(--warning-text)]'
  return 'bg-[var(--retro-red-soft)] text-[var(--critical-text)]'
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function RetroPage() {
  const [items, setItems] = useState<RetroItem[]>([])
  const [groups, setGroups] = useState<ThemeGroup[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupDraftTitle, setGroupDraftTitle] = useState<Record<Category, string>>({
    went_well: '',
    to_improve: '',
    action_items: '',
  })
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  const [boardHeader, setBoardHeader] = useState<BoardHeader>(DEFAULT_BOARD_HEADER)
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerDraft, setHeaderDraft] = useState<BoardHeader>(DEFAULT_BOARD_HEADER)
  const [feedback, setFeedback] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(10 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [leaderNameDraft, setLeaderNameDraft] = useState('Joana Durvalo')
  const [participantOptions, setParticipantOptions] = useState<string[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set())

  async function loadLiveItems() {
    setLoading(true)
    const { data } = await supabase
      .from('retro_items')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: false })

    const fetched = (data ?? []) as RetroItem[]
    setItems(fetched)
    setLoading(false)
    return fetched
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadThemeGroups(SESSION_ID).then(setGroups)
      loadBoardHeader(SESSION_ID, DEFAULT_BOARD_HEADER).then(setBoardHeader)
      loadLiveItems()
      setParticipantOptions(loadPeople().map(p => p.name).filter(Boolean))
    })

    const channel = supabase
      .channel(`retro-room-${SESSION_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'retro_items', filter: `session_id=eq.${SESSION_ID}` },
        () => loadLiveItems(),
      )
      .subscribe()

    return () => {
      window.cancelAnimationFrame(frame)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => {
      setTimerSeconds(value => {
        if (value <= 1) {
          setTimerRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [timerRunning])

  const retroItems = useMemo(() => items.filter(item => !isMoodItem(item)), [items])
  const moodEntries = useMemo(() => items.map(parseMoodItem).filter(entry => entry !== null), [items])
  const moodAverage = moodEntries.length
    ? moodEntries.reduce((sum, entry) => sum + entry.score, 0) / moodEntries.length
    : 0

  const itemsByCategory = useMemo(() => {
    return CATEGORIES.reduce<Record<Category, RetroItem[]>>((acc, category) => {
      acc[category.key] = retroItems.filter(item => item.category === category.key)
      return acc
    }, { went_well: [], to_improve: [], action_items: [] })
  }, [retroItems])

  function persistGroups(next: ThemeGroup[]) {
    setGroups(next)
    saveThemeGroups(SESSION_ID, next).catch(() => {})
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection(category: Category) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      itemsByCategory[category].forEach(item => next.delete(item.id))
      return next
    })
    setGroupDraftTitle(prev => ({ ...prev, [category]: '' }))
  }

  function createGroup(category: Category) {
    const title = groupDraftTitle[category].trim()
    const ids = itemsByCategory[category].filter(item => selectedIds.has(item.id)).map(item => item.id)
    if (!title || ids.length < 2) return
    const group: ThemeGroup = { id: `group-${Date.now()}`, category, title, itemIds: ids }
    persistGroups([...groups, group])
    clearSelection(category)
  }

  function ungroup(groupId: string) {
    persistGroups(groups.filter(g => g.id !== groupId))
  }

  function renameGroup(groupId: string, title: string) {
    persistGroups(groups.map(g => (g.id === groupId ? { ...g, title } : g)))
  }

  function removeItemFromGroup(groupId: string, itemId: string) {
    const next = groups
      .map(g => (g.id === groupId ? { ...g, itemIds: g.itemIds.filter(id => id !== itemId) } : g))
      .filter(g => g.itemIds.length > 0)
    persistGroups(next)
  }

  async function clearBoard() {
    if (items.length === 0) {
      setFeedback('O board já está vazio.')
      window.setTimeout(() => setFeedback(''), 2400)
      return
    }

    const confirmed = window.confirm(
      `Remover todos os ${items.length} card(s) e respostas de mood do board? Essa ação não pode ser desfeita. Salve um snapshot antes, se quiser guardar o conteúdo.`
    )
    if (!confirmed) return

    setClearing(true)
    const { error } = await supabase
      .from('retro_items')
      .delete()
      .eq('session_id', SESSION_ID)

    if (error) {
      setFeedback('Não foi possível limpar o board. Tente novamente.')
    } else {
      await loadLiveItems()
      persistGroups([])
      setFeedback('Board limpo.')
    }

    setClearing(false)
    window.setTimeout(() => setFeedback(''), 2600)
  }

  function startEditHeader() {
    setHeaderDraft(boardHeader)
    setEditingHeader(true)
  }

  function cancelEditHeader() {
    setEditingHeader(false)
  }

  function saveEditHeader() {
    const title = headerDraft.title.trim()
    const subtitle = headerDraft.subtitle.trim()
    if (!title) return
    const next: BoardHeader = { title, subtitle }
    setBoardHeader(next)
    saveBoardHeader(SESSION_ID, next).catch(() => {})
    setEditingHeader(false)
  }

  function toggleParticipant(name: string) {
    setSelectedParticipants(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function saveSnapshot() {
    const themes = CATEGORIES
      .filter(category => itemsByCategory[category.key].length > 0)
      .map(category => category.label)
    const categoryLabel = (key: Category) => CATEGORIES.find(c => c.key === key)?.label ?? key
    const groupTitleFor = (itemId: string) => groups.find(g => g.itemIds.includes(itemId))?.title ?? null
    const snapshot: RetroSnapshot = {
      id: `snapshot-${Date.now()}`,
      title: `Retro de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())}`,
      date: new Date().toISOString().slice(0, 10),
      moodAverage,
      moodCount: moodEntries.length,
      itemCount: retroItems.length,
      openPlanCount: loadManagementPlans().filter(plan => plan.status !== 'done').length,
      themes,
      createdAt: new Date().toISOString(),
      leaderName: leaderNameDraft.trim() || undefined,
      participantNames: [...selectedParticipants],
      items: retroItems.map(item => {
        const theme = groupTitleFor(item.id)
        return {
          category: categoryLabel(item.category) + (theme ? ` · ${theme}` : ''),
          content: item.content,
          authorName: item.author_name,
        }
      }),
    }
    setSavingSnapshot(true)
    const { error } = await insertRetroSnapshot(SESSION_ID, snapshot)
    setSavingSnapshot(false)
    setShowSaveDialog(false)
    setFeedback(
      error
        ? 'Não foi possível salvar o snapshot. Tente novamente.'
        : 'Snapshot salvo com todos os cards. Veja o histórico completo no cockpit.'
    )
    window.setTimeout(() => setFeedback(''), 2800)
  }

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      {feedback && (
        <p role="status" className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg">
          {feedback}
        </p>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4" onClick={() => setShowSaveDialog(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <p className="text-base font-black text-zinc-900">Salvar snapshot da retro</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">Quem liderou e quem participou — isso fica no histórico.</p>

            <div className="mt-4 grid gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Líder da retro</label>
              <input
                type="text"
                value={leaderNameDraft}
                onChange={e => setLeaderNameDraft(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]"
              />
            </div>

            <div className="mt-4 grid gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Participantes</label>
              {participantOptions.length === 0 ? (
                <p className="text-xs font-semibold text-zinc-400">Nenhuma pessoa cadastrada em /pessoas ainda — pode salvar sem marcar participantes.</p>
              ) : (
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                  {participantOptions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleParticipant(name)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        selectedParticipants.has(name)
                          ? 'bg-[var(--retro-wine)] text-white'
                          : 'border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)]'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSaveDialog(false)} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-600 hover:bg-zinc-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSnapshot}
                disabled={savingSnapshot}
                className="rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white hover:bg-[var(--retro-wine-hover)] disabled:opacity-40"
              >
                {savingSnapshot ? 'Salvando...' : 'Salvar snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1280px] space-y-5">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--retro-wine)] via-[var(--retro-wine)]/70 to-transparent" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--retro-wine)]">Ritual da retro</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Ao vivo
                </span>
              </div>

              {editingHeader ? (
                <div className="mt-2 max-w-2xl space-y-2">
                  <input
                    value={headerDraft.title}
                    onChange={e => setHeaderDraft(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título do board"
                    autoFocus
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-2xl font-bold text-zinc-950 outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[var(--retro-wine)]/15"
                  />
                  <textarea
                    value={headerDraft.subtitle}
                    onChange={e => setHeaderDraft(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Descrição curta do ritual"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[var(--retro-wine)]/15"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={saveEditHeader}
                      disabled={!headerDraft.title.trim()}
                      className="rounded-lg bg-[var(--retro-wine)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditHeader}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <div className="mt-2 flex items-start gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{boardHeader.title}</h1>
                    <button
                      type="button"
                      onClick={startEditHeader}
                      aria-label="Editar título e descrição"
                      className="mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-zinc-500">{boardHeader.subtitle}</p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_auto]">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <Clock3 size={14} />
                    Timebox
                  </span>
                  <span className="font-mono text-2xl font-bold text-zinc-950">{formatTimer(timerSeconds)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(value => !value)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--retro-wine)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--retro-wine-hover)]"
                  >
                    {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                    {timerRunning ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTimerRunning(false); setTimerSeconds(10 * 60) }}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                    aria-label="Reiniciar cronômetro"
                  >
                    <TimerReset size={15} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={savingSnapshot || (retroItems.length === 0 && moodEntries.length === 0)}
                  aria-label="Salvar snapshot"
                  title="Salvar snapshot"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--retro-wine)] text-white hover:bg-[var(--retro-wine-hover)] disabled:opacity-40"
                >
                  <Save size={15} />
                </button>
                <button
                  type="button"
                  onClick={clearBoard}
                  disabled={clearing}
                  aria-label="Limpar board"
                  title="Limpar board"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              {
                label: 'Cards',
                value: retroItems.length,
                detail: 'contribuições do time',
                icon: MessageSquareText,
                tint: 'bg-[var(--retro-blue-soft)] text-[var(--retro-blue)]',
              },
              {
                label: 'Mood',
                value: moodEntries.length ? moodAverage.toFixed(1) : '-',
                detail: `${moodEntries.length} resposta(s)`,
                icon: Smile,
                tint: 'bg-[var(--retro-green-soft)] text-[var(--retro-green)]',
              },
              {
                label: 'Ações/paradas',
                value: itemsByCategory.action_items.length,
                detail: 'saídas para transformar',
                icon: Zap,
                tint: 'bg-[var(--retro-red-soft)] text-[var(--retro-red)]',
              },
              {
                label: 'Temas agrupados',
                value: groups.length,
                detail: 'clusters criados',
                icon: Layers,
                tint: 'bg-[var(--retro-amber-soft)] text-[var(--retro-amber)]',
              },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${stat.tint}`}>
                  <stat.icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">{stat.label}</p>
                  <p className="truncate text-[11px] font-medium text-zinc-400">{stat.detail}</p>
                </div>
                <p className="text-xl font-bold text-zinc-950">{String(stat.value)}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 lg:grid-cols-3">
            {CATEGORIES.map(category => {
              const tone = categoryTone[category.key]
              const categoryItems = itemsByCategory[category.key]
              const categoryGroups = groups.filter(g => g.category === category.key)
              const groupedIds = new Set(categoryGroups.flatMap(g => g.itemIds))
              const ungroupedItems = categoryItems.filter(item => !groupedIds.has(item.id))
              const selectedInCategory = categoryItems.filter(item => selectedIds.has(item.id))

              return (
                <article key={category.key} className={`min-h-[430px] rounded-3xl border bg-white shadow-sm ${tone.border}`}>
                  <div className="border-b border-zinc-100 p-4">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${tone.header}`}>
                      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                      {category.label}
                    </div>
                    <p className="mt-3 text-xs font-medium leading-5 text-zinc-500">
                      {category.key === 'went_well' && 'Reconheça padrões que devem continuar.'}
                      {category.key === 'to_improve' && 'Agrupe cards parecidos para virar um tema.'}
                      {category.key === 'action_items' && 'Capture decisões, paradas e próximos movimentos.'}
                    </p>
                  </div>

                  <div className="grid gap-2 p-3">
                    {selectedInCategory.length >= 2 && (
                      <div className="space-y-2.5 rounded-2xl border border-dashed border-[var(--retro-wine)]/40 bg-[var(--retro-wine)]/5 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--retro-wine)]">
                          {selectedInCategory.length} cards selecionados
                        </p>
                        <input
                          value={groupDraftTitle[category.key]}
                          onChange={e => setGroupDraftTitle(prev => ({ ...prev, [category.key]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && createGroup(category.key)}
                          placeholder="Nome do tema"
                          autoFocus
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[var(--retro-wine)]/15"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => createGroup(category.key)}
                            disabled={!groupDraftTitle[category.key].trim()}
                            className="flex-1 rounded-xl bg-[var(--retro-wine)] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                          >
                            Agrupar
                          </button>
                          <button
                            type="button"
                            onClick={() => clearSelection(category.key)}
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold text-zinc-500 hover:bg-zinc-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {categoryGroups.map(group => (
                      <div key={group.id} className={`rounded-2xl border border-zinc-200 p-3 ${tone.soft}`}>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            value={group.title}
                            onChange={e => renameGroup(group.id, e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-zinc-800 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => ungroup(group.id)}
                            aria-label="Desfazer grupo"
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-white hover:text-zinc-600"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <div className="mt-2 grid gap-1.5">
                          {group.itemIds.map(id => {
                            const item = categoryItems.find(i => i.id === id)
                            if (!item) return null
                            return (
                              <div key={id} className="flex items-start justify-between gap-2 rounded-xl bg-white/80 px-2.5 py-1.5">
                                <span className="text-xs font-medium leading-4 text-zinc-700">{item.content}</span>
                                <button
                                  type="button"
                                  onClick={() => removeItemFromGroup(group.id, id)}
                                  aria-label="Remover card do grupo"
                                  className="mt-0.5 shrink-0 text-zinc-300 hover:text-zinc-500"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {ungroupedItems.length > 0
                      ? ungroupedItems.map(item => {
                          const isSelected = selectedIds.has(item.id)
                          return (
                            <div
                              key={item.id}
                              className={`relative rounded-2xl border p-3 transition ${
                                isSelected
                                  ? 'border-[var(--retro-wine)] bg-white ring-2 ring-[var(--retro-wine)]/15'
                                  : 'border-zinc-100 bg-zinc-50'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleSelect(item.id)}
                                aria-label={isSelected ? 'Remover da seleção' : 'Selecionar para agrupar'}
                                className={`absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full border transition ${
                                  isSelected
                                    ? 'border-[var(--retro-wine)] bg-[var(--retro-wine)] text-white'
                                    : 'border-zinc-300 bg-white text-transparent hover:border-zinc-400'
                                }`}
                              >
                                <Check size={11} strokeWidth={3} />
                              </button>
                              <p className="pr-7 text-sm font-medium leading-5 text-zinc-800">{item.content}</p>
                              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-zinc-400">
                                <span>{item.author_name || 'Anônimo'}</span>
                                <span>{formatTime(item.created_at)}</span>
                              </div>
                            </div>
                          )
                        })
                      : categoryGroups.length === 0 && (
                          <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-zinc-200 px-4 text-center">
                            <p className="text-sm font-medium text-zinc-400">{loading ? 'Carregando cards...' : tone.empty}</p>
                          </div>
                        )}
                  </div>
                </article>
              )
            })}
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <UsersRound size={14} />
                    Pulso do time
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">Mood registrado no começo da retro.</p>
                </div>
                <button
                  type="button"
                  onClick={loadLiveItems}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                  aria-label="Atualizar retro"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                <div className={`grid h-20 place-items-center rounded-2xl ${moodAverage ? moodColor(moodAverage) : 'bg-white text-zinc-400'}`}>
                  <span className="text-3xl font-bold">{moodAverage ? moodAverage.toFixed(1) : '-'}</span>
                </div>
                <p className="mt-3 text-center text-xs font-semibold text-zinc-500">{moodEntries.length} resposta(s) de mood</p>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <CheckCircle2 size={14} />
                Fechamento esperado
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li className="rounded-xl bg-zinc-50 p-3">Ponto crítico vira FCA quando houver fato, causa e ação.</li>
                <li className="rounded-xl bg-zinc-50 p-3">Tema agrupado vira frente com dono e checkpoint.</li>
                <li className="rounded-xl bg-zinc-50 p-3">Combinado simples vira ação aberta no painel.</li>
              </ul>
            </section>

            <Link
              href="/historico"
              className="flex items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:bg-zinc-50"
            >
              <div>
                <p className="text-sm font-bold text-zinc-800">Histórico completo</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">Retros passadas ficam no cockpit, fora do board ao vivo.</p>
              </div>
              <ArrowUpRight size={18} className="shrink-0 text-zinc-400" />
            </Link>
          </aside>
        </section>
      </div>
    </main>
  )
}
