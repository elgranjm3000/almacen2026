'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cerrarSesion } from '@/lib/auth'

const modulos = [
  { href: '/', label: 'Panel' },
  { href: '/inventario', label: 'Inventario' },
  { href: '/entradas', label: 'Ingresos' },
  { href: '/dispensaciones', label: 'Dispensaciones' },
  { href: '/movimientos', label: 'Movimientos' },
  { href: '/afiliados', label: 'Afiliados' },
  { href: '/insumos', label: 'Catálogo' },
  { href: '/centros', label: 'Centros de salud' },
  { href: '/contabilidad', label: 'Contabilidad' },
]

function Marca() {
  return (
    <Link href="/" className="block px-6 pt-7 pb-6">
      <span className="font-display text-[19px] font-600 leading-tight tracking-tight text-white">
        Almacén
      </span>
      <span className="mt-0.5 block text-[12px] text-white/55">
        DIGESALUD · Dirección de Salud Militar
      </span>
    </Link>
  )
}

export default function Nav({
  sesion,
}: {
  sesion: { nombre: string; rol: string } | null
}) {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)

  const enlaces = modulos.map((m) => {
    const activo = pathname === m.href
    return (
      <Link
        key={m.href}
        href={m.href}
        onClick={() => setAbierto(false)}
        className={`block rounded-md px-3 py-2 text-[14px] transition-colors ${
          activo ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
        }`}
      >
        {m.label}
      </Link>
    )
  })

  const pie = sesion && (
    <div className="border-t border-white/10 px-6 pb-6 pt-4">
      <p className="text-[13px] font-550 text-white">{sesion.nombre}</p>
      <p className="text-[11.5px] text-white/50">{sesion.rol}</p>
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="mt-3 rounded-md border border-white/25 px-3 py-1.5 text-[12.5px] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ink text-white/85 md:flex">
        <Marca />
        <nav className="flex-1 px-3">
          <ul>{enlaces.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </nav>
        {pie}
      </aside>

      {/* Móvil: cabecera con menú desplegable */}
      <header className="sticky top-0 z-20 bg-ink text-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-[17px] font-600 tracking-tight">
            Almacén
          </Link>
          <button
            aria-expanded={abierto}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto(!abierto)}
            className="rounded-md p-2 text-white/85 hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              {abierto ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
        {abierto && (
          <div className="max-h-[calc(100dvh-56px)] overflow-y-auto pb-2">
            <nav className="px-3">{enlaces}</nav>
            {pie}
          </div>
        )}
      </header>
    </>
  )
}
