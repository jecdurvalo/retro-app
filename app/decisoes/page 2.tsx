import { ArrowRight, CheckCircle2, Clock3, Plus, Scale } from 'lucide-react'

const decisoes = [
  { titulo: 'Modelo de priorização trimestral', frente: 'Previsibilidade das entregas', estado: 'Aguardando decisão', responsavel: 'Você', data: 'Até 10 jun' },
  { titulo: 'Formato do novo checkpoint executivo', frente: 'Governança de portfólio', estado: 'Em validação', responsavel: 'Marina', data: 'Até 12 jun' },
  { titulo: 'Redistribuição de capacidade', frente: 'Expansão de capacidade do time', estado: 'Decidida', responsavel: 'Você', data: 'Decidida em 03 jun' },
]

export default function DecisoesPage() {
  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-8 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">Registro e acompanhamento</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Decisões</h1><p className="mt-2 max-w-2xl text-sm text-zinc-500">Dê visibilidade ao que precisa ser decidido, por quem e com qual contexto.</p></div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"><Plus size={17} /> Registrar decisão</button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Aguardando decisão', '3', Scale],
            ['Prazo nesta semana', '2', Clock3],
            ['Decididas no mês', '6', CheckCircle2],
          ].map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-zinc-500">{String(label)}</p><Icon size={19} className="text-[var(--retro-wine)]" /></div><p className="mt-3 text-3xl font-black">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
          <div><h2 className="text-lg font-black">Fila de decisões</h2><p className="mt-1 text-sm text-zinc-500">Priorize o que desbloqueia mais progresso.</p></div>
          <div className="mt-5 space-y-3">
            {decisoes.map(decisao => (
              <article key={decisao.titulo} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{decisao.titulo}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${decisao.estado === 'Decidida' ? 'bg-emerald-50 text-emerald-700' : decisao.estado === 'Em validação' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>{decisao.estado}</span></div><p className="mt-2 text-sm text-zinc-500">Frente: {decisao.frente}</p></div>
                  <div className="sm:text-right"><p className="text-sm font-bold">{decisao.responsavel}</p><p className="mt-1 text-xs text-zinc-500">{decisao.data}</p></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--retro-wine)] p-5 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Próximo passo</p><p className="mt-1 font-bold">Defina o modelo de priorização para desbloquear o planejamento.</p></div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--retro-wine)]">Abrir decisão <ArrowRight size={16} /></button>
        </aside>
      </div>
    </main>
  )
}
