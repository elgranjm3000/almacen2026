import { restGet } from "@/lib/db";
import { Section } from "@/components/ui";
import { AsientoManualForm } from "../forms";

interface Cuenta {
  id: string;
  codigo_cuenta: string;
  nombre_cuenta: string;
}

interface Partida {
  id: string;
  codigo_partida: string;
  denominacion: string;
}

export default async function ComprobantePage() {
  const [centros, cuentas, partidas] = await Promise.all([
    restGet<{ id: string; nombre: string }>("centros_salud", { order: "nombre" }),
    restGet<Cuenta>("cuentas_contables", { order: "codigo_cuenta" }),
    restGet<Partida>("partidas_onapre", { order: "codigo_partida" }),
  ]);

  return (
    <div className="px-4 pb-16 md:px-8">
      <Section title="Registrar comprobante manual">
        <p className="mb-4 max-w-prose text-[13.5px] text-ink-soft">
          Para ajustes y compras directas. Las dispensaciones e ingresos de mercancía generan su comprobante automáticamente.
        </p>
        <AsientoManualForm
          centros={centros.map((c) => ({ id: c.id, label: c.nombre }))}
          cuentas={cuentas.map((c) => ({ codigo: c.codigo_cuenta, label: `${c.codigo_cuenta} ${c.nombre_cuenta}` }))}
          partidas={partidas.map((p) => ({ id: p.id, label: `${p.codigo_partida} ${p.denominacion}` }))}
        />
      </Section>
    </div>
  );
}
