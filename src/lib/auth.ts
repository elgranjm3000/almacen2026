'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const URL = process.env.SUPABASE_URL!
const KEY = process.env.SUPABASE_SECRET_KEY!
const COOKIE = 'almacen_sesion'

export interface Sesion {
  id: string
  email: string
  nombre: string
  rol: string
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  const { access_token: token } = JSON.parse(raw)
  const res = await fetch(`${URL}/auth/v1/user`, {
    headers: { apikey: KEY, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null // token vencido o inválido
  const user = await res.json()
  const perfil = await fetch(
    `${URL}/rest/v1/perfiles_usuarios?select=nombre_completo,rol&id=eq.${user.id}`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' },
  ).then((r) => r.json() as Promise<{ nombre_completo: string; rol: string }[]>)
  return {
    id: user.id,
    email: user.email,
    nombre: perfil[0]?.nombre_completo ?? user.email,
    rol: perfil[0]?.rol ?? '',
  }
}

export async function iniciarSesion(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })
  if (!res.ok) return 'Correo o contraseña incorrectos.'
  const { access_token } = await res.json()
  ;(await cookies()).set(COOKIE, JSON.stringify({ access_token }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return null
}

export async function cerrarSesion() {
  ;(await cookies()).delete(COOKIE)
  redirect('/login')
}
