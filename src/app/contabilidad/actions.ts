'use server'

import { revalidatePath } from 'next/cache'
import { restRpc } from '@/lib/db'
import { obtenerSesion } from '@/lib/auth'

export async function cargarTasa(fecha: string, tasa: number) {
  if (!fecha) return { error: 'Indica la fecha de la tasa.' }
  if (!tasa || tasa <= 0) return { error: 'La tasa debe ser mayor que cero.' }
  const sesion = await obtenerSesion()
  if (!sesion) return { error: 'Tu sesión expiró: vuelve a iniciar sesión.' }

  const r = await restRpc('cargar_tasa_bcv', { p_fecha: fecha, p_tasa: tasa })
  if (r.error) return { error: r.error }
  revalidatePath('/contabilidad')
  return { ok: true }
}

export interface LineaAsiento {
  cuenta: string
  partida: string
  debe: number
  haber: number
}

export async function registrarAsientoManual(input: {
  centro_salud_id: string
  concepto: string
  momento: string
  modulo: string
  lineas: LineaAsiento[]
}) {
  if (!input.centro_salud_id) return { error: 'Selecciona el centro de salud.' }
  if (!input.concepto.trim()) return { error: 'Escribe el concepto del comprobante.' }
  const conMonto = input.lineas.filter((l) => (l.debe > 0 || l.haber > 0) && l.cuenta)
  if (conMonto.length < 2) return { error: 'Necesitas al menos dos líneas con cuenta y monto.' }

  const sesion = await obtenerSesion()
  if (!sesion) return { error: 'Tu sesión expiró: vuelve a iniciar sesión.' }

  const r = await restRpc<string | null>('registrar_asiento_manual', {
    p_centro: input.centro_salud_id,
    p_concepto: input.concepto.trim(),
    p_momento: input.momento,
    p_modulo: input.modulo,
    p_lineas: conMonto.map((l) => ({
      cuenta: l.cuenta,
      partida: l.partida || null,
      debe: l.debe || 0,
      haber: l.haber || 0,
    })),
    p_usuario: sesion.id,
  })
  if (r.error) return { error: r.error }
  revalidatePath('/contabilidad')
  return { ok: true }
}
