'use client'

import Image from 'next/image'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error || 'Não foi possível entrar.')
        setLoading(false)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError('Não foi possível conectar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--retro-wine)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.1),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(52,232,207,0.22),transparent_24%),linear-gradient(135deg,var(--retro-wine),var(--retro-wine-deep)_68%)]" />
      <div className="absolute -right-32 top-[-8rem] h-[44rem] w-[34rem] rotate-12 rounded-[6rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20" />
      <div className="absolute right-16 top-0 hidden h-72 w-16 rounded-b-[2.5rem] bg-[var(--retro-acqua)]/90 shadow-2xl shadow-emerald-300/30 lg:block" />
      <div className="absolute bottom-[-9rem] left-[-6rem] h-80 w-80 rounded-full border border-white/10 bg-white/5" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] opacity-45" />

      <section className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/retro-mark.svg" alt="Retro Sync" width={44} height={44} className="h-11 w-11 rounded-2xl shadow-lg shadow-black/15" />
          <span>
            <span className="block text-lg font-black leading-5">Retro Sync</span>
            <span className="block text-xs font-semibold text-white/55">Cockpit de liderança</span>
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[2rem] border border-white/14 bg-white/10 p-2 shadow-2xl shadow-black/20 backdrop-blur-2xl"
        >
          <div className="rounded-[1.6rem] bg-white p-6 text-[var(--retro-ink)] shadow-2xl shadow-black/10 sm:p-8">
            <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--retro-wine)]">
              <Lock size={13} />
              Acesso restrito
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Entrar no cockpit</h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">Use suas credenciais para continuar.</p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Usuário</span>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition focus-within:border-[var(--retro-wine)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--retro-wine-tint)]">
                  <User size={16} className="shrink-0 text-zinc-400" />
                  <input
                    autoFocus
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    placeholder="seu.usuario"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">Senha</span>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition focus-within:border-[var(--retro-wine)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--retro-wine-tint)]">
                  <Lock size={16} className="shrink-0 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword(value => !value)}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--retro-wine)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(135,0,47,0.18)] transition hover:bg-[var(--retro-wine-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={17} />
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-6 text-center text-xs font-semibold text-white/50">
          Acesso restrito à liderança. Fale com a Joana se precisar de credenciais.
        </p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
