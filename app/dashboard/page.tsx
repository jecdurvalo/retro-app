'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  GitBranch,
  MessageSquareWarning,
  Plus,
  Square,
  Target,
  ThermometerSun,
  Users,
} from 'lucide-react'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { loadTasks, saveTasks, createEmptyTask, type Task } from '@/lib/tasks'
import { loadPeople, type LeadershipPerson } from '@/lib/people'
import { loadRetroSnapshots, type RetroSnapshot } from '@/lib/management'
import { loadDecisions, type LeadershipDecision } from '@/lib/decisions'

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

function isOverdue(value: string, referenceTime: number) {
  return Boolean(value && new Date(`${value}T23:59:59`).getTime() < referenceTime)
}

export default function HojePage() {
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [people, setPeople] = useState<LeadershipPerson[]>([])
  const [snapshots, setSnapshots] = useState<RetroSnapshot[]>([])
  const [decisions, setDecisions] = useState<LeadershipDecision[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [referenceTime] = useState(() => Date.now())

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFronts(loadFronts())
      setTasks(loadTasks())
      setPeople(loadPeople())
      setSnapshots(loadRetroSnapshots())
      setDecisions(loadDecisions())
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const openTasks = tasks.filter(t => t.status !== 'Concluída')
  const overdueTasks = openTasks.filter(task => isOverdue(task.dueDate, referenceTime))
  const openFcas = fronts.flatMap(front => (front.fcas ?? [])
    .filter(fca => fca.status !== 'Concluído')
    .map(fca => ({ ...fca, frontName: front.name, frontId: front.id })))
  const pendingDecisions = decisions.filter(decision => decision.status === 'Pendente' || decision.status === 'Em alinhamento' || decision.status === 'Escalada')

  const urgentFronts = fronts.filter(f =>
    f.temperature === 'Crítica' ||
    f.temperature === 'Atenção' ||
    f.status === 'Bloqueada' ||
    isOverdue(f.nextCheckpoint, referenceTime)
  )

  const sortedPeople = [...people]
    .filter(p => p.nextOneOnOne)
    .sort((a, b) => a.nextOneOnOne.localeCompare(b.nextOneOnOne))
  const peopleInFocus = people.filter(person =>
    person.attention === 'Cuidar' ||
    person.attention === 'Monitorar carga' ||
    person.pdi.status === 'Ativo'
  )

  const lastSnapshot = [...snapshots].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  const retroThemes = lastSnapshot?.themes.slice(0, 4) ?? []

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
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1200px] space-y-6">

        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Painel de hoje, Joana
          </h1>
          <p className="mt-1 text-sm font-medium capitalize text-[var(--text-secondary)]">
            {todayGreeting()} · {formattedToday()}
          </p>
        </header>

        <section className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck size={19} className="text-[var(--retro-wine)]" />
                <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Revisão executiva do dia</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--text-secondary)]">
                O que precisa da sua atenção antes de cobrar: frentes, FCAs, decisões, retro e desenvolvimento do time.
              </p>
            </div>
            <Link
              href="/frentes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)]"
            >
              <GitBranch size={16} />
              Abrir frentes
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Frentes para destravar', urgentFronts.length, 'Saúde, bloqueio ou checkpoint'],
              ['FCAs abertos', openFcas.length, 'Fato, causa e ação'],
              ['Tasks atrasadas', overdueTasks.length, 'Cobrança objetiva'],
              ['Decisões pendentes', pendingDecisions.length, 'Trade-offs sem fechamento'],
              ['Pessoas em foco', peopleInFocus.length, 'Carga, cuidado ou desenvolvimento'],
            ].map(([label, value, detail]) => (
              <div key={String(label)} className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">{String(label)}</p>
                <p className="mt-1 text-2xl font-black text-[var(--text-primary)]">{Number(value)}</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[var(--text-secondary)]">{String(detail)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-light)] bg-white p-4">
              <div className="flex items-center gap-2">
                <MessageSquareWarning size={16} className="text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-tertiary)]">Pauta de cobrança</h3>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ...overdueTasks.slice(0, 3).map(task => ({
                    title: task.text,
                    detail: `Task atrasada${task.assignee ? ` · ${task.assignee}` : ''}`,
                    href: '/frentes',
                  })),
                  ...openFcas.slice(0, 2).map(fca => ({
                    title: fca.action || fca.fact,
                    detail: `FCA aberto · ${fca.frontName}`,
                    href: '/frentes',
                  })),
                  ...pendingDecisions.slice(0, 2).map(decision => ({
                    title: decision.title,
                    detail: `Decisão ${decision.status.toLowerCase()}`,
                    href: '/decisoes',
                  })),
                ].slice(0, 6).map(item => (
                  <Link key={`${item.detail}-${item.title}`} href={item.href} className="block rounded-lg bg-[var(--bg-secondary)] px-3 py-2 transition hover:bg-zinc-100">
                    <p className="truncate text-sm font-black text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--text-secondary)]">{item.detail}</p>
                  </Link>
                ))}
                {overdueTasks.length === 0 && openFcas.length === 0 && pendingDecisions.length === 0 && (
                  <p className="rounded-lg border border-dashed border-[var(--border-medium)] px-3 py-4 text-sm font-semibold text-[var(--text-tertiary)]">
                    Nada crítico para cobrar agora.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-light)] bg-white p-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-sky-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-tertiary)]">Sinais de liderança</h3>
              </div>
              <div className="mt-3 space-y-2">
                {peopleInFocus.slice(0, 3).map(person => (
                  <Link key={person.id} href="/pessoas" className="block rounded-lg bg-[var(--bg-secondary)] px-3 py-2 transition hover:bg-zinc-100">
                    <p className="truncate text-sm font-black text-[var(--text-primary)]">{person.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[var(--text-secondary)]">{person.attention} · {person.pdi.status}</p>
                  </Link>
                ))}
                {retroThemes.length > 0 && (
                  <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                    <p className="text-xs font-black uppercase tracking-wider text-[var(--text-tertiary)]">Temas da retro</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {retroThemes.map(theme => (
                        <span key={theme} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--text-secondary)]">{theme}</span>
                      ))}
                    </div>
                  </div>
                )}
                {peopleInFocus.length === 0 && retroThemes.length === 0 && (
                  <p className="rounded-lg border border-dashed border-[var(--border-medium)] px-3 py-4 text-sm font-semibold text-[var(--text-tertiary)]">
                    Sem sinais suficientes ainda. Use 1:1s e retro para alimentar esta visão.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">

            {/* ── Atenção agora ── */}
            <section className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-[var(--critical-text)]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">O que destravar agora</h2>
              </div>
              {urgentFronts.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">Nenhuma frente crítica, bloqueada ou vencida no momento.</p>
              ) : (
                <ul className="space-y-2.5">
                  {urgentFronts.map(front => (
                    <li key={front.id}>
                      <Link
                        href="/frentes"
                        className="flex items-start gap-3 rounded-xl border border-[var(--border-light)] p-3.5 transition hover:bg-[var(--bg-secondary)] hover:border-[var(--border-medium)]"
                      >
                        <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${temperatureDot[front.temperature] ?? 'bg-[var(--text-tertiary)]'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)]">{front.name}</span>
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${temperatureStyle[front.temperature] ?? ''}`}>
                              {front.temperature}
                            </span>
                          </div>
                          {(front.nextStep || front.description) && (
                            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] line-clamp-2">
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
            <section className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare size={18} className="text-[var(--retro-wine)]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Próximas ações</h2>
              </div>

              {openTasks.length === 0 ? (
                <p className="mb-4 text-sm text-[var(--text-tertiary)]">Nenhuma ação aberta. Registre a próxima cobrança ou compromisso abaixo.</p>
              ) : (
                <ul className="mb-4 space-y-2">
                  {openTasks.map(task => {
                    const front = task.frontId ? fronts.find(f => f.id === task.frontId) : null
                    return (
                      <li key={task.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--bg-secondary)] transition-colors">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          aria-label={task.status === 'Concluída' ? 'Marcar como aberta' : 'Marcar como concluída'}
                          className="mt-0.5 shrink-0 text-[var(--text-tertiary)] transition hover:text-[var(--retro-wine)]"
                        >
                          <Square size={17} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{task.text}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                <CalendarDays size={12} />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                            {front && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
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
                  placeholder="Nova ação ou cobrança..."
                  className="min-w-0 flex-1 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--retro-wine)] focus:ring-2 focus:ring-[var(--retro-wine-soft)]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--retro-wine-hover)]"
                >
                  <Plus size={15} />
                  Adicionar
                </button>
              </form>
            </section>

          </div>

          <div className="space-y-5">

            {/* ── Próximos 1:1s ── */}
            <section className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-sky-500" />
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Próximos 1:1s</h2>
              </div>

              {sortedPeople.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">Nenhuma pessoa com 1:1 agendado.</p>
              ) : (
                <ul className="space-y-2.5">
                  {sortedPeople.slice(0, 6).map(person => (
                    <li key={person.id}>
                      <Link
                        href="/pessoas"
                        className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--bg-secondary)]"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--retro-wine)] text-xs font-bold text-white uppercase">
                          {person.name.slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{person.name}</p>
                          <p className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <CalendarDays size={11} />
                            {formatDate(person.nextOneOnOne)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${attentionStyle[person.attention] ?? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                          {person.attention}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Pulso da retro ── */}
            <section className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 mb-4">
                <ThermometerSun size={18} className="text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Pulso da retro</h2>
              </div>

              {!lastSnapshot ? (
                <p className="text-sm text-[var(--text-tertiary)]">Nenhum snapshot de retro registrado ainda.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Último snapshot: <span className="font-semibold text-[var(--text-secondary)]">{formatDate(lastSnapshot.date)}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50">
                      <span className="text-xl font-bold text-emerald-700">{lastSnapshot.moodAverage.toFixed(1)}</span>
                      <span className="text-[10px] font-semibold text-emerald-600">mood</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{lastSnapshot.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{lastSnapshot.itemCount} cards · {lastSnapshot.moodCount} respostas</p>
                    </div>
                  </div>
                  {lastSnapshot.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lastSnapshot.themes.map(theme => (
                        <span key={theme} className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-1">
                    <Link
                      href="/retro"
                      className="text-xs font-semibold text-[var(--retro-wine)] transition hover:underline"
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
