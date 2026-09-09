// Seed de datos de ejemplo para el almacén. Ejecutar: node scripts/seed.mjs
// Requiere SUPABASE_URL y SUPABASE_SECRET_KEY en el entorno (o en .env.local)
import { readFileSync } from 'node:fs'
function envVar(k) {
  if (process.env[k]) return process.env[k]
  const f = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  return f.match(new RegExp('^' + k + '=(.*)$', 'm'))?.[1]
}
const BASE = envVar('SUPABASE_URL')
const KEY = envVar('SUPABASE_SECRET_KEY')
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

async function clean() {
  for (const r of ['movimientos_inventario', 'dispensaciones', 'lotes_inventario', 'afiliados_pacientes', 'perfiles_usuarios', 'catalogos_insumos', 'centros_salud']) {
    const res = await fetch(`${BASE}/rest/v1/${r}?id=neq.00000000-0000-0000-0000-000000000000`, { method: 'DELETE', headers: H })
    if (!res.ok) throw new Error(`clean ${r}: ${res.status} ${await res.text()}`)
  }
}
await clean()

async function insert(resource, rows) {
  const res = await fetch(`${BASE}/rest/v1/${resource}`, { method: 'POST', headers: H, body: JSON.stringify(rows) })
  if (!res.ok) throw new Error(`${resource}: ${res.status} ${await res.text()}`)
  return res.json()
}

const centros = await insert('centros_salud', [
  { nombre: 'Hospital Militar Dr. Vicente Salias', codigo_centro: 'HMD-001', estado: 'Distrito Capital', direccion: 'Av. Los Ilustres, Santa Mónica, Caracas' },
  { nombre: 'Ambulatorio MD La Carlota', codigo_centro: 'AML-002', estado: 'Distrito Capital', direccion: 'Base Aérea La Carlota, Chacao' },
  { nombre: 'CDI Guatire - Componente Terrestre', codigo_centro: 'CDI-003', estado: 'Miranda', direccion: 'Calle Bolívar, Guatire' },
  { nombre: 'Hospital Naval de Puerto Cabello', codigo_centro: 'HNP-004', estado: 'Carabobo', direccion: 'Av. Bermúdez, Puerto Cabello' },
])

const insumos = await insert('catalogos_insumos', [
  { codigo_sku: 'MED-0001', nombre_generico: 'Paracetamol', presentacion: 'Tabletas 500 mg x 100', categoria: 'MEDICAMENTO', requiere_recipe: false },
  { codigo_sku: 'MED-0002', nombre_generico: 'Ibuprofeno', presentacion: 'Tabletas 400 mg x 100', categoria: 'MEDICAMENTO', requiere_recipe: false },
  { codigo_sku: 'MED-0003', nombre_generico: 'Amoxicilina', presentacion: 'Cápsulas 500 mg x 50', categoria: 'MEDICAMENTO', requiere_recipe: true },
  { codigo_sku: 'MED-0004', nombre_generico: 'Losartán', presentacion: 'Tabletas 50 mg x 30', categoria: 'MEDICAMENTO', requiere_recipe: true },
  { codigo_sku: 'MED-0005', nombre_generico: 'Metformina', presentacion: 'Tabletas 850 mg x 30', categoria: 'MEDICAMENTO', requiere_recipe: true },
  { codigo_sku: 'INS-0001', nombre_generico: 'Jeringa desechable 5 ml', presentacion: 'Caja x 100 unidades', categoria: 'MATERIAL_QUIRURGICO', requiere_recipe: false },
  { codigo_sku: 'INS-0002', nombre_generico: 'Guantes de nitrilo talla M', presentacion: 'Caja x 100 unidades', categoria: 'MATERIAL_QUIRURGICO', requiere_recipe: false },
  { codigo_sku: 'INS-0003', nombre_generico: 'Solución salina 0.9%', presentacion: 'Bolsa 500 ml', categoria: 'MATERIAL_QUIRURGICO', requiere_recipe: false },
  { codigo_sku: 'INS-0004', nombre_generico: 'Alcohol antiséptico', presentacion: 'Frasco 1 L', categoria: 'MATERIAL_QUIRURGICO', requiere_recipe: false },
])

function fecha(dias) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

const bySku = Object.fromEntries(insumos.map((i) => [i.codigo_sku, i]))
const lotes = await insert('lotes_inventario', [
  { centro_salud_id: centros[0].id, insumo_id: bySku['MED-0001'].id, numero_lote: 'PCM-2411', fecha_vencimiento: fecha(420), cantidad_actual: 860, stock_minimo_alerta: 200 },
  { centro_salud_id: centros[0].id, insumo_id: bySku['MED-0003'].id, numero_lote: 'AMX-2502', fecha_vencimiento: fecha(30), cantidad_actual: 40, stock_minimo_alerta: 100 },
  { centro_salud_id: centros[0].id, insumo_id: bySku['INS-0001'].id, numero_lote: 'JER-2508', fecha_vencimiento: fecha(600), cantidad_actual: 1500, stock_minimo_alerta: 300 },
  { centro_salud_id: centros[0].id, insumo_id: bySku['INS-0003'].id, numero_lote: 'SSN-2504', fecha_vencimiento: fecha(15), cantidad_actual: 120, stock_minimo_alerta: 80 },
  { centro_salud_id: centros[1].id, insumo_id: bySku['MED-0004'].id, numero_lote: 'LOS-2501', fecha_vencimiento: fecha(250), cantidad_actual: 65, stock_minimo_alerta: 100 },
  { centro_salud_id: centros[1].id, insumo_id: bySku['MED-0002'].id, numero_lote: 'IBU-2412', fecha_vencimiento: fecha(-10), cantidad_actual: 210, stock_minimo_alerta: 100 },
  { centro_salud_id: centros[2].id, insumo_id: bySku['MED-0005'].id, numero_lote: 'MET-2503', fecha_vencimiento: fecha(330), cantidad_actual: 480, stock_minimo_alerta: 150 },
  { centro_salud_id: centros[2].id, insumo_id: bySku['INS-0002'].id, numero_lote: 'GUA-2506', fecha_vencimiento: fecha(500), cantidad_actual: 95, stock_minimo_alerta: 200 },
  { centro_salud_id: centros[3].id, insumo_id: bySku['MED-0001'].id, numero_lote: 'PCM-2505', fecha_vencimiento: fecha(380), cantidad_actual: 320, stock_minimo_alerta: 150 },
  { centro_salud_id: centros[3].id, insumo_id: bySku['INS-0004'].id, numero_lote: 'ALC-2507', fecha_vencimiento: fecha(540), cantidad_actual: 40, stock_minimo_alerta: 60 },
])

// perfiles_usuarios.id tiene FK a auth.users → resolver usuarios vía Admin API
async function listarUsuarios() {
  const res = await fetch(`${BASE}/auth/v1/admin/users?page=1&per_page=50`, { headers: H })
  if (!res.ok) throw new Error(`auth list: ${res.status} ${await res.text()}`)
  const j = await res.json()
  return j.users ?? []
}

async function crearUsuario(email, nombre, cedula) {
  const existentes = await listarUsuarios()
  const ya = existentes.find((u) => u.email === email)
  if (ya) return ya.id
  const res = await fetch(`${BASE}/auth/v1/admin/users`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email, password: 'Almacen2026!', email_confirm: true, user_metadata: { nombre_completo: nombre, cedula } }),
  })
  if (!res.ok) throw new Error(`auth user ${email}: ${res.status} ${await res.text()}`)
  const u = await res.json()
  return u.id
}


const usuarios = []
for (const [email, nombre, cedula, rol, ci] of [
  ['operador@almacen.local', 'Ana Gabriela Duarte', '11222333', 'FARMACEUTICO', 0],
  ['farmaceuta@almacen.local', 'Jorge Luis Contreras', '14444555', 'MEDICO', 0],
  ['supervisor@almacen.local', 'Elena Margarita Vizcaya', '16666777', 'ADMIN_HOSPITAL', 0],
]) {
  const id = await crearUsuario(email, nombre, cedula)
  usuarios.push({ id, email, nombre, cedula, rol, centro: centros[ci].id })
}
await insert('perfiles_usuarios', usuarios.map((u) => ({ id: u.id, cedula: u.cedula, nombre_completo: u.nombre, rol: u.rol, centro_salud_id: u.centro })))

const afiliados = await insert('afiliados_pacientes', [
  { cedula: '12873456', nombre_completo: 'Ramón Antonio Velásquez', componente_fanb: 'Ejército Bolivariano', parentesco: 'TITULAR', estatus: 'ACTIVO' },
  { cedula: '19345678', nombre_completo: 'Yulimar Concepción Rojas', componente_fanb: 'Milicia Bolivariana', parentesco: 'ESPOSO_A', estatus: 'ACTIVO' },
  { cedula: '22456789', nombre_completo: 'Luis Enrique Márquez', componente_fanb: 'Guardia Nacional', parentesco: 'TITULAR', estatus: 'ACTIVO' },
  { cedula: '14890123', nombre_completo: 'Carmen Luisa Herrera', componente_fanb: 'Aviación Militar', parentesco: 'TITULAR', estatus: 'ACTIVO' },
  { cedula: '26781234', nombre_completo: 'Andrés Sebastián Herrera', componente_fanb: 'Aviación Militar', parentesco: 'HIJO_A', estatus: 'ACTIVO' },
  { cedula: '17002984', nombre_completo: 'Diana Carolina Pinto', componente_fanb: 'Armada Bolivariana', parentesco: 'TITULAR', estatus: 'ACTIVO' },
  { cedula: '20567123', nombre_completo: 'Pedro Ramón Gutiérrez', componente_fanb: 'Ejército Bolivariano', parentesco: 'TITULAR', estatus: 'INACTIVO' },
  { cedula: '18234560', nombre_completo: 'María Alejandra Salazar', componente_fanb: 'Guardia Nacional', parentesco: 'ESPOSO_A', estatus: 'ACTIVO' },
])

const dispensaciones = await insert('dispensaciones', [
  { centro_salud_id: centros[0].id, afiliado_id: afiliados[0].id, lote_id: lotes[0].id, cantidad_entregada: 30, medico_prescribe: 'Dra. G. Ochoa', numero_recipe: 'R-2025-00114', dispensado_por: usuarios[0].id },
  { centro_salud_id: centros[0].id, afiliado_id: afiliados[1].id, lote_id: lotes[1].id, cantidad_entregada: 21, medico_prescribe: 'Dr. R. Padilla', numero_recipe: 'R-2025-00115', dispensado_por: usuarios[0].id },
  { centro_salud_id: centros[0].id, afiliado_id: afiliados[3].id, lote_id: lotes[3].id, cantidad_entregada: 4, medico_prescribe: 'Dra. G. Ochoa', numero_recipe: 'R-2025-00116', dispensado_por: usuarios[0].id },
  { centro_salud_id: centros[1].id, afiliado_id: afiliados[2].id, lote_id: lotes[4].id, cantidad_entregada: 30, medico_prescribe: 'Dr. J. Fuentes', numero_recipe: 'R-2025-00117', dispensado_por: usuarios[1].id },
  { centro_salud_id: centros[2].id, afiliado_id: afiliados[5].id, lote_id: lotes[6].id, cantidad_entregada: 60, medico_prescribe: 'Dra. M. Rondón', numero_recipe: 'R-2025-00118', dispensado_por: usuarios[1].id },
  { centro_salud_id: centros[2].id, afiliado_id: afiliados[7].id, lote_id: lotes[7].id, cantidad_entregada: 10, medico_prescribe: 'Dra. M. Rondón', numero_recipe: 'R-2025-00119', dispensado_por: usuarios[1].id },
  { centro_salud_id: centros[3].id, afiliado_id: afiliados[4].id, lote_id: lotes[8].id, cantidad_entregada: 12, medico_prescribe: 'Dr. C. Bracho', numero_recipe: 'R-2025-00120', dispensado_por: usuarios[2].id },
])

await insert('movimientos_inventario', [
  { lote_id: lotes[0].id, tipo_movimiento: 'ENTRADA_ALMACEN', cantidad: 1000, referencia_id: null, usuario_id: usuarios[0].id, observaciones: 'Recepción compra nacional' },
  { lote_id: lotes[1].id, tipo_movimiento: 'ENTRADA_ALMACEN', cantidad: 61, referencia_id: null, usuario_id: usuarios[0].id, observaciones: 'Recepción donación OPS' },
  { lote_id: lotes[0].id, tipo_movimiento: 'DISPENSACION', cantidad: 140, referencia_id: dispensaciones[0].id, usuario_id: usuarios[0].id, observaciones: 'Despacho semanal' },
  { lote_id: lotes[1].id, tipo_movimiento: 'DISPENSACION', cantidad: 21, referencia_id: dispensaciones[1].id, usuario_id: usuarios[0].id, observaciones: 'Despacho semanal' },
  { lote_id: lotes[5].id, tipo_movimiento: 'AJUSTE_MERMA', cantidad: 5, referencia_id: null, usuario_id: usuarios[2].id, observaciones: 'Vencido — destrucción documentada' },
  { lote_id: lotes[6].id, tipo_movimiento: 'TRANSFERENCIA', cantidad: 540, referencia_id: null, usuario_id: usuarios[2].id, observaciones: 'Traslado desde almacén central' },
  { lote_id: lotes[6].id, tipo_movimiento: 'DISPENSACION', cantidad: 60, referencia_id: dispensaciones[4].id, usuario_id: usuarios[1].id, observaciones: null },
  { lote_id: lotes[8].id, tipo_movimiento: 'DISPENSACION', cantidad: 12, referencia_id: dispensaciones[6].id, usuario_id: usuarios[2].id, observaciones: null },
])

console.log('Seed listo:',
  centros.length, 'centros,', insumos.length, 'insumos,', lotes.length, 'lotes,',
  afiliados.length, 'afiliados,', dispensaciones.length, 'dispensaciones')
