import { restGet } from "@/lib/db";
import { Section } from "@/components/ui";
import { TasaForm } from "../forms";

interface Tasa {
  id: string;
  fecha: string;
  tasa_ves_usd: number | string;
}

export default async function TasaBcvPage() {
  const tasas = await restGet<Tasa>("tasas_cambio_bcv", {
    order: "fecha",
    ascending: false,
    limit: 10,
  });

  return (
    <div className="px-4 pb-16 md:px-8">
      <Section title="Cargar tasa del día">
        <TasaForm />
      </Section>

      <Section title="Tasas recientes">
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
                  <td className="text-right">
                    {Number(t.tasa_ves_usd).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
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
