import { restGet } from "@/lib/db";
import { PageHeader } from "@/components/ui";

const etiqueta: Record<string, string> = {
  ENTRADA_ALMACEN: "Entrada",
  DISPENSACION: "Dispensación",
  AJUSTE_MERMA: "Merma",
  TRANSFERENCIA: "Transferencia",
};

const tono: Record<string, string> = {
  ENTRADA_ALMACEN: "text-ok",
  DISPENSACION: "text-accent",
  AJUSTE_MERMA: "text-danger",
  TRANSFERENCIA: "text-warn",
};

interface Movimiento {
  id: string;
  tipo_movimiento: string;
  cantidad: number;
  observaciones: string | null;
  created_at: string;
  lote: { numero_lote: string; insumo: { nombre_generico: string } | null } | null;
}

export default async function Movimientos() {
  const movimientos = await restGet<Movimiento>("movimientos_inventario", {
    select: "*,lote:lote_id(numero_lote,insumo:insumo_id(nombre_generico))",
    order: "created_at",
    ascending: false,
    limit: 100,
  });

  return (
    <>
      <PageHeader
        title="Movimientos"
        subtitle="Trazabilidad de entradas, dispensaciones, mermas y transferencias. Últimos 100 registros."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Insumo</th>
                <th>Lote</th>
                <th className="text-right">Cantidad</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td className="text-ink-soft">
                    {new Date(m.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className={tono[m.tipo_movimiento] ?? ""}>{etiqueta[m.tipo_movimiento] ?? m.tipo_movimiento}</td>
                  <td>{m.lote?.insumo?.nombre_generico}</td>
                  <td>{m.lote?.numero_lote}</td>
                  <td className="text-right">{m.cantidad}</td>
                  <td className="text-ink-soft">{m.observaciones ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
