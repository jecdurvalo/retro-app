'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  FolderKanban,
  MessageSquareText,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { EditableTextField, QuickAddModal, QuickAddTextForm } from '@/components/ui/quick-add-modal'
import {
  attentionTypes,
  careerMoments,
  loadPeople,
  newChecklistItem,
  projectRoles,
  savePeople,
  tenureLabel,
  type AttentionType,
  type CareerMoment,
  type ChecklistItem,
  type LeadershipPerson,
  type ProjectRole,
} from '@/lib/people'
import { loadFronts, type ManagementFront } from '@/lib/fronts'
import { Select } from '@/components/ui/select'
import {
  attentionTone,
  cardClass,
  daysAgo,
  fieldClass,
  formatDate,
  formatLongDate,
  formatTimestamp,
  initials,
  newNote,
} from '@/components/people-shared'

type Tab = 'visao' | 'pdi' | '1a1' | 'notas' | 'projetos' | 'historico'

const tabs: { id: Tab; label: string }[] = [
  { id: 'visao', label: 'Visão geral' },
  { id: 'pdi', label: 'PDI' },
  { id: '1a1', label: '1:1' },
  { id: 'notas', label: 'Notas & Feedback' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'historico', label: 'Histórico' },
]

// ─── Small building blocks ────────────────────────────────────────────────────

function Checklist({
  items,
  onAdd,
  onToggle,
  onRemove,
  label,
  placeholder,
}: {
  items: ChecklistItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  label: string
  placeholder: string
}) {
  return (
    <div className="grid gap-1.5">
      {items.map(item => (
        <div key={item.id} className="group flex items-start gap-2.5 rounded-xl px-1 py-1.5 hover:bg-black/[0.03]">
          <button
            type="button"
            aria-label={item.done ? 'Reabrir item' : 'Concluir item'}
            onClick={() => onToggle(item.id)}
            className={`mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border transition ${
              item.done ? 'border-current bg-current text-white' : 'border-current/40 text-transparent hover:border-current'
            }`}
          >
            <Check size={11} strokeWidth={3} />
          </button>
          <span className={`flex-1 text-sm font-semibold leading-5 ${item.done ? 'opacity-50 line-through' : ''}`}>
            {item.text}
          </span>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="shrink-0 rounded-lg p-1 opacity-0 transition hover:bg-black/5 group-hover:opacity-60"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <div className="mt-1">
        <QuickAddModal title={label} triggerLabel={label} compact>
          {close => (
            <QuickAddTextForm
              placeholder={placeholder}
              onSubmit={text => {
                onAdd(text)
                close()
              }}
            />
          )}
        </QuickAddModal>
      </div>
    </div>
  )
}

function ListEditor({
  items,
  onAdd,
  onRemove,
  label,
  placeholder,
}: {
  items: string[]
  onAdd: (text: string) => void
  onRemove: (index: number) => void
  label: string
  placeholder: string
}) {
  return (
    <div className="grid gap-1.5">
      {items.map((text, i) => (
        <div key={i} className="group flex items-start gap-2.5 rounded-xl px-1 py-1.5 hover:bg-black/[0.03]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span className="flex-1 text-sm font-semibold leading-5">{text}</span>
          <button type="button" onClick={() => onRemove(i)} className="shrink-0 rounded-lg p-1 opacity-0 transition hover:bg-black/5 group-hover:opacity-60">
            <X size={13} />
          </button>
        </div>
      ))}
      <div className="mt-1">
        <QuickAddModal title={label} triggerLabel={label} compact>
          {close => (
            <QuickAddTextForm
              placeholder={placeholder}
              onSubmit={text => {
                onAdd(text)
                close()
              }}
            />
          )}
        </QuickAddModal>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [people, setPeople] = useState<LeadershipPerson[] | null>(null)
  const [fronts, setFronts] = useState<ManagementFront[]>([])
  const [tab, setTab] = useState<Tab>('visao')
  const [savedLabel, setSavedLabel] = useState('')
  const [schedulingOneOnOne, setSchedulingOneOnOne] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPeople(loadPeople())
      setFronts(loadFronts())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const person = useMemo(() => people?.find(p => p.id === params.id) ?? null, [people, params.id])

  function update(updates: Partial<LeadershipPerson>) {
    if (!person || !people) return
    const next = people.map(p => (p.id === person.id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    setPeople(next)
    savePeople(next)
    setSavedLabel('Salvo automaticamente agora')
    window.setTimeout(() => setSavedLabel('Salvo automaticamente'), 1500)
  }

  function deletePerson() {
    if (!person || !people) return
    if (!window.confirm(`Remover ${person.name || 'esta pessoa'}?`)) return
    savePeople(people.filter(p => p.id !== person.id))
    router.push('/pessoas')
  }

  if (people === null) return null

  if (!person) {
    return (
      <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-10 text-center">
        <p className="font-black text-zinc-900">Pessoa não encontrada.</p>
        <Link href="/pessoas" className="mt-3 inline-block text-sm font-bold text-[var(--retro-wine)] hover:underline">
          ← Voltar para Pessoas
        </Link>
      </main>
    )
  }

  const linkedFronts = person.frontIds.map(id => fronts.find(f => f.id === id)).filter((f): f is ManagementFront => Boolean(f))
  const availableFronts = fronts.filter(f => !person.frontIds.includes(f.id))
  const lastFeedback = person.feedback[0]
  const hasOneOnOne = Boolean(person.nextOneOnOne)
  const hasPdi = person.pdi.status !== 'Sem PDI'

  function addProject(frontId: string) {
    if (!frontId || person.frontIds.includes(frontId)) return
    update({ frontIds: [...person.frontIds, frontId] })
  }
  function removeProject(frontId: string) {
    const nextRoles = { ...person.projectRoles }
    delete nextRoles[frontId]
    update({ frontIds: person.frontIds.filter(id => id !== frontId), projectRoles: nextRoles })
  }
  function setProjectRole(frontId: string, role: ProjectRole) {
    update({ projectRoles: { ...person.projectRoles, [frontId]: role } })
  }

  // ── Checklists
  function addEvidence(text: string) {
    update({ nextLeapEvidence: [...person.nextLeapEvidence, newChecklistItem(text)] })
  }
  function toggleEvidence(id: string) {
    update({ nextLeapEvidence: person.nextLeapEvidence.map(i => (i.id === id ? { ...i, done: !i.done } : i)) })
  }
  function removeEvidence(id: string) {
    update({ nextLeapEvidence: person.nextLeapEvidence.filter(i => i.id !== id) })
  }

  function addLeaderAction(text: string) {
    update({ leaderActions: [...person.leaderActions, newChecklistItem(text)] })
  }
  function toggleLeaderAction(id: string) {
    update({ leaderActions: person.leaderActions.map(i => (i.id === id ? { ...i, done: !i.done } : i)) })
  }
  function removeLeaderAction(id: string) {
    update({ leaderActions: person.leaderActions.filter(i => i.id !== id) })
  }

  function addRisk(text: string) {
    update({ risks: [...person.risks, text] })
  }
  function removeRisk(index: number) {
    update({ risks: person.risks.filter((_, i) => i !== index) })
  }
  function addLever(text: string) {
    update({ levers: [...person.levers, text] })
  }
  function removeLever(index: number) {
    update({ levers: person.levers.filter((_, i) => i !== index) })
  }

  // ── PDI goals (stored as a newline-joined string, edited as chips)
  const goalsList = person.pdi.goals.split('\n').map(g => g.trim()).filter(Boolean)
  function addGoal(text: string) {
    update({ pdi: { ...person.pdi, goals: [...goalsList, text].join('\n') } })
  }
  function removeGoal(index: number) {
    update({ pdi: { ...person.pdi, goals: goalsList.filter((_, i) => i !== index).join('\n') } })
  }

  // ── History (merged timeline)
  const historyItems = [
    ...person.notes.map(n => ({ id: n.id, type: 'Nota', tone: 'text-sky-600 bg-sky-50', createdAt: n.createdAt, text: n.text })),
    ...person.feedback.map(n => ({ id: n.id, type: 'Feedback', tone: 'text-violet-600 bg-violet-50', createdAt: n.createdAt, text: n.text })),
    ...person.oneOnOnes.map(o => ({ id: o.id, type: '1:1', tone: 'text-[var(--retro-wine)] bg-[var(--retro-wine-soft)]', createdAt: o.date, text: o.notes || 'Sem notas registradas' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400">
            <Link href="/pessoas" className="hover:text-zinc-700">Pessoas</Link>
            <ChevronRight size={14} />
            <span className="text-zinc-700">{person.name || 'Sem nome'}</span>
          </p>
          <button
            type="button"
            onClick={deletePerson}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50"
          >
            <Trash2 size={13} /> Remover pessoa
          </button>
        </div>

        {/* Header */}
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm shadow-zinc-950/5">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-[linear-gradient(90deg,var(--retro-wine),var(--retro-wine-deep)_55%,var(--retro-acqua))]" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-[var(--retro-wine-soft)] text-lg font-black text-[var(--retro-wine)]">
                  {initials(person.name) || <UserRound size={22} />}
                </span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-950">{person.name || 'Pessoa sem nome'}</h1>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-500">
                    {person.role || 'Cargo não definido'}
                    <Select
                      value={person.attention}
                      options={attentionTypes}
                      onChange={value => update({ attention: value as AttentionType })}
                      className={`!w-auto !gap-1.5 !rounded-full !border-0 !px-3 !py-1 !text-xs !font-black !shadow-none ${attentionTone[person.attention]}`}
                    />
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <CalendarDays size={11} /> Próximo 1:1
                  </p>
                  <p className="mt-0.5 text-sm font-black text-zinc-900">{hasOneOnOne ? formatDate(person.nextOneOnOne) : 'Não agendado'}</p>
                  <button type="button" onClick={() => { setTab('1a1'); setSchedulingOneOnOne(true) }} className="mt-1 text-xs font-bold text-[var(--retro-wine)] hover:underline">
                    Agendar 1:1 →
                  </button>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <Target size={11} /> PDI
                  </p>
                  <p className="mt-0.5 text-sm font-black text-zinc-900">{person.pdi.status}</p>
                  <button type="button" onClick={() => setTab('pdi')} className="mt-1 text-xs font-bold text-[var(--retro-wine)] hover:underline">
                    {hasPdi ? 'Ver PDI →' : 'Criar PDI →'}
                  </button>
                </div>
                <div className="col-span-2 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-2.5">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <MessageSquareText size={11} /> Último feedback
                  </p>
                  <p className="mt-0.5 text-sm font-black text-zinc-900">
                    {lastFeedback ? `Há ${daysAgo(lastFeedback.createdAt)} dias` : 'Nenhum registrado'}
                  </p>
                  <button type="button" onClick={() => setTab('notas')} className="mt-1 text-xs font-bold text-[var(--retro-wine)] hover:underline">
                    Ver histórico →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-5 py-2.5 sm:px-6">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id ? 'bg-[var(--retro-wine)] text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Aba: Visão geral ─────────────────────────────── */}
        {tab === 'visao' && (
          <div className="mt-5 grid gap-5">
            <div className={`${cardClass} p-5`}>
              <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--retro-wine)]">
                <Sparkles size={13} /> Visão da liderança
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-400">Resumo do momento atual de {person.name || 'pessoa'} e foco do ciclo.</p>
              <textarea
                rows={3}
                value={person.visionSummary}
                onChange={e => update({ visionSummary: e.target.value })}
                placeholder="Escreva um resumo do momento atual e do foco de desenvolvimento deste ciclo…"
                className={`${fieldClass} mt-3 resize-none leading-6`}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-black text-zinc-900">Momento de carreira</p>
                <p className="mt-1 text-xs font-semibold text-zinc-400">Em qual momento a pessoa está na sua jornada?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {careerMoments.map(moment => (
                    <button
                      key={moment}
                      type="button"
                      onClick={() => update({ careerMoment: moment as CareerMoment })}
                      className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
                        person.careerMoment === moment
                          ? 'bg-[var(--retro-wine)] text-white shadow-sm'
                          : 'border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)]'
                      }`}
                    >
                      {moment}
                    </button>
                  ))}
                </div>

                <p className="mt-5 text-sm font-black text-zinc-900">Contexto</p>
                <p className="mt-1 text-xs font-semibold text-zinc-400">Informações que ajudam a entender o momento atual.</p>
                <textarea
                  rows={3}
                  value={person.moment}
                  onChange={e => update({ moment: e.target.value })}
                  placeholder="O que está acontecendo com essa pessoa agora?"
                  className={`${fieldClass} mt-3 resize-none leading-6`}
                />
              </div>

              <div className={`${cardClass} grid gap-3 p-5`}>
                <p className="text-sm font-black text-zinc-900">Snapshot</p>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2">
                  <span className="text-xs font-semibold text-zinc-400">Cargo</span>
                  <span className="text-sm font-black text-zinc-900">{person.role || '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2">
                  <span className="text-xs font-semibold text-zinc-400">Status de desenvolvimento</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${attentionTone[person.attention]}`}>
                    {person.attention}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2">
                  <span className="text-xs font-semibold text-zinc-400">Momento de carreira</span>
                  <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-black text-zinc-700">
                    {person.careerMoment}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-zinc-400">Tempo no iFood</span>
                  <span className="text-sm font-black text-zinc-900">{tenureLabel(person.startDate)}</span>
                </div>
                <div className="mt-1 grid gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Data de entrada</label>
                  <input
                    type="date"
                    value={person.startDate}
                    onChange={e => update({ startDate: e.target.value })}
                    className={`${fieldClass} !py-2 text-sm`}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Líder</label>
                  <input
                    type="text"
                    value={person.leaderName}
                    onChange={e => update({ leaderName: e.target.value })}
                    className={`${fieldClass} !py-2 text-sm`}
                  />
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-sm font-black text-zinc-900">
                  <FolderKanban size={15} className="text-[var(--retro-wine)]" /> Projetos / Exposições relevantes
                </p>
                <button type="button" onClick={() => setTab('projetos')} className="text-xs font-bold text-[var(--retro-wine)] hover:underline">
                  Gerenciar →
                </button>
              </div>
              {linkedFronts.length === 0 ? (
                <p className="mt-2 text-xs font-semibold text-zinc-400">Nenhum projeto vinculado ainda.</p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {linkedFronts.map(front => (
                    <div key={front.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-sm font-black text-zinc-900">{front.name}</p>
                      {person.projectRoles[front.id] && (
                        <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-zinc-600">
                          {person.projectRoles[front.id]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-black text-zinc-900">Próximo salto</p>
                <p className="mt-1 text-xs font-semibold text-zinc-400">O que esperamos ver diferente nos próximos 3–6 meses?</p>
                <div className="mt-3">
                  <EditableTextField
                    label="Próximo salto"
                    value={person.nextLeap}
                    onSave={value => update({ nextLeap: value })}
                    placeholder="O que esperamos ver diferente nos próximos 3–6 meses?"
                    emptyText="Ainda não definido."
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--retro-wine-tint)] bg-[var(--retro-wine-soft)]/40 p-5">
                <p className="text-sm font-black text-[var(--retro-wine-deep)]">Como saberíamos que aconteceu?</p>
                <div className="mt-3">
                  <Checklist
                    items={person.nextLeapEvidence}
                    onAdd={addEvidence}
                    onToggle={toggleEvidence}
                    onRemove={removeEvidence}
                    label="Adicionar evidência"
                    placeholder="O que aconteceu, de forma observável?"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-100 bg-white p-5">
                <p className="inline-flex items-center gap-1.5 text-sm font-black text-rose-600">
                  <AlertTriangle size={15} /> Alertas / Riscos
                </p>
                <div className="mt-3">
                  <ListEditor items={person.risks.filter(Boolean)} onAdd={addRisk} onRemove={removeRisk} label="Adicionar alerta" placeholder="Descreva o alerta ou risco..." />
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5">
                <p className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-600">
                  <Zap size={15} /> Alavancas
                </p>
                <div className="mt-3">
                  <ListEditor items={person.levers.filter(Boolean)} onAdd={addLever} onRemove={removeLever} label="Adicionar alavanca" placeholder="Descreva a alavanca..." />
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-black text-zinc-900">Próximas ações (líder)</p>
              <p className="mt-1 text-xs font-semibold text-zinc-400">O que você precisa fazer para apoiar essa pessoa.</p>
              <div className="mt-3">
                <Checklist
                  items={person.leaderActions}
                  onAdd={addLeaderAction}
                  onToggle={toggleLeaderAction}
                  onRemove={removeLeaderAction}
                  label="Adicionar ação"
                  placeholder="O que você vai fazer?"
                />
              </div>
            </div>

            <p className="text-center text-xs font-semibold text-zinc-400">{savedLabel || `Editado em ${formatLongDate(person.updatedAt.slice(0, 10))}`}</p>
          </div>
        )}

        {/* ─── Aba: PDI ─────────────────────────────────────── */}
        {tab === 'pdi' && (
          <div className="mt-5 grid gap-5">
            <div className={`${cardClass} grid gap-4 p-5`}>
              <div>
                <p className="text-sm font-black text-zinc-900">Plano de Desenvolvimento Individual</p>
                <p className="mt-1 text-xs font-semibold text-zinc-400">Título e status do ciclo atual.</p>
              </div>
              <div className="grid gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Título do PDI</label>
                <input
                  type="text"
                  placeholder="Ex: Especialista: influência técnica"
                  className={fieldClass}
                  value={person.pdi.title}
                  onChange={e => update({ pdi: { ...person.pdi, title: e.target.value } })}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['Ativo', 'Em revisão', 'Sem PDI'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => update({ pdi: { ...person.pdi, status } })}
                      className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
                        person.pdi.status === status
                          ? 'bg-[var(--retro-wine)] text-white shadow-sm'
                          : 'border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${cardClass} grid gap-3 p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-zinc-900">Objetivos</p>
                <QuickAddModal title="Novo objetivo" triggerLabel="Adicionar objetivo" compact>
                  {close => (
                    <QuickAddTextForm
                      placeholder="Ex: Liderar iniciativa cross-time"
                      onSubmit={text => {
                        addGoal(text)
                        close()
                      }}
                    />
                  )}
                </QuickAddModal>
              </div>
              {goalsList.length === 0 ? (
                <p className="text-xs font-semibold text-zinc-400">Nenhum objetivo definido ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {goalsList.map((goal, index) => (
                    <span
                      key={`${goal}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--retro-wine-soft)] px-3 py-1.5 text-xs font-bold text-[var(--retro-wine-deep)]"
                    >
                      {goal}
                      <button type="button" onClick={() => removeGoal(index)} className="text-[var(--retro-wine)] opacity-50 hover:opacity-100">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-black text-zinc-900">Próximo passo</p>
              <p className="mt-1 text-xs font-semibold text-zinc-400">O que precisa acontecer antes do próximo 1:1?</p>
              <div className="mt-3">
                <EditableTextField
                  label="Próximo passo"
                  value={person.pdi.nextStep}
                  onSave={value => update({ pdi: { ...person.pdi, nextStep: value } })}
                  placeholder="O que precisa acontecer antes do próximo 1:1?"
                  emptyText="Nenhum próximo passo definido."
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Aba: 1:1 ─────────────────────────────────────── */}
        {tab === '1a1' && (
          <div className="mt-5 grid gap-5">
            <div className={`${cardClass} flex flex-wrap items-center justify-between gap-4 p-5`}>
              <div>
                <p className="text-sm font-black text-zinc-900">Próximo 1:1</p>
                <p className="mt-1 text-xs font-semibold text-zinc-400">
                  {person.nextOneOnOne ? formatLongDate(person.nextOneOnOne) : 'Ainda não agendado.'}
                </p>
              </div>
              <input
                type="date"
                autoFocus={schedulingOneOnOne}
                value={person.nextOneOnOne}
                onChange={e => update({ nextOneOnOne: e.target.value })}
                className={`${fieldClass} max-w-[200px]`}
              />
            </div>
            <OneOnOneLogEditor person={person} onSave={update} />
          </div>
        )}

        {/* ─── Aba: Notas & Feedback ────────────────────────── */}
        {tab === 'notas' && <NotesFeedbackTab person={person} onSave={update} />}

        {/* ─── Aba: Projetos ────────────────────────────────── */}
        {tab === 'projetos' && (
          <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/5">
            <p className="text-sm font-black text-zinc-900">Projetos / Exposições relevantes</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">Vincule frentes reais e marque o tipo de exposição desta pessoa.</p>

            {linkedFronts.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {linkedFronts.map(front => (
                  <div key={front.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link href="/frentes" className="text-sm font-black text-zinc-900 hover:text-[var(--retro-wine)]">
                        {front.name}
                      </Link>
                      <button type="button" onClick={() => removeProject(front.id)} className="shrink-0 text-zinc-400 hover:text-rose-500">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-2">
                      <Select
                        value={person.projectRoles[front.id] ?? ''}
                        onChange={value => setProjectRole(front.id, value as ProjectRole)}
                        placeholder="Tipo de exposição"
                        options={[...projectRoles]}
                        className="!py-1.5 !text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              {availableFronts.length > 0 ? (
                <div className="max-w-xs">
                  <Select value="" onChange={addProject} placeholder="+ Vincular frente" options={availableFronts.map(f => ({ value: f.id, label: f.name }))} />
                </div>
              ) : fronts.length === 0 ? (
                <Link href="/frentes" className="text-xs font-bold text-[var(--retro-wine)] hover:underline">
                  Nenhuma frente cadastrada ainda — criar em Frentes →
                </Link>
              ) : (
                <p className="text-xs font-semibold text-zinc-400">Todas as frentes já estão vinculadas.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── Aba: Histórico ───────────────────────────────── */}
        {tab === 'historico' && (
          <div className={`${cardClass} mt-5 p-5`}>
            <p className="text-sm font-black text-zinc-900">Histórico</p>
            <p className="mt-1 text-xs font-semibold text-zinc-400">Linha do tempo de notas, feedbacks e 1:1s.</p>
            {historyItems.length === 0 ? (
              <p className="mt-4 text-xs font-semibold text-zinc-400">Nenhum registro ainda.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {historyItems.map(item => (
                  <div key={item.id} className="flex gap-3 border-b border-zinc-100 pb-3 last:border-0">
                    <span className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${item.tone}`}>{item.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5 text-zinc-700">{item.text}</p>
                      <p className="mt-1 text-xs font-semibold text-zinc-400">{formatTimestamp(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Tab: Notas ───────────────────────────────────────────────────────────────

type NoteKind = 'nota' | 'feedback'

function NotesFeedbackTab({ person, onSave }: { person: LeadershipPerson; onSave: (updates: Partial<LeadershipPerson>) => void }) {
  function add(kind: NoteKind, text: string) {
    const value = text.trim()
    if (!value) return
    if (kind === 'nota') onSave({ notes: [newNote(value), ...person.notes] })
    else onSave({ feedback: [newNote(value), ...person.feedback] })
  }

  const merged = [
    ...person.notes.map(entry => ({ ...entry, kind: 'nota' as const })),
    ...person.feedback.map(entry => ({ ...entry, kind: 'feedback' as const })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className={`${cardClass} mt-5 grid gap-4 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-zinc-900">Notas & Feedback</p>
          <p className="mt-1 text-xs font-semibold text-zinc-400">Observações do dia a dia e feedbacks dados ou recebidos.</p>
        </div>
        <QuickAddModal title="Novo registro" triggerLabel="Adicionar" compact>
          {close => (
            <NoteFeedbackForm
              onSubmit={(kind, text) => {
                add(kind, text)
                close()
              }}
            />
          )}
        </QuickAddModal>
      </div>

      <div className="border-t border-zinc-200 pt-4">
        {merged.length === 0 ? (
          <p className="text-xs text-zinc-400">Nenhum registro ainda.</p>
        ) : (
          <div className="grid gap-4">
            {merged.map(entry => (
              <div key={entry.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      entry.kind === 'nota' ? 'bg-sky-50 text-sky-600' : 'bg-violet-50 text-violet-600'
                    }`}
                  >
                    {entry.kind === 'nota' ? 'Nota' : 'Feedback'}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{formatTimestamp(entry.createdAt)}</span>
                  <div className="flex-1 border-t border-zinc-100" />
                </div>
                <p className="text-sm text-zinc-700">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteFeedbackForm({ onSubmit }: { onSubmit: (kind: NoteKind, text: string) => void }) {
  const [kind, setKind] = useState<NoteKind>('nota')
  const [text, setText] = useState('')
  const canSubmit = text.trim().length > 0

  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        if (!canSubmit) return
        onSubmit(kind, text)
      }}
    >
      <div className="flex gap-2">
        {(['nota', 'feedback'] as const).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
              kind === option
                ? 'bg-[var(--retro-wine)] text-white shadow-sm'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)]'
            }`}
          >
            {option === 'nota' ? 'Nota' : 'Feedback'}
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={kind === 'nota' ? 'O que observou, o que vai desafiar no próximo 1:1...' : 'Feedback dado ou recebido, contexto, data...'}
        className={`${fieldClass} resize-none leading-6`}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className={`justify-self-end rounded-xl px-4 py-2.5 text-sm font-black transition ${
          canSubmit
            ? 'bg-[var(--retro-wine)] text-white hover:bg-[var(--retro-wine-hover)]'
            : 'cursor-not-allowed border border-zinc-200 text-zinc-400'
        }`}
      >
        Salvar
      </button>
    </form>
  )
}

// ─── Tab: 1:1 log ──────────────────────────────────────────────────────────────

function OneOnOneLogEditor({ person, onSave }: { person: LeadershipPerson; onSave: (updates: Partial<LeadershipPerson>) => void }) {
  const sorted = [...person.oneOnOnes].sort((a, b) => b.date.localeCompare(a.date))

  function add(date: string, notes: string) {
    if (!date) return
    const entry = { id: `1a1-${Date.now()}`, date, notes: notes.trim() }
    onSave({ oneOnOnes: [entry, ...person.oneOnOnes] })
  }

  return (
    <div className={`${cardClass} grid gap-4 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-zinc-900">Histórico de 1:1s</p>
        <QuickAddModal title="Registrar 1:1" triggerLabel="Registrar 1:1" compact>
          {close => (
            <OneOnOneLogForm
              onSubmit={(date, notes) => {
                add(date, notes)
                close()
              }}
            />
          )}
        </QuickAddModal>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-400">Nenhum 1:1 registrado ainda.</p>
      ) : (
        <div className="grid gap-3">
          {sorted.map(entry => (
            <div key={entry.id} className="flex items-start gap-3 border-b border-zinc-100 pb-3 last:border-0">
              <span className="shrink-0 rounded-full bg-[var(--retro-wine-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--retro-wine)]">
                {formatDate(entry.date)}
              </span>
              <p className="text-sm font-semibold leading-5 text-zinc-700">{entry.notes || 'Sem notas registradas'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OneOnOneLogForm({ onSubmit }: { onSubmit: (date: string, notes: string) => void }) {
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const canSubmit = Boolean(date)

  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        if (!canSubmit) return
        onSubmit(date, notes)
      }}
    >
      <div className="grid gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Data</label>
        <input autoFocus type="date" value={date} onChange={e => setDate(e.target.value)} className={fieldClass} />
      </div>
      <div className="grid gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Notas</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Principais pontos conversados…" className={fieldClass} />
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className={`justify-self-end rounded-xl px-4 py-2.5 text-sm font-black transition ${
          canSubmit
            ? 'bg-[var(--retro-wine)] text-white hover:bg-[var(--retro-wine-hover)]'
            : 'cursor-not-allowed border border-zinc-200 text-zinc-400'
        }`}
      >
        Registrar 1:1
      </button>
    </form>
  )
}
