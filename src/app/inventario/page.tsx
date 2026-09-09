import { restGet } from "@/lib/db";
import { PageHeader, Badge, estadoLote } from "@/components/ui";

interface Lote {
  id: string;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad_actual: number;
  stock_minimo_alerta: number;
  costo_unitario_usd: number | null;
  centro: { nombre: string } | null;
  insumo: { nombre_generico: string; codigo_sku: string; presentacion: string } | null;
}

export default async function Inventario() {
  const lotes = await restGet<Lote>("lotes_inventario", {
    select: "*,centro:centro_salud_id(nombre),insumo:insumo_id(nombre_generico,codigo_sku,presentacion)",
    order: "fecha_vencimiento",
  });

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Lotes por centro de salud, ordenados por fecha de vencimiento: los más próximos a vencer aparecen primero."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Presentación</th>
                <th>Centro</th>
                <th>Lote</th>
                <th className="text-right">Cantidad</th>
                <th className="text-right">Mínimo</th>
                <th className="text-right">Costo unit. (USD)</th>
                <th>Vence</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.insumo?.nombre_generico}
                    <span className="ml-2 text-[12px] text-ink-soft">{l.insumo?.codigo_sku}</span>
                  </td>
                  <td className="text-ink-soft">{l.insumo?.presentacion}</td>
                  <td>{l.centro?.nombre}</td>
                  <td>{l.numero_lote}</td>
                  <td className="text-right">{l.cantidad_actual}</td>
                  <td className="text-right text-ink-soft">{l.stock_minimo_alerta}</td>
                  <td className="text-right">{l.costo_unitario_usd ? `$ ${l.costo_unitario_usd.toLocaleString("es-VE", { maximumFractionDigits: 2 })}` : "—"}</td>
                  <td>{l.fecha_vencimiento}</td>
                  <td>
                    <Badge estado={estadoLote(l.cantidad_actual, l.stock_minimo_alerta, l.fecha_vencimiento)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
