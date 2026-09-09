import { restGet } from "@/lib/db";
import { PageHeader } from "@/components/ui";

interface Afiliado {
  id: string;
  cedula: string;
  nombre_completo: string;
  componente_fanb: string | null;
  parentesco: string | null;
  estatus: string | null;
}

export default async function Afiliados() {
  const afiliados = await restGet<Afiliado>("afiliados_pacientes", { order: "nombre_completo" });

  return (
    <>
      <PageHeader
        title="Afiliados"
        subtitle="Titulares y beneficiarios con derecho a dispensación de insumos."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Componente</th>
                <th>Parentesco</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {afiliados.map((a) => (
                <tr key={a.id}>
                  <td className="text-ink-soft">{a.cedula}</td>
                  <td>{a.nombre_completo}</td>
                  <td>{a.componente_fanb ?? "—"}</td>
                  <td>{a.parentesco ?? "—"}</td>
                  <td>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[12px] font-550 ${
                        a.estatus === "ACTIVO" ? "bg-ok/10 text-ok" : "bg-ink-soft/10 text-ink-soft"
                      }`}
                    >
                      {a.estatus}
                    </span>
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
