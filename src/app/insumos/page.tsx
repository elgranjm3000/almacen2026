import { restGet } from "@/lib/db";
import { PageHeader } from "@/components/ui";

interface Insumo {
  id: string;
  codigo_sku: string;
  nombre_generico: string;
  presentacion: string;
  categoria: string;
  requiere_recipe: boolean | null;
}

export default async function Insumos() {
  const insumos = await restGet<Insumo>("catalogos_insumos", { order: "codigo_sku" });

  return (
    <>
      <PageHeader
        title="Catálogo de insumos"
        subtitle="Medicamentos y materiales homologados para dispensación en la red de centros."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre genérico</th>
                <th>Presentación</th>
                <th>Categoría</th>
                <th>Receta</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.id}>
                  <td className="text-ink-soft">{i.codigo_sku}</td>
                  <td>{i.nombre_generico}</td>
                  <td>{i.presentacion}</td>
                  <td>{i.categoria}</td>
                  <td>{i.requiere_recipe ? "Requerida" : "No requerida"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
