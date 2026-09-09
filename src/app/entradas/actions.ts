'use server'

import { revalidatePath } from 'next/cache'
import { restRpc } from '@/lib/db'
import { obtenerSesion } from '@/lib/auth'

export interface EntradaInput {
  centro_salud_id: string
  insumo_id: string
  numero_lote: string
  fecha_vencimiento: string
  cantidad: number
  stock_minimo: number
  observaciones: string
}

export async function registrarEntrada(input: EntradaInput) {
  if (!input.centro_salud_id) return { error: 'Selecciona el centro de salud.' }
  if (!input.insumo_id) return { error: 'Selecciona el insumo del catálogo.' }
  if (!input.numero_lote.trim()) return { error: 'Escribe el número de lote del fabricante.' }
  if (!input.fecha_vencimiento) return { error: 'Indica la fecha de vencimiento del lote.' }
  if (!input.cantidad || input.cantidad <= 0)
    return { error: 'La cantidad recibida debe ser mayor que cero.' }

  const sesion = await obtenerSesion()
  if (!sesion) return { error: 'Tu sesión expiró: vuelve a iniciar sesión.' }

  const r = await restRpc<string | null>('registrar_entrada', {
    p_centro: input.centro_salud_id,
    p_insumo: input.insumo_id,
    p_numero_lote: input.numero_lote.trim(),
    p_vencimiento: input.fecha_vencimiento,
    p_cantidad: input.cantidad,
    p_minimo: input.stock_minimo || null,
    p_usuario: sesion.id,
    p_observaciones: input.observaciones.trim() || null,
  })
  if (r.error) return { error: r.error }

  revalidatePath('/inventario')
  revalidatePath('/entradas')
  revalidatePath('/movimientos')
  revalidatePath('/')
  return { ok: true }
}
