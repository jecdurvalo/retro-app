'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ExternalLink, LayoutList } from 'lucide-react'
import { loadRetroSnapshots, type RetroSnapshot } from '@/lib/management'

function formatDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function moodColor(score: number) {
  if (score >= 4) return 'bg-emerald-50 text-emerald-700'
  if (score >= 3) return 'bg-amber-50 text-amber-700'
  return 'bg-rose-50 text-rose-700'
}

export default function RetroPage() {
  const [snapshots, setSnapshots] = useState<RetroSnapshot[]>([])

  useEffect(() => {
    const all = loadRetroSnapshots()
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date))
    setSnapshots(sorted)
  }, [])

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-4 py-7 text-[var(--retro-ink)] sm:px-7 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[900px]">

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Retro qualitativa</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Histórico de snapshots — pulso do time ao longo do tempo.
            </p>
          </div>
          <Link
            href="/team"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)]"
          >
            <ExternalLink size={16} />
            Abrir retro ao vivo
          </Link>
        </header>

        <section className="mt-8">
          {snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-zinc-200 bg-white py-16 text-center">
              <LayoutList size={36} className="text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-400">Nenhuma retro registrada ainda.</p>
              <Link
                href="/team"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--retro-wine)] px-4 py-2 text-sm font-black text-[var(--retro-wine)] transition hover:bg-[rgba(135,0,47,0.06)]"
              >
                <ExternalLink size={14} />
                Fazer a primeira retro
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {snapshots.map(snapshot => (
                <li key={snapshot.id} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-zinc-900">{snapshot.title}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <CalendarDays size={13} />
                        {formatDate(snapshot.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex flex-col items-center rounded-2xl px-4 py-2 ${moodColor(snapshot.moodAverage)}`}>
                        <span className="text-xl font-black leading-none">{snapshot.moodAverage.toFixed(1)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">mood</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-500">
                    <span className="font-semibold">{snapshot.itemCount} cards</span>
                    <span className="font-semibold">{snapshot.moodCount} respostas</span>
                    {snapshot.openPlanCount > 0 && (
                      <span className="font-semibold text-amber-600">{snapshot.openPlanCount} planos abertos</span>
                    )}
                  </div>

                  {snapshot.themes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {snapshot.themes.map(theme => (
                        <span
                          key={theme}
                          className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
