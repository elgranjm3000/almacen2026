import Link from "next/link";
import { restGet } from "@/lib/db";
import { PageHeader, Metric, Badge, estadoLote, Section } from "@/components/ui";

interface Alerta {
  centro_hospitalario: string;
  codigo_sku: string;
  nombre_generico: string;
  numero_lote: string;
  cantidad_actual: number;
  fecha_vencimiento: string;
  estado_alerta: string;
}

async function contar(resource: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({ select: "id", ...filters });
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/${resource}?${params}`,
    {
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY!}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      cache: "no-store",
    },
  );
  const range = res.headers.get("content-range");
  if (res.ok && range) return parseInt(range.split("/")[1] ?? "0", 10);
  return 0;
}

export default async function Panel() {
  const [centros, afiliados, dispensaciones, alertas] = await Promise.all([
    contar("centros_salud"),
    contar("afiliados_pacientes", { estatus: "eq.ACTIVO" }),
    contar("dispensaciones"),
    restGet<Alerta>("vista_alertas_inventario", { order: "fecha_vencimiento" }),
  ]);

  const vencidos = alertas.filter((a) => a.estado_alerta === "VENCIDO").length;
  const criticos = alertas.filter((a) => a.estado_alerta === "CRITICO").length;
  const bajos = alertas.filter((a) => a.estado_alerta === "BAJO").length;

  return (
    <>
      <PageHeader
        title="Panel"
        subtitle="Estado del inventario y actividad reciente en todos los centros de salud."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-6 grid grid-cols-2 md:mt-8 gap-x-10 gap-y-8 lg:grid-cols-4">
          <Metric value={alertas.length} label="Lotes bajo alerta" tone={alertas.length ? "warn" : "ok"} />
          <Metric value={vencidos + criticos} label="Vencidos o por vencer" tone={vencidos + criticos ? "danger" : "ok"} />
          <Metric value={dispensaciones} label="Dispensaciones registradas" />
          <Metric value={`${centros} · ${afiliados}`} label="Centros de salud · afiliados activos" />
        </div>

        <Section title="Alertas de inventario">
          {alertas.length === 0 ? (
            <p className="text-[14px] text-ink-soft">
              No hay alertas: todo el inventario está sobre el mínimo y dentro del plazo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Centro</th>
                    <th>Insumo</th>
                    <th>Lote</th>
                    <th className="text-right">Cantidad</th>
                    <th>Vence</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a) => (
                    <tr key={`${a.centro_hospitalario}-${a.numero_lote}`}>
                      <td>{a.centro_hospitalario}</td>
                      <td>
                        {a.nombre_generico}
                        <span className="ml-2 text-[12px] text-ink-soft">{a.codigo_sku}</span>
                      </td>
                      <td>{a.numero_lote}</td>
                      <td className="text-right">{a.cantidad_actual}</td>
                      <td>{a.fecha_vencimiento}</td>
                      <td>
                        <Badge estado={a.estado_alerta as never} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <p className="mt-8 text-[13.5px] text-ink-soft">
          Revisa el detalle por lote en{" "}
          <Link href="/inventario" className="text-accent underline underline-offset-2">
            Inventario
          </Link>{" "}
          o registra una entrega en{" "}
          <Link href="/dispensaciones" className="text-accent underline underline-offset-2">
            Dispensaciones
          </Link>
          .
        </p>
      </div>
    </>
  );
}
