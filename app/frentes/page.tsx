import { ArrowRight, BriefcaseBusiness, CalendarClock, CircleAlert, Plus } from 'lucide-react'

const frentes = [
  { nome: 'Revisão do fluxo de atendimento', tipo: 'Processo', status: 'Em andamento', dono: 'Marina', proximo: 'Validar novo fluxo com stakeholders', prazo: '12 jun' },
  { nome: 'Previsibilidade das entregas', tipo: 'Melhoria', status: 'Atenção', dono: 'Rafael', proximo: 'Revisar dependências críticas', prazo: '10 jun' },
  { nome: 'Expansão de capacidade do time', tipo: 'Oportunidade', status: 'Em análise', dono: 'Você', proximo: 'Consolidar cenários de alocação', prazo: '18 jun' },
]

const statusTone: Record<string, string> = {
  'Em andamento': 'bg-emerald-50 text-emerald-700',
  Atenção: 'bg-amber-50 text-amber-700',
  'Em análise': 'bg-sky-50 text-sky-700',
}

export default function FrentesPage() {
  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-8 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">Portfólio de gestão</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Frentes de Gestão</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">Acompanhe iniciativas, riscos, melhorias e planos em um único lugar.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(135,0,47,0.16)]">
            <Plus size={17} /> Nova frente
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Frentes ativas', '8', BriefcaseBusiness],
            ['Pedem atenção', '2', CircleAlert],
            ['Checkpoints na semana', '5', CalendarClock],
          ].map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-500">{String(label)}</p>
                <Icon size={19} className="text-[var(--retro-wine)]" />
              </div>
              <p className="mt-3 text-3xl font-black">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">Prioridades atuais</h2>
              <p className="mt-1 text-sm text-zinc-500">Ordenadas pelo próximo movimento necessário.</p>
            </div>
            <button className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600">Filtrar</button>
          </div>
          <div className="mt-5 grid gap-3">
            {frentes.map(frente => (
              <article key={frente.nome} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{frente.nome}</h3>
                      <span className="rounded-full bg-[rgba(135,0,47,0.08)] px-2.5 py-1 text-xs font-bold text-[var(--retro-wine)]">{frente.tipo}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[frente.status]}`}>{frente.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">Responsável: {frente.dono}</p>
                  </div>
                  <div className="lg:text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Próximo passo · {frente.prazo}</p>
                    <p className="mt-1 text-sm font-bold text-zinc-800">{frente.proximo}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--retro-wine)] p-5 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Próximo passo</p><p className="mt-1 font-bold">Revise as duas frentes que pedem atenção antes do próximo checkpoint.</p></div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--retro-wine)]">Revisar agora <ArrowRight size={16} /></button>
        </aside>
      </div>
    </main>
  )
}
