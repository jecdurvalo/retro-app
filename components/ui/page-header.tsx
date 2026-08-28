import type { ReactNode } from 'react'

export type PageStat = { label: string; value: number | string; detail?: string }

const statsGridClass: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
}

// Cycles through the brand + supporting palette so each stat card gets its own
// identity (accent strip + dot) instead of one flat gray block repeated N times.
const statAccentColors = [
  'var(--retro-wine)',
  'var(--retro-acqua)',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
]

/**
 * Shared cockpit page header: gradient top bar, uppercase eyebrow, black tracking-tight
 * title, subtitle, optional action button, optional stat row, optional extra content
 * (search bars, filters...). Used to keep every cockpit page (Painel, Frentes, Pessoas,
 * Histórico, Evolução, Decisões, Rituais) visually consistent.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  stats,
  children,
  backLink,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
  stats?: PageStat[]
  children?: ReactNode
  backLink?: ReactNode
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-md shadow-zinc-950/5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--retro-wine),var(--retro-wine-deep)_55%,var(--retro-acqua))]" />

      {backLink}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--retro-wine)]">{eyebrow}</p>}
          <h1 className={`text-3xl font-black tracking-tight text-zinc-950 ${eyebrow ? 'mt-2' : ''}`}>{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className={`mt-4 grid gap-2 ${statsGridClass[stats.length] ?? 'sm:grid-cols-3'}`}>
          {stats.map((stat, index) => {
            const accent = statAccentColors[index % statAccentColors.length]
            return (
              <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm shadow-zinc-950/[0.02]">
                <p className="flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                  {stat.label}
                </p>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-lg font-black leading-none tracking-tight text-zinc-950">{stat.value}</span>
                  {stat.detail && <span className="truncate text-[11px] font-medium text-zinc-400">{stat.detail}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </header>
  )
}
