import Image from 'next/image'
import Link from 'next/link'
import { ClipboardList, LayoutDashboard, QrCode, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { TEAM_JOIN_URL } from '@/lib/site-url'

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--retro-wine)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.1),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(52,232,207,0.22),transparent_24%),linear-gradient(135deg,var(--retro-wine),var(--retro-wine-deep)_68%)]" />
      <div className="absolute -right-32 top-[-8rem] h-[44rem] w-[34rem] rotate-12 rounded-[6rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20" />
      <div className="absolute right-16 top-0 hidden h-72 w-16 rounded-b-[2.5rem] bg-[var(--retro-cyan)]/90 shadow-2xl shadow-cyan-300/30 lg:block" />
      <div className="absolute bottom-[-9rem] left-[-6rem] h-80 w-80 rounded-full border border-white/10 bg-white/5" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-45" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between rounded-3xl border border-white/12 bg-white/8 px-4 py-3 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-3 text-sm font-bold">
            <Image src="/retro-mark.svg" alt="Retro Sync" width={40} height={40} className="h-10 w-10 rounded-2xl shadow-lg shadow-black/15" />
            <span>
              <span className="block leading-4">Retro Sync</span>
              <span className="block text-xs font-semibold text-white/50">mensal</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/team"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <ClipboardList size={16} />
              Responder
            </Link>
            <Link
              href="/management"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--retro-cyan)] px-4 py-2.5 text-sm font-black text-[var(--retro-wine-deep)] shadow-xl shadow-cyan-300/20 transition hover:brightness-110"
            >
              <LayoutDashboard size={16} />
              Cockpit
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:py-14">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-2xl border border-white/14 bg-white/10 px-4 py-2 text-sm font-bold text-white/70 backdrop-blur">
              Retro mensal
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Vamos ver como estamos?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/66">
              Responda pelo celular e acompanhe os sinais qualitativos no cockpit em tempo real.
            </p>
          </div>

          <aside className="rounded-[2rem] border border-white/14 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl">
            <div className="rounded-[1.5rem] bg-white p-5 text-[var(--retro-ink)] shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">
                    <QrCode size={14} />
                    QR do time
                  </p>
                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-black">
                    <Smartphone size={24} />
                    Responder
                  </h2>
                </div>
              </div>
              <div className="mt-5 rounded-[1.25rem] border border-zinc-100 bg-white p-4 shadow-inner">
                <QRCodeSVG value={TEAM_JOIN_URL} size={248} level="H" className="h-auto w-full" />
              </div>
              <p className="mt-4 break-all text-xs font-semibold leading-5 text-zinc-500">{TEAM_JOIN_URL}</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
