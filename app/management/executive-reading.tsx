'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, CalendarClock, RefreshCw, Sparkles } from 'lucide-react'
import { loadDelegationItems, type DelegationItem } from '@/lib/delegation'
import {
  generateExecutiveReading,
  type ExecutiveReadingTone,
} from '@/lib/executive-reading'
import { loadHotTopics, type HotTopic } from '@/lib/hot-topics'
import { loadInitiatives, type Initiative } from '@/lib/initiatives'
import type { ManagementPlan, RetroSnapshot } from '@/lib/management'

const toneLabels: Record<ExecutiveReadingTone, string> = {
  slack: 'Slack objetivo',
  minutes: 'Ata gerencial',
  senior: 'Liderança sênior',
}

export default function ExecutiveReading({
  plans,
  snapshots,
  currentMood,
}: {
  plans: ManagementPlan[]
  snapshots: RetroSnapshot[]
  currentMood: number | null
}) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([])
  const [delegations, setDelegations] = useState<DelegationItem[]>([])
  const [tone, setTone] = useState<ExecutiveReadingTone>('slack')
  const [generated, setGenerated] = useState(false)
  const [generatedAt, setGeneratedAt] = useState('')

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInitiatives(loadInitiatives())
      setHotTopics(loadHotTopics())
      setDelegations(loadDelegationItems())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const reading = useMemo(() => generateExecutiveReading({
    plans,
    initiatives,
    hotTopics,
    delegations,
    snapshots,
    currentMood,
    tone,
    referenceDate: new Date().toISOString().slice(0, 10),
  }), [currentMood, delegations, hotTopics, initiatives, plans, snapshots, tone])

  function generate() {
    setInitiatives(loadInitiatives())
    setHotTopics(loadHotTopics())
    setDelegations(loadDelegationItems())
    setGenerated(true)
    setGeneratedAt(new Date().toLocaleString('pt-BR'))
  }

  return (
    <section className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]"><Sparkles size={14} /> Leitura Executiva</p>
          <h2 className="mt-2 text-2xl font-black">Síntese prática para decisão e cobrança</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-400">Usa FCAs, iniciativas, temas, delegações, mood e histórico mensal.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(toneLabels) as ExecutiveReadingTone[]).map(value => (
            <button key={value} onClick={() => setTone(value)} aria-pressed={tone === value} className={`rounded-xl px-3 py-2 text-xs font-black ${tone === value ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white text-zinc-500'}`}>{toneLabels[value]}</button>
          ))}
          <button onClick={generate} className="inline-flex items-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2 text-xs font-black text-white">{generated ? <RefreshCw size={14} /> : <BookOpenCheck size={14} />}{generated ? 'Atualizar leitura' : 'Gerar leitura'}</button>
        </div>
      </div>

      {!generated ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
          <BookOpenCheck className="mx-auto text-zinc-300" size={28} />
          <p className="mt-3 text-sm font-black text-zinc-700">Gere uma leitura baseada apenas nos dados registrados.</p>
          <p className="mt-1 text-xs font-semibold text-zinc-400">Quando faltarem evidências, os gaps serão explicitados.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4" aria-live="polite">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400"><CalendarClock size={13} /> Gerada em {generatedAt} · {toneLabels[tone]}</p>
          <article className="rounded-2xl bg-[var(--retro-wine)] p-5 text-white">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-white/55">1. Resumo executivo</h3>
            <div className="mt-3 space-y-1.5">{reading.summary.map(line => <p key={line} className="text-sm font-semibold leading-6 text-white/80">{line}</p>)}</div>
          </article>
          <div className="grid gap-4 lg:grid-cols-2">
            <ReadingList title="2. Principais avanços" items={reading.advances.map(item => `${item.title}: ${item.detail} Evidência: ${item.evidence}`)} empty="Não há evidência suficiente para afirmar avanços relevantes." />
            <ReadingList title="3. Pontos de atenção" items={reading.attentionPoints.map(item => `${item.title}: ${item.detail} Dono: ${item.owner}.`)} empty="Nenhum ponto prioritário identificado." />
            <ReadingList title="4. Decisões necessárias" items={reading.decisions.map(item => `${item.title}. Dono sugerido: ${item.suggestedOwner}. Prazo sugerido: ${item.suggestedDeadline}.`)} empty="Nenhuma decisão pendente registrada." />
            <ReadingList title="5. Próximos movimentos" items={reading.nextMoves.map(item => `${item.owner}: ${item.action} Prazo: ${item.suggestedDeadline}. Motivo: ${item.reason}`)} empty="Não há dados suficientes para recomendar próximos movimentos." />
          </div>
          {reading.gaps.length > 0 && (
            <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <summary className="cursor-pointer text-xs font-black text-zinc-600">Limitações desta leitura ({reading.gaps.length})</summary>
              <ul className="mt-3 space-y-2">{reading.gaps.map(gap => <li key={gap} className="text-xs font-semibold leading-5 text-zinc-500">• {gap}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}

function ReadingList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--retro-wine)]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : [empty]).map(item => <li key={item} className="text-xs font-semibold leading-5 text-zinc-600">• {item}</li>)}
      </ul>
    </article>
  )
}
