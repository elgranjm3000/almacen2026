import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-line px-4 pt-6 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 md:px-8 md:pt-8 md:pb-6">
      <div>
        <h1 className="font-display text-[22px] md:text-[26px] font-600 tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-[14px] text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Metric({
  value,
  label,
  tone,
}: {
  value: ReactNode
  label: string
  tone?: 'ok' | 'warn' | 'danger'
}) {
  const color =
    tone === 'danger'
      ? 'text-danger'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'ok'
          ? 'text-ok'
          : ''
  return (
    <div className="border-b-2 border-ink pb-3">
      <div className={`font-display text-[34px] font-600 leading-none tabular-nums tracking-tight ${color}`}>
        {value}
      </div>
      <div className="mt-2 text-[13px] text-ink-soft">{label}</div>
    </div>
  )
}

// Etiqueta de estado de un lote según stock y vencimiento
export type EstadoAlerta = 'VENCIDO' | 'CRITICO' | 'BAJO' | 'OK'

export function estadoLote(cantidad: number, stockMinimo: number, vence: string): EstadoAlerta {
  const hoy = new Date()
  const dias = Math.ceil((new Date(vence).getTime() - hoy.getTime()) / 86400000)
  if (dias < 0) return 'VENCIDO'
  if (dias <= 30 || cantidad === 0) return 'CRITICO'
  if (cantidad < stockMinimo) return 'BAJO'
  return 'OK'
}

const estilos: Record<EstadoAlerta, string> = {
  VENCIDO: 'bg-danger/10 text-danger',
  CRITICO: 'bg-warn/15 text-warn',
  BAJO: 'bg-warn/10 text-warn',
  OK: 'bg-ok/10 text-ok',
}

export function Badge({ estado }: { estado: EstadoAlerta }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[12px] font-550 ${estilos[estado]}`}>
      {estado}
    </span>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-[17px] font-600 tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
