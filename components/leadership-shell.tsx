'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  GitBranch,
  Home,
  MessageSquareText,
  Plus,
  UserRound,
  UsersRound,
} from 'lucide-react'
import CaptureInput from './capture-input'

const navigation = [
  { label: 'Hoje', href: '/dashboard', icon: Home },
  { label: 'Frentes', href: '/frentes', icon: GitBranch },
  { label: 'Time', href: '/pessoas', icon: UsersRound },
  { label: 'Retro', href: '/retro', icon: MessageSquareText },
]

const publicPaths = new Set(['/', '/team'])

export default function LeadershipShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const showFeedback = () => {
      setFeedback('Input salvo.')
      window.setTimeout(() => setFeedback(''), 2400)
    }
    window.addEventListener('captured-input-saved', showFeedback)
    return () => window.removeEventListener('captured-input-saved', showFeedback)
  }, [])

  if (publicPaths.has(pathname)) return children

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <CaptureInput />
      {feedback && (
        <p role="status" className="fixed bottom-5 right-5 z-[110] rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {feedback}
        </p>
      )}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-[var(--border-medium)] bg-[var(--bg-primary)] p-4 shadow-sm backdrop-blur-xl lg:flex">
        <Link href="/management" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[var(--bg-secondary)]">
          <Image src="/retro-mark.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Cockpit de Gestão</p>
            <p className="mt-0.5 text-xs font-medium text-[var(--text-secondary)]">Liderança</p>
          </div>
        </Link>

        <nav aria-label="Navegação principal" className="mt-4 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-[var(--retro-wine-soft)] text-[var(--retro-wine)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
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
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--retro-wine-hover)]"
        >
          <Plus size={17} />
          Capturar input
        </button>

        <div className="mt-auto rounded-2xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--retro-wine)] text-white">
              <UserRound size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">Joana</p>
              <p className="truncate text-xs font-medium text-[var(--text-secondary)]">Perfil de liderança</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="border-b border-[var(--border-medium)] bg-[var(--bg-primary)] px-3 py-2.5 shadow-sm backdrop-blur-xl lg:hidden">
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
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  active ? 'bg-[var(--retro-wine-soft)] text-[var(--retro-wine)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <button type="button" aria-label="Capturar input" onClick={() => window.dispatchEvent(new Event('open-capture-input'))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--retro-wine)] text-white shadow-sm">
          <Plus size={16} />
        </button>
        </div>
      </div>

      <div className="lg:pl-72">{children}</div>
    </div>
  )
}
