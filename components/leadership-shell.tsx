'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CalendarClock,
  GitBranch,
  History,
  Home,
  LogOut,
  PanelLeft,
  Plus,
  Scale,
  TrendingUp,
  UserRound,
  UsersRound,
} from 'lucide-react'
import CaptureInput from './capture-input'

const navigationGroups = [
  {
    title: null,
    items: [{ label: 'Painel', href: '/dashboard', icon: Home }],
  },
  {
    title: 'Gestão',
    items: [
      { label: 'Frentes', href: '/frentes', icon: GitBranch },
      { label: 'Decisões', href: '/decisoes', icon: Scale },
      { label: 'Rituais', href: '/rituais', icon: CalendarClock },
    ],
  },
  {
    title: 'Time',
    items: [
      { label: 'Pessoas', href: '/pessoas', icon: UsersRound },
      { label: 'Evolução', href: '/minha-evolucao', icon: TrendingUp },
    ],
  },
  {
    title: 'Histórico',
    items: [{ label: 'Histórico', href: '/historico', icon: History }],
  },
]

const navigation = navigationGroups.flatMap(group => group.items)

const publicPaths = new Set(['/', '/team', '/retro', '/login'])
const SIDEBAR_PINNED_KEY = 'cockpit-sidebar-pinned'

export default function LeadershipShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const showFeedback = () => {
      setFeedback('Input salvo.')
      window.setTimeout(() => setFeedback(''), 2400)
    }
    window.addEventListener('captured-input-saved', showFeedback)
    return () => window.removeEventListener('captured-input-saved', showFeedback)
  }, [])

  useEffect(() => {
    setPinned(window.localStorage.getItem(SIDEBAR_PINNED_KEY) === '1')
  }, [])

  function toggleExpanded() {
    setPinned(value => {
      const next = !value
      window.localStorage.setItem(SIDEBAR_PINNED_KEY, next ? '1' : '0')
      return next
    })
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' }).catch(() => null)
    router.push('/')
    router.refresh()
  }

  if (publicPaths.has(pathname)) return children

  const expanded = pinned || hovered

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <CaptureInput />
      {feedback && (
        <p role="status" className="fixed bottom-5 right-5 z-[110] rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {feedback}
        </p>
      )}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-[var(--border-medium)] bg-[var(--bg-primary)] py-4 shadow-sm transition-[width] duration-150 lg:flex ${
          expanded ? 'w-64' : 'w-[76px]'
        }`}
      >
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={pinned ? 'Soltar menu' : 'Fixar menu'}
          title={pinned ? 'Soltar menu' : 'Fixar menu'}
          className={`mx-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
            pinned
              ? 'bg-[var(--retro-acqua)] text-[var(--retro-wine-deep)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
          } ${expanded ? '' : 'justify-center px-0'}`}
        >
          <PanelLeft size={20} className="shrink-0" />
          {expanded && <span className="whitespace-nowrap">{pinned ? 'Soltar menu' : 'Fixar menu'}</span>}
        </button>

        <Link
          href="/dashboard"
          title="Cockpit de Liderança"
          className={`mt-4 flex items-center gap-3 rounded-2xl transition hover:bg-[var(--bg-secondary)] ${
            expanded ? 'mx-3 px-3 py-2' : 'mx-3 h-11 w-11 justify-center'
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[var(--retro-wine)] text-white shadow-sm">
            <Image src="/retro-mark.svg" alt="" width={20} height={20} className="h-5 w-5" />
          </span>
          {expanded && (
            <span className="min-w-0 whitespace-nowrap">
              <span className="block text-sm font-bold text-[var(--text-primary)]">Cockpit de Liderança</span>
              <span className="block text-xs font-medium text-[var(--text-secondary)]">Gestão sênior</span>
            </span>
          )}
        </Link>

        <nav aria-label="Navegação principal" className="mt-6 flex flex-col gap-4 px-3">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.title ?? `group-${groupIndex}`} className="flex flex-col gap-1">
              {group.title && expanded && (
                <p className="mb-1 px-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                  {group.title}
                </p>
              )}
              {group.title && !expanded && <div className="mx-3 mb-1 h-px bg-[var(--border-medium)]" />}
              {group.items.map(item => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-2xl transition ${expanded ? 'px-3 py-2.5' : 'h-11 w-11 justify-center'} ${
                      active
                        ? 'bg-[var(--retro-wine-soft)] text-[var(--retro-wine)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
                    {expanded && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('open-capture-input'))}
          aria-label="Capturar input"
          title="Capturar input"
          className={`mt-4 flex items-center gap-3 rounded-2xl bg-[var(--retro-wine)] text-white shadow-sm transition hover:bg-[var(--retro-wine-hover)] ${
            expanded ? 'mx-3 justify-start px-3 py-2.5' : 'mx-3 h-11 w-11 justify-center'
          }`}
        >
          <Plus size={19} className="shrink-0" />
          {expanded && <span className="whitespace-nowrap text-sm font-semibold">Capturar input</span>}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title="Sair"
          aria-label="Sair"
          className={`group mt-auto flex items-center gap-3 rounded-2xl bg-[var(--bg-secondary)] text-left transition hover:bg-rose-50 ${expanded ? 'mx-3 px-3 py-2.5' : 'mx-3 h-11 w-11 justify-center'}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--retro-wine)] text-white group-hover:bg-rose-500">
            <UserRound size={16} className="group-hover:hidden" />
            <LogOut size={16} className="hidden group-hover:block" />
          </span>
          {expanded && (
            <span className="min-w-0 whitespace-nowrap">
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-rose-600">Joana</span>
              <span className="block truncate text-xs font-medium text-[var(--text-secondary)] group-hover:text-rose-500">Sair</span>
            </span>
          )}
        </button>
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

      <div className={`transition-[padding] duration-200 ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>{children}</div>
    </div>
  )
}
