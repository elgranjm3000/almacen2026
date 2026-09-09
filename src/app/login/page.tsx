'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { iniciarSesion } from '@/lib/auth'

const inputCls =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<'propia' | 'demo' | null>(null)

  async function entrar(email: string, password: string, via: 'propia' | 'demo') {
    setEnviando(via)
    setError(null)
    const err = await iniciarSesion(email, password)
    if (err) {
      setError(err)
      setEnviando(null)
    } else {
      router.replace('/')
      router.refresh()
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await entrar(String(fd.get('email')), String(fd.get('password')), 'propia')
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-[26px] font-600 tracking-tight">SIFAR</h1>
        <p className="text-[13px] text-ink-soft">Sistema Integrado de Farmacia Militar</p>
        <p className="mt-1 text-[14px] text-ink-soft">
          Inicia sesión para gestionar el inventario y las dispensaciones.
        </p>

        <form onSubmit={onSubmit} className="mt-8 rounded-lg border border-line bg-surface p-6">
          <label className="block text-[13px] text-ink-soft">
            Correo
            <input name="email" type="email" required autoComplete="email" className={`mt-1 ${inputCls}`} />
          </label>
          <label className="mt-4 block text-[13px] text-ink-soft">
            Contraseña
            <input name="password" type="password" required autoComplete="current-password" className={`mt-1 ${inputCls}`} />
          </label>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando !== null}
            className="mt-5 w-full rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white transition-colors hover:bg-accent-ink disabled:opacity-60"
          >
            {enviando === 'propia' ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => entrar('operador@almacen.local', 'Almacen2026!', 'demo')}
            disabled={enviando !== null}
            className="w-full rounded-md border border-ink/25 px-4 py-2 text-[13.5px] font-550 text-ink transition-colors hover:border-ink/50 hover:bg-ink/5 disabled:opacity-60"
          >
            {enviando === 'demo' ? 'Abriendo…' : 'Abrir cuenta demo'}
          </button>
          <p className="mt-2 text-center text-[12px] text-ink-soft">
            Entra como farmacéutico, con datos de ejemplo, sin registrarte.
          </p>
        </div>
      </div>
    </div>
  )
}
