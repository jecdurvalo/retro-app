'use client'

import Link from 'next/link'
import type { ElementType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ClipboardCheck, Cloud, CloudRain, Columns3, Frown, GripVertical, HeartPulse, Home, Laugh, ListChecks, Meh, MessageSquareWarning, Pause, Play, QrCode, Send, Smile, Square, Timer, Trash2, Ungroup, UserRound, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, SESSION_ID, CATEGORIES, type RetroItem, type Category } from '@/lib/supabase'
import { TEAM_JOIN_URL } from '@/lib/site-url'
import { isMoodItem, moodOptions, parseMoodItem } from '@/lib/mood'
import type { MoodScore } from '@/lib/mood'

const RETRO_DURATION_SECONDS = 10 * 60
const PLAN_STORAGE_KEY = `retro-action-plans:${SESSION_ID}`
const PLAN_META_STORAGE_KEY = `retro-action-plan-meta:${SESSION_ID}`
const CARD_GROUP_STORAGE_KEY = `retro-card-groups:${SESSION_ID}`

const STOP_WORDS = new Set([
  'ainda', 'algum', 'alguma', 'ao', 'aos', 'as', 'ate', 'bem', 'com', 'como', 'da', 'das', 'de',
  'dei', 'delas', 'deles', 'do', 'dos', 'e', 'em', 'essa', 'esse', 'esta', 'este', 'eu', 'foi',
  'mais', 'mas', 'me', 'mesmo', 'na', 'nas', 'no', 'nos', 'nossa', 'nosso', 'o', 'os', 'ou',
  'para', 'pela', 'pelo', 'por', 'porque', 'pra', 'que', 'se', 'sem', 'ser', 'seu', 'sua',
  'ta', 'tambem', 'ter', 'um', 'uma', 'vai', 'vamos',
  'the', 'and', 'for', 'with', 'this', 'that', 'was', 'were', 'are',
])

const categoryMeta: Record<Category, { accent: string; panel: string; pill: string; icon: ElementType }> = {
  went_well: {
    accent: 'bg-emerald-500',
    panel: 'from-emerald-50 to-white border-emerald-200',
    pill: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  to_improve: {
    accent: 'bg-zinc-700',
    panel: 'from-zinc-50 to-white border-zinc-200',
    pill: 'bg-zinc-100 text-zinc-700',
    icon: MessageSquareWarning,
  },
  action_items: {
    accent: 'bg-[#955251]',
    panel: 'from-[rgba(149,82,81,0.1)] to-white border-[rgba(149,82,81,0.22)]',
    pill: 'bg-[rgba(149,82,81,0.12)] text-[#955251]',
    icon: ListChecks,
  },
}

type PlanStatus = 'todo' | 'doing' | 'done'

type PlanDraft = {
  action: string
  owner: string
  dueDate: string
  status: PlanStatus
}

type PlanMeta = {
  title: string
  startDate: string
  endDate: string
}

type PlanCluster = {
  id: string
  category: Category
  title: string
  items: RetroItem[]
  defaultAction: string
}

type CardGroup = {
  id: string
  title: string
  itemIds: string[]
}

const planTone: Record<Category, { shell: string; badge: string; accent: string }> = {
  went_well: {
    shell: 'from-emerald-50 to-white border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-400',
  },
  to_improve: {
    shell: 'from-amber-50 to-white border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    accent: 'bg-amber-400',
  },
  action_items: {
    shell: 'from-[rgba(149,82,81,0.08)] to-white border-[rgba(149,82,81,0.22)]',
    badge: 'bg-[rgba(149,82,81,0.12)] text-[#955251]',
    accent: 'bg-[#955251]',
  },
}

const moodIcons: Record<MoodScore, ElementType> = {
  1: CloudRain,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function normalizeWord(word: string) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSignificantWords(text: string) {
  const matches = text.match(/[a-zA-ZÀ-ÿ0-9]+/g) || []

  return matches
    .map(rawWord => normalizeWord(rawWord))
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word))
}

function buildWordCloud(items: RetroItem[]) {
  const words = new Map<string, { label: string; count: number }>()

  items.forEach(item => {
    getSignificantWords(item.content).forEach(key => {

      const current = words.get(key)
      words.set(key, {
        label: current?.label || key,
        count: (current?.count || 0) + 1,
      })
    })
  })

  return Array.from(words.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 42)
}

function getPlanReason(category: Category) {
  if (category === 'went_well') return 'Manter'
  if (category === 'to_improve') return 'Melhorar'
  return 'Parar'
}

function getClusterTitle(items: RetroItem[]) {
  const counts = new Map<string, number>()

  items.forEach(item => {
    getSignificantWords(item.content).forEach(word => {
      counts.set(word, (counts.get(word) || 0) + 1)
    })
  })

  const topWords = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([word]) => word)

  return topWords.length > 0 ? topWords.join(' + ') : 'tema sem título'
}

function getDefaultPlan(cluster: PlanCluster) {
  if (cluster.category === 'to_improve') {
    return `Definir um ajuste para melhorar "${cluster.title}" e validar no próximo encontro.`
  }

  return `Alinhar com o time como vamos parar ou reduzir "${cluster.title}" a partir deste mês.`
}

function loadPlanDrafts() {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY) || '{}') as Record<string, PlanDraft>
  } catch {
    return {}
  }
}

function loadPlanMeta(): PlanMeta {
  const now = new Date()
  const month = now.toLocaleDateString('pt-BR', { month: 'long' })
  const fallback = {
    title: `Planos de ação - ${month.charAt(0).toUpperCase()}${month.slice(1)}`,
    startDate: '',
    endDate: '',
  }

  if (typeof window === 'undefined') return fallback

  try {
    return { ...fallback, ...JSON.parse(window.localStorage.getItem(PLAN_META_STORAGE_KEY) || '{}') }
  } catch {
    return fallback
  }
}

function loadCardGroups() {
  if (typeof window === 'undefined') return { went_well: [], to_improve: [], action_items: [] }

  try {
    const groups = JSON.parse(window.localStorage.getItem(CARD_GROUP_STORAGE_KEY) || '{}') as Partial<Record<Category, CardGroup[]>>
    return {
      went_well: groups.went_well || [],
      to_improve: groups.to_improve || [],
      action_items: groups.action_items || [],
    }
  } catch {
    return { went_well: [], to_improve: [], action_items: [] }
  }
}

export default function DashboardPage() {
  const [items, setItems] = useState<RetroItem[]>([])
  const [loading, setLoading] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(RETRO_DURATION_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [recentItemIds, setRecentItemIds] = useState<Set<string>>(new Set())
  const [activeView, setActiveView] = useState<'board' | 'cloud' | 'mood' | 'plans'>('mood')
  const [planDrafts, setPlanDrafts] = useState<Record<string, PlanDraft>>(loadPlanDrafts)
  const [cardGroups, setCardGroups] = useState<Record<Category, CardGroup[]>>(loadCardGroups)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [planMeta, setPlanMeta] = useState<PlanMeta>(loadPlanMeta)
  const [slackCopied, setSlackCopied] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RetroItem | null>(null)

  useEffect(() => {
    if (!timerRunning || secondsLeft === 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft(current => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft, timerRunning])

  useEffect(() => {
    supabase
      .from('retro_items')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data)
        setLoading(false)
      })

    const channel = supabase
      .channel('retro-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'retro_items', filter: `session_id=eq.${SESSION_ID}` },
        payload => {
          const item = payload.new as RetroItem
          setItems(prev => [...prev, item])
          setRecentItemIds(prev => new Set(prev).add(item.id))
          window.setTimeout(() => {
            setRecentItemIds(prev => {
              const next = new Set(prev)
              next.delete(item.id)
              return next
            })
          }, 1800)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'retro_items', filter: `session_id=eq.${SESSION_ID}` },
        payload => {
          const deletedId = (payload.old as { id: string }).id
          setItems(prev => prev.filter(item => item.id !== deletedId))
          setCardGroups(prev => ({
            went_well: removeItemFromGroups(prev.went_well, deletedId),
            to_improve: removeItemFromGroups(prev.to_improve, deletedId),
            action_items: removeItemFromGroups(prev.action_items, deletedId),
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const progress = useMemo(() => {
    return ((RETRO_DURATION_SECONDS - secondsLeft) / RETRO_DURATION_SECONDS) * 100
  }, [secondsLeft])

  const retroItems = useMemo(() => items.filter(item => !isMoodItem(item)), [items])
  const moodEntries = useMemo(() => items.map(parseMoodItem).filter(entry => entry !== null), [items])
  const averageMood = useMemo(() => {
    if (moodEntries.length === 0) return 0
    return moodEntries.reduce((sum, entry) => sum + entry.score, 0) / moodEntries.length
  }, [moodEntries])
  const cloudWords = useMemo(() => buildWordCloud(retroItems), [retroItems])
  const planClusters = useMemo(() => {
    const relevantCategories: Category[] = ['to_improve', 'action_items']

    return relevantCategories.flatMap(category => {
      const categoryItems = retroItems.filter(item => item.category === category)
      const validIds = new Set(categoryItems.map(item => item.id))
      const validGroups = cardGroups[category]
        .map(group => ({
          ...group,
          itemIds: group.itemIds.filter(id => validIds.has(id)),
        }))
        .filter(group => group.itemIds.length > 0)
      const groupedIds = new Set(validGroups.flatMap(group => group.itemIds))

      const groupedPlans = validGroups.map(group => {
        const groupItems = group.itemIds
          .map(id => categoryItems.find(item => item.id === id))
          .filter((item): item is RetroItem => item !== undefined)
        const plan = {
          id: group.id,
          category,
          title: group.title || getClusterTitle(groupItems),
          items: groupItems,
          defaultAction: '',
        }

        return { ...plan, defaultAction: getDefaultPlan(plan) }
      })

      const singlePlans = categoryItems
        .filter(item => !groupedIds.has(item.id))
        .map(item => {
          const plan = {
            id: `single:${item.id}`,
            category,
            title: getClusterTitle([item]),
            items: [item],
            defaultAction: '',
          }

          return { ...plan, defaultAction: getDefaultPlan(plan) }
        })

      return [...groupedPlans, ...singlePlans]
    })
  }, [cardGroups, retroItems])
  const actionPlans = useMemo(() => {
    return planClusters.map(cluster => ({
      cluster,
      draft: planDrafts[cluster.id] || {
        action: cluster.defaultAction,
        owner: '',
        dueDate: '',
        status: 'todo' as PlanStatus,
      },
    }))
  }, [planClusters, planDrafts])

  useEffect(() => {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(planDrafts))
  }, [planDrafts])

  useEffect(() => {
    window.localStorage.setItem(PLAN_META_STORAGE_KEY, JSON.stringify(planMeta))
  }, [planMeta])

  useEffect(() => {
    window.localStorage.setItem(CARD_GROUP_STORAGE_KEY, JSON.stringify(cardGroups))
  }, [cardGroups])

  function byCategory(category: Category) {
    return retroItems.filter(i => i.category === category)
  }

  function startTimer() {
    setSecondsLeft(current => current === 0 ? RETRO_DURATION_SECONDS : current)
    setTimerRunning(true)
  }

  function pauseTimer() {
    setTimerRunning(false)
  }

  function stopTimer() {
    setTimerRunning(false)
    setSecondsLeft(0)
  }

  function updatePlan(cluster: PlanCluster, updates: Partial<PlanDraft>) {
    setPlanDrafts(prev => {
      const current = prev[cluster.id] || {
        action: cluster.defaultAction,
        owner: '',
        dueDate: '',
        status: 'todo' as PlanStatus,
      }

      return {
        ...prev,
        [cluster.id]: { ...current, ...updates },
      }
    })
  }

  async function copyPlansToSlack() {
    const now = new Date()
    const month = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const period = [planMeta.startDate, planMeta.endDate].filter(Boolean).join(' → ')

    const header = [
      `:repeat: *Retro mensal — ${month.charAt(0).toUpperCase()}${month.slice(1)}*`,
      `Segue o resumo da nossa retro deste mês :point_down:`,
      period ? `_Período: ${period}_` : '',
    ].filter(Boolean).join('\n')

    const planLines = actionPlans.flatMap(({ cluster, draft }, index) => [
      `*${index + 1}. ${cluster.title}* · ${getPlanReason(cluster.category)}`,
      `> ${draft.action || cluster.defaultAction}`,
      `*Responsável:* ${draft.owner || 'a definir'} · *Prazo:* ${draft.dueDate || planMeta.endDate || 'a definir'}`,
      '',
    ])

    const message = [header, '', ...planLines].join('\n').trimEnd()

    await navigator.clipboard.writeText(message)
    setSlackCopied(true)
    window.setTimeout(() => setSlackCopied(false), 1800)
  }

  function cleanGroups(category: Category, groups: CardGroup[]) {
    const validIds = new Set(byCategory(category).map(item => item.id))

    return groups
      .map(group => ({
        ...group,
        itemIds: group.itemIds.filter(id => validIds.has(id)),
      }))
      .filter(group => group.itemIds.length > 0)
  }

  function removeItemFromGroups(groups: CardGroup[], itemId: string) {
    return groups
      .map(group => ({ ...group, itemIds: group.itemIds.filter(id => id !== itemId) }))
      .filter(group => group.itemIds.length > 0)
  }

  function groupCardWithTarget(category: Category, targetItemId: string) {
    if (!draggedItemId || draggedItemId === targetItemId) return

    setCardGroups(prev => {
      const groups = cleanGroups(category, prev[category])
      const targetGroup = groups.find(group => group.itemIds.includes(targetItemId))
      const nextGroups = removeItemFromGroups(groups, draggedItemId)

      if (targetGroup) {
        return {
          ...prev,
          [category]: nextGroups.map(group => (
            group.id === targetGroup.id
              ? { ...group, itemIds: Array.from(new Set([...group.itemIds, draggedItemId])) }
              : group
          )),
        }
      }

      const targetItem = byCategory(category).find(item => item.id === targetItemId)
      const draggedItem = byCategory(category).find(item => item.id === draggedItemId)
      if (!targetItem || !draggedItem) return prev

      return {
        ...prev,
        [category]: [
          ...nextGroups,
          {
            id: `group-${Date.now()}`,
            title: getClusterTitle([targetItem, draggedItem]),
            itemIds: [targetItemId, draggedItemId],
          },
        ],
      }
    })
    setDraggedItemId(null)
  }

  function addCardToGroup(category: Category, groupId: string) {
    if (!draggedItemId) return

    setCardGroups(prev => {
      const groups = removeItemFromGroups(cleanGroups(category, prev[category]), draggedItemId)
      return {
        ...prev,
        [category]: groups.map(group => (
          group.id === groupId
            ? { ...group, itemIds: Array.from(new Set([...group.itemIds, draggedItemId])) }
            : group
        )),
      }
    })
    setDraggedItemId(null)
  }

  function updateGroupTitle(category: Category, groupId: string, title: string) {
    setCardGroups(prev => ({
      ...prev,
      [category]: prev[category].map(group => group.id === groupId ? { ...group, title } : group),
    }))
  }

  function ungroupItem(category: Category, groupId: string, itemId: string) {
    setCardGroups(prev => ({
      ...prev,
      [category]: prev[category]
        .map(group => group.id === groupId ? { ...group, itemIds: group.itemIds.filter(id => id !== itemId) } : group)
        .filter(group => group.itemIds.length > 0),
    }))
  }

  async function deleteCard(item: RetroItem) {
    const { error } = await supabase.from('retro_items').delete().eq('id', item.id)

    if (!error) {
      setItems(prev => prev.filter(current => current.id !== item.id))
      setCardGroups(prev => ({
        went_well: removeItemFromGroups(prev.went_well, item.id),
        to_improve: removeItemFromGroups(prev.to_improve, item.id),
        action_items: removeItemFromGroups(prev.action_items, item.id),
      }))
      setDeleteTarget(null)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] text-[var(--retro-ink)]">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(135,0,47,0.12),rgba(255,255,255,0.94)_34%,rgba(247,242,240,0.96)),radial-gradient(circle_at_84%_10%,rgba(52,232,207,0.18),transparent_24%)]" />
      <div className="fixed inset-x-0 top-0 z-30 h-2 bg-[var(--retro-wine)]" />

      <section className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <header className="mb-3 flex items-center justify-between rounded-3xl border border-black/5 bg-white/82 px-4 py-3 shadow-lg shadow-zinc-950/5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700">
              <Home size={14} />
              Início
            </Link>
            <h1 className="text-lg font-black tracking-normal text-[#1f1f1f] md:text-xl">Retro mensal</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-zinc-500 sm:inline">
              {loading ? 'Carregando...' : `${retroItems.length} resposta${retroItems.length !== 1 ? 's' : ''}`}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-[rgba(52,232,207,0.16)] px-3 py-2 text-xs font-bold text-[var(--retro-wine-deep)]">
              <span className="h-2 w-2 rounded-full bg-[var(--retro-cyan)] animate-pulse" />
              Ao vivo
            </span>
          </div>
        </header>

        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-grid rounded-2xl border border-black/5 bg-white/82 p-1 shadow-lg shadow-zinc-950/5 backdrop-blur-xl sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveView('mood')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${activeView === 'mood' ? 'bg-[var(--retro-wine)] text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <HeartPulse size={17} />
              Mood
            </button>
            <button
              type="button"
              onClick={() => setActiveView('cloud')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${activeView === 'cloud' ? 'bg-[var(--retro-wine)] text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <Cloud size={17} />
              Nuvem
            </button>
            <button
              type="button"
              onClick={() => setActiveView('board')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${activeView === 'board' ? 'bg-[var(--retro-wine)] text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <Columns3 size={17} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setActiveView('plans')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${activeView === 'plans' ? 'bg-[var(--retro-wine)] text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <ClipboardCheck size={17} />
              Planos
            </button>
          </div>
        </div>

        {activeView === 'board' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CATEGORIES.map(cat => {
              const catItems = byCategory(cat.key)
              const groups = cleanGroups(cat.key, cardGroups[cat.key])
              const groupedIds = new Set(groups.flatMap(group => group.itemIds))
              const ungroupedItems = catItems.filter(item => !groupedIds.has(item.id))
              const CategoryIcon = categoryMeta[cat.key].icon
              return (
                <section key={cat.key} className={`min-h-[calc(100vh-235px)] rounded-[2rem] border bg-gradient-to-br p-3 shadow-xl shadow-zinc-950/5 backdrop-blur-xl ${categoryMeta[cat.key].panel}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className={`mb-2 h-1.5 w-10 rounded-full ${categoryMeta[cat.key].accent}`} />
                      <h2 className="flex items-center gap-2 text-lg font-black text-[var(--retro-ink)]">
                        <CategoryIcon size={18} />
                        {cat.label}
                      </h2>
                      <p className="mt-0.5 text-xs font-semibold text-zinc-500">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-xl px-3 py-1 text-xs font-black ${categoryMeta[cat.key].pill}`}>
                        {catItems.length}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        {groups.length} grupo{groups.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {catItems.length === 0 ? (
                    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-zinc-300/80 bg-white/60 p-6 text-center">
                      <p className="max-w-48 text-sm font-semibold text-zinc-400">Sem itens por enquanto.</p>
                    </div>
                  ) : (
                    <ul className="max-h-[calc(100vh-330px)] space-y-2 overflow-y-auto pr-1">
                      {groups.map((group, index) => {
                        const groupItems = group.itemIds
                          .map(id => catItems.find(item => item.id === id))
                          .filter((item): item is RetroItem => item !== undefined)

                        return (
                        <li
                          key={group.id}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => addCardToGroup(cat.key, group.id)}
                          className={`retro-item relative rounded-2xl border border-black/5 bg-white p-3 shadow-md shadow-zinc-950/5 ${groupItems.some(item => recentItemIds.has(item.id)) ? 'retro-item-new' : ''}`}
                          style={{
                            animationDelay: `${Math.min(index * 55, 420)}ms`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <input
                                value={group.title}
                                onChange={e => updateGroupTitle(cat.key, group.id, e.target.value)}
                                className="w-full bg-transparent text-xs font-black uppercase tracking-[0.12em] text-zinc-500 outline-none"
                                aria-label="Nome do grupo"
                              />
                              <p className="mt-1 text-xs font-semibold text-zinc-500">
                                {groupItems.length} card{groupItems.length !== 1 ? 's' : ''} agrupado{groupItems.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <span className="rounded-xl bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-500">
                              {groupItems.length}
                            </span>
                          </div>

                          <div className="relative mt-3">
                            {groupItems.length > 1 && (
                              <>
                                <div className="absolute inset-x-3 top-2 h-full rounded-2xl bg-zinc-200/70" />
                                <div className="absolute inset-x-6 top-4 h-full rounded-2xl bg-zinc-300/50" />
                              </>
                            )}
                            <div className="relative space-y-2">
                              {groupItems.map((item, itemIndex) => (
                                <div
                                  key={item.id}
                                  draggable
                                  onDragStart={() => setDraggedItemId(item.id)}
                                  className="rounded-xl border border-zinc-100 bg-white px-2.5 py-2 shadow-sm"
                                  style={{ marginTop: itemIndex === 0 ? 0 : -5 }}
                                >
                                  <div className="flex items-start gap-2">
                                    <GripVertical className="mt-0.5 shrink-0 text-zinc-300" size={15} />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold leading-5 text-zinc-900">{item.content}</p>
                                      <p className="mt-1 truncate text-[11px] font-bold text-zinc-400">
                                        {item.author_name ? item.author_name : 'Anônimo'}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => ungroupItem(cat.key, group.id, item.id)}
                                      className="rounded-lg p-1 text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-600"
                                      aria-label="Remover do grupo"
                                      title="Remover do grupo"
                                    >
                                      <Ungroup size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget(item)}
                                      className="rounded-lg p-1 text-zinc-300 transition hover:bg-rose-50 hover:text-rose-600"
                                      aria-label="Excluir card"
                                      title="Excluir card"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </li>
                        )
                      })}

                      {ungroupedItems.map((item, index) => (
                        <li
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggedItemId(item.id)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => groupCardWithTarget(cat.key, item.id)}
                          className={`retro-item rounded-2xl border border-black/5 bg-white p-3 shadow-md shadow-zinc-950/5 transition hover:-translate-y-0.5 ${recentItemIds.has(item.id) ? 'retro-item-new' : ''}`}
                          style={{ animationDelay: `${Math.min((groups.length + index) * 55, 420)}ms` }}
                          title="Arraste outro card para cima deste para criar um grupo"
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="mt-1 shrink-0 text-zinc-300" size={16} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-5 text-zinc-900">{item.content}</p>
                              <p className="mt-1 truncate text-[11px] font-bold text-zinc-400">
                                {item.author_name ? item.author_name : 'Anônimo'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="rounded-lg p-1 text-zinc-300 transition hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Excluir card"
                              title="Excluir card"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        ) : activeView === 'cloud' ? (
          <section className="min-h-[520px] rounded-[2rem] border border-black/5 bg-white/86 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">
                  <Cloud size={15} />
                  Nuvem de palavras
                </p>
                <h2 className="mt-2 text-3xl font-black text-[var(--retro-ink)]">Temas mais citados</h2>
              </div>
              <p className="text-sm font-semibold text-zinc-500">{cloudWords.length} palavra{cloudWords.length !== 1 ? 's' : ''}</p>
            </div>

            {cloudWords.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <p className="max-w-sm text-sm font-semibold text-zinc-400">A nuvem aparece quando o time começar a preencher o formulário.</p>
              </div>
            ) : (
              <div className="flex min-h-80 flex-wrap items-center justify-center gap-x-5 gap-y-4 rounded-3xl bg-[linear-gradient(135deg,rgba(135,0,47,0.08),rgba(52,232,207,0.11))] p-6 sm:p-10">
                {cloudWords.map((word, index) => {
                  const maxCount = cloudWords[0]?.count || 1
                  const weight = word.count / maxCount
                  const fontSize = Math.round(18 + weight * 46)
                  const color = index % 5 === 0 ? 'var(--retro-cyan)' : index % 2 === 0 ? 'var(--retro-wine)' : 'var(--retro-ink)'

                  return (
                    <span
                      key={word.label}
                      className="retro-item inline-flex items-baseline gap-1 font-black leading-none"
                      style={{
                        animationDelay: `${Math.min(index * 35, 420)}ms`,
                        color,
                        fontSize,
                        opacity: 0.62 + weight * 0.38,
                      }}
                      title={`${word.count} ocorrência${word.count !== 1 ? 's' : ''}`}
                    >
                      {word.label}
                      {word.count > 1 && <span className="text-xs font-black opacity-45">{word.count}</span>}
                    </span>
                  )
                })}
              </div>
            )}
          </section>
        ) : activeView === 'mood' ? (
          <section className="min-h-[520px] rounded-[2rem] border border-black/5 bg-white/86 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">
                  <HeartPulse size={15} />
                  Saúde do time
                </p>
                <h2 className="mt-2 text-3xl font-black text-[var(--retro-ink)]">Mood board</h2>
              </div>
              <p className="text-sm font-semibold text-zinc-500">{moodEntries.length} resposta{moodEntries.length !== 1 ? 's' : ''}</p>
            </div>

            {moodEntries.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <p className="max-w-sm text-sm font-semibold text-zinc-400">O mood aparece quando o time preencher a aba Mood no formulário.</p>
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center gap-5 lg:grid-cols-[260px_1fr]">
                <div className="w-full rounded-3xl bg-[var(--retro-wine)] p-5 text-center text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Média</p>
                  <div className="mt-3 text-6xl font-black tabular-nums">{averageMood.toFixed(1)}</div>
                  <p className="mt-2 text-sm font-semibold text-white/60">de 5.0</p>
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-5">
                  {moodOptions.map(option => {
                    const count = moodEntries.filter(entry => entry.score === option.score).length
                    const MoodIcon = moodIcons[option.score]
                    return (
                      <div key={option.score} className={`rounded-3xl border p-4 text-center ${option.tone}`}>
                        <MoodIcon className="mx-auto" size={30} strokeWidth={2.4} />
                        <p className="mt-1 text-sm font-black">{option.label}</p>
                        <p className="mt-3 text-xs font-bold opacity-70">{count} voto{count !== 1 ? 's' : ''}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="lg:col-span-2">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-400">Votos</h3>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {moodEntries.map(entry => {
                      const MoodIcon = moodIcons[entry.score]
                      const originalItem = items.find(item => item.id === entry.id)
                      return (
                        <article key={entry.id} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                          <MoodIcon className="mt-0.5 shrink-0 text-zinc-400" size={18} strokeWidth={2.4} />
                          <div className="min-w-0 flex-1">
                            {entry.note && <p className="text-sm font-semibold leading-6 text-zinc-800">{entry.note}</p>}
                            <p className={`text-xs font-bold text-zinc-400 ${entry.note ? 'mt-2' : ''}`}>
                              {entry.authorName || 'Anônimo'} · mood {entry.score}
                            </p>
                          </div>
                          {originalItem && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(originalItem)}
                              className="shrink-0 rounded-lg p-1 text-zinc-300 transition hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Excluir mood"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-[2rem] border border-black/5 bg-white/86 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-8">
            <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">
                  <ClipboardCheck size={15} />
                  Planos de ação
                </p>
                <h2 className="mt-2 text-3xl font-black text-[var(--retro-ink)]">Planos consolidados</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
                  Os grupos montados nos cards viram planos de acompanhamento para as próximas retros.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm">
                <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-[var(--retro-ink)]">{actionPlans.length}</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">Planos</p>
                </div>
                <div className="rounded-2xl bg-[rgba(135,0,47,0.08)] px-4 py-3 text-center">
                  <p className="text-2xl font-black text-[var(--retro-wine)]">
                    {actionPlans.filter(plan => plan.cluster.items.length > 1).length}
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">Grupos</p>
                </div>
              </div>
            </div>

            <div className="mb-5 grid gap-3 rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Ciclo</span>
                <input
                  value={planMeta.title}
                  onChange={e => setPlanMeta(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-black text-zinc-900 outline-none focus:border-[var(--retro-wine)] focus:bg-white"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Início</span>
                  <input
                    type="date"
                    value={planMeta.startDate}
                    onChange={e => setPlanMeta(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-[var(--retro-wine)] focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Fim</span>
                  <input
                    type="date"
                    value={planMeta.endDate}
                    onChange={e => setPlanMeta(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-[var(--retro-wine)] focus:bg-white"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={copyPlansToSlack}
                disabled={actionPlans.length === 0}
                className="inline-flex justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {slackCopied ? <ClipboardCheck size={16} /> : <Send size={16} />}
                {slackCopied ? 'Copiado' : 'Copiar Slack'}
              </button>
            </div>

            {actionPlans.length === 0 ? (
              <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                <p className="max-w-sm text-sm font-semibold text-zinc-400">Os planos aparecem quando houver itens preenchidos no formulário.</p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {actionPlans.map(({ cluster, draft }, index) => (
                  <article
                    key={cluster.id}
                    className={`retro-item overflow-hidden rounded-[2rem] border bg-gradient-to-br shadow-xl shadow-zinc-950/5 ${planTone[cluster.category].shell}`}
                    style={{ animationDelay: `${Math.min(index * 45, 420)}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/80 bg-white/55 p-5 backdrop-blur">
                      <div>
                        <div className={`mb-3 h-1.5 w-12 rounded-full ${planTone[cluster.category].accent}`} />
                        <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-black ${planTone[cluster.category].badge}`}>
                          {getPlanReason(cluster.category)}
                        </span>
                        <h3 className="mt-3 text-xl font-black text-[var(--retro-ink)]">{cluster.title}</h3>
                        <p className="mt-1 text-sm font-semibold leading-6 text-zinc-500">
                          {cluster.items.length > 1 ? 'Grupo consolidado' : 'Item individual'} · {cluster.items.length} item{cluster.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-right shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">Prazo</p>
                        <p className="mt-0.5 text-xs font-black text-zinc-700">{draft.dueDate || planMeta.endDate || 'a definir'}</p>
                      </div>
                    </div>

                    <div className="p-5">
                      <label className="block text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                        Ação
                      </label>
                      <textarea
                        value={draft.action}
                        onChange={e => updatePlan(cluster, { action: e.target.value })}
                        rows={3}
                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-900 outline-none focus:border-[var(--retro-wine)] focus:bg-white focus:ring-4 focus:ring-[rgba(135,0,47,0.1)]"
                      />

                      <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Base do plano</p>
                        <ul className="space-y-2">
                          {cluster.items.map(sourceItem => (
                            <li key={sourceItem.id} className="rounded-xl bg-zinc-50 px-3 py-2 text-sm font-semibold leading-5 text-zinc-600">
                              {sourceItem.content}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                            <UserRound size={14} />
                            Responsável
                          </span>
                          <input
                            value={draft.owner}
                            onChange={e => updatePlan(cluster, { owner: e.target.value })}
                            placeholder="Nome"
                            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[rgba(135,0,47,0.1)]"
                          />
                        </label>
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                            <CalendarDays size={14} />
                            Prazo
                          </span>
                          <input
                            type="date"
                            value={draft.dueDate}
                            onChange={e => updatePlan(cluster, { dueDate: e.target.value })}
                            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[rgba(135,0,47,0.1)]"
                          />
                        </label>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>

      <div className="fixed bottom-5 right-5 z-40">
        {toolsOpen && (
          <div className="mb-3 grid w-[320px] gap-3 rounded-[2rem] border border-black/5 bg-white/92 p-3 shadow-2xl shadow-zinc-950/18 backdrop-blur-2xl">
            <div className="rounded-2xl bg-[var(--retro-wine)] p-3 text-white shadow-lg shadow-[rgba(135,0,47,0.14)]">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                <Timer size={14} />
                Tempo
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <div className="text-4xl font-black leading-none tabular-nums">{formatTime(secondsLeft)}</div>
                  <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-[var(--retro-cyan)] transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={startTimer}
                    aria-label="Iniciar timer"
                    title="Iniciar"
                    disabled={timerRunning && secondsLeft > 0}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                  <button
                    type="button"
                    onClick={pauseTimer}
                    aria-label="Pausar timer"
                    title="Pausar"
                    disabled={!timerRunning || secondsLeft === 0}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Pause size={16} fill="currentColor" />
                  </button>
                  <button
                    type="button"
                    onClick={stopTimer}
                    aria-label="Parar timer"
                    title="Parar"
                    disabled={secondsLeft === 0 && !timerRunning}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Square size={15} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[76px_1fr] items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2">
              <QRCodeSVG value={TEAM_JOIN_URL} size={76} level="H" className="h-auto w-full" />
              <div>
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                  <QrCode size={14} />
                  QR
                </p>
                <p className="mt-1 break-all text-xs font-semibold leading-4 text-zinc-500">{TEAM_JOIN_URL}</p>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setToolsOpen(open => !open)}
          className="ml-auto flex h-14 items-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 text-sm font-black text-white shadow-2xl shadow-[rgba(135,0,47,0.28)] transition hover:bg-[var(--retro-wine-deep)]"
          aria-label="Abrir ferramentas"
        >
          <Timer size={18} />
          {formatTime(secondsLeft)}
        </button>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl shadow-zinc-950/20">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <Trash2 size={21} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--retro-ink)]">Excluir este card?</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-zinc-500">
                  Essa ação remove o item do Supabase e do dashboard.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-3 text-sm font-semibold leading-6 text-zinc-700">
              {deleteTarget.content}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteCard(deleteTarget)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
