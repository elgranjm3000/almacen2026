'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const pestanas = [
  { href: '/contabilidad', label: 'Resumen', exact: true },
  { href: '/contabilidad/tasa', label: 'Tasa BCV' },
  { href: '/contabilidad/comprobante', label: 'Comprobante manual' },
  { href: '/contabilidad/mayor', label: 'Libro mayor' },
]

export default function TabNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-line px-4 md:px-8" aria-label="Secciones de contabilidad">
      <ul className="flex gap-1 overflow-x-auto">
        {pestanas.map((p) => {
          const activa = p.exact ? pathname === p.href : pathname.startsWith(p.href)
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={activa ? 'page' : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13.5px] transition-colors ${
                  activa
                    ? 'border-accent font-550 text-ink'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {p.label}
              </Link>
            </li>
          )
        })}
        <li className="ml-auto">
          <Link
            href="/contabilidad/reportes"
            className="block whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-[13.5px] text-accent hover:underline"
          >
            Reportes PDF
          </Link>
        </li>
      </ul>
    </nav>
  )
}
