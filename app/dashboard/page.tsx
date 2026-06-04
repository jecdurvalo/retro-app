import type { ElementType } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Eye,
  FileSearch,
  Filter,
  GitBranch,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'

const topics = ['Sobrecarga', 'Priorização', 'Desenvolvimento', 'Dependências entre times', 'Comunicação']

const nextSteps = [
  {
    title: 'Criar frente de governança de prioridades',
    description: 'Estruturar critérios e cadência de revisão.',
    meta: 'Até 30 jun',
    href: '/frentes',
    icon: GitBranch,
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Agendar alinhamento com área parceira',
    description: 'Tratar dependências e acordar próximos passos.',
    meta: 'Até 26 jun',
    href: '/decisoes',
    icon: CalendarDays,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Revisar PDI de uma pessoa em foco',
    description: 'Validar evidências e próximo salto.',
    meta: 'Até 30 jun',
    href: '/pessoas',
    icon: UserRound,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Monitorar capacidade do time',
    description: 'Acompanhar carga e foco nas próximas semanas.',
    meta: 'Contínuo',
    href: '/frentes',
    icon: Eye,
    tone: 'bg-amber-50 text-amber-600',
  },
]

const retros = [
  {
    month: 'Mai/2026',
    mood: 'Estável com atenção',
    moodTone: 'bg-amber-50 text-amber-700',
    topics: ['Sobrecarga', 'Priorização', 'Desenvolvimento'],
    actions: '6 ações',
    status: 'Em andamento',
    statusTone: 'text-amber-700',
  },
  {
    month: 'Abr/2026',
    mood: 'Positivo',
    moodTone: 'bg-emerald-50 text-emerald-700',
    topics: ['Comunicação', 'Rituais', 'Priorização'],
    actions: '5 ações',
    status: 'Concluídas',
    statusTone: 'text-emerald-700',
  },
  {
    month: 'Mar/2026',
    mood: 'Neutro',
    moodTone: 'bg-zinc-100 text-zinc-600',
    topics: ['Dependências', 'Processos', 'Foco'],
    actions: '4 ações',
    status: 'Em andamento',
    statusTone: 'text-amber-700',
  },
]

const classifications = [
  { label: 'Frente', description: 'Tema vira uma frente de trabalho ou atualiza uma já existente.', href: '/frentes', tone: 'bg-violet-50 text-violet-700' },
  { label: 'Ação', description: 'Tarefa prática com responsável e prazo.', href: '/frentes', tone: 'bg-amber-50 text-amber-700' },
  { label: 'Decisão', description: 'Escolha ou definição da liderança ou do time.', href: '/decisoes', tone: 'bg-sky-50 text-sky-700' },
  { label: 'PDI', description: 'Sinal ligado ao desenvolvimento individual.', href: '/pessoas', tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Monitoramento', description: 'Tema para acompanhar ao longo do tempo.', href: '/frentes', tone: 'bg-orange-50 text-orange-700' },
  { label: 'FCA', description: 'Fato, causa ou aprendizado; usado só quando necessário.', href: '/frentes', tone: 'bg-rose-50 text-rose-700' },
]

const kpis: Array<{ label: string; value: string; detail: string; icon: ElementType; tone: string; href: string }> = [
  { label: 'Mood atual', value: 'Estável com atenção', detail: 'Capacidade e foco pedem cuidado', icon: CircleDot, tone: 'bg-amber-50 text-amber-600', href: '#ultima-retro' },
  { label: 'Temas recorrentes', value: '5', detail: '2 aparecem há três ciclos', icon: MessageSquareText, tone: 'bg-violet-50 text-violet-600', href: '#ultima-retro' },
  { label: 'Viraram frente', value: '3', detail: '1 atualizou frente existente', icon: BriefcaseBusiness, tone: 'bg-emerald-50 text-emerald-600', href: '/frentes' },
  { label: 'Itens em observação', value: '4', detail: 'Sem necessidade de ação agora', icon: Eye, tone: 'bg-sky-50 text-sky-600', href: '/frentes' },
]

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--retro-wine)] transition hover:gap-2.5">
      {children}
      <ArrowRight size={14} />
    </Link>
  )
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-4 py-7 text-[var(--retro-ink)] sm:px-7 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[1480px]">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Retro Qualitativa</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">Pulso do time, temas recorrentes e conversão de sinais em ação.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm sm:w-72">
              <Search size={17} className="shrink-0 text-zinc-400" />
              <span className="sr-only">Buscar na retro qualitativa</span>
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" placeholder="Buscar sinais, temas, pessoas..." />
            </label>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50">
              <Filter size={16} />
              Filtros
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-deep)]">
              <Plus size={17} />
              Nova retro
            </button>
          </div>
        </header>

        <section aria-label="Indicadores da retro" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, detail, icon: Icon, tone, href }) => (
            <Link key={label} href={href} className="group rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
                  <Icon size={21} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-500">{label}</p>
                  <p className={`${value.length > 6 ? 'text-lg' : 'text-2xl'} mt-0.5 font-black tracking-tight text-zinc-900`}>{value}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{detail}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <article id="ultima-retro" className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <h2 className="text-lg font-black">Última retro</h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400"><CalendarDays size={14} /> 29 de mai. de 2026</span>
                <span className="text-xs font-semibold text-zinc-400">12 participantes</span>
              </div>
              <SectionLink href="#historico">Ver histórico</SectionLink>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm"><CircleDot size={21} /></span>
                <div>
                  <p className="font-black text-zinc-900">Estável com sinais de sobrecarga</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">Atenção à capacidade e ao foco do time nas próximas semanas.</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-zinc-400">Temas mais recorrentes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                  <span key={topic} className={`rounded-full px-3 py-1.5 text-xs font-bold ${index === 0 ? 'bg-rose-50 text-rose-700' : index === 1 ? 'bg-amber-50 text-amber-700' : index === 2 ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>{topic}</span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 border-t border-zinc-100 pt-5 md:grid-cols-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-black"><GitBranch size={16} className="text-emerald-600" /> O que virou frente</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
                  <li>Governança de prioridades</li>
                  <li>Desenvolvimento de autonomia</li>
                  <li>Atualização da frente de capacidade</li>
                </ul>
                <div className="mt-3"><SectionLink href="/frentes">Ver frentes</SectionLink></div>
              </div>
              <div className="border-zinc-100 md:border-l md:pl-4">
                <p className="flex items-center gap-2 text-sm font-black"><ListChecks size={16} className="text-amber-600" /> O que virou ação</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
                  <li>Revisar critérios de priorização</li>
                  <li>Alinhar bloqueios entre times</li>
                  <li>Preparar decisão de capacidade</li>
                </ul>
                <div className="mt-3"><SectionLink href="/decisoes">Ver decisões</SectionLink></div>
              </div>
              <div className="border-zinc-100 md:border-l md:pl-4">
                <p className="flex items-center gap-2 text-sm font-black"><Eye size={16} className="text-sky-600" /> O que ficou em observação</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
                  <li>Foco do time nas próximas semanas</li>
                  <li>Dependências com área parceira</li>
                  <li>Clareza dos papéis no ritual</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Próximos passos do ciclo</h2>
                <p className="mt-1 text-xs text-zinc-400">Itens gerados ou atualizados a partir da retro.</p>
              </div>
              <ClipboardCheck size={20} className="text-[var(--retro-wine)]" />
            </div>
            <div className="mt-5 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-100">
              {nextSteps.map(({ title, description, meta, href, icon: Icon, tone }) => (
                <Link key={title} href={href} className="group flex items-center gap-3 p-3.5 transition hover:bg-zinc-50">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-zinc-900">{title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-zinc-400">{description}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-bold text-zinc-500">{meta}</span>
                  <ChevronRight size={15} className="shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--retro-wine)]" />
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center"><SectionLink href="/frentes">Ver todos os próximos passos</SectionLink></div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <article id="historico" className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm shadow-zinc-950/5">
            <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-black">Histórico de retros</h2>
                <p className="mt-1 text-xs text-zinc-400">Evolução qualitativa e destino dos sinais por ciclo.</p>
              </div>
              <FileSearch size={20} className="text-[var(--retro-wine)]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="border-y border-zinc-100 bg-zinc-50/70 text-zinc-400">
                  <tr>
                    <th className="px-6 py-3 font-bold">Mês</th>
                    <th className="px-4 py-3 font-bold">Mood</th>
                    <th className="px-4 py-3 font-bold">Top temas</th>
                    <th className="px-4 py-3 font-bold">Ações geradas</th>
                    <th className="px-4 py-3 font-bold">Status das ações</th>
                    <th className="px-4 py-3" aria-label="Abrir retro" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {retros.map(retro => (
                    <tr key={retro.month} className="transition hover:bg-zinc-50/70">
                      <td className="px-6 py-4 font-black text-zinc-900">{retro.month}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 font-bold ${retro.moodTone}`}>{retro.mood}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">{retro.topics.map(topic => <span key={topic} className="rounded-full bg-zinc-100 px-2 py-1 font-semibold text-zinc-600">{topic}</span>)}</div>
                      </td>
                      <td className="px-4 py-4 font-bold text-zinc-700">{retro.actions}</td>
                      <td className={`px-4 py-4 font-bold ${retro.statusTone}`}>{retro.status}</td>
                      <td className="px-4 py-4"><ChevronRight size={15} className="text-zinc-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-zinc-100 px-6 py-4 text-center"><SectionLink href="#historico">Ver histórico completo</SectionLink></div>
          </article>

          <aside className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(135,0,47,0.08)] text-[var(--retro-wine)]"><Lightbulb size={18} /></span>
              <div>
                <h2 className="text-lg font-black">Como classificar um sinal</h2>
                <p className="mt-1 text-xs leading-5 text-zinc-400">A IA sugere. A gestora valida, edita e decide o destino.</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {classifications.map(item => (
                <Link key={item.label} href={item.href} className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-zinc-50">
                  <span className={`w-24 shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-black ${item.tone}`}>{item.label}</span>
                  <span className="text-xs leading-5 text-zinc-500">{item.description}</span>
                </Link>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-[rgba(135,0,47,0.12)] bg-[rgba(135,0,47,0.04)] p-4">
              <p className="flex items-center gap-2 text-xs font-black text-[var(--retro-wine)]"><Sparkles size={15} /> Regra de classificação</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">FCA não é o padrão. Antes de criar algo novo, a gestora pode editar a sugestão ou usar o sinal para atualizar uma frente existente.</p>
            </div>
          </aside>
        </section>

        <footer className="mt-5 flex flex-col gap-2 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Última retro consolidada e pronta para acompanhamento.</span>
          <Link href="/frentes" className="inline-flex items-center gap-1.5 font-black text-[var(--retro-wine)]">Revisar frentes atualizadas <Target size={14} /></Link>
        </footer>
      </div>
    </main>
  )
}
