'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LayoutGrid,
  Pause,
  Play,
  RefreshCw,
  Save,
  TimerReset,
  UsersRound,
} from 'lucide-react'
import { CATEGORIES, SESSION_ID, supabase, type Category, type RetroItem } from '@/lib/supabase'
import { isMoodItem, parseMoodItem } from '@/lib/mood'
import {
  loadManagementPlans,
  loadRetroSnapshots,
  saveRetroSnapshots,
  type RetroSnapshot,
} from '@/lib/management'

const categoryTone: Record<Category, { border: string; header: string; dot: string; empty: string }> = {
  went_well: {
    border: 'border-[var(--retro-green)]/35',
    header: 'bg-[var(--retro-green-soft)] text-[var(--success-text)]',
    dot: 'bg-[var(--retro-green)]',
    empty: 'O que funcionou bem aparece aqui.',
  },
  to_improve: {
    border: 'border-[var(--retro-amber)]/40',
    header: 'bg-[var(--retro-amber-soft)] text-[var(--warning-text)]',
    dot: 'bg-[var(--retro-amber)]',
    empty: 'Pontos de melhoria aparecem aqui.',
  },
  action_items: {
    border: 'border-[var(--retro-red)]/35',
    header: 'bg-[var(--retro-red-soft)] text-[var(--critical-text)]',
    dot: 'bg-[var(--retro-red)]',
    empty: 'Paradas, ações ou decisões aparecem aqui.',
  },
}

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
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
  const [snapshots, setSnapshots] = useState<RetroSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(10 * 60)
  const [timerRunning, setTimerRunning] = useState(false)

  async function loadLiveItems() {
    setLoading(true)
    const { data } = await supabase
      .from('retro_items')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: false })

    setItems((data ?? []) as RetroItem[])
    setLoading(false)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSnapshots([...loadRetroSnapshots()].sort((a, b) => b.date.localeCompare(a.date)))
      loadLiveItems()
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

  function saveSnapshot() {
    const themes = CATEGORIES
      .filter(category => itemsByCategory[category.key].length > 0)
      .map(category => category.label)
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
    }
    const next = [snapshot, ...loadRetroSnapshots()]
    saveRetroSnapshots(next)
    setSnapshots(next)
    setFeedback('Snapshot salvo no histórico da retro.')
    window.setTimeout(() => setFeedback(''), 2400)
  }

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      {feedback && (
        <p role="status" className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg">
          {feedback}
        </p>
      )}
      <div className="mx-auto max-w-[1280px] space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-md shadow-zinc-950/5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--retro-green),var(--retro-amber),var(--retro-red),var(--retro-blue))]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--retro-wine)]">Ritual da retro</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Board da retro ao vivo</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-zinc-500">
                Facilite a conversa, acompanhe cards do time em tempo real e feche o ritual com ações, FCAs ou frentes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_auto]">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-400">
                    <Clock3 size={14} />
                    Timebox
                  </span>
                  <span className="font-mono text-2xl font-black text-zinc-950">{formatTimer(timerSeconds)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(value => !value)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--retro-wine)] px-3 py-2 text-xs font-black text-white hover:bg-[var(--retro-wine-hover)]"
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

              <div className="grid gap-2">
                <Link
                  href="/team"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-blue)] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:brightness-95"
                >
                  <ExternalLink size={16} />
                  Link do time
                </Link>
                <button
                  type="button"
                  onClick={saveSnapshot}
                  disabled={retroItems.length === 0 && moodEntries.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <Save size={16} />
                  Salvar snapshot
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              ['Cards', retroItems.length, 'contribuições do time'],
              ['Mood', moodEntries.length ? moodAverage.toFixed(1) : '-', `${moodEntries.length} resposta(s)`],
              ['Ações/paradas', itemsByCategory.action_items.length, 'saídas para transformar'],
              ['Snapshots', snapshots.length, 'histórico salvo'],
            ].map(([label, value, detail]) => (
              <div key={String(label)} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{String(label)}</p>
                <p className="mt-1 text-2xl font-black text-zinc-950">{String(value)}</p>
                <p className="mt-0.5 text-xs font-semibold text-zinc-500">{String(detail)}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 lg:grid-cols-3">
            {CATEGORIES.map(category => {
              const tone = categoryTone[category.key]
              const categoryItems = itemsByCategory[category.key]
              return (
                <article key={category.key} className={`min-h-[430px] rounded-3xl border bg-white shadow-sm shadow-zinc-950/5 ${tone.border}`}>
                  <div className="border-b border-zinc-100 p-4">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${tone.header}`}>
                      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                      {category.label}
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-5 text-zinc-500">
                      {category.key === 'went_well' && 'Reconheça padrões que devem continuar.'}
                      {category.key === 'to_improve' && 'Agrupe fatos para virar causa e plano.'}
                      {category.key === 'action_items' && 'Capture decisões, paradas e próximos movimentos.'}
                    </p>
                  </div>

                  <div className="grid gap-2 p-3">
                    {categoryItems.length > 0 ? (
                      categoryItems.map(item => (
                        <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 shadow-sm">
                          <p className="text-sm font-bold leading-5 text-zinc-800">{item.content}</p>
                          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-bold text-zinc-400">
                            <span>{item.author_name || 'Anônimo'}</span>
                            <span>{formatTime(item.created_at)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-zinc-200 px-4 text-center">
                        <p className="text-sm font-semibold text-zinc-400">{loading ? 'Carregando cards...' : tone.empty}</p>
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
                  <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-400">
                    <UsersRound size={14} />
                    Pulso do time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-500">Mood registrado no começo da retro.</p>
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
                  <span className="text-3xl font-black">{moodAverage ? moodAverage.toFixed(1) : '-'}</span>
                </div>
                <p className="mt-3 text-center text-xs font-bold text-zinc-500">{moodEntries.length} resposta(s) de mood</p>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-400">
                <CheckCircle2 size={14} />
                Fechamento esperado
              </p>
              <ul className="mt-3 space-y-2 text-sm font-semibold leading-5 text-zinc-600">
                <li className="rounded-xl bg-zinc-50 p-3">Ponto crítico vira FCA quando houver fato, causa e ação.</li>
                <li className="rounded-xl bg-zinc-50 p-3">Tema recorrente vira frente com dono e checkpoint.</li>
                <li className="rounded-xl bg-zinc-50 p-3">Combinado simples vira ação aberta no painel.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-400">
                <LayoutGrid size={14} />
                Histórico
              </p>
              <div className="mt-3 grid gap-2">
                {snapshots.length > 0 ? (
                  snapshots.slice(0, 4).map(snapshot => (
                    <div key={snapshot.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                      <p className="text-sm font-black text-zinc-800">{snapshot.title}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                        <CalendarDays size={12} />
                        {formatDate(snapshot.date)}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-zinc-500">
                        {snapshot.itemCount} cards · mood {snapshot.moodCount ? snapshot.moodAverage.toFixed(1) : '-'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm font-semibold text-zinc-400">
                    Nenhum snapshot salvo ainda.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
