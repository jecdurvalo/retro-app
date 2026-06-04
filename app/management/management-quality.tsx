'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ClipboardCheck, Lightbulb, TriangleAlert } from 'lucide-react'
import { loadDelegationItems, type DelegationItem } from '@/lib/delegation'
import { loadHotTopics, type HotTopic } from '@/lib/hot-topics'
import { loadInitiatives, type Initiative } from '@/lib/initiatives'
import {
  calculateManagementQuality,
  type ManagementQualityDimensionId,
} from '@/lib/management-quality'
import type { ManagementPlan } from '@/lib/management'

const MANAGER_STORAGE_KEY = 'retro-delegation-manager'
const dimensionTone: Record<ManagementQualityDimensionId, string> = {
  clarity: 'bg-cyan-500',
  ownership: 'bg-violet-500',
  cadence: 'bg-amber-500',
  outcome: 'bg-emerald-500',
  delegation: 'bg-[var(--retro-wine)]',
}

function scoreLabel(score: number) {
  if (score >= 85) return 'Gestão consistente'
  if (score >= 70) return 'Boa base'
  if (score >= 50) return 'Oportunidades de estruturação'
  return 'Fundamentos a fortalecer'
}

function scoreCopy(score: number) {
  if (score >= 85) return 'A estrutura atual favorece acompanhamento e previsibilidade.'
  if (score >= 70) return 'A gestão está bem estruturada, com alguns pontos que podem ganhar consistência.'
  if (score >= 50) return 'Alguns ajustes podem facilitar cobrança, decisões e acompanhamento.'
  return 'Há oportunidades importantes para dar mais clareza e previsibilidade à operação.'
}

export default function ManagementQuality({ plans }: { plans: ManagementPlan[] }) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([])
  const [delegations, setDelegations] = useState<DelegationItem[]>([])
  const [manager, setManager] = useState('Marina Costa')

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInitiatives(loadInitiatives())
      setHotTopics(loadHotTopics())
      setDelegations(loadDelegationItems())
      setManager(window.localStorage.getItem(MANAGER_STORAGE_KEY) || 'Marina Costa')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const quality = useMemo(
    () => calculateManagementQuality(plans, initiatives, hotTopics, delegations, manager),
    [delegations, hotTopics, initiatives, manager, plans],
  )

  return (
    <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]"><ClipboardCheck size={14} /> Qualidade da Gestão</p>
          <h2 className="mt-2 text-2xl font-black">Sinais sobre a estrutura da gestão</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-400">O score indica onde pequenos ajustes podem melhorar previsibilidade e acompanhamento.</p>
        </div>
        <span className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-500">Atualização automática</span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <article className="rounded-3xl bg-[var(--retro-wine)] p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/55">Score geral</p>
          <p className="mt-3 text-6xl font-black">{quality.score}</p>
          <p className="mt-3 text-lg font-black">{scoreLabel(quality.score)}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/65">{scoreCopy(quality.score)}</p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Scores por dimensão</p>
          <div className="mt-4 space-y-4">
            {Object.values(quality.dimensions).map(dimension => (
              <div key={dimension.id}>
                <div className="flex items-end justify-between gap-3"><p className="text-xs font-black text-zinc-700">{dimension.label}</p><p className="text-sm font-black text-zinc-900">{dimension.score}%</p></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${dimensionTone[dimension.id]}`} style={{ width: `${dimension.score}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {quality.topGaps.map(gap => (
          <article key={gap.metricId} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-lg bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-amber-700">{quality.dimensions[gap.dimension].label}</span>
              <span className="text-sm font-black text-amber-800">{gap.score}%</span>
            </div>
            <p className="mt-3 text-sm font-black text-zinc-800">{gap.title}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-zinc-600">{gap.supportCopy}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 sm:flex-row sm:items-start">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-cyan-700"><Lightbulb size={16} /></span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">Recomendação prática para o próximo ciclo</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-700">{quality.recommendation}</p>
        </div>
        {quality.topGaps.length > 0 && <ArrowUpRight className="ml-auto shrink-0 text-cyan-600" size={17} />}
        {quality.topGaps.length === 0 && <TriangleAlert className="ml-auto shrink-0 text-cyan-600" size={17} />}
      </div>
    </section>
  )
}
