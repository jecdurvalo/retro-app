'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CalendarSync,
  Compass,
  GitBranch,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react'
import CaptureInput from './capture-input'

const navigation = [
  { label: 'Cockpit', href: '/management', icon: LayoutDashboard },
  { label: 'Frentes de Gestão', href: '/frentes', icon: GitBranch },
  { label: 'Retro Qualitativa', href: '/dashboard', icon: MessageSquareText },
  { label: 'Pessoas', href: '/pessoas', icon: UsersRound },
  { label: 'Decisões', href: '/decisoes', icon: Compass },
  { label: 'Rituais', href: '/rituais', icon: CalendarSync },
  { label: 'Minha Evolução', href: '/minha-evolucao', icon: Sparkles },
]

const publicPaths = new Set(['/', '/team'])

export default function LeadershipShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const showFeedback = () => {
      setFeedback('Input salvo e conectado ao acompanhamento.')
      window.setTimeout(() => setFeedback(''), 2400)
    }
    window.addEventListener('captured-input-saved', showFeedback)
    return () => window.removeEventListener('captured-input-saved', showFeedback)
  }, [])

  if (publicPaths.has(pathname)) return children

  return (
    <div className="min-h-screen bg-[var(--retro-bg)] text-[var(--retro-ink)]">
      <CaptureInput />
      {feedback && (
        <p role="status" className="fixed bottom-5 right-5 z-[110] rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-xl">
          {feedback}
        </p>
      )}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-black/5 bg-white/92 p-4 shadow-xl shadow-zinc-950/5 backdrop-blur-xl lg:flex">
        <Link href="/management" className="flex items-center gap-3 px-2 py-3">
          <Image src="/retro-mark.svg" alt="" width={38} height={38} className="h-10 w-10 rounded-2xl" />
          <div>
            <p className="text-sm font-black text-zinc-900">Cockpit de Gestão</p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-400">Liderança</p>
          </div>
        </Link>

        <nav aria-label="Navegação principal" className="mt-5 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                  active
                    ? 'bg-[rgba(135,0,47,0.1)] text-[var(--retro-wine)]'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('open-capture-input'))}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--retro-wine)] px-3 py-3 text-sm font-black text-white"
        >
          <Plus size={17} />
          Capturar input
        </button>

        <div className="mt-auto rounded-3xl border border-black/5 bg-[var(--retro-bg)] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--retro-wine)] text-white">
              <UserRound size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-zinc-900">Joana</p>
              <p className="truncate text-xs font-semibold text-zinc-400">Perfil de liderança</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="border-b border-black/5 bg-white/92 px-3 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex gap-2">
        <nav aria-label="Navegação principal" className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {navigation.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                  active ? 'bg-[rgba(135,0,47,0.1)] text-[var(--retro-wine)]' : 'bg-zinc-50 text-zinc-500'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button type="button" aria-label="Capturar input" onClick={() => window.dispatchEvent(new Event('open-capture-input'))} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--retro-wine)] text-white">
          <Plus size={16} />
        </button>
        </div>
      </div>

      <div className="lg:pl-64">{children}</div>
    </div>
  )
}
