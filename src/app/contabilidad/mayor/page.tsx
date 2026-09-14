import { restGet } from "@/lib/db";
import { Section } from "@/components/ui";

interface Detalle {
  id: string;
  debe_ves: number | string;
  haber_ves: number | string;
  cuenta: { codigo_cuenta: string; nombre_cuenta: string; tipo: string } | null;
}

export default async function MayorPage() {
  const detalles = await restGet<Detalle>("detalles_asiento", {
    select: "cuenta:cuenta_id(codigo_cuenta,nombre_cuenta,tipo),debe_ves,haber_ves",
  });

  const porCuenta = new Map<string, { nombre: string; tipo: string; debe: number; haber: number }>();
  for (const m of detalles) {
    const key = m.cuenta?.codigo_cuenta ?? "?";
    const c = porCuenta.get(key) ?? {
      nombre: m.cuenta?.nombre_cuenta ?? "",
      tipo: m.cuenta?.tipo ?? "",
      debe: 0,
      haber: 0,
    };
    c.debe += Number(m.debe_ves);
    c.haber += Number(m.haber_ves);
    porCuenta.set(key, c);
  }

  return (
    <div className="px-4 pb-16 md:px-8">
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
                  <td>
                    {c.nombre}
                    <span className="ml-2 text-[12px] text-ink-soft">{c.tipo}</span>
                  </td>
                  <td className="text-right">{c.debe.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</td>
                  <td className="text-right">{c.haber.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</td>
                  <td className="text-right">
                    {(c.debe - c.haber).toLocaleString("es-VE", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
