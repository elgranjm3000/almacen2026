import { restGet } from "@/lib/db";
import { PageHeader, Metric, Section } from "@/components/ui";

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
  tasa_bcv_aplicada: number;
  referencia_modulo: string | null;
  centro: { nombre: string } | null;
}

interface ResumenAsiento {
  asiento_id: string;
  total_debe_ves: number;
}

interface Mayor {
  cuenta: { codigo_cuenta: string; nombre_cuenta: string; tipo: string } | null;
  debe_ves: number;
  haber_ves: number;
}

interface Tasa {
  id: string;
  fecha: string;
  tasa_ves_usd: number;
}

export default async function Contabilidad() {
  const [asientos, resumenes, mayor, tasas] = await Promise.all([
    restGet<Asiento>("asientos_contables", {
      select: "*,centro:centro_salud_id(nombre)",
      order: "fecha",
      ascending: false,
      limit: 50,
    }),
    restGet<ResumenAsiento>("detalles_asiento", {
      select: "asiento_id,debe_ves,haber_ves",
    }),
    restGet<Mayor>("detalles_asiento", {
      select: "cuenta:cuenta_id(codigo_cuenta,nombre_cuenta,tipo),debe_ves,haber_ves",
    }),
    restGet<Tasa>("tasas_cambio_bcv", { order: "fecha", ascending: false, limit: 10 }),
  ]);

  const totales = new Map<string, { ves: number; haber: number }>();
  for (const d of resumenes) {
    const t = totales.get(d.asiento_id) ?? { ves: 0, haber: 0 };
    t.ves += Number(d.total_debe_ves);
    totales.set(d.asiento_id, t);
  }
  const vesHoy = tasas[0]?.tasa_ves_usd ?? 0;
  const totalDebe = [...totales.values()].reduce((a, t) => a + t.ves, 0);

  // Libro mayor: agrupa debe/haber por cuenta
  const porCuenta = new Map<string, { nombre: string; tipo: string; debe: number; haber: number }>();
  for (const m of mayor) {
    const key = m.cuenta?.codigo_cuenta ?? "?";
    const c = porCuenta.get(key) ?? { nombre: m.cuenta?.nombre_cuenta ?? "", tipo: m.cuenta?.tipo ?? "", debe: 0, haber: 0 };
    c.debe += Number(m.debe_ves);
    c.haber += Number(m.haber_ves);
    porCuenta.set(key, c);
  }

  return (
    <>
      <PageHeader
        title="Contabilidad"
        subtitle="Asientos generados por los movimientos del almacén, valorizados en bolívares y dólares con la tasa BCV vigente."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-8 md:mt-8 lg:grid-cols-4">
          <Metric value={asientos.length} label="Comprobantes (últimos 50)" />
          <Metric value={totalDebe.toLocaleString("es-VE", { maximumFractionDigits: 0 })} label="Bs. movimientos" />
          <Metric value={vesHoy.toLocaleString("es-VE", { minimumFractionDigits: 2 })} label="Tasa BCV vigente (Bs./USD)" />
          <Metric value={porCuenta.size} label="Cuentas con movimiento" />
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
                        {(totales.get(a.id)?.ves ?? 0).toLocaleString("es-VE", { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Libro mayor por cuenta (Bs.)">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Nombre</th>
                  <th className="text-right">Debe</th>
                  <th className="text-right">Haber</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {[...porCuenta.entries()].map(([codigo, c]) => (
                  <tr key={codigo}>
                    <td className="text-ink-soft">{codigo}</td>
                    <td>{c.nombre}<span className="ml-2 text-[12px] text-ink-soft">{c.tipo}</span></td>
                    <td className="text-right">{c.debe.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</td>
                    <td className="text-right">{c.haber.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</td>
                    <td className="text-right">{(c.debe - c.haber).toLocaleString("es-VE", { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Tasas BCV recientes">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th className="text-right">Bs. por USD</th>
                </tr>
              </thead>
              <tbody>
                {tasas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fecha}</td>
                    <td className="text-right">{Number(t.tasa_ves_usd).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
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
