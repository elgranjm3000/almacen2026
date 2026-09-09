'use server'

import { revalidatePath } from 'next/cache'
import { restRpc } from '@/lib/db'
import { obtenerSesion } from '@/lib/auth'

export interface DispensacionInput {
  centro_salud_id: string
  afiliado_id: string
  lote_id: string
  cantidad_entregada: number
  medico_prescribe: string
  numero_recipe: string
}

export async function registrarDispensacion(input: DispensacionInput) {
  if (!input.centro_salud_id) return { error: 'Selecciona el centro de salud.' }
  if (!input.afiliado_id) return { error: 'Selecciona el afiliado que recibe el insumo.' }
  if (!input.lote_id) return { error: 'Selecciona el lote del que se descuenta.' }
  if (!input.cantidad_entregada || input.cantidad_entregada <= 0)
    return { error: 'La cantidad entregada debe ser mayor que cero.' }
  if (!input.medico_prescribe.trim()) return { error: 'Escribe el nombre del médico que prescribe.' }

  const sesion = await obtenerSesion()
  if (!sesion) return { error: 'Tu sesión expiró: vuelve a iniciar sesión.' }

  const r = await restRpc<string | null>('registrar_dispensacion', {
    p_centro: input.centro_salud_id,
    p_afiliado: input.afiliado_id,
    p_lote: input.lote_id,
    p_cantidad: input.cantidad_entregada,
    p_medico: input.medico_prescribe.trim(),
    p_recipe: input.numero_recipe.trim(),
    p_usuario: sesion.id,
  })
  if (r.error) return { error: r.error }

  revalidatePath('/dispensaciones')
  revalidatePath('/inventario')
  revalidatePath('/')
  return { ok: true }
}
