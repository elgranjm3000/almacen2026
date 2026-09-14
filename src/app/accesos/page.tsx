import { restGet } from "@/lib/db";
import { PageHeader } from "@/components/ui";

interface Acceso {
  id: string;
  email: string;
  accion: string;
  direccion_ip: string | null;
  agente: string | null;
  created_at: string;
  usuario: { nombre_completo: string } | null;
}

const etiqueta: Record<string, { texto: string; clase: string }> = {
  INICIO: { texto: "Inicio", clase: "bg-ok/10 text-ok" },
  INICIO_FALLIDO: { texto: "Inicio fallido", clase: "bg-danger/10 text-danger" },
  CIERRE: { texto: "Cierre", clase: "bg-ink-soft/10 text-ink-soft" },
};

export default async function Accesos() {
  const accesos = await restGet<Acceso>("registro_accesos", {
    select: "*,usuario:usuario_id(nombre_completo)",
    order: "created_at",
    ascending: false,
    limit: 200,
  });

  return (
    <>
      <PageHeader
        title="Accesos"
        subtitle="Historial de inicios de sesión, intentos fallidos y cierres. Últimos 200 registros."
      />
      <div className="px-4 pb-16 md:px-8">
        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Dirección IP</th>
                <th>Navegador</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map((a) => {
                const e = etiqueta[a.accion] ?? { texto: a.accion, clase: "bg-ink-soft/10 text-ink-soft" };
                return (
                  <tr key={a.id}>
                    <td className="text-ink-soft">
                      {new Date(a.created_at).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>
                      {a.usuario?.nombre_completo ?? "—"}
                      <span className="ml-2 text-[12px] text-ink-soft">{a.email}</span>
                    </td>
                    <td>
                      <span className={`inline-block rounded px-2 py-0.5 text-[12px] font-550 ${e.clase}`}>
                        {e.texto}
                      </span>
                    </td>
                    <td className="text-ink-soft">{a.direccion_ip ?? "—"}</td>
                    <td className="max-w-[280px] truncate text-[12.5px] text-ink-soft">{a.agente ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
