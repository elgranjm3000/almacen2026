import Link from "next/link";
import PrintButton from "./print-button";
import { restGet } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Detalle {
  id: string;
  asiento_id: string;
  debe_ves: number | string;
  haber_ves: number | string;
  cuenta: { codigo_cuenta: string; nombre_cuenta: string } | null;
  partida: { codigo_partida: string; denominacion: string } | null;
}

interface Asiento {
  id: string;
  numero_comprobante: string;
  fecha: string;
  concepto: string;
  momento_presupuestario: string | null;
  tasa_bcv_aplicada: number | string;
  referencia_modulo: string | null;
  centro: { nombre: string } | null;
}

const fmt = (n: number) =>
  n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const momento: Record<string, string> = {
  COMPROMISO: "Compromiso",
  CAUSADO: "Causado",
  PAGADO: "Pagado",
  EJECUCION_DIRECTA: "Ejecución directa",
};

const reportes = [
  { tipo: "diario", nombre: "Libro Diario" },
  { tipo: "mayor", nombre: "Libro Mayor" },
  { tipo: "balance", nombre: "Balance de Comprobación" },
];

export default async function Reportes({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; desde?: string; hasta?: string }>;
}) {
  const { tipo = "balance", desde, hasta } = await searchParams;
  const filtros: Record<string, string> = {};
  if (desde) filtros.fecha = `gte.${desde}`;
  if (hasta) filtros.fecha = [filtros.fecha, `lte.${hasta}`].filter(Boolean).join(",");

  const [asientos, detalles] = await Promise.all([
    restGet<Asiento>("asientos_contables", {
      select: "*,centro:centro_salud_id(nombre)",
      order: "fecha,created_at",
      ...(Object.keys(filtros).length ? { filters: filtros } : {}),
    }),
    restGet<Detalle>("detalles_asiento", {
      select: "*,cuenta:cuenta_id(codigo_cuenta,nombre_cuenta),partida:partida_onapre_id(codigo_partida,denominacion)",
      order: "created_at",
    }),
  ]);

  const porAsiento = new Map<string, Detalle[]>();
  for (const d of detalles) {
    const arr = porAsiento.get(d.asiento_id) ?? [];
    arr.push(d);
    porAsiento.set(d.asiento_id, arr);
  }

  const num = (v: number | string) => Number(v ?? 0);
  const hoy = new Date().toLocaleDateString("es-VE", { dateStyle: "long" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      {/* Barra de control: no se imprime */}
      <div className="print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[24px] font-600 tracking-tight">Reportes contables</h1>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              Formatos listos para imprimir o guardar como PDF (Ctrl+P / Cmd+P).
            </p>
          </div>
          <Link href="/contabilidad" className="text-[13.5px] text-accent underline underline-offset-2">
            Volver a Contabilidad
          </Link>
        </div>

        <form className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
          <label className="block text-[13px] text-ink-soft">
            Reporte
            <select name="tipo" defaultValue={tipo} className="mt-1 block rounded-md border border-line bg-white px-3 py-2 text-[14px]">
              {reportes.map((r) => (
                <option key={r.tipo} value={r.tipo}>{r.nombre}</option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] text-ink-soft">
            Desde
            <input type="date" name="desde" defaultValue={desde} className="mt-1 block rounded-md border border-line bg-white px-3 py-2 text-[14px]" />
          </label>
          <label className="block text-[13px] text-ink-soft">
            Hasta
            <input type="date" name="hasta" defaultValue={hasta} className="mt-1 block rounded-md border border-line bg-white px-3 py-2 text-[14px]" />
          </label>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-[13.5px] font-550 text-white hover:bg-accent-ink">
            Generar
          </button>
          <PrintButton />
        </form>
      </div>

      {/* Documento */}
      <article className="mt-8 rounded-lg border border-line bg-surface p-8 print:mt-0 print:rounded-none print:border-0 print:p-0">
        <header className="border-b-2 border-ink pb-4 text-center">
          <p className="text-[12px] text-ink-soft">Dirección General de Salud Militar — DIGESALUD</p>
          <h2 className="mt-1 font-display text-[20px] font-600 tracking-tight">
            {reportes.find((r) => r.tipo === tipo)?.nombre ?? "Reporte"}
          </h2>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            {desde || hasta
              ? `Período: ${desde ?? "inicio"} al ${hasta ?? "hoy"} · Emitido el ${hoy}`
              : `Acumulado al ${hoy}`}
          </p>
        </header>

        <div className="mt-6">
          {tipo === "diario" && <Diario asientos={asientos} porAsiento={porAsiento} num={num} />}
          {tipo === "mayor" && <Mayor asientos={asientos} porAsiento={porAsiento} num={num} />}
          {tipo === "balance" && <Balance asientos={asientos} porAsiento={porAsiento} num={num} />}
        </div>

        <footer className="mt-10 flex justify-between border-t border-line pt-6 text-[12px] text-ink-soft">
          <span>Tasas BCV aplicadas según registro del sistema.</span>
          <span>Página 1</span>
        </footer>
      </article>
    </div>
  );
}

type Num = (v: number | string) => number;

function Diario({
  asientos,
  porAsiento,
  num,
}: {
  asientos: Asiento[];
  porAsiento: Map<string, Detalle[]>;
  num: Num;
}) {
  if (asientos.length === 0)
    return <p className="text-[13.5px] text-ink-soft">No hay comprobantes en el período seleccionado.</p>;

  let totalDebe = 0;
  let totalHaber = 0;

  return (
    <table className="w-full text-[12.5px]">
      <thead>
        <tr>
          <th className="w-24">Fecha</th>
          <th>Cuenta / concepto</th>
          <th className="w-28 text-right">Debe (Bs.)</th>
          <th className="w-28 text-right">Haber (Bs.)</th>
        </tr>
      </thead>
      <tbody>
        {asientos.map((a) => (
          <DetallesAsiento key={a.id} a={a} ds={porAsiento.get(a.id) ?? []} num={num} onSuma={(d, h) => { totalDebe += d; totalHaber += h; }} />
        ))}
        <tr className="font-600">
          <td colSpan={2} className="pt-3 text-right">Sumas iguales</td>
          <td className="pt-3 text-right">{fmt(totalDebe)}</td>
          <td className="pt-3 text-right">{fmt(totalHaber)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function DetallesAsiento({
  a,
  ds,
  num,
  onSuma,
}: {
  a: Asiento;
  ds: Detalle[];
  num: Num;
  onSuma?: (debe: number, haber: number) => void;
}) {
  let d = 0;
  let h = 0;
  for (const x of ds) {
    d += num(x.debe_ves);
    h += num(x.haber_ves);
  }
  onSuma?.(d, h);
  return (
    <>
      <tr className="bg-ink/[0.04]">
        <td className="align-top">{a.fecha}</td>
        <td className="align-top">
          <span className="font-550">{a.numero_comprobante}</span> — {a.concepto}
          <span className="block text-[11.5px] text-ink-soft">
            {a.centro?.nombre} · {a.momento_presupuestario ? momento[a.momento_presupuestario] : ""}
            {` · Tasa BCV: ${fmt(num(a.tasa_bcv_aplicada))}`}
          </span>
        </td>
        <td className="text-right align-top">{fmt(d)}</td>
        <td className="text-right align-top">{fmt(h)}</td>
      </tr>
      {ds.map((x) => (
        <tr key={x.id}>
          <td />
          <td>
            <span className="ml-3 inline-block">
              {x.debe_ves && num(x.debe_ves) > 0 ? "" : "    "}
              {x.cuenta?.codigo_cuenta} {x.cuenta?.nombre_cuenta}
              {x.partida && (
                <span className="block text-[11px] text-ink-soft ml-4">
                  Partida ONAPRE {x.partida.codigo_partida} — {x.partida.denominacion}
                </span>
              )}
            </span>
          </td>
          <td className="text-right">{num(x.debe_ves) > 0 ? fmt(num(x.debe_ves)) : ""}</td>
          <td className="text-right">{num(x.haber_ves) > 0 ? fmt(num(x.haber_ves)) : ""}</td>
        </tr>
      ))}
    </>
  );
}

function Mayor({
  asientos,
  porAsiento,
  num,
}: {
  asientos: Asiento[];
  porAsiento: Map<string, Detalle[]>;
  num: Num;
}) {
  const porCuenta = new Map<string, { nombre: string; lineas: { a: Asiento; d: Detalle }[] }>();
  for (const a of asientos) {
    for (const d of porAsiento.get(a.id) ?? []) {
      const key = d.cuenta?.codigo_cuenta ?? "?";
      const c = porCuenta.get(key) ?? { nombre: d.cuenta?.nombre_cuenta ?? "", lineas: [] };
      c.lineas.push({ a, d });
      porCuenta.set(key, c);
    }
  }
  if (porCuenta.size === 0)
    return <p className="text-[13.5px] text-ink-soft">No hay movimientos en el período seleccionado.</p>;

  return (
    <div className="space-y-8">
      {[...porCuenta.entries()].map(([codigo, c]) => {
        let debe = 0;
        let haber = 0;
        for (const l of c.lineas) {
          debe += num(l.d.debe_ves);
          haber += num(l.d.haber_ves);
        }
        return (
          <section key={codigo}>
            <h3 className="border-b border-ink pb-1 font-display text-[14px] font-600">
              {codigo} — {c.nombre}
            </h3>
            <table className="mt-2 w-full text-[12.5px]">
              <thead>
                <tr>
                  <th className="w-24">Fecha</th>
                  <th>Comprobante / concepto</th>
                  <th className="w-28 text-right">Debe</th>
                  <th className="w-28 text-right">Haber</th>
                </tr>
              </thead>
              <tbody>
                {c.lineas.map(({ a, d }) => (
                  <tr key={d.id}>
                    <td>{a.fecha}</td>
                    <td>
                      {a.numero_comprobante} — {a.concepto}
                    </td>
                    <td className="text-right">{num(d.debe_ves) > 0 ? fmt(num(d.debe_ves)) : ""}</td>
                    <td className="text-right">{num(d.haber_ves) > 0 ? fmt(num(d.haber_ves)) : ""}</td>
                  </tr>
                ))}
                <tr className="font-600">
                  <td colSpan={2} className="text-right">Saldo</td>
                  <td className="text-right">{fmt(debe)}</td>
                  <td className="text-right">{fmt(haber)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function Balance({
  asientos,
  porAsiento,
  num,
}: {
  asientos: Asiento[];
  porAsiento: Map<string, Detalle[]>;
  num: Num;
}) {
  const porCuenta = new Map<string, { nombre: string; debe: number; haber: number }>();
  for (const a of asientos) {
    for (const d of porAsiento.get(a.id) ?? []) {
      const key = d.cuenta?.codigo_cuenta ?? "?";
      const c = porCuenta.get(key) ?? { nombre: d.cuenta?.nombre_cuenta ?? "", debe: 0, haber: 0 };
      c.debe += num(d.debe_ves);
      c.haber += num(d.haber_ves);
      porCuenta.set(key, c);
    }
  }
  const filas = [...porCuenta.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (filas.length === 0)
    return <p className="text-[13.5px] text-ink-soft">No hay movimientos en el período seleccionado.</p>;

  let td = 0;
  let th = 0;
  for (const [, c] of filas) {
    td += c.debe;
    th += c.haber;
  }

  return (
    <table className="w-full text-[12.5px]">
      <thead>
        <tr>
          <th>Código</th>
          <th>Cuenta</th>
          <th className="w-32 text-right">Sumas debe (Bs.)</th>
          <th className="w-32 text-right">Sumas haber (Bs.)</th>
        </tr>
      </thead>
      <tbody>
        {filas.map(([codigo, c]) => (
          <tr key={codigo}>
            <td>{codigo}</td>
            <td>{c.nombre}</td>
            <td className="text-right">{fmt(c.debe)}</td>
            <td className="text-right">{fmt(c.haber)}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-ink font-600">
          <td colSpan={2} className="pt-2 text-right">Sumas iguales</td>
          <td className="pt-2 text-right">{fmt(td)}</td>
          <td className="pt-2 text-right">{fmt(th)}</td>
        </tr>
      </tbody>
    </table>
  );
}
