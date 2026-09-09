import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { obtenerSesion } from "@/lib/auth";
import Nav from "@/components/nav";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIFAR — Sistema Integrado de Farmacia Militar",
  description: "Control de inventario, dispensación y contabilidad de insumos médicos — DIGESALUD",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return (
      <html
        lang="es"
        className={`${archivo.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full">{children}</body>
      </html>
    );
  }

  return (
    <html
      lang="es"
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-dvh flex-col md:flex-row">
          <Nav sesion={{ nombre: sesion.nombre, rol: sesion.rol }} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
