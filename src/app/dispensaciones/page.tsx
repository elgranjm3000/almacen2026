import { restGet } from "@/lib/db";
import { PageHeader, Section } from "@/components/ui";
import DispensacionForm from "./form";

interface Dispensacion {
  id: string;
  cantidad_entregada: number;
  medico_prescribe: string;
  numero_recipe: string | null;
  created_at: string;
  afiliado: { nombre_completo: string; cedula: string } | null;
  lote: { numero_lote: string; insumo: { nombre_generico: string; codigo_sku: string } | null } | null;
  centro: { nombre: string } | null;
}

export default async function Dispensaciones() {
  const [dispensaciones, centros, afiliados, lotes] = await Promise.all([
    restGet<Dispensacion>("dispensaciones", {
      select:
        "*,afiliado:afiliado_id(nombre_completo,cedula),centro:centro_salud_id(nombre),lote:lote_id(numero_lote,insumo:insumo_id(nombre_generico,codigo_sku))",
      order: "created_at",
      ascending: false,
    }),
    restGet<{ id: string; nombre: string }>("centros_salud", { order: "nombre" }),
    restGet<{ id: string; nombre_completo: string; cedula: string }>("afiliados_pacientes", {
      filters: { estatus: "eq.ACTIVO" },
      order: "nombre_completo",
    }),
    restGet<{ id: string; cantidad_actual: number; numero_lote: string; centro_salud_id: string; insumo: { nombre_generico: string } | null }>(
      "lotes_inventario",
      {
        select: "id,cantidad_actual,numero_lote,centro_salud_id,insumo:insumo_id(nombre_generico)",
        filters: { cantidad_actual: "gt.0" },
        order: "numero_lote",
      },
    ),
  ]);

  return (
    <>
      <PageHeader
        title="Dispensaciones"
        subtitle="Entregas de insumos a afiliados. Cada registro descuenta la cantidad del lote correspondiente."
      />
      <div className="px-4 pb-16 md:px-8">
        <Section title="Registrar entrega">
          <DispensacionForm
            centros={centros.map((c) => ({ id: c.id, label: c.nombre }))}
            afiliados={afiliados.map((a) => ({ id: a.id, label: `${a.nombre_completo} — ${a.cedula}` }))}
            lotes={lotes.map((l) => ({
              id: l.id,
              centroId: l.centro_salud_id,
              label: `${l.insumo?.nombre_generico} · lote ${l.numero_lote} · ${l.cantidad_actual} disponibles`,
            }))}
          />
        </Section>

        <Section title="Historial">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Afiliado</th>
                  <th>Insumo</th>
                  <th className="text-right">Entregado</th>
                  <th>Centro</th>
                  <th>Receta</th>
                  <th>Prescrito por</th>
                </tr>
              </thead>
              <tbody>
                {dispensaciones.map((d) => (
                  <tr key={d.id}>
                    <td className="text-ink-soft">{new Date(d.created_at).toLocaleDateString("es-VE")}</td>
                    <td>
                      {d.afiliado?.nombre_completo}
                      <span className="ml-2 text-[12px] text-ink-soft">{d.afiliado?.cedula}</span>
                    </td>
                    <td>{d.lote?.insumo?.nombre_generico}<span className="ml-2 text-[12px] text-ink-soft">{d.lote?.numero_lote}</span></td>
                    <td className="text-right">{d.cantidad_entregada}</td>
                    <td>{d.centro?.nombre}</td>
                    <td className="text-ink-soft">{d.numero_recipe ?? "—"}</td>
                    <td>{d.medico_prescribe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </>
  );
}
