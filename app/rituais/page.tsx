import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Plus } from 'lucide-react'

const rituais = [
  { nome: 'Checkpoint de prioridades', cadencia: 'Semanal', proxima: 'Seg, 9h', preparo: 'Revisar bloqueios das frentes', status: 'Preparar' },
  { nome: 'Revisão de desenvolvimento', cadencia: 'Quinzenal', proxima: 'Qua, 14h', preparo: 'Consolidar evolução dos PDIs', status: 'Em dia' },
  { nome: 'Fórum de decisões', cadencia: 'Mensal', proxima: 'Sex, 10h', preparo: 'Selecionar decisões para escalonamento', status: 'Preparar' },
]

export default function RituaisPage() {
  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-8 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">Cadência de gestão</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Rituais</h1><p className="mt-2 max-w-2xl text-sm text-zinc-500">Organize encontros recorrentes com propósito, preparo e saída esperada.</p></div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"><Plus size={17} /> Novo ritual</button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Rituais ativos', '6', CalendarDays],
            ['Próximos 7 dias', '4', Clock3],
            ['Com pauta pronta', '2', CheckCircle2],
          ].map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-zinc-500">{String(label)}</p><Icon size={19} className="text-[var(--retro-wine)]" /></div><p className="mt-3 text-3xl font-black">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
          <div><h2 className="text-lg font-black">Agenda de gestão</h2><p className="mt-1 text-sm text-zinc-500">Rituais ordenados por proximidade e necessidade de preparo.</p></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {rituais.map(ritual => (
              <article key={ritual.nome} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-5">
                <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-[rgba(135,0,47,0.08)] px-2.5 py-1 text-xs font-bold text-[var(--retro-wine)]">{ritual.cadencia}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ritual.status === 'Em dia' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{ritual.status}</span></div>
                <h3 className="mt-5 font-black">{ritual.nome}</h3><p className="mt-1 text-sm text-zinc-500">{ritual.proxima}</p>
                <div className="mt-5 border-t border-zinc-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Preparo necessário</p><p className="mt-1 text-sm font-bold">{ritual.preparo}</p></div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--retro-wine)] p-5 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Próximo passo</p><p className="mt-1 font-bold">Prepare o checkpoint de prioridades antes de segunda-feira.</p></div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--retro-wine)]">Preparar ritual <ArrowRight size={16} /></button>
        </aside>
      </div>
    </main>
  )
}
