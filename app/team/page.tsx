'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ElementType } from 'react'
import { useMemo, useState } from 'react'
import { Activity, Check, CloudRain, Frown, Home, Laugh, Meh, Plus, Send, Smile, User } from 'lucide-react'
import { supabase, SESSION_ID, CATEGORIES, type Category } from '@/lib/supabase'
import { encodeMood, moodOptions, type MoodScore } from '@/lib/mood'

const categoryCopy: Record<Category, { prompt: string; hint: string; tone: string }> = {
  went_well: {
    prompt: 'Mandamos muito bem',
    hint: 'O que funcionou bem neste mês.',
    tone: 'from-emerald-50 to-white border-emerald-200',
  },
  to_improve: {
    prompt: 'Precisamos melhorar',
    hint: 'Pontos que precisam de ajuste.',
    tone: 'from-zinc-50 to-white border-zinc-200',
  },
  action_items: {
    prompt: 'Vamos parar',
    hint: 'O que não faz mais sentido manter.',
    tone: 'from-[rgba(149,82,81,0.1)] to-white border-[rgba(149,82,81,0.22)]',
  },
}

const moodIcons: Record<MoodScore, ElementType> = {
  1: CloudRain,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

export default function TeamPage() {
  const [step, setStep] = useState<'rules' | 'mood' | 'retro'>('rules')
  const [authorName, setAuthorName] = useState('')
  const [inputs, setInputs] = useState<Record<Category, string>>({
    went_well: '',
    to_improve: '',
    action_items: '',
  })
  const [submitted, setSubmitted] = useState<Record<Category, string[]>>({
    went_well: [],
    to_improve: [],
    action_items: [],
  })
  const [loading, setLoading] = useState<Category | null>(null)
  const [moodScore, setMoodScore] = useState<MoodScore | null>(null)
  const [moodNote, setMoodNote] = useState('')
  const [moodLoading, setMoodLoading] = useState(false)
  const [moodSent, setMoodSent] = useState(false)
  const [done, setDone] = useState(false)

  const totalSubmitted = useMemo(
    () => Object.values(submitted).reduce((sum, items) => sum + items.length, 0),
    [submitted]
  )

  async function addItem(category: Category) {
    const content = inputs[category].trim()
    if (!content) return

    setLoading(category)
    const { error } = await supabase.from('retro_items').insert({
      session_id: SESSION_ID,
      category,
      content,
      author_name: authorName.trim() || null,
    })

    if (!error) {
      setSubmitted(prev => ({ ...prev, [category]: [...prev[category], content] }))
      setInputs(prev => ({ ...prev, [category]: '' }))
    }

    setLoading(null)
  }

  async function submitMood() {
    if (!moodScore) return

    setMoodLoading(true)
    const { error } = await supabase.from('retro_items').insert({
      session_id: SESSION_ID,
      category: 'action_items',
      content: encodeMood(moodScore, moodNote.trim()),
      author_name: null,
    })

    if (!error) {
      setMoodNote('')
      setMoodSent(true)
    }

    setMoodLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent, category: Category) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem(category)
    }
  }

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--retro-bg)] px-5">
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-2xl shadow-zinc-950/10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--retro-wine)] text-white">
            <Check size={30} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black text-[#1f1f1f]">Respostas enviadas</h1>
          <p className="mt-3 text-zinc-500">Os itens já estão no dashboard.</p>
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => { setDone(false); setStep('retro') }}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-900"
            >
              Adicionar mais
            </button>
            <Link href="/" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--retro-wine)] px-5 py-3 text-sm font-bold text-white">
              <Home size={16} />
              Início
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--retro-bg)] text-[var(--retro-ink)]">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(135,0,47,0.12),rgba(255,255,255,0.92)_34%,rgba(247,242,240,0.96)),radial-gradient(circle_at_82%_16%,rgba(52,232,207,0.18),transparent_24%)]" />
      <div className="fixed inset-x-0 top-0 z-30 h-2 bg-[var(--retro-wine)]" />

      <header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(247,242,240,0.72)] px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-black text-[#1f1f1f]">
            <span className="grid h-8 w-11 place-items-center overflow-hidden">
              <Image src="/retro-mark.svg" alt="Retro Sync" width={32} height={32} className="h-8 w-8" />
            </span>
            Retro Sync
          </Link>
          <div className="rounded-xl bg-[#1f1f1f] px-3 py-1.5 text-xs font-bold text-white">
            {totalSubmitted} enviado{totalSubmitted !== 1 ? 's' : ''}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:py-10">

        {step === 'rules' && (
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-black/5 bg-white/85 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-7">
              <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">Antes de começar</p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-[#1f1f1f] sm:text-4xl">Três combinados</h1>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-black text-zinc-900">Seja verdadeiro(a)</p>
                    <p className="mt-0.5 text-sm text-zinc-500">Sua percepção honesta vale mais do que uma resposta bonita.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-500" />
                  <div>
                    <p className="font-black text-zinc-900">Enfrente os fatos brutais</p>
                    <p className="mt-0.5 text-sm text-zinc-500">Só o que é dito pode ser melhorado.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#955251]" />
                  <div>
                    <p className="font-black text-zinc-900">Podemos sempre melhorar</p>
                    <p className="mt-0.5 text-sm text-zinc-500">Cada retro é uma chance de ajustar a rota.</p>
                  </div>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setStep('mood')}
              className="w-full rounded-2xl bg-[var(--retro-wine)] py-4 text-base font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)]"
            >
              Entendido, vamos começar
            </button>
          </div>
        )}

        {step === 'mood' && (
          <div className="space-y-4">
            <section className="rounded-[2rem] border border-[rgba(52,232,207,0.32)] bg-white/86 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-7">
              <div className="mb-5 flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgba(52,232,207,0.18)] text-[var(--retro-wine-deep)]">
                  <Activity size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[var(--retro-ink)]">Como você está?</h1>
                  <p className="mt-1 text-sm text-zinc-500">Ajuda a entender a saúde do time neste mês.</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-5">
                {moodOptions.map(option => {
                  const MoodIcon = moodIcons[option.score]
                  return (
                    <button
                      key={option.score}
                      type="button"
                      onClick={() => setMoodScore(option.score)}
                      className={`rounded-2xl border px-3 py-4 text-center text-sm font-black transition ${moodScore === option.score ? 'border-[var(--retro-wine)] bg-[var(--retro-wine)] text-white shadow-lg shadow-[rgba(135,0,47,0.16)]' : option.tone}`}
                    >
                      <MoodIcon className="mx-auto mb-2" size={28} strokeWidth={2.4} />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <textarea
                value={moodNote}
                onChange={e => setMoodNote(e.target.value)}
                placeholder="Quer contar o motivo? (opcional)"
                rows={3}
                className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[rgba(135,0,47,0.12)]"
              />

              {moodSent && (
                <p className="mt-3 rounded-2xl bg-[rgba(52,232,207,0.16)] px-4 py-3 text-sm font-bold text-[var(--retro-wine-deep)]">
                  Mood enviado!
                </p>
              )}

              <button
                onClick={submitMood}
                disabled={!moodScore || moodLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[var(--retro-wine)] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
                {moodLoading ? 'Enviando' : 'Enviar mood'}
              </button>
            </section>

            <button
              onClick={() => setStep('retro')}
              className="w-full rounded-2xl bg-[#1f1f1f] py-4 text-base font-black text-white shadow-xl shadow-zinc-950/15 transition hover:bg-black"
            >
              Continuar para a retro
            </button>
          </div>
        )}

        {step === 'retro' && (
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-black/5 bg-white/85 p-5 shadow-xl shadow-zinc-950/5 backdrop-blur-xl sm:p-7">
              <h1 className="text-3xl font-black leading-tight text-[#1f1f1f] sm:text-4xl">Retro mensal</h1>
              <p className="mt-2 text-sm text-zinc-500">Adicione quantos itens fizerem sentido.</p>
              <label className="mt-6 block text-sm font-bold text-zinc-700" htmlFor="authorName">
                <span className="inline-flex items-center gap-1.5">
                  <User size={15} />
                  Nome <span className="font-medium text-zinc-400">(opcional)</span>
                </span>
              </label>
              <input
                id="authorName"
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Como quer aparecer no dashboard?"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[rgba(135,0,47,0.12)]"
              />
            </div>

            {CATEGORIES.map(cat => (
              <section
                key={cat.key}
                className={`rounded-[2rem] border bg-gradient-to-br p-4 shadow-lg shadow-zinc-950/5 backdrop-blur-xl sm:p-5 ${categoryCopy[cat.key].tone}`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-[#1f1f1f]">{categoryCopy[cat.key].prompt}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{categoryCopy[cat.key].hint}</p>
                  </div>
                  <span className="rounded-xl bg-white px-3 py-1 text-xs font-bold text-zinc-500">
                    {submitted[cat.key].length}
                  </span>
                </div>

                {submitted[cat.key].length > 0 && (
                  <ul className="mb-4 grid gap-2">
                    {submitted[cat.key].map((item, i) => (
                      <li key={i} className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                        <span className="inline-flex items-start gap-2">
                          <Check className="mt-0.5 shrink-0 text-[var(--retro-wine)]" size={15} />
                          <span>{item}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <textarea
                    value={inputs[cat.key]}
                    onChange={e => setInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyDown={e => handleKeyDown(e, cat.key)}
                    placeholder="Digite aqui..."
                    rows={3}
                    className="min-h-24 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[rgba(135,0,47,0.12)]"
                  />
                  <button
                    onClick={() => addItem(cat.key)}
                    disabled={loading === cat.key || !inputs[cat.key].trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--retro-wine)] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)] disabled:cursor-not-allowed disabled:opacity-40 sm:self-end"
                  >
                    {loading === cat.key ? <Send size={16} /> : <Plus size={16} />}
                    {loading === cat.key ? 'Enviando' : 'Adicionar'}
                  </button>
                </div>
              </section>
            ))}

            <button
              onClick={() => setDone(true)}
              className="w-full rounded-2xl bg-[#1f1f1f] py-5 text-base font-black text-white shadow-xl shadow-zinc-950/15 transition hover:bg-black"
            >
              Finalizar participação
            </button>
          </div>
        )}

      </section>
    </main>
  )
}
