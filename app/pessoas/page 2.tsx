import { ArrowRight, CalendarCheck, MessageSquareText, Plus, UsersRound } from 'lucide-react'

const pessoas = [
  { nome: 'Marina Costa', papel: 'Liderança de operações', momento: 'Alta autonomia', conversa: '11 jun', foco: 'Ampliar influência entre áreas' },
  { nome: 'Rafael Lima', papel: 'Especialista de produto', momento: 'Em desenvolvimento', conversa: '13 jun', foco: 'Priorizar com mais clareza' },
  { nome: 'Camila Rocha', papel: 'Analista sênior', momento: 'Nova responsabilidade', conversa: '17 jun', foco: 'Estruturar plano de transição' },
]

export default function PessoasPage() {
  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-8 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">Desenvolvimento e contexto</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Pessoas</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">Centralize combinados, desenvolvimento e pontos de atenção dos liderados.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"><Plus size={17} /> Adicionar pessoa</button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Pessoas acompanhadas', '7', UsersRound],
            ['1:1 nesta semana', '4', CalendarCheck],
            ['Conversas a preparar', '2', MessageSquareText],
          ].map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-zinc-500">{String(label)}</p><Icon size={19} className="text-[var(--retro-wine)]" /></div>
              <p className="mt-3 text-3xl font-black">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
          <div><h2 className="text-lg font-black">Acompanhamentos prioritários</h2><p className="mt-1 text-sm text-zinc-500">Contexto essencial para conduzir as próximas conversas.</p></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {pessoas.map((pessoa, index) => (
              <article key={pessoa.nome} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgba(135,0,47,0.1)] text-sm font-black text-[var(--retro-wine)]">{pessoa.nome.split(' ').map(nome => nome[0]).join('')}</div>
                  <div><h3 className="font-black">{pessoa.nome}</h3><p className="text-xs text-zinc-500">{pessoa.papel}</p></div>
                </div>
                <span className={`mt-5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${index === 1 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{pessoa.momento}</span>
                <div className="mt-5 border-t border-zinc-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Foco atual</p><p className="mt-1 text-sm font-bold">{pessoa.foco}</p><p className="mt-3 text-xs text-zinc-500">Próxima conversa: {pessoa.conversa}</p></div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--retro-wine)] p-5 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Próximo passo</p><p className="mt-1 font-bold">Prepare as duas conversas que ainda não têm pauta definida.</p></div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--retro-wine)]">Preparar pautas <ArrowRight size={16} /></button>
        </aside>
      </div>
    </main>
  )
}
