'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Link2,
  Save,
  Sparkles,
  X,
} from 'lucide-react'
import {
  createEmptyFront,
  loadFronts,
  saveFronts,
  type FrontOrigin,
  type ManagementFront,
} from '@/lib/fronts'
import { createEmptyDecision, loadDecisions, saveDecisions } from '@/lib/decisions'
import { loadPeople, savePeople } from '@/lib/people'

const INPUTS_STORAGE_KEY = 'leadership-captured-inputs'

const origins = [
  'Retro',
  '1:1',
  'Reunião',
  'Demanda da liderança',
  'Crise/incidente',
  'Planejamento',
  'Dia a dia',
  'Outro',
] as const

const urgencies = ['Baixa', 'Média', 'Alta', 'Crítica'] as const

const classifications = [
  'Frente nova',
  'Atualização de frente existente',
  'Task',
  'Decisão',
  'PDI',
  'Monitoramento',
  'FCA',
  'Insight qualitativo',
] as const

const destinations = ['Task', 'Decisão', 'Checkpoint', 'PDI', 'Insight qualitativo'] as const

type Classification = (typeof classifications)[number]
type Destination = (typeof destinations)[number]

type CapturedInput = {
  id: string
  text: string
  origin: (typeof origins)[number]
  people: string
  relatedFrontId: string
  relatedFrontName: string
  urgency: (typeof urgencies)[number]
  notes: string
  classification: Classification
  destination: Destination
  relatedDecision: string
  createdAt: string
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:bg-white focus:ring-4 focus:ring-[rgba(135,0,47,0.1)]'

function suggestClassification(text: string, origin: string, relatedFrontId: string): Classification {
  const normalized = text.toLocaleLowerCase('pt-BR')

  if (relatedFrontId) return 'Atualização de frente existente'
  if (origin === '1:1' || /desenvolv|feedback|carreira|autonomia/.test(normalized)) return 'PDI'
  if (/decid|aprovar|escolher|definir/.test(normalized)) return 'Decisão'
  if (/acompanhar|monitorar|observar|sinal/.test(normalized)) return 'Monitoramento'
  if (/ação|acao|tarefa|entregar|fazer|agendar/.test(normalized)) return 'Task'
  if (/projeto|iniciativa|frente|estruturar/.test(normalized)) return 'Frente nova'
  return 'Insight qualitativo'
}

function destinationFor(classification: Classification): Destination {
  if (classification === 'Decisão') return 'Decisão'
  if (classification === 'PDI') return 'PDI'
  if (classification === 'Task') return 'Task'
  return 'Insight qualitativo'
}

function classificationForDestination(destination: Destination, hasFront: boolean): Classification {
  if (destination === 'Task') return 'Task'
  if (destination === 'Decisão') return 'Decisão'
  if (destination === 'PDI') return 'PDI'
  if (destination === 'Checkpoint') return hasFront ? 'Atualização de frente existente' : 'Insight qualitativo'
  return 'Insight qualitativo'
}

function frontOriginFor(origin: (typeof origins)[number]): FrontOrigin {
  if (origin === 'Crise/incidente') return 'Crise'
  if (origin === 'Dia a dia') return 'Outro'
  return origin
}

function readCapturedInputs(): CapturedInput[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INPUTS_STORAGE_KEY) || '[]') as CapturedInput[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function CaptureInput() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'capture' | 'classify'>('capture')
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [text, setText] = useState('')
  const [origin, setOrigin] = useState<(typeof origins)[number]>('Dia a dia')
  const [people, setPeople] = useState('')
  const [relatedFrontId, setRelatedFrontId] = useState('')
  const [urgency, setUrgency] = useState<(typeof urgencies)[number]>('Média')
  const [notes, setNotes] = useState('')
  const [classification, setClassification] = useState<Classification>('Insight qualitativo')
  const [destination, setDestination] = useState<Destination>('Insight qualitativo')
  const [relatedDecision, setRelatedDecision] = useState('')

  const relatedFront = useMemo(
    () => fronts.find(front => front.id === relatedFrontId),
    [fronts, relatedFrontId],
  )

  const reset = useCallback(() => {
    setStep('capture')
    setText('')
    setOrigin('Dia a dia')
    setPeople('')
    setRelatedFrontId('')
    setUrgency('Média')
    setNotes('')
    setClassification('Insight qualitativo')
    setDestination('Insight qualitativo')
    setRelatedDecision('')
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    reset()
  }, [reset])

  useEffect(() => {
    function handleOpen() {
      setFronts(loadFronts().filter(front => front.status !== 'Arquivada'))
      setOpen(true)
    }

    window.addEventListener('open-capture-input', handleOpen)
    return () => window.removeEventListener('open-capture-input', handleOpen)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, open])

  function handleCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const suggestion = suggestClassification(text, origin, relatedFrontId)
    setClassification(suggestion)
    setDestination(destinationFor(suggestion))
    setStep('classify')
  }

  function saveInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const textValue = text.trim()
    const notesValue = notes.trim()
    const record: CapturedInput = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `input-${Date.now()}`,
      text: textValue,
      origin,
      people: people.trim(),
      relatedFrontId,
      relatedFrontName: relatedFront?.name || '',
      urgency,
      notes: notesValue,
      classification,
      destination,
      relatedDecision: relatedDecision.trim(),
      createdAt: new Date().toISOString(),
    }

    window.localStorage.setItem(INPUTS_STORAGE_KEY, JSON.stringify([record, ...readCapturedInputs()]))

    const currentFronts = loadFronts()
    if (classification === 'Frente nova') {
      const newFront = createEmptyFront()
      saveFronts([
        {
          ...newFront,
          name: textValue.slice(0, 80),
          description: textValue,
          origin: frontOriginFor(origin),
          involvedPeople: people ? people.split(',').map(item => item.trim()).filter(Boolean) : [],
          temperature: urgency === 'Crítica' ? 'Crítica' : urgency === 'Alta' ? 'Atenção' : 'Saudável',
          managerIntervention: urgency === 'Crítica' ? 'Desbloquear' : 'Monitorar',
          nextStep: notesValue || 'Definir próximo passo',
        },
        ...currentFronts,
      ])
    } else if (destination === 'Decisão') {
      const decision = createEmptyDecision()
      saveDecisions([
        {
          ...decision,
          title: textValue.slice(0, 100),
          context: notesValue || textValue,
          owner: people.split(',')[0]?.trim() || 'Joana',
          frontIds: relatedFrontId ? [relatedFrontId] : [],
        },
        ...loadDecisions(),
      ])
    } else if (destination === 'PDI') {
      const names = people.toLocaleLowerCase('pt-BR')
      savePeople(loadPeople().map(person => names.includes(person.name.toLocaleLowerCase('pt-BR'))
        ? { ...person, evidence: [`Input para PDI: ${textValue}`, ...person.evidence], updatedAt: new Date().toISOString() }
        : person))
    } else if (relatedFrontId && destination !== 'Insight qualitativo') {
      saveFronts(currentFronts.map(front => {
        if (front.id !== relatedFrontId) return front

        const peopleToAdd = people.split(',').map(item => item.trim()).filter(Boolean)
        return {
          ...front,
          involvedPeople: [...new Set([...front.involvedPeople, ...peopleToAdd])],
          relatedTasks: destination === 'Task' || destination === 'Checkpoint' || destination === 'PDI'
            ? [...front.relatedTasks, `${destination}: ${textValue}`]
            : front.relatedTasks,
          updatedAt: new Date().toISOString(),
        }
      }))
    }

    window.dispatchEvent(new CustomEvent('captured-input-saved', { detail: record }))
    close()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-zinc-950/30 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-input-title"
        className="flex h-full w-full max-w-xl flex-col border-l border-white/70 bg-[#fcfaf9] shadow-2xl shadow-zinc-950/20"
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/5 bg-white px-5 py-5 sm:px-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--retro-wine)]">
              <Sparkles size={15} />
              Entrada rápida
            </p>
            <h2 id="capture-input-title" className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
              {step === 'capture' ? 'Capturar input' : 'Validar e salvar'}
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {step === 'capture'
                ? 'Registre o contexto agora e organize depois.'
                : 'A sugestão é editável e só será aplicada após sua validação.'}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar captura de input"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            <X size={18} />
          </button>
        </header>

        {step === 'capture' ? (
          <form onSubmit={handleCapture} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
              <label className="block text-sm font-black text-zinc-700">
                O que aconteceu?
                <textarea
                  autoFocus
                  required
                  value={text}
                  onChange={event => setText(event.target.value)}
                  rows={4}
                  placeholder="Ex.: O time sinalizou dependências que podem atrasar a entrega..."
                  className={`${fieldClass} resize-none leading-6`}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Origem" value={origin} options={origins} onChange={value => setOrigin(value as typeof origin)} />
                <SelectField label="Urgência" value={urgency} options={urgencies} onChange={value => setUrgency(value as typeof urgency)} />
              </div>

              <label className="block text-sm font-black text-zinc-700">
                Pessoas envolvidas
                <input
                  value={people}
                  onChange={event => setPeople(event.target.value)}
                  placeholder="Nomes separados por vírgula"
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-black text-zinc-700">
                Frente relacionada <span className="font-semibold text-zinc-400">(opcional)</span>
                <span className="relative block">
                  <select value={relatedFrontId} onChange={event => setRelatedFrontId(event.target.value)} className={`${fieldClass} appearance-none pr-10`}>
                    <option value="">Nenhuma frente relacionada</option>
                    {fronts.map(front => <option key={front.id} value={front.id}>{front.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute bottom-3.5 right-4 text-zinc-400" />
                </span>
              </label>

              <label className="block text-sm font-black text-zinc-700">
                Observações <span className="font-semibold text-zinc-400">(opcional)</span>
                <textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Contexto adicional, restrições ou evidências..."
                  className={`${fieldClass} resize-none leading-6`}
                />
              </label>
            </div>
            <footer className="border-t border-black/5 bg-white px-5 py-4 sm:px-7">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)]"
              >
                Sugerir classificação
                <ArrowRight size={17} />
              </button>
            </footer>
          </form>
        ) : (
          <form onSubmit={saveInput} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
              <div className="rounded-2xl border border-[rgba(135,0,47,0.12)] bg-[rgba(135,0,47,0.05)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--retro-wine)]">Input capturado</p>
                <p className="mt-2 text-sm font-bold leading-6 text-zinc-800">{text}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-zinc-600">{origin}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-zinc-600">Urgência {urgency.toLowerCase()}</span>
                  {relatedFront && <span className="rounded-full bg-white px-2.5 py-1 text-zinc-600">{relatedFront.name}</span>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Classificação sugerida"
                  value={classification}
                  options={classifications}
                  onChange={value => {
                    const next = value as Classification
                    setClassification(next)
                    setDestination(destinationFor(next))
                  }}
                />

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Salvar como</p>
                  <p className="mt-1 text-xs text-zinc-400">A IA sugere. Você valida a saída final.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {destinations.map(option => (
                      <button
                        key={option}
                        type="button"
                        disabled={(option === 'Task' || option === 'Checkpoint') && !relatedFrontId}
                        onClick={() => {
                          setDestination(option)
                          setClassification(classificationForDestination(option, Boolean(relatedFrontId)))
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-black transition ${
                          destination === option
                            ? 'border-[var(--retro-wine)] bg-[rgba(135,0,47,0.08)] text-[var(--retro-wine)]'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35'
                        }`}
                      >
                        {destination === option && <Check size={14} />}
                        {option === 'Insight qualitativo' ? 'Salvar como insight' : option}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-zinc-400">
                    Vai sair como <strong className="text-zinc-700">{classification}</strong>
                    {relatedFront ? ` em ${relatedFront.name}` : ''}.
                  </p>
                  {!relatedFrontId && <p className="mt-1 text-xs text-amber-700">Task e checkpoint exigem uma frente relacionada.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-black text-zinc-800">
                  <Link2 size={16} className="text-[var(--retro-wine)]" />
                  Conexões opcionais
                </p>
                <p className="mt-1 text-xs font-semibold text-zinc-400">Preencha só o que ajudar a preservar contexto.</p>
                <div className="mt-4 grid gap-4">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">
                    Pessoa
                    <input value={people} onChange={event => setPeople(event.target.value)} placeholder="Pessoa relacionada" className={fieldClass} />
                  </label>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">
                    Frente
                    <span className="relative block">
                      <select value={relatedFrontId} onChange={event => setRelatedFrontId(event.target.value)} className={`${fieldClass} appearance-none pr-10`}>
                        <option value="">Nenhuma frente relacionada</option>
                        {fronts.map(front => <option key={front.id} value={front.id}>{front.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute bottom-3.5 right-4 text-zinc-400" />
                    </span>
                  </label>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500">
                    Decisão
                    <input value={relatedDecision} onChange={event => setRelatedDecision(event.target.value)} placeholder="Decisão relacionada" className={fieldClass} />
                  </label>
                </div>
              </div>
            </div>
            <footer className="grid grid-cols-[auto_1fr] gap-2 border-t border-black/5 bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => setStep('capture')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-black text-zinc-600 transition hover:bg-zinc-50"
              >
                <ArrowLeft size={17} />
                Voltar
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)]"
              >
                <Save size={17} />
                Salvar input
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm font-black text-zinc-700">
      {label}
      <span className="relative block">
        <select value={value} onChange={event => onChange(event.target.value)} className={`${fieldClass} appearance-none pr-10`}>
          {options.map(option => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute bottom-3.5 right-4 text-zinc-400" />
      </span>
    </label>
  )
}
