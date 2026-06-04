'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CalendarDays,
  CheckSquare,
  Plus,
  Square,
  ThermometerSun,
  Users,
} from 'lucide-react'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { loadTasks, saveTasks, createEmptyTask, type Task } from '@/lib/tasks'
import { loadPeople, type LeadershipPerson } from '@/lib/people'
import { loadRetroSnapshots, type RetroSnapshot } from '@/lib/management'

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function todayGreeting() {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formattedToday() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

const temperatureStyle: Record<string, string> = {
  Crítica: 'bg-rose-50 text-rose-700 border-rose-200',
  Atenção: 'bg-amber-50 text-amber-700 border-amber-200',
  Saudável: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const temperatureDot: Record<string, string> = {
  Crítica: 'bg-rose-500',
  Atenção: 'bg-amber-400',
  Saudável: 'bg-emerald-500',
}

const attentionStyle: Record<string, string> = {
  'Dar autonomia': 'bg-violet-50 text-violet-700',
  'Desafiar': 'bg-sky-50 text-sky-700',
  'Cuidar': 'bg-rose-50 text-rose-700',
  'Desenvolver': 'bg-emerald-50 text-emerald-700',
  'Monitorar carga': 'bg-amber-50 text-amber-700',
}

export default function HojePage() {
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [people, setPeople] = useState<LeadershipPerson[]>([])
  const [snapshots, setSnapshots] = useState<RetroSnapshot[]>([])
  const [newTaskText, setNewTaskText] = useState('')

  useEffect(() => {
    setFronts(loadFronts())
    setTasks(loadTasks())
    setPeople(loadPeople())
    setSnapshots(loadRetroSnapshots())
  }, [])

  // Frentes em atenção ou crítica
  const urgentFronts = fronts.filter(f => f.temperature === 'Crítica' || f.temperature === 'Atenção')

  // Tasks abertas (status !== Concluída)
  const openTasks = tasks.filter(t => t.status !== 'Concluída')

  // Pessoas ordenadas por nextOneOnOne mais próximo
  const sortedPeople = [...people]
    .filter(p => p.nextOneOnOne)
    .sort((a, b) => a.nextOneOnOne.localeCompare(b.nextOneOnOne))

  // Último snapshot de retro
  const lastSnapshot = [...snapshots].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null

  function handleAddTask() {
    const text = newTaskText.trim()
    if (!text) return
    const task = createEmptyTask({ text })
    const updated = [...tasks, task]
    setTasks(updated)
    saveTasks(updated)
    setNewTaskText('')
  }

  function handleToggleTask(id: string) {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, status: (t.status === 'Concluída' ? 'Aberta' : 'Concluída') as Task['status'], updatedAt: new Date().toISOString() } : t
    )
    setTasks(updated)
    saveTasks(updated)
  }

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-4 py-7 text-[var(--retro-ink)] sm:px-7 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[1200px] space-y-7">

        {/* Header */}
        <header>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {todayGreeting()}, Joana
          </h1>
          <p className="mt-1 text-sm font-medium capitalize text-zinc-500">{formattedToday()}</p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">

            {/* ── Atenção agora ── */}
            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-rose-500" />
                <h2 className="text-base font-black uppercase tracking-[0.1em] text-zinc-400">Atenção agora</h2>
              </div>
              {urgentFronts.length === 0 ? (
                <p className="text-sm text-zinc-400">Nenhuma frente em atenção ou crítica no momento.</p>
              ) : (
                <ul className="space-y-3">
                  {urgentFronts.map(front => (
                    <li key={front.id}>
                      <Link
                        href="/frentes"
                        className="flex items-start gap-3 rounded-2xl border border-zinc-100 p-3.5 transition hover:bg-zinc-50"
                      >
                        <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${temperatureDot[front.temperature] ?? 'bg-zinc-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-zinc-900">{front.name}</span>
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${temperatureStyle[front.temperature] ?? ''}`}>
                              {front.temperature}
                            </span>
                          </div>
                          {(front.nextStep || front.description) && (
                            <p className="mt-1 text-xs leading-5 text-zinc-500 line-clamp-2">
                              {front.nextStep || front.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Minhas tasks ── */}
            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare size={18} className="text-[var(--retro-wine)]" />
                <h2 className="text-base font-black uppercase tracking-[0.1em] text-zinc-400">Minhas tasks</h2>
              </div>

              {openTasks.length === 0 ? (
                <p className="mb-4 text-sm text-zinc-400">Nenhuma task aberta. Adicione a primeira abaixo.</p>
              ) : (
                <ul className="mb-4 space-y-2">
                  {openTasks.map(task => {
                    const front = task.frontId ? fronts.find(f => f.id === task.frontId) : null
                    return (
                      <li key={task.id} className="flex items-start gap-3 rounded-xl px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          aria-label={task.status === 'Concluída' ? 'Marcar como aberta' : 'Marcar como concluída'}
                          className="mt-0.5 shrink-0 text-zinc-400 transition hover:text-[var(--retro-wine)]"
                        >
                          <Square size={17} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-zinc-800">{task.text}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-xs text-zinc-400">
                                <CalendarDays size={12} />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                            {front && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">
                                {front.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Quick add */}
              <form
                onSubmit={e => { e.preventDefault(); handleAddTask() }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  placeholder="Nova task..."
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-1 focus:ring-[var(--retro-wine)]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[var(--retro-wine-deep)]"
                >
                  <Plus size={15} />
                  Add
                </button>
              </form>
            </section>

          </div>

          <div className="space-y-5">

            {/* ── Próximos 1:1s ── */}
            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-sky-500" />
                <h2 className="text-base font-black uppercase tracking-[0.1em] text-zinc-400">Próximos 1:1s</h2>
              </div>

              {sortedPeople.length === 0 ? (
                <p className="text-sm text-zinc-400">Nenhuma pessoa com 1:1 agendado.</p>
              ) : (
                <ul className="space-y-3">
                  {sortedPeople.slice(0, 6).map(person => (
                    <li key={person.id}>
                      <Link
                        href="/pessoas"
                        className="flex items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-zinc-50"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--retro-wine)] text-xs font-black text-white uppercase">
                          {person.name.slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-zinc-900">{person.name}</p>
                          <p className="flex items-center gap-1 text-xs text-zinc-400">
                            <CalendarDays size={11} />
                            {formatDate(person.nextOneOnOne)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${attentionStyle[person.attention] ?? 'bg-zinc-100 text-zinc-600'}`}>
                          {person.attention}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Pulso da retro ── */}
            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ThermometerSun size={18} className="text-emerald-500" />
                <h2 className="text-base font-black uppercase tracking-[0.1em] text-zinc-400">Pulso da retro</h2>
              </div>

              {!lastSnapshot ? (
                <p className="text-sm text-zinc-400">Nenhum snapshot de retro registrado ainda.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Último snapshot: <span className="font-bold text-zinc-600">{formatDate(lastSnapshot.date)}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-50">
                      <span className="text-xl font-black text-emerald-700">{lastSnapshot.moodAverage.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-emerald-500">mood</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-700">{lastSnapshot.title}</p>
                      <p className="text-xs text-zinc-400">{lastSnapshot.itemCount} cards · {lastSnapshot.moodCount} respostas</p>
                    </div>
                  </div>
                  {lastSnapshot.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lastSnapshot.themes.map(theme => (
                        <span key={theme} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-1">
                    <Link
                      href="/retro"
                      className="text-xs font-black text-[var(--retro-wine)] transition hover:underline"
                    >
                      Ver histórico de retros →
                    </Link>
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}
