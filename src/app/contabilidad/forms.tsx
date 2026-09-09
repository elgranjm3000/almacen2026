'use client'

import { useState } from 'react'
import { cargarTasa, registrarAsientoManual, type LineaAsiento } from './actions'

const inputCls =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none'

export function TasaForm() {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'exito'>('listo')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('enviando')
    setError(null)
    const fd = new FormData(e.currentTarget)
    const r = await cargarTasa(String(fd.get('fecha')), Number(fd.get('tasa')))
    if (r.error) {
      setError(r.error)
      setEstado('listo')
    } else {
      setEstado('exito')
      e.currentTarget.reset()
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-[13px] text-ink-soft">
          Fecha de la tasa
          <input name="fecha" type="date" required max={new Date().toISOString().slice(0, 10)} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft">
          Bs. por USD
          <input name="tasa" type="number" min={0.01} step="0.0001" required placeholder="820,10" className={`mt-1 ${inputCls}`} />
        </label>
        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white hover:bg-accent-ink disabled:opacity-60"
        >
          {estado === 'enviando' ? 'Guardando…' : 'Cargar tasa'}
        </button>
      </div>
      <p className="mt-3 text-[13px] text-ink-soft">
        Si ya existe una tasa para esa fecha, se reemplaza. Los nuevos movimientos usan la más reciente.
      </p>
      {estado === 'exito' && (
        <p className="mt-3 rounded-md bg-ok/10 px-3 py-2 text-[13.5px] text-ok">Tasa guardada.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

interface Fila extends LineaAsiento {
  id: number
}

export function AsientoManualForm({
  centros,
  cuentas,
  partidas,
}: {
  centros: { id: string; label: string }[]
  cuentas: { codigo: string; label: string }[]
  partidas: { id: string; label: string }[]
}) {
  const [filas, setFilas] = useState<Fila[]>([
    { id: 1, cuenta: '', partida: '', debe: 0, haber: 0 },
    { id: 2, cuenta: '', partida: '', debe: 0, haber: 0 },
  ])
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'exito'>('listo')
  const [error, setError] = useState<string | null>(null)

  const totalDebe = filas.reduce((a, f) => a + (f.debe || 0), 0)
  const totalHaber = filas.reduce((a, f) => a + (f.haber || 0), 0)
  const balanceado = totalDebe > 0 && Math.abs(totalDebe - totalHaber) < 0.01

  function actualizar(id: number, campo: keyof LineaAsiento, valor: string | number) {
    setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('enviando')
    setError(null)
    const fd = new FormData(e.currentTarget)
    const r = await registrarAsientoManual({
      centro_salud_id: String(fd.get('centro_salud_id')),
      concepto: String(fd.get('concepto')),
      momento: String(fd.get('momento')),
      modulo: String(fd.get('modulo')),
      lineas: filas,
    })
    if (r.error) {
      setError(r.error)
      setEstado('listo')
    } else {
      setEstado('exito')
      setFilas([
        { id: 1, cuenta: '', partida: '', debe: 0, haber: 0 },
        { id: 2, cuenta: '', partida: '', debe: 0, haber: 0 },
      ])
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[13px] text-ink-soft">
          Centro de salud
          <select name="centro_salud_id" required className={`mt-1 ${inputCls}`}>
            <option value="">Selecciona un centro</option>
            {centros.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="block text-[13px] text-ink-soft">
          Tipo de comprobante
          <select name="modulo" defaultValue="AJUSTE" className={`mt-1 ${inputCls}`}>
            <option value="AJUSTE">Ajuste</option>
            <option value="COMPRA">Compra directa</option>
          </select>
        </label>
        <label className="block text-[13px] text-ink-soft sm:col-span-2">
          Concepto
          <input name="concepto" required placeholder="Ajuste de inventario por conteo físico…" className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft">
          Momento presupuestario
          <select name="momento" defaultValue="EJECUCION_DIRECTA" className={`mt-1 ${inputCls}`}>
            <option value="COMPROMISO">Compromiso</option>
            <option value="CAUSADO">Causado</option>
            <option value="PAGADO">Pagado</option>
            <option value="EJECUCION_DIRECTA">Ejecución directa</option>
          </select>
        </label>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Partida ONAPRE</th>
              <th className="text-right">Debe (Bs.)</th>
              <th className="text-right">Haber (Bs.)</th>
              <th aria-label="Quitar" />
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                <td className="p-0 pt-2 align-top">
                  <select value={f.cuenta} onChange={(e) => actualizar(f.id, 'cuenta', e.target.value)} className={inputCls}>
                    <option value="">Selecciona…</option>
                    {cuentas.map((c) => <option key={c.codigo} value={c.codigo}>{c.label}</option>)}
                  </select>
                </td>
                <td className="p-0 pt-2 align-top">
                  <select value={f.partida} onChange={(e) => actualizar(f.id, 'partida', e.target.value)} className={inputCls}>
                    <option value="">Opcional</option>
                    {partidas.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </td>
                <td className="p-0 pt-2 align-top">
                  <input type="number" min={0} step="0.01" value={f.debe || ''} onChange={(e) => actualizar(f.id, 'debe', Number(e.target.value))} className={`${inputCls} text-right`} />
                </td>
                <td className="p-0 pt-2 align-top">
                  <input type="number" min={0} step="0.01" value={f.haber || ''} onChange={(e) => actualizar(f.id, 'haber', Number(e.target.value))} className={`${inputCls} text-right`} />
                </td>
                <td className="pt-2 align-top">
                  {filas.length > 2 && (
                    <button
                      type="button"
                      aria-label="Quitar línea"
                      onClick={() => setFilas((fs) => fs.filter((x) => x.id !== f.id))}
                      className="rounded-md p-2 text-ink-soft hover:bg-ink-soft/10 hover:text-danger"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFilas((fs) => [...fs, { id: Math.max(...fs.map((f) => f.id)) + 1, cuenta: '', partida: '', debe: 0, haber: 0 }])}
          className="rounded-md border border-line px-3 py-1.5 text-[13px] font-550 text-ink hover:border-ink/40"
        >
          Agregar línea
        </button>
        <div className="text-[13.5px] tabular-nums">
          <span className="text-ink-soft">Debe </span>
          <span className="font-550">{totalDebe.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          <span className="mx-3 text-ink-soft">Haber </span>
          <span className="font-550">{totalHaber.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
          <span className={`ml-3 rounded px-2 py-0.5 text-[12px] font-550 ${balanceado ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
            {balanceado ? 'Balanceado' : 'Sin balancear'}
          </span>
        </div>
      </div>

      {estado === 'exito' && (
        <p className="mt-4 rounded-md bg-ok/10 px-3 py-2 text-[13.5px] text-ok">Comprobante registrado.</p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="mt-5 rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white hover:bg-accent-ink disabled:opacity-60"
      >
        {estado === 'enviando' ? 'Registrando…' : 'Registrar comprobante'}
      </button>
    </form>
  )
}
