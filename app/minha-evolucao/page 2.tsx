import { ArrowRight, BookOpenCheck, Plus, Sparkles, Target } from 'lucide-react'

const objetivos = [
  { titulo: 'Delegar decisões com mais clareza', progresso: 72, evidencia: '3 decisões conduzidas pelo time', proximo: 'Definir limites de autonomia da próxima frente' },
  { titulo: 'Aprimorar conversas de desenvolvimento', progresso: 50, evidencia: '2 planos atualizados no mês', proximo: 'Registrar feedback após os próximos 1:1' },
  { titulo: 'Proteger tempo para atuação estratégica', progresso: 35, evidencia: '1 bloco semanal preservado', proximo: 'Revisar agenda e remover uma reunião operacional' },
]

export default function MinhaEvolucaoPage() {
  return (
    <main className="min-h-screen bg-[var(--retro-bg)] px-5 py-8 text-[var(--retro-ink)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">Desenvolvimento da liderança</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Minha Evolução</h1><p className="mt-2 max-w-2xl text-sm text-zinc-500">Transforme aprendizados em práticas observáveis e acompanhe sua evolução.</p></div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[rgba(135,0,47,0.16)]"><Plus size={17} /> Novo objetivo</button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Objetivos ativos', '3', Target],
            ['Evidências no mês', '6', BookOpenCheck],
            ['Reflexões pendentes', '2', Sparkles],
          ].map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-zinc-500">{String(label)}</p><Icon size={19} className="text-[var(--retro-wine)]" /></div><p className="mt-3 text-3xl font-black">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
          <div><h2 className="text-lg font-black">Objetivos de desenvolvimento</h2><p className="mt-1 text-sm text-zinc-500">Progresso sustentado por evidências e próximos passos concretos.</p></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {objetivos.map(objetivo => (
              <article key={objetivo.titulo} className="rounded-2xl border border-zinc-100 bg-[#fcfaf9] p-5">
                <div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-wider text-[var(--retro-wine)]">Em evolução</span><span className="text-sm font-black">{objetivo.progresso}%</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[var(--retro-wine)]" style={{ width: `${objetivo.progresso}%` }} /></div>
                <h3 className="mt-5 font-black">{objetivo.titulo}</h3><p className="mt-2 text-sm text-zinc-500">{objetivo.evidencia}</p>
                <div className="mt-5 border-t border-zinc-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Próximo passo</p><p className="mt-1 text-sm font-bold">{objetivo.proximo}</p></div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-6 flex flex-col gap-4 rounded-2xl bg-[var(--retro-wine)] p-5 text-white shadow-lg shadow-[rgba(135,0,47,0.16)] sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Próximo passo</p><p className="mt-1 font-bold">Reserve 15 minutos para registrar evidências da sua semana.</p></div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--retro-wine)]">Registrar reflexão <ArrowRight size={16} /></button>
        </aside>
      </div>
    </main>
  )
}
