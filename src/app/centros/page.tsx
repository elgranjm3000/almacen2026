import { restGet } from "@/lib/db";
import { PageHeader } from "@/components/ui";

interface Centro {
  id: string;
  nombre: string;
  codigo_centro: string;
  estado: string;
  direccion: string | null;
}

export default async function Centros() {
  const centros = await restGet<Centro>("centros_salud", { order: "nombre" });

  return (
    <>
      <PageHeader
        title="Centros de salud"
        subtitle="Puntos de dispensación de la red: cada centro mantiene su propio inventario de lotes."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {centros.map((c) => (
                <tr key={c.id}>
                  <td className="text-ink-soft">{c.codigo_centro}</td>
                  <td>{c.nombre}</td>
                  <td>{c.estado}</td>
                  <td className="text-ink-soft">{c.direccion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
