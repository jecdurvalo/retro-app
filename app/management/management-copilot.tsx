'use client'

import { useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { loadDelegationItems } from '@/lib/delegation'
import { loadHotTopics } from '@/lib/hot-topics'
import { loadInitiatives } from '@/lib/initiatives'
import type { ManagementPlan, RetroSnapshot } from '@/lib/management'

type CopilotResponse = {
  diagnosis: string
  evidence: Array<{ source: string; fact: string }>
  recommendation: string
  nextStep: string
  suggestedOwner: string
  dataGaps: string[]
}

const suggestions = [
  'O que eu deveria cobrar essa semana?',
  'Onde estou centralizando demais?',
  'Quais temas precisam ser escalados?',
  'Que pauta eu deveria levar para minha liderança?',
]

export default function ManagementCopilot({ plans, snapshots, currentMood }: { plans: ManagementPlan[]; snapshots: RetroSnapshot[]; currentMood: number | null }) {
  const [question, setQuestion] = useState(suggestions[0])
  const [answer, setAnswer] = useState<CopilotResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask() {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    const initiatives = loadInitiatives()
    const hotTopics = loadHotTopics()
    const delegations = loadDelegationItems()
    const context = {
      referenceDate: new Date().toISOString().slice(0, 10),
      signals: {
        initiativesWithoutOwner: initiatives.filter(item => !item.owner.trim()).map(item => item.title),
        blockedInitiatives: initiatives.filter(item => item.status === 'blocked').map(item => item.title),
        criticalTopicsWithoutAction: hotTopics.filter(item => item.temperature === 'critical' && !item.nextAction.trim()).map(item => item.title),
        overdueCheckIns: delegations.filter(item => !item.nextCheckIn || item.nextCheckIn < new Date().toISOString().slice(0, 10)).map(item => item.title),
      },
      plans: plans.map(item => ({ id: item.id, title: item.title, status: item.status, criticality: item.criticality, owner: item.owner, action: item.action, decision: item.status === 'blocked' ? item.lastUpdate : '' })),
      initiatives: initiatives.map(item => ({ id: item.id, title: item.title, status: item.status, criticality: item.criticality, owner: item.owner, nextStep: item.nextStep, risk: item.currentRisk, decision: item.decisionNeeded })),
      hotTopics: hotTopics.map(item => ({ id: item.id, title: item.title, temperature: item.temperature, impacts: item.impacts, owner: item.owner, nextAction: item.nextAction, decision: item.decisionNeeded, containment: item.containmentPlan })),
      delegations: delegations.map(item => ({ id: item.id, title: item.title, responsible: item.responsible, initiativeId: item.initiativeId, autonomy: item.autonomyLevel, nextCheckIn: item.nextCheckIn, warningSigns: item.warningSigns, evolution: item.observedEvolution })),
      mood: { current: currentMood, previous: snapshots.at(-1)?.moodAverage ?? null },
      snapshots: snapshots.slice(-3),
    }
    try {
      const response = await fetch('/api/management-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      })
      const data = await response.json() as CopilotResponse & { error?: string }
      if (!response.ok) throw new Error(data.error || 'Falha ao consultar o copiloto.')
      setAnswer(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao consultar o copiloto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-label="Copiloto de gestão" className="mt-4 rounded-[2rem] border border-black/5 bg-white/88 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--retro-wine)]"><Bot size={14} /> Copiloto de Gestão</p>
        <h2 className="mt-2 text-2xl font-black">Perguntas práticas sobre a gestão atual</h2>
        <p className="mt-1 text-sm font-semibold text-zinc-400">Respostas baseadas somente nos dados cadastrados no Retro Sync.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{suggestions.map(item => <button key={item} onClick={() => setQuestion(item)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-500">{item}</button>)}</div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') ask() }} maxLength={500} className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--retro-wine)] focus-visible:ring-2 focus-visible:ring-[var(--retro-wine)] focus-visible:ring-offset-1" placeholder="Faça uma pergunta de gestão..." />
        <button onClick={ask} disabled={loading || !question.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"><Send size={15} />{loading ? 'Analisando...' : 'Perguntar'}</button>
      </div>
      {error && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">{error}</p>}
      {answer && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2" aria-live="polite">
          <AnswerBlock title="1. Diagnóstico" text={answer.diagnosis} />
          <AnswerBlock title="2. Evidência usada" text={answer.evidence.map(item => `${item.source}: ${item.fact}`).join('\n')} />
          <AnswerBlock title="3. Recomendação" text={answer.recommendation} />
          <AnswerBlock title="4. Próximo passo sugerido" text={answer.nextStep} />
          <AnswerBlock title="5. Dono sugerido" text={answer.suggestedOwner} />
          <AnswerBlock title="Campos que precisam ser preenchidos" text={answer.dataGaps.join('\n') || 'Nenhum gap relevante identificado.'} />
        </div>
      )}
    </section>
  )
}

function AnswerBlock({ title, text }: { title: string; text: string }) {
  return <article className="rounded-2xl border border-zinc-200 bg-white p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--retro-wine)]"><Sparkles size={12} />{title}</p><p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-zinc-600">{text}</p></article>
}
