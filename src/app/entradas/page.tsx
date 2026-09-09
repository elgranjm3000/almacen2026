import { restGet } from "@/lib/db";
import { PageHeader, Section } from "@/components/ui";
import EntradaForm from "./form";

interface Entrada {
  id: string;
  cantidad: number;
  observaciones: string | null;
  created_at: string;
  lote: { numero_lote: string; insumo: { nombre_generico: string } | null } | null;
}

export default async function Entradas() {
  const [centros, insumos, entradas] = await Promise.all([
    restGet<{ id: string; nombre: string }>("centros_salud", { order: "nombre" }),
    restGet<{ id: string; nombre_generico: string; presentacion: string }>("catalogos_insumos", {
      order: "nombre_generico",
    }),
    restGet<Entrada>("movimientos_inventario", {
      select: "*,lote:lote_id(numero_lote,insumo:insumo_id(nombre_generico))",
      filters: { tipo_movimiento: "eq.ENTRADA_ALMACEN" },
      order: "created_at",
      ascending: false,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Ingresos"
        subtitle="Recepción de mercancía: crea lotes nuevos o suma existencias a uno ya registrado en el centro."
      />
      <div className="px-4 pb-16 md:px-8">
        <Section title="Registrar entrada">
          <EntradaForm
            centros={centros.map((c) => ({ id: c.id, label: c.nombre }))}
            insumos={insumos.map((i) => ({
              id: i.id,
              label: `${i.nombre_generico} · ${i.presentacion}`,
            }))}
          />
        </Section>

        <Section title="Entradas recientes">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Insumo</th>
                  <th>Lote</th>
                  <th className="text-right">Cantidad</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((e) => (
                  <tr key={e.id}>
                    <td className="text-ink-soft">
                      {new Date(e.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td>{e.lote?.insumo?.nombre_generico}</td>
                    <td>{e.lote?.numero_lote}</td>
                    <td className="text-right">{e.cantidad}</td>
                    <td className="text-ink-soft">{e.observaciones ?? "—"}</td>
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
