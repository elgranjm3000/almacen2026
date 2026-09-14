import { restGet } from "@/lib/db";
import { Metric, Section } from "@/components/ui";

const momentoEtiqueta: Record<string, string> = {
  COMPROMISO: "Compromiso",
  CAUSADO: "Causado",
  PAGADO: "Pagado",
  EJECUCION_DIRECTA: "Ejecución directa",
};

const moduloEtiqueta: Record<string, string> = {
  DISPENSACION: "Dispensación",
  ENTRADA_ALMACEN: "Ingreso",
  AJUSTE: "Ajuste",
  COMPRA: "Compra",
};

interface Asiento {
  id: string;
  numero_comprobante: string;
  fecha: string;
  concepto: string;
  momento_presupuestario: string | null;
  referencia_modulo: string | null;
  centro: { nombre: string } | null;
}

interface Detalle {
  asiento_id: string;
  debe_ves: number | string;
  haber_ves: number | string;
}

interface Tasa {
  id: string;
  fecha: string;
  tasa_ves_usd: number | string;
}

export default async function ContabilidadResumen() {
  const [asientos, detalles, tasas] = await Promise.all([
    restGet<Asiento>("asientos_contables", {
      select: "*,centro:centro_salud_id(nombre)",
      order: "fecha",
      ascending: false,
      limit: 50,
    }),
    restGet<Detalle>("detalles_asiento", { select: "asiento_id,debe_ves,haber_ves" }),
    restGet<Tasa>("tasas_cambio_bcv", { order: "fecha", ascending: false, limit: 1 }),
  ]);

  const totales = new Map<string, number>();
  for (const d of detalles) {
    totales.set(d.asiento_id, (totales.get(d.asiento_id) ?? 0) + Number(d.debe_ves));
  }
  const vesHoy = Number(tasas[0]?.tasa_ves_usd ?? 0);
  const totalDebe = [...totales.values()].reduce((a, v) => a + v, 0);
  const cuentasConMovimiento = new Set(detalles.map((d) => d.asiento_id)).size;

  return (
    <div className="px-4 pb-16 md:px-8">
      <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-8 md:mt-8 lg:grid-cols-4">
        <Metric value={asientos.length} label="Comprobantes (últimos 50)" />
        <Metric value={totalDebe.toLocaleString("es-VE", { maximumFractionDigits: 0 })} label="Bs. movimientos" />
        <Metric value={vesHoy.toLocaleString("es-VE", { minimumFractionDigits: 2 })} label="Tasa BCV vigente (Bs./USD)" />
        <Metric value={cuentasConMovimiento} label="Comprobantes con detalle" />
      </div>

      <Section title="Comprobantes">
        {asientos.length === 0 ? (
          <p className="text-[14px] text-ink-soft">
            Aún no hay asientos: se generan automáticamente al registrar ingresos con costo unitario y dispensaciones.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Comprobante</th>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Momento</th>
                  <th>Origen</th>
                  <th className="text-right">Monto (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {asientos.map((a) => (
                  <tr key={a.id}>
                    <td className="text-ink-soft">{a.numero_comprobante}</td>
                    <td>{a.fecha}</td>
                    <td>{a.concepto}</td>
                    <td>{a.momento_presupuestario ? momentoEtiqueta[a.momento_presupuestario] : "—"}</td>
                    <td className="text-ink-soft">{a.referencia_modulo ? moduloEtiqueta[a.referencia_modulo] : "—"}</td>
                    <td className="text-right">
                      {(totales.get(a.id) ?? 0).toLocaleString("es-VE", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
