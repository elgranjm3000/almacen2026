import { PageHeader } from "@/components/ui";
import TabNav from "./tab-nav";

export default function ContabilidadLayout({ children }: LayoutProps<"/contabilidad">) {
  return (
    <>
      <PageHeader
        title="Contabilidad"
        subtitle="Asientos generados por los movimientos del almacén, valorizados en bolívares y dólares con la tasa BCV vigente."
      />
      <TabNav />
      {children}
    </>
  );
}
