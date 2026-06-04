'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  Lightbulb,
  MessageCircleMore,
  Plus,
  Search,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
} from 'lucide-react'
import {
  FRONTS_UPDATED_EVENT,
  loadFronts,
  type FrontTemperature,
  type ManagementFront,
} from '@/lib/fronts'

const agenda = [
  {
    title: 'Checkpoint com stakeholder',
    detail: 'Alinhar definições dos indicadores executivos',
    time: 'Hoje · 10:00',
    href: '/rituais',
    icon: UsersRound,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Decisão a tomar',
    detail: 'Definir reforço temporário para suporte',
    time: 'Hoje · 14:00',
    href: '/decisoes',
    icon: Target,
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Frente sem atualização',
    detail: 'Confiabilidade dos indicadores executivos',
    time: 'Amanhã · 09:00',
    href: '/frentes',
    icon: CircleAlert,
    tone: 'bg-rose-50 text-rose-600',
  },
  {
    title: '1:1 de desenvolvimento',
    detail: 'Evolução de autonomia da liderança',
    time: 'Qui · 11:00',
    href: '/pessoas',
    icon: UserRound,
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Tema da retro para tratar',
    detail: 'Capacidade e foco do time',
    time: 'Sex · 10:30',
    href: '/dashboard',
    icon: MessageCircleMore,
    tone: 'bg-emerald-50 text-emerald-600',
  },
]

const temperatureTone: Record<FrontTemperature, string> = {
  Saudável: 'bg-emerald-50 text-emerald-700',
  Atenção: 'bg-amber-50 text-amber-700',
  Crítica: 'bg-rose-50 text-rose-700',
}

const interventionTone: Record<string, string> = {
  Decidir: 'bg-rose-50 text-rose-700',
  Desbloquear: 'bg-amber-50 text-amber-700',
  'Alinhar stakeholders': 'bg-violet-50 text-violet-700',
  'Desenvolver dono': 'bg-sky-50 text-sky-700',
  Monitorar: 'bg-emerald-50 text-emerald-700',
  Nenhuma: 'bg-zinc-100 text-zinc-600',
}

const moodTopics = ['Capacidade', 'Foco e prioridades', 'Processos', 'Comunicação']

function formatCheckpoint(value: string) {
  if (!value) return 'A definir'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function priorityScore(front: ManagementFront) {
  const temperature = { Crítica: 30, Atenção: 20, Saudável: 10 }[front.temperature]
  const blocked = front.status === 'Bloqueada' ? 12 : 0
  const owner = front.owner ? 0 : 8
  const checkpoint = front.nextCheckpoint ? new Date(front.nextCheckpoint).getTime() : Number.MAX_SAFE_INTEGER
  return { score: temperature + blocked + owner, checkpoint }
}

function MetricCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  detail: string
  href: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  tone: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
          <Icon size={21} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-zinc-950">{value}</p>
          <p className="mt-1 truncate text-xs font-medium text-zinc-400">{detail}</p>
        </div>
      </div>
    </Link>
  )
}

export default function ManagementPage() {
  const [fronts, setFronts] = useState<ManagementFront[]>([])

  useEffect(() => {
    const refresh = () => setFronts(loadFronts())
    refresh()
    window.addEventListener(FRONTS_UPDATED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(FRONTS_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const activeFronts = useMemo(
    () => fronts.filter(front => front.status !== 'Arquivada' && front.status !== 'Concluída'),
    [fronts],
  )

  const priorityFronts = useMemo(
    () =>
      [...activeFronts]
        .sort((a, b) => {
          const aPriority = priorityScore(a)
          const bPriority = priorityScore(b)
          return bPriority.score - aPriority.score || aPriority.checkpoint - bPriority.checkpoint
        })
        .slice(0, 5),
    [activeFronts],
  )

  const criticalCount = activeFronts.filter(front => front.temperature === 'Crítica').length
  const peopleInFocus = new Set(
    activeFronts
      .filter(front => front.temperature !== 'Saudável' || front.managerIntervention !== 'Nenhuma')
      .flatMap(front => [front.owner, ...front.involvedPeople])
      .filter(Boolean),
  ).size

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--retro-bg)] px-4 py-7 text-[var(--retro-ink)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Cockpit de Gestão</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Retros, frentes, decisões e prioridades da liderança em uma visão única.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-400 shadow-sm sm:w-72">
              <Search size={17} />
              <span className="sr-only">Busca global</span>
              <input
                type="search"
                placeholder="Buscar frentes, pessoas, decisões..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400"
              />
            </label>
            <Link
              href="/frentes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-zinc-300"
            >
              <Filter size={17} /> Filtros
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-capture-input'))}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:brightness-110"
            >
              <Plus size={17} /> Capturar input
            </button>
          </div>
        </header>

        <section aria-label="Indicadores principais" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Frentes críticas"
            value={criticalCount}
            detail={`${criticalCount} pedem intervenção da Joana`}
            href="/frentes"
            icon={CircleAlert}
            tone="bg-rose-50 text-rose-600"
          />
          <MetricCard
            label="Checkpoints da semana"
            value="5"
            detail="2 hoje · 3 nos próximos dias"
            href="/rituais"
            icon={CalendarCheck}
            tone="bg-sky-50 text-sky-600"
          />
          <MetricCard
            label="Ações em atraso"
            value="3"
            detail="1 crítica · 2 importantes"
            href="/frentes"
            icon={Clock3}
            tone="bg-amber-50 text-amber-600"
          />
          <MetricCard
            label="Pessoas em foco"
            value={peopleInFocus}
            detail="1:1s e próximos saltos"
            href="/pessoas"
            icon={UsersRound}
            tone="bg-violet-50 text-violet-600"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <article className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5">
            <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <Target size={20} className="text-[var(--retro-wine)]" />
                <h2 className="text-lg font-black text-zinc-950">Frentes prioritárias</h2>
              </div>
              <Link href="/frentes" className="inline-flex items-center gap-1 text-xs font-black text-[var(--retro-wine)]">
                Ver todas <ChevronRight size={15} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-zinc-100 bg-[#fcfbfa] text-xs font-bold text-zinc-500">
                    <th className="px-6 py-3">Frente</th>
                    <th className="px-4 py-3">Dono</th>
                    <th className="px-4 py-3">Saúde</th>
                    <th className="px-4 py-3">Intervenção da Joana</th>
                    <th className="px-4 py-3">Próximo checkpoint</th>
                    <th className="px-4 py-3">Próximo passo</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityFronts.map(front => (
                    <tr key={front.id} className="border-b border-zinc-100 text-sm last:border-0">
                      <td className="px-6 py-4">
                        <Link href="/frentes" className="font-black text-zinc-900 hover:text-[var(--retro-wine)]">
                          {front.name}
                        </Link>
                        <p className="mt-1 max-w-52 truncate text-xs text-zinc-400">{front.type} · {front.origin}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-zinc-600">{front.owner || 'Sem dono'}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${temperatureTone[front.temperature]}`}>
                          {front.temperature}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${interventionTone[front.managerIntervention]}`}>
                          {front.managerIntervention}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{formatCheckpoint(front.nextCheckpoint)}</td>
                      <td className="max-w-60 px-4 py-4 text-sm font-medium text-zinc-600">{front.nextStep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link
              href="/frentes"
              className="flex items-center justify-center gap-2 border-t border-zinc-100 px-5 py-4 text-sm font-black text-[var(--retro-wine)]"
            >
              Ver todas as frentes <ArrowRight size={16} />
            </Link>
          </article>

          <article className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CalendarClock size={20} className="text-[var(--retro-wine)]" />
                <h2 className="text-lg font-black text-zinc-950">Agenda da semana</h2>
              </div>
              <Link href="/rituais" className="text-xs font-black text-[var(--retro-wine)]">Ver agenda</Link>
            </div>

            <div className="mt-5 space-y-2">
              {agenda.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-100 p-3 transition hover:border-[rgba(135,0,47,0.18)] hover:bg-[#fcfaf9]"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-zinc-900">{item.title}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-zinc-400">{item.detail}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs font-bold text-zinc-500">{item.time}</span>
                  </Link>
                )
              })}
            </div>
            <Link
              href="/rituais"
              className="mt-5 flex items-center justify-center gap-2 text-sm font-black text-[var(--retro-wine)]"
            >
              Ver todos os compromissos <ArrowRight size={16} />
            </Link>
          </article>
        </section>

        <Link
          href="/dashboard"
          className="mt-6 block rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 transition hover:shadow-md sm:p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageCircleMore size={20} className="text-[var(--retro-wine)]" />
              <h2 className="text-lg font-black text-zinc-950">Retro qualitativa</h2>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-black text-[var(--retro-wine)]">
              Ver detalhes <ChevronRight size={15} />
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_1.5fr_repeat(3,0.7fr)]">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-xs font-bold text-zinc-500">Mood atual</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm"><Sparkles size={19} /></span>
                <p className="font-black text-zinc-900">Estável com sinais de sobrecarga</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#fcfbfa] p-4">
              <p className="text-xs font-bold text-zinc-500">Temas mais citados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {moodTopics.map((topic, index) => (
                  <span
                    key={topic}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      ['bg-rose-50 text-rose-700', 'bg-amber-50 text-amber-700', 'bg-sky-50 text-sky-700', 'bg-emerald-50 text-emerald-700'][index]
                    }`}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {[
              ['Ações geradas', '12', CheckCircle2, 'text-emerald-600 bg-emerald-50'],
              ['Melhorias criadas', '4', Lightbulb, 'text-violet-600 bg-violet-50'],
              ['Itens em observação', '3', CircleAlert, 'text-amber-600 bg-amber-50'],
            ].map(([label, value, Icon, tone]) => (
              <div key={String(label)} className="rounded-2xl border border-zinc-100 p-4">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${String(tone)}`}>
                  <Icon size={17} />
                </span>
                <p className="mt-3 text-2xl font-black text-zinc-950">{String(value)}</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">{String(label)}</p>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </main>
  )
}
