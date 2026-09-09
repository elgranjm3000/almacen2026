'use client'

import { useState } from 'react'
import { registrarDispensacion } from './actions'

interface Opcion {
  id: string
  label: string
}

const inputCls =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none'

export default function DispensacionForm({
  centros,
  afiliados,
  lotes,
}: {
  centros: Opcion[]
  afiliados: Opcion[]
  lotes: { id: string; label: string; centroId: string }[]
}) {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'exito'>('listo')
  const [error, setError] = useState<string | null>(null)
  const [centro, setCentro] = useState('')
  const [lote, setLote] = useState('')

  const lotesFiltrados = lotes.filter((l) => !centro || l.centroId === centro)

  async function onSubmit(fd: FormData) {
    setEstado('enviando')
    setError(null)
    const r = await registrarDispensacion({
      centro_salud_id: String(fd.get('centro_salud_id') ?? ''),
      afiliado_id: String(fd.get('afiliado_id') ?? ''),
      lote_id: String(fd.get('lote_id') ?? ''),
      cantidad_entregada: Number(fd.get('cantidad_entregada')),
      medico_prescribe: String(fd.get('medico_prescribe') ?? ''),
      numero_recipe: String(fd.get('numero_recipe') ?? ''),
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
        <p className="font-display text-[16px] font-600">Dispensación registrada</p>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          El lote se descontó del inventario y la entrega quedó en el historial.
        </p>
        <button
          onClick={() => { setEstado('listo'); setLote('') }}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white hover:bg-accent-ink"
        >
          Registrar otra
        </button>
      </div>
    )
  }

  return (
    <form action={onSubmit} className="rounded-lg border border-line bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[13px] text-ink-soft">
          Centro de salud
          <select
            name="centro_salud_id"
            required
            value={centro}
            onChange={(e) => { setCentro(e.target.value); setLote('') }}
            className={`mt-1 ${inputCls}`}
          >
            <option value="">Selecciona un centro</option>
            {centros.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="block text-[13px] text-ink-soft">
          Afiliado que recibe
          <select name="afiliado_id" className={`mt-1 ${inputCls}`}>
            <option value="">Selecciona un afiliado</option>
            {afiliados.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        <label className="block text-[13px] text-ink-soft sm:col-span-2">
          Lote (solo lotes con existencias)
          <select
            name="lote_id"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            className={`mt-1 ${inputCls}`}
          >
            <option value="">Selecciona un lote</option>
            {lotesFiltrados.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <label className="block text-[13px] text-ink-soft">
          Cantidad entregada
          <input name="cantidad_entregada" type="number" min={1} required className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft">
          Número de receta (opcional)
          <input name="numero_recipe" placeholder="R-2026-00001" className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block text-[13px] text-ink-soft sm:col-span-2">
          Médico que prescribe
          <input name="medico_prescribe" required placeholder="Dra. …" className={`mt-1 ${inputCls}`} />
        </label>
      </div>
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
        {estado === 'enviando' ? 'Registrando…' : 'Registrar dispensación'}
      </button>
    </form>
  )
}
