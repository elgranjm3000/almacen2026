// Acceso a datos vía Supabase REST (PostgREST).
// Se usa la secret key solo del lado del servidor: las tablas no tienen
// GRANT para el rol anon, así que la publishable key no basta para leer.

const URL = process.env.SUPABASE_URL!
const SECRET = process.env.SUPABASE_SECRET_KEY!

if (!URL || !SECRET) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el entorno')
}

export interface QueryOpts {
  select?: string
  order?: string
  ascending?: boolean
  limit?: number
  filters?: Record<string, string>
}

export async function restGet<T = Record<string, unknown>>(
  resource: string,
  opts: QueryOpts = {},
): Promise<T[]> {
  const params = new URLSearchParams()
  if (opts.select) params.set('select', opts.select)
  if (opts.order) {
    params.set('order', `${opts.order}.${opts.ascending === false ? 'desc' : 'asc'}`)
  }
  if (opts.limit) params.set('limit', String(opts.limit))
  for (const [k, v] of Object.entries(opts.filters ?? {})) params.set(k, v)

  const res = await fetch(`${URL}/rest/v1/${resource}?${params}`, {
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`REST ${resource}: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

export async function restInsert<T = Record<string, unknown>>(
  resource: string,
  body: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {  const res = await fetch(`${URL}/rest/v1/${resource}`, {
    method: 'POST',
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`REST insert ${resource}: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

// Llama una función RPC de Postgres. Devuelve { error } con el mensaje de la
// base si la función hace raise exception.
export async function restRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  })
  if (!res.ok) {
    let msg = `${res.status}`
    try {
      msg = (await res.json()).message ?? msg
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    return { error: msg }
  }
  const text = await res.text()
  return { data: text ? (JSON.parse(text) as T) : undefined }
}
