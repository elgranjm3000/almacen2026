'use client'

import { useState } from 'react'
import { registrarEntrada } from './actions'

const inputCls =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none'

export default function EntradaForm({
  centros,
  insumos,
}: {
  centros: { id: string; label: string }[]
  insumos: { id: string; label: string }[]
}) {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'exito'>('listo')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('enviando')
    setError(null)
    const fd = new FormData(e.currentTarget)
    const r = await registrarEntrada({
      centro_salud_id: String(fd.get('centro_salud_id')),
      insumo_id: String(fd.get('insumo_id')),
      numero_lote: String(fd.get('numero_lote')),
      fecha_vencimiento: String(fd.get('fecha_vencimiento')),
      cantidad: Number(fd.get('cantidad')),
      stock_minimo: Number(fd.get('stock_minimo')),
      observaciones: String(fd.get('observaciones')),
    })
    if (r.error) {
      setError(r.error)
      setEstado('listo')
    } else {
      setEstado('exito')
    }
  }

  if (estado === 'exito') {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <p className="font-display text-[16px] font-600">Entrada registrada</p>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          El lote sumó existencias en el centro y quedó asentado en movimientos.
        </p>
        <button
          onClick={() => setEstado('listo')}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white hover:bg-accent-ink"
        >
          Registrar otra entrada
        </button>
      </div>
    )
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
          Insumo
          <select name="insumo_id" required className={`mt-1 ${inputCls}`}>
            <option value="">Selecciona un insumo</option>
            {insumos.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </label>
        <label className="block text-[13px] text-ink-soft">
          Número de lote del fabricante
          <input name="numero_lote" required placeholder="PCM-2601" className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft">
          Fecha de vencimiento
          <input name="fecha_vencimiento" type="date" required className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft">
          Cantidad recibida
          <input name="cantidad" type="number" min={1} required className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft">
          Stock mínimo de alerta
          <input name="stock_minimo" type="number" min={0} placeholder="50" className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft sm:col-span-2">
          Observaciones (opcional)
          <input name="observaciones" placeholder="Compra nacional, donación, traslado…" className={`mt-1 ${inputCls}`} />
        </label>
      </div>
      <p className="mt-4 text-[13px] text-ink-soft">
        Si el lote ya existe en el centro, la cantidad se suma a las existencias actuales.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="mt-5 rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white transition-colors hover:bg-accent-ink disabled:opacity-60"
      >
        {estado === 'enviando' ? 'Registrando…' : 'Registrar entrada'}
      </button>
    </form>
  )
}
